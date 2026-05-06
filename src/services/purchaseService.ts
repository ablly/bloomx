import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  runTransaction,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Purchase } from '../types/marketplace';

const defaultSubscriptionPrice = 10;

function normalizeDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date();
}

function mapPurchase(id: string, data: Record<string, unknown>): Purchase {
  return {
    id,
    uid: String(data.uid ?? data.buyer_id ?? ''),
    product_id: String(data.product_id ?? ''),
    seller_id: String(data.seller_id ?? ''),
    product_name: String(data.product_name ?? ''),
    product_url: String(data.product_url ?? ''),
    status: (data.status as Purchase['status']) || 'active',
    createdAt: normalizeDate(data.createdAt),
    expiresAt: normalizeDate(data.expiresAt),
  };
}

function topLevelPurchaseId(uid: string, productId: string): string {
  return `${uid}_${productId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function findExistingActivePurchase(uid: string, productId: string): Promise<Purchase | null> {
  const colRef = collection(db, 'users', uid, 'purchases');
  const q = query(colRef, where('product_id', '==', productId));
  const snap = await getDocs(q);
  const match = snap.docs.find((entry) => entry.data().status === 'active');
  return match ? mapPurchase(match.id, match.data()) : null;
}

export async function createPurchase(
  uid: string,
  data: {
    product_id: string;
    seller_id: string;
    product_name: string;
    product_url: string;
    priceCredits?: number;
  }
): Promise<Purchase> {
  const existing = await findExistingActivePurchase(uid, data.product_id);
  if (existing) return existing;

  const priceCredits = data.priceCredits ?? defaultSubscriptionPrice;
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  const userRef = doc(db, 'users', uid);
  const purchaseRef = doc(db, 'users', uid, 'purchases', data.product_id);
  const globalPurchaseRef = doc(db, 'purchases', topLevelPurchaseId(uid, data.product_id));

  await runTransaction(db, async (transaction) => {
    const [userSnap, purchaseSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(purchaseRef),
    ]);

    if (!userSnap.exists()) {
      throw new Error('User profile does not exist');
    }

    if (purchaseSnap.exists() && purchaseSnap.data().status === 'active') {
      return;
    }

    const userData = userSnap.data();
    const currentCredits = Number(userData.credits_balance ?? userData.credits ?? 0);

    if (currentCredits < priceCredits) {
      throw new Error('Insufficient credits');
    }

    const nextCredits = Number((currentCredits - priceCredits).toFixed(6));
    const purchaseData = {
      uid,
      buyer_id: uid,
      user_id: uid,
      product_id: data.product_id,
      seller_id: data.seller_id,
      product_name: data.product_name,
      product_url: data.product_url,
      status: 'active',
      subscription_price_credits: priceCredits,
      payment_provider: 'credits',
      source: 'marketplace_product_detail',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt,
    };

    transaction.update(userRef, {
      credits_balance: nextCredits,
      credits: nextCredits,
      updatedAt: serverTimestamp(),
    });
    transaction.set(purchaseRef, purchaseData);
    transaction.set(globalPurchaseRef, purchaseData);
  });

  const now = new Date();
  return {
    id: data.product_id,
    uid,
    product_id: data.product_id,
    seller_id: data.seller_id,
    product_name: data.product_name,
    product_url: data.product_url,
    status: 'active',
    createdAt: now,
    expiresAt: expiresAt.toDate(),
  };
}

export async function getUserPurchases(uid: string): Promise<Purchase[]> {
  const colRef = collection(db, 'users', uid, 'purchases');
  const snap = await getDocs(colRef);
  
  return snap.docs
    .map((entry) => mapPurchase(entry.id, entry.data()))
    .filter((purchase) => purchase.status === 'active')
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export async function hasProductAccess(uid: string, productId: string): Promise<boolean> {
  return Boolean(await findExistingActivePurchase(uid, productId));
}

export async function revokePurchase(
  uid: string,
  purchaseId: string
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'purchases', purchaseId);
  await updateDoc(docRef, {
    status: 'revoked',
  });
}
