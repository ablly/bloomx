import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();
const DEFAULT_SUBSCRIPTION_PRICE_CREDITS = 10;
const SELLER_EARNING_SHARE = 0.9;

type CreateMarketplaceSubscriptionPayload = {
  productId?: string;
  priceCredits?: number;
};

export function subscriptionDocumentId(uid: string, productId: string): string {
  return `${uid}_${productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function sellerEarningBreakdown(grossCredits: number) {
  const normalizedGross = Number(grossCredits.toFixed(6));
  const sellerEarnings = Number((normalizedGross * SELLER_EARNING_SHARE).toFixed(6));
  const platformFee = Number((normalizedGross - sellerEarnings).toFixed(6));
  return {
    gross_amount: normalizedGross,
    platform_fee: platformFee,
    seller_earnings: sellerEarnings,
  };
}

function requireUid(context: functions.https.CallableContext): string {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Please sign in before subscribing');
  }
  return uid;
}

function assertProductId(value: unknown): string {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.includes('/') || normalized.length > 160) {
    throw new functions.https.HttpsError('invalid-argument', 'productId is invalid');
  }
  return normalized;
}

function normalizePriceCredits(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_SUBSCRIPTION_PRICE_CREDITS;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > 100000) {
    throw new functions.https.HttpsError('invalid-argument', 'priceCredits is invalid');
  }
  return Number(numeric.toFixed(6));
}

export const createMarketplaceSubscription = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: CreateMarketplaceSubscriptionPayload, context) => {
    const uid = requireUid(context);
    const productId = assertProductId(data.productId);
    const requestedPriceCredits = normalizePriceCredits(data.priceCredits);
    const subscriptionId = subscriptionDocumentId(uid, productId);
    const userRef = firestore.collection('users').doc(uid);
    const productRef = firestore.collection('products').doc(productId);
    const subscriptionRef = firestore.collection('subscriptions').doc(subscriptionId);
    const purchaseRef = firestore.collection('purchases').doc(subscriptionId);
    const userPurchaseRef = userRef.collection('purchases').doc(productId);
    const ledgerRef = firestore.collection('credit_ledger').doc(`subscription_${subscriptionId}`);

    const result = await firestore.runTransaction(async (transaction) => {
      const [userSnap, productSnap, subscriptionSnap, ledgerSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(productRef),
        transaction.get(subscriptionRef),
        transaction.get(ledgerRef),
      ]);

      if (!userSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
      }

      if (!productSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Product not found');
      }

      const product = productSnap.data() || {};
      const productStatus = String(product.status || '').toLowerCase();
      if (productStatus !== 'active') {
        throw new functions.https.HttpsError('failed-precondition', 'Product is not available for subscription');
      }

      if (subscriptionSnap.exists && subscriptionSnap.data()?.status === 'active') {
        const existing = subscriptionSnap.data() || {};
        return {
          alreadyOwned: true,
          purchase: {
            id: productId,
            uid,
            product_id: productId,
            seller_id: String(existing.sellerId || product.seller_id || ''),
            product_name: String(existing.productName || product.name || ''),
            product_url: String(existing.productUrl || product.base_url || ''),
            status: 'active',
            createdAt: existing.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            expiresAt: existing.expiresAt?.toDate?.()?.toISOString?.() || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
        };
      }

      if (ledgerSnap.exists) {
        throw new functions.https.HttpsError('aborted', 'Subscription ledger already exists but subscription is missing');
      }

      const creditsBalance = Number(userSnap.data()?.credits_balance ?? userSnap.data()?.credits ?? 0);
      if (creditsBalance < requestedPriceCredits) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient credits');
      }

      const sellerId = String(product.seller_id || '');
      const productName = String(product.name || '');
      const productUrl = String(product.base_url || '');
      const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const now = admin.firestore.FieldValue.serverTimestamp();
      const nextCredits = Number((creditsBalance - requestedPriceCredits).toFixed(6));
      const earnings = sellerEarningBreakdown(requestedPriceCredits);
      const sharedPurchase = {
        uid,
        userId: uid,
        buyer_id: uid,
        product_id: productId,
        offerId: productId,
        seller_id: sellerId,
        product_name: productName,
        product_url: productUrl,
        status: 'active',
        subscription_price_credits: requestedPriceCredits,
        payment_provider: 'credits',
        source: 'marketplace_subscription_function',
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      transaction.update(userRef, {
        credits_balance: nextCredits,
        credits: nextCredits,
        updatedAt: now,
      });

      transaction.set(subscriptionRef, {
        id: subscriptionId,
        userId: uid,
        uid,
        offerId: productId,
        productId,
        sellerId,
        productName,
        productUrl,
        modelNames: Array.isArray(product.models) ? product.models : [],
        status: 'active',
        paymentProvider: 'credits',
        subscriptionPriceCredits: requestedPriceCredits,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      });

      transaction.set(purchaseRef, {
        id: subscriptionId,
        ...sharedPurchase,
      });
      transaction.set(userPurchaseRef, sharedPurchase);

      transaction.set(ledgerRef, {
        id: ledgerRef.id,
        userId: uid,
        transactionId: subscriptionId,
        delta: -requestedPriceCredits,
        balanceAfter: nextCredits,
        reason: `Marketplace subscription: ${productName || productId}`,
        source: 'usage',
        requestId: subscriptionId,
        productId,
        sellerId,
        createdAt: now,
      });

      const sellerEarningRef = firestore.collection('seller_earnings').doc(subscriptionId);
      const sellerScopedEarningRef = firestore.collection('sellers').doc(sellerId).collection('earnings').doc(subscriptionId);
      const sellerEarningRecord = {
        id: subscriptionId,
        seller_id: sellerId,
        product_id: productId,
        buyer_id: uid,
        model: Array.isArray(product.models) && product.models.length > 0 ? String(product.models[0]) : productName,
        tokens_in: 0,
        tokens_out: 0,
        ...earnings,
        status: 'pending',
        source: 'subscription',
        createdAt: now,
      };

      transaction.set(sellerEarningRef, sellerEarningRecord);
      transaction.set(sellerScopedEarningRef, sellerEarningRecord);
      transaction.set(productRef, {
        total_sales: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      }, {merge: true});

      return {
        alreadyOwned: false,
        purchase: {
          id: productId,
          uid,
          product_id: productId,
          seller_id: sellerId,
          product_name: productName,
          product_url: productUrl,
          status: 'active',
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toDate().toISOString(),
        },
      };
    });

    return result;
  });
