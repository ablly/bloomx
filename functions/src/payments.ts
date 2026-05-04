import * as admin from 'firebase-admin';
import {createHash} from 'crypto';
import * as functions from 'firebase-functions';
import {defineSecret} from 'firebase-functions/params';
import Stripe = require('stripe');

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

type PlanId = 'starter' | 'creator' | 'pro';

type CheckoutPayload = {
  planId?: string;
  successUrl?: string;
  cancelUrl?: string;
  idempotencyKey?: string;
};

type PlanConfig = {
  id: PlanId;
  envKey: string;
  name: string;
  credits: number;
  amount: number;
  currency: 'usd';
};

type StripeMetadata = Record<string, string> | null | undefined;
type StripeObject = Record<string, unknown> & {
  id?: string;
  metadata?: StripeMetadata;
};
type StripeEvent = {
  id: string;
  type: string;
  data: {object: StripeObject};
  request?: {id?: string | null} | string | null;
};
type StripeSession = StripeObject & {
  customer?: string | {id?: string} | null;
  payment_intent?: string | {id?: string} | null;
  url?: string | null;
};

const PLANS: Record<PlanId, PlanConfig> = {
  starter: {
    id: 'starter',
    envKey: 'STRIPE_PRICE_STARTER',
    name: 'STARTER',
    credits: 1000,
    amount: 1000,
    currency: 'usd',
  },
  creator: {
    id: 'creator',
    envKey: 'STRIPE_PRICE_CREATOR',
    name: 'CREATOR',
    credits: 12000,
    amount: 10000,
    currency: 'usd',
  },
  pro: {
    id: 'pro',
    envKey: 'STRIPE_PRICE_PRO',
    name: 'PRO',
    credits: 60000,
    amount: 50000,
    currency: 'usd',
  },
};

function paymentEnvironment(): 'test' | 'production' {
  return process.env.STRIPE_ENVIRONMENT === 'production' ? 'production' : 'test';
}

function stripeClient(): Stripe.Stripe {
  const secret = STRIPE_SECRET_KEY.value() || process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key is not configured');
  }
  return new Stripe(secret);
}

function stripeWebhookSecret(): string {
  const secret = STRIPE_WEBHOOK_SECRET.value() || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Stripe webhook secret is not configured');
  }
  return secret;
}

function normalizePlanId(value: unknown): PlanId {
  const planId = String(value || '').trim().toLowerCase();
  if (planId === 'starter' || planId === 'creator' || planId === 'pro') return planId;
  throw new functions.https.HttpsError('invalid-argument', 'Unsupported Stripe credit package');
}

function priceIdForPlan(plan: PlanConfig): string {
  const priceId = String(process.env[plan.envKey] || '').trim();
  if (!priceId) {
    throw new functions.https.HttpsError('failed-precondition', `${plan.envKey} is not configured`);
  }
  return priceId;
}

function safeUrl(value: unknown, fallback: string): string {
  const candidate = String(value || '').trim();
  if (!candidate) return fallback;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
  } catch {
    return fallback;
  }
  return fallback;
}

function normalizeIdempotencyKey(uid: string, planId: PlanId, value: unknown): string {
  const raw = String(value || '').trim();
  const base = /^[a-zA-Z0-9:_-]{8,160}$/.test(raw) ? raw : `${planId}:${Date.now()}`;
  return createHash('sha256').update(`${uid}:${planId}:${base}`).digest('hex');
}

function summarizeStripeObject(value: StripeObject): Record<string, unknown> {
  const objectWithFields = value as Record<string, unknown>;
  return {
    object: objectWithFields.object,
    id: objectWithFields.id,
    status: objectWithFields.status,
    payment_status: objectWithFields.payment_status,
    amount_total: objectWithFields.amount_total,
    amount: objectWithFields.amount,
    currency: objectWithFields.currency,
    customer: objectWithFields.customer,
    payment_intent: objectWithFields.payment_intent,
    checkout_session: objectWithFields.checkout_session,
  };
}

function metadataString(metadata: StripeMetadata, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

async function markTransactionStatus(
  transactionId: string,
  status: 'failed' | 'refunded' | 'disputed',
  event: StripeEvent,
  summary: Record<string, unknown>,
) {
  if (!transactionId) return;
  await firestore.collection('payment_transactions').doc(transactionId).set({
    status,
    lastProviderEventId: event.id,
    lastProviderEventType: event.type,
    providerSummary: summary,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
}

async function processCheckoutCompleted(event: StripeEvent, session: StripeSession) {
  const transactionId = metadataString(session.metadata, 'transactionId');
  const userId = metadataString(session.metadata, 'userId');
  const planId = metadataString(session.metadata, 'planId') as PlanId;
  const credits = Number(metadataString(session.metadata, 'credits'));

  if (!transactionId || !userId || !Number.isFinite(credits) || credits <= 0) {
    throw new Error('Stripe checkout session metadata is incomplete');
  }

  const transactionRef = firestore.collection('payment_transactions').doc(transactionId);
  const eventRef = firestore.collection('webhook_events').doc(event.id);
  const ledgerRef = firestore.collection('credit_ledger').doc(`stripe_${event.id}`);
  const userRef = firestore.collection('users').doc(userId);

  await firestore.runTransaction(async (transaction) => {
    const [transactionSnap, ledgerSnap, userSnap] = await Promise.all([
      transaction.get(transactionRef),
      transaction.get(ledgerRef),
      transaction.get(userRef),
    ]);

    if (!transactionSnap.exists) {
      throw new Error(`Payment transaction ${transactionId} does not exist`);
    }

    if (!userSnap.exists) {
      throw new Error(`User ${userId} does not exist`);
    }

    const currentBalance = Number(userSnap.data()?.credits_balance ?? userSnap.data()?.credits ?? 0);
    const nextBalance = ledgerSnap.exists ? currentBalance : currentBalance + credits;
    const now = admin.firestore.FieldValue.serverTimestamp();

    transaction.update(transactionRef, {
      status: 'paid',
      providerSessionId: session.id,
      providerPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
      providerCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
      paidAt: now,
      updatedAt: now,
    });

    if (!ledgerSnap.exists) {
      transaction.update(userRef, {
        credits_balance: admin.firestore.FieldValue.increment(credits),
        updatedAt: now,
      });
      transaction.set(ledgerRef, {
        id: ledgerRef.id,
        userId,
        transactionId,
        delta: credits,
        balanceAfter: nextBalance,
        reason: `Stripe ${PLANS[planId]?.name ?? planId} credit top-up`,
        source: 'payment',
        requestId: event.id,
        provider: 'stripe',
        providerEventId: event.id,
        providerSessionId: session.id,
        createdAt: now,
      });
    }

    transaction.set(eventRef, {
      processingStatus: 'processed',
      processedAt: now,
      transactionId,
      userId,
      creditDelta: credits,
      updatedAt: now,
    }, {merge: true});
  });
}

async function processStripeEvent(event: StripeEvent) {
  const object = event.data.object;
  const summary = summarizeStripeObject(object);

  if (event.type === 'checkout.session.completed') {
    await processCheckoutCompleted(event, object as StripeSession);
    return;
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = object as StripeSession;
    await markTransactionStatus(metadataString(session.metadata, 'transactionId'), 'failed', event, summary);
    return;
  }

  if (event.type.startsWith('charge.refund') || event.type.startsWith('refund.')) {
    const refund = object;
    await markTransactionStatus(metadataString(refund.metadata, 'transactionId'), 'refunded', event, summary);
    return;
  }

  if (event.type.startsWith('charge.dispute.')) {
    const dispute = object;
    await markTransactionStatus(metadataString(dispute.metadata, 'transactionId'), 'disputed', event, summary);
  }
}

export const createPaymentCheckout = functions
  .runWith({secrets: [STRIPE_SECRET_KEY], invoker: 'public'})
  .https.onCall(async (data: CheckoutPayload, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
      throw new functions.https.HttpsError('unauthenticated', '请先登录后再购买积分套餐');
    }

    const plan = PLANS[normalizePlanId(data.planId)];
    const idempotencyKey = normalizeIdempotencyKey(uid, plan.id, data.idempotencyKey);
    const transactionId = idempotencyKey;
    const transactionRef = firestore.collection('payment_transactions').doc(transactionId);
    const existingTransaction = await transactionRef.get();
    const existingData = existingTransaction.data();

    if (existingData?.providerSessionId && existingData?.checkoutUrl) {
      return {
        checkoutUrl: existingData.checkoutUrl,
        transactionId,
        providerSessionId: existingData.providerSessionId,
      };
    }

    const priceId = priceIdForPlan(plan);
    const successUrl = safeUrl(data.successUrl, 'http://127.0.0.1:5173/dashboard?checkout=success');
    const cancelUrl = safeUrl(data.cancelUrl, 'http://127.0.0.1:5173/#pricing');
    const stripe = stripeClient();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await transactionRef.set({
      id: transactionId,
      provider: 'stripe',
      environment: paymentEnvironment(),
      userId: uid,
      userEmail: context.auth?.token.email ?? null,
      productType: 'credits',
      planId: plan.id,
      planName: plan.name,
      priceId,
      amount: plan.amount,
      currency: plan.currency,
      credits: plan.credits,
      status: 'created',
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    }, {merge: true});

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{price: priceId, quantity: 1}],
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}transactionId=${transactionId}`,
      cancel_url: cancelUrl,
      customer_email: typeof context.auth?.token.email === 'string' ? context.auth.token.email : undefined,
      metadata: {
        transactionId,
        userId: uid,
        planId: plan.id,
        credits: String(plan.credits),
        environment: paymentEnvironment(),
      },
    }, {idempotencyKey});

    if (!session.url) {
      throw new functions.https.HttpsError('internal', 'Stripe checkout session did not return a URL');
    }

    await transactionRef.set({
      status: 'checkout_started',
      providerSessionId: session.id,
      checkoutUrl: session.url,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    return {
      checkoutUrl: session.url,
      transactionId,
      providerSessionId: session.id,
    };
  });

export const handleStripeWebhook = functions
  .runWith({secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], invoker: 'public'})
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const signature = req.header('stripe-signature');
    if (!signature) {
      res.status(400).send('Missing Stripe signature');
      return;
    }

    let event: StripeEvent;
    try {
      event = stripeClient().webhooks.constructEvent(req.rawBody, signature, stripeWebhookSecret()) as unknown as StripeEvent;
    } catch (error) {
      await firestore.collection('webhook_events').add({
        provider: 'stripe',
        environment: paymentEnvironment(),
        eventId: null,
        eventType: 'signature_failed',
        signatureStatus: 'failed',
        processingStatus: 'failed',
        attempts: 1,
        requestId: req.header('x-cloud-trace-context') || null,
        payloadSummary: {},
        error: error instanceof Error ? error.message : 'Stripe webhook signature verification failed',
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(400).send('Invalid Stripe signature');
      return;
    }

    const eventRef = firestore.collection('webhook_events').doc(event.id);
    const existingEvent = await eventRef.get();
    if (existingEvent.data()?.processingStatus === 'processed') {
      res.json({received: true, duplicate: true});
      return;
    }

    await eventRef.set({
      id: event.id,
      provider: 'stripe',
      environment: paymentEnvironment(),
      eventId: event.id,
      eventType: event.type,
      signatureStatus: 'verified',
      processingStatus: 'processing',
      attempts: admin.firestore.FieldValue.increment(1),
      requestId: req.header('x-cloud-trace-context') || (typeof event.request === 'object' ? event.request?.id : null) || null,
      payloadSummary: summarizeStripeObject(event.data.object),
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    try {
      await processStripeEvent(event);
      await eventRef.set({
        processingStatus: 'processed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      res.json({received: true});
    } catch (error) {
      await eventRef.set({
        processingStatus: 'failed',
        error: error instanceof Error ? error.message : 'Stripe webhook processing failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      res.status(500).json({received: false});
    }
  });
