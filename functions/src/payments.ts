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

type PortalPayload = {
  returnUrl?: string;
};

type RefundPayload = {
  transactionId?: string;
  amount?: number;
  reason?: string;
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
type StripeRefund = StripeObject & {
  amount?: number;
  currency?: string;
  payment_intent?: string | {id?: string} | null;
  status?: string;
};
type StripeDispute = StripeObject & {
  amount?: number;
  currency?: string;
  payment_intent?: string | {id?: string} | null;
  status?: string;
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

const DEFAULT_ADMIN_EMAIL = 'zqhablly@gmail.com';
const REFUNDABLE_STATUSES = new Set(['paid', 'refund_requested', 'refund_failed']);

function paymentEnvironment(): 'test' | 'production' {
  return process.env.STRIPE_ENVIRONMENT === 'production' ? 'production' : 'test';
}

function allowedAdminEmails(): string[] {
  return String(process.env.ADMIN_ALLOWED_EMAILS || DEFAULT_ADMIN_EMAIL)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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

function normalizeRefundIdempotencyKey(uid: string, transactionId: string, value: unknown): string {
  const raw = String(value || '').trim();
  const base = /^[a-zA-Z0-9:_-]{8,160}$/.test(raw) ? raw : `refund:${Date.now()}`;
  return createHash('sha256').update(`${uid}:${transactionId}:${base}`).digest('hex');
}

function assertSafeDocumentId(value: unknown, field: string): string {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.includes('/') || normalized.length > 160) {
    throw new functions.https.HttpsError('invalid-argument', `${field} is invalid`);
  }
  return normalized;
}

function assertReason(value: unknown): string {
  const reason = String(value || '').trim();
  if (reason.length < 8 || reason.length > 500) {
    throw new functions.https.HttpsError('invalid-argument', '退款原因必须为 8-500 个字符');
  }
  return reason;
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

async function assertAdmin(context: functions.https.CallableContext) {
  const uid = context.auth?.uid;
  const email = String(context.auth?.token.email || '').trim().toLowerCase();

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', '请先登录管理员账号');
  }

  const allowedByEmail = allowedAdminEmails().includes(email);
  const userSnap = await firestore.collection('users').doc(uid).get();
  const role = String(userSnap.data()?.role || '');

  if (!allowedByEmail && role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', '需要管理员权限才能发起退款');
  }

  return {
    uid,
    email,
    role: allowedByEmail ? 'owner' : role,
  };
}

async function findStripeCustomerId(userId: string): Promise<string | null> {
  const mapRef = firestore.collection('provider_customers').doc(`stripe_${paymentEnvironment()}_${userId}`);
  const mapSnap = await mapRef.get();
  const mappedCustomerId = String(mapSnap.data()?.providerCustomerId || '').trim();
  if (mappedCustomerId) return mappedCustomerId;

  const transactions = await firestore
    .collection('payment_transactions')
    .where('userId', '==', userId)
    .limit(20)
    .get();

  for (const transaction of transactions.docs) {
    const customerId = String(transaction.data().providerCustomerId || '').trim();
    if (customerId) return customerId;
  }

  return null;
}

function stripeId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id;
  return '';
}

async function findTransactionIdForPaymentIntent(paymentIntentId: string): Promise<string> {
  if (!paymentIntentId) return '';
  const query = await firestore
    .collection('payment_transactions')
    .where('providerPaymentId', '==', paymentIntentId)
    .limit(1)
    .get();
  return query.docs[0]?.id ?? '';
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

async function markRefundStatus(event: StripeEvent, refund: StripeRefund, summary: Record<string, unknown>) {
  const providerRefundId = String(refund.id || '').trim();
  const paymentIntentId = stripeId(refund.payment_intent);
  const transactionId = metadataString(refund.metadata, 'transactionId') || await findTransactionIdForPaymentIntent(paymentIntentId);
  const refundRef = providerRefundId
    ? firestore.collection('refunds').doc(`stripe_${providerRefundId}`)
    : firestore.collection('refunds').doc(`stripe_event_${event.id}`);
  const status = String(refund.status || 'updated');
  const now = admin.firestore.FieldValue.serverTimestamp();

  await refundRef.set({
    id: refundRef.id,
    provider: 'stripe',
    environment: paymentEnvironment(),
    providerRefundId: providerRefundId || null,
    providerPaymentId: paymentIntentId || null,
    transactionId: transactionId || null,
    amount: typeof refund.amount === 'number' ? refund.amount : null,
    currency: refund.currency || null,
    status: status === 'succeeded' ? 'completed' : status,
    source: 'webhook',
    providerEventId: event.id,
    providerSummary: summary,
    updatedAt: now,
    createdAt: now,
  }, {merge: true});

  if (transactionId) {
    await firestore.collection('payment_transactions').doc(transactionId).set({
      status: status === 'succeeded' ? 'refunded' : 'refund_processing',
      refundStatus: status,
      providerRefundId: providerRefundId || null,
      lastProviderEventId: event.id,
      lastProviderEventType: event.type,
      providerSummary: summary,
      updatedAt: now,
    }, {merge: true});
  }
}

async function markDisputeStatus(event: StripeEvent, dispute: StripeDispute, summary: Record<string, unknown>) {
  const paymentIntentId = stripeId(dispute.payment_intent);
  const transactionId = metadataString(dispute.metadata, 'transactionId') || await findTransactionIdForPaymentIntent(paymentIntentId);
  const disputeRef = firestore.collection('refunds').doc(`stripe_dispute_${event.id}`);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await disputeRef.set({
    id: disputeRef.id,
    provider: 'stripe',
    environment: paymentEnvironment(),
    providerDisputeId: dispute.id || null,
    providerPaymentId: paymentIntentId || null,
    transactionId: transactionId || null,
    amount: typeof dispute.amount === 'number' ? dispute.amount : null,
    currency: dispute.currency || null,
    status: 'disputed',
    source: 'webhook',
    providerEventId: event.id,
    providerSummary: summary,
    updatedAt: now,
    createdAt: now,
  }, {merge: true});

  if (transactionId) {
    await firestore.collection('payment_transactions').doc(transactionId).set({
      status: 'disputed',
      disputeStatus: dispute.status || 'updated',
      providerDisputeId: dispute.id || null,
      lastProviderEventId: event.id,
      lastProviderEventType: event.type,
      providerSummary: summary,
      updatedAt: now,
    }, {merge: true});
  }
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

    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? '';
    if (customerId) {
      transaction.set(firestore.collection('provider_customers').doc(`stripe_${paymentEnvironment()}_${userId}`), {
        id: `stripe_${paymentEnvironment()}_${userId}`,
        provider: 'stripe',
        environment: paymentEnvironment(),
        userId,
        providerCustomerId: customerId,
        updatedAt: now,
        createdAt: now,
      }, {merge: true});
    }

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
    await markRefundStatus(event, object as StripeRefund, summary);
    return;
  }

  if (event.type.startsWith('charge.dispute.')) {
    await markDisputeStatus(event, object as StripeDispute, summary);
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

export const createStripePortalSession = functions
  .runWith({secrets: [STRIPE_SECRET_KEY], invoker: 'public'})
  .https.onCall(async (data: PortalPayload, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
      throw new functions.https.HttpsError('unauthenticated', '请先登录后再管理账单');
    }

    const customerId = await findStripeCustomerId(uid);
    if (!customerId) {
      throw new functions.https.HttpsError('failed-precondition', '当前账户还没有可管理的 Stripe 账单记录');
    }

    const returnUrl = safeUrl(data.returnUrl, 'http://127.0.0.1:5173/dashboard');
    const session = await stripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!session.url) {
      throw new functions.https.HttpsError('internal', 'Stripe Customer Portal 没有返回可用地址');
    }

    return {portalUrl: session.url};
  });

export const requestStripeRefund = functions
  .runWith({secrets: [STRIPE_SECRET_KEY], invoker: 'public'})
  .https.onCall(async (data: RefundPayload, context) => {
    const actor = await assertAdmin(context);
    const transactionId = assertSafeDocumentId(data.transactionId, 'transactionId');
    const reason = assertReason(data.reason);
    const idempotencyKey = normalizeRefundIdempotencyKey(actor.uid, transactionId, data.idempotencyKey);
    const transactionRef = firestore.collection('payment_transactions').doc(transactionId);
    const transactionSnap = await transactionRef.get();

    if (!transactionSnap.exists) {
      throw new functions.https.HttpsError('not-found', '支付交易不存在');
    }

    const payment = transactionSnap.data() ?? {};
    const status = String(payment.status || '');
    if (!REFUNDABLE_STATUSES.has(status)) {
      throw new functions.https.HttpsError('failed-precondition', `当前交易状态不能退款: ${status || 'unknown'}`);
    }

    const paymentIntentId = String(payment.providerPaymentId || '').trim();
    if (!paymentIntentId) {
      throw new functions.https.HttpsError('failed-precondition', '交易缺少 Stripe payment intent，不能退款');
    }

    const existingProviderRefundId = String(payment.providerRefundId || '').trim();
    if (existingProviderRefundId) {
      return {
        success: true,
        refundId: String(payment.refundId || ''),
        providerRefundId: existingProviderRefundId,
        status: String(payment.refundStatus || status),
      };
    }

    const maxAmount = Number(payment.amount || 0);
    const requestedAmount = data.amount === undefined || data.amount === null ? maxAmount : Number(data.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || requestedAmount > maxAmount) {
      throw new functions.https.HttpsError('invalid-argument', '退款金额必须大于 0 且不能超过交易金额');
    }

    const refundRef = firestore.collection('refunds').doc(idempotencyKey);
    const existingRefund = await refundRef.get();
    if (existingRefund.exists && existingRefund.data()?.providerRefundId) {
      return {
        success: true,
        refundId: refundRef.id,
        providerRefundId: existingRefund.data()?.providerRefundId,
        status: existingRefund.data()?.status,
      };
    }

    const refund = await stripeClient().refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(requestedAmount),
      metadata: {
        transactionId,
        requestedBy: actor.uid,
        environment: paymentEnvironment(),
      },
    }, {idempotencyKey});

    const now = admin.firestore.FieldValue.serverTimestamp();
    await Promise.all([
      refundRef.set({
        id: refundRef.id,
        provider: 'stripe',
        environment: paymentEnvironment(),
        providerRefundId: refund.id,
        providerPaymentId: paymentIntentId,
        transactionId,
        amount: requestedAmount,
        currency: payment.currency || refund.currency || 'usd',
        reason,
        status: refund.status || 'processing',
        source: 'admin_request',
        requestedBy: actor,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      }, {merge: true}),
      transactionRef.set({
        status: refund.status === 'succeeded' ? 'refunded' : 'refund_requested',
        refundStatus: refund.status || 'processing',
        refundId: refundRef.id,
        providerRefundId: refund.id,
        refundRequestedBy: actor.uid,
        refundReason: reason,
        updatedAt: now,
      }, {merge: true}),
      firestore.collection('audit_logs').add({
        actionType: 'request_stripe_refund',
        targetCollection: 'payment_transactions',
        targetId: transactionId,
        actor,
        reason,
        metadata: {
          refundId: refundRef.id,
          providerRefundId: refund.id,
          amount: requestedAmount,
          currency: payment.currency || refund.currency || 'usd',
          previousStatus: status,
        },
        status: 'approved_executed',
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    return {
      success: true,
      refundId: refundRef.id,
      providerRefundId: refund.id,
      status: refund.status || 'processing',
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
