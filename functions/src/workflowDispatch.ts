import * as admin from 'firebase-admin';
import {createHmac} from 'crypto';
import * as functions from 'firebase-functions';
import {defineSecret} from 'firebase-functions/params';

declare const fetch: (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

const WORKFLOW_SIGNING_SECRET = defineSecret('WORKFLOW_SIGNING_SECRET');

const WORKFLOW_SELLER_APPLICATION_WEBHOOK = defineSecret('WORKFLOW_SELLER_APPLICATION_WEBHOOK');
const WORKFLOW_SUPPORT_TICKET_WEBHOOK = defineSecret('WORKFLOW_SUPPORT_TICKET_WEBHOOK');
const WORKFLOW_PAYMENT_SUCCESS_WEBHOOK = defineSecret('WORKFLOW_PAYMENT_SUCCESS_WEBHOOK');
const WORKFLOW_SETTLEMENT_REPORT_WEBHOOK = defineSecret('WORKFLOW_SETTLEMENT_REPORT_WEBHOOK');
const WORKFLOW_API_HEALTH_WEBHOOK = defineSecret('WORKFLOW_API_HEALTH_WEBHOOK');
const WORKFLOW_EVENT_BUS_WEBHOOK = defineSecret('WORKFLOW_EVENT_BUS_WEBHOOK');

const allWorkflowSecrets = [
  WORKFLOW_SELLER_APPLICATION_WEBHOOK,
  WORKFLOW_SUPPORT_TICKET_WEBHOOK,
  WORKFLOW_PAYMENT_SUCCESS_WEBHOOK,
  WORKFLOW_SETTLEMENT_REPORT_WEBHOOK,
  WORKFLOW_API_HEALTH_WEBHOOK,
  WORKFLOW_EVENT_BUS_WEBHOOK,
  WORKFLOW_SIGNING_SECRET,
];

type WorkflowProvider = 'activepieces' | 'node-red' | 'windmill';

type AutomationWorkflowType =
  | 'seller_application.created'
  | 'support_ticket.created'
  | 'payment.succeeded'
  | 'settlement.monthly_snapshot'
  | 'api_health.snapshot'
  | 'user.created'
  | 'user.deleted'
  | 'email_log.created'
  | 'seller_profile.created'
  | 'api_offer.created'
  | 'api_offer.status_changed'
  | 'seller_product.created'
  | 'product.created'
  | 'merchant_api_test.created'
  | 'api_call.completed'
  | 'api_call.failed'
  | 'subscription.created'
  | 'purchase.created';

type AutomationWorkflowPayload = {
  eventType: AutomationWorkflowType;
  resourceId: string;
  source: string;
  data: Record<string, unknown>;
};

const workflowWebhookUrlFor = (eventType: AutomationWorkflowType) => {
  if (eventType === 'seller_application.created') return WORKFLOW_SELLER_APPLICATION_WEBHOOK.value();
  if (eventType === 'support_ticket.created') return WORKFLOW_SUPPORT_TICKET_WEBHOOK.value();
  if (eventType === 'payment.succeeded') return WORKFLOW_PAYMENT_SUCCESS_WEBHOOK.value();
  if (eventType === 'settlement.monthly_snapshot') return WORKFLOW_SETTLEMENT_REPORT_WEBHOOK.value();
  if (eventType === 'api_health.snapshot') return WORKFLOW_API_HEALTH_WEBHOOK.value();
  return WORKFLOW_EVENT_BUS_WEBHOOK.value();
};

const workflowProviderFor = (eventType: AutomationWorkflowType): WorkflowProvider => {
  if (eventType === 'settlement.monthly_snapshot') return 'windmill';
  if (eventType === 'api_health.snapshot') return 'node-red';
  return 'activepieces';
};

const webhookTargetFor = (eventType: AutomationWorkflowType): {provider: WorkflowProvider; url: string} | null => {
  const workflowUrl = workflowWebhookUrlFor(eventType);
  if (workflowUrl) return {provider: workflowProviderFor(eventType), url: workflowUrl};
  return null;
};

const cleanFirestoreValue = (value: unknown): unknown => {
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (value instanceof admin.firestore.DocumentReference) return value.path;
  if (Array.isArray(value)) return value.map(cleanFirestoreValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, cleanFirestoreValue(entry)])
    );
  }
  return value;
};

const signatureFor = (body: string) => {
  const secret = WORKFLOW_SIGNING_SECRET.value();
  if (!secret) return '';
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
};

const postAutomationWorkflowEvent = async (payload: AutomationWorkflowPayload) => {
  const target = webhookTargetFor(payload.eventType);
  const eventRef = firestore.collection('automationWorkflowEvents').doc();
  const body = JSON.stringify({
    id: eventRef.id,
    eventType: payload.eventType,
    resourceId: payload.resourceId,
    source: payload.source,
    occurredAt: new Date().toISOString(),
    data: cleanFirestoreValue(payload.data),
  });

  if (!target) {
    await eventRef.set({
      eventType: payload.eventType,
      resourceId: payload.resourceId,
      source: payload.source,
      status: 'skipped',
      reason: 'missing_workflow_webhook_url',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const signature = signatureFor(body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-BloomX-Event-Type': payload.eventType,
    'X-BloomX-Event-Id': eventRef.id,
    'X-BloomX-Workflow-Provider': target.provider,
  };
  if (signature) headers['X-BloomX-Signature'] = signature;

  try {
    const response = await fetch(target.url, {
      method: 'POST',
      headers,
      body,
    });
    const responseText = await response.text();

    await eventRef.set({
      eventType: payload.eventType,
      resourceId: payload.resourceId,
      source: payload.source,
      provider: target.provider,
      status: response.ok ? 'delivered' : 'failed',
      providerStatus: response.status,
      responsePreview: responseText.slice(0, 500),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    await eventRef.set({
      eventType: payload.eventType,
      resourceId: payload.resourceId,
      source: payload.source,
      provider: target.provider,
      status: 'failed',
      error: error instanceof Error ? error.message : 'unknown_error',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
};

const isSuccessfulPayment = (data: admin.firestore.DocumentData) => {
  const status = String(data.status || '').toLowerCase();
  const type = String(data.type || data.kind || '').toLowerCase();
  return ['succeeded', 'success', 'completed', 'paid'].includes(status)
    && ['payment', 'recharge', 'checkout', 'credit_purchase', ''].includes(type);
};

const paymentCreatedHandler = async (
  snapshot: functions.firestore.QueryDocumentSnapshot,
  source: string,
  parentUserId?: string
) => {
  const data = snapshot.data();
  if (!isSuccessfulPayment(data)) return null;

  await postAutomationWorkflowEvent({
    eventType: 'payment.succeeded',
    resourceId: snapshot.id,
    source,
    data: {
      ...data,
      userId: parentUserId || data.userId || data.uid || null,
    },
  });
  return null;
};

const statusChanged = (
  before: admin.firestore.DocumentData | undefined,
  after: admin.firestore.DocumentData | undefined
) => String(before?.status || '') !== String(after?.status || '');

export const onSellerApplicationCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('seller_applications/{applicationId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'seller_application.created',
      resourceId: context.params.applicationId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onSupportTicketCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('supportTickets/{ticketId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'support_ticket.created',
      resourceId: context.params.ticketId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onPaymentTransactionCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('transactions/{transactionId}')
  .onCreate((snapshot) => paymentCreatedHandler(snapshot, snapshot.ref.path));

export const onUserPaymentTransactionCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('users/{userId}/transactions/{transactionId}')
  .onCreate((snapshot, context) => paymentCreatedHandler(snapshot, snapshot.ref.path, context.params.userId));

export const sendMonthlySettlementSnapshotToWorkflow = functions
  .runWith({secrets: allWorkflowSecrets})
  .pubsub.schedule('0 9 1 * *')
  .timeZone('Asia/Shanghai')
  .onRun(async () => {
    const [statsSnap, settlementsSnap] = await Promise.all([
      firestore.collection('apiOfferStats').limit(500).get(),
      firestore.collection('settlements').where('status', '==', 'pending').limit(500).get(),
    ]);

    await postAutomationWorkflowEvent({
      eventType: 'settlement.monthly_snapshot',
      resourceId: `settlement-${new Date().toISOString().slice(0, 7)}`,
      source: 'scheduled:monthly-settlement',
      data: {
        period: new Date().toISOString().slice(0, 7),
        offerStats: statsSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})),
        pendingSettlements: settlementsSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})),
      },
    });
    return null;
  });

export const sendApiHealthSnapshotToWorkflow = functions
  .runWith({secrets: allWorkflowSecrets})
  .pubsub.schedule('every 30 minutes')
  .onRun(async () => {
    const [offersSnap, failedCallsSnap] = await Promise.all([
      firestore.collection('apiOffers').where('status', '==', 'listed').limit(500).get(),
      firestore.collection('apiCallRecords').where('status', '==', 'failed').limit(500).get(),
    ]);

    await postAutomationWorkflowEvent({
      eventType: 'api_health.snapshot',
      resourceId: `api-health-${Date.now()}`,
      source: 'scheduled:api-health',
      data: {
        listedOffers: offersSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})),
        recentFailedCalls: failedCallsSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})),
      },
    });
    return null;
  });

export const onUserProfileCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('users/{userId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'user.created',
      resourceId: context.params.userId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onUserProfileDeleted = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('users/{userId}')
  .onDelete(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'user.deleted',
      resourceId: context.params.userId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onEmailLogCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('email_logs/{logId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'email_log.created',
      resourceId: context.params.logId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onSellerProfileCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('sellers/{sellerId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'seller_profile.created',
      resourceId: context.params.sellerId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onApiOfferCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('apiOffers/{offerId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'api_offer.created',
      resourceId: context.params.offerId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onApiOfferStatusChanged = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('apiOffers/{offerId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!statusChanged(before, after)) return null;

    await postAutomationWorkflowEvent({
      eventType: 'api_offer.status_changed',
      resourceId: context.params.offerId,
      source: change.after.ref.path,
      data: {
        beforeStatus: before.status || null,
        afterStatus: after.status || null,
        offer: after,
      },
    });
    return null;
  });

export const onSellerProductCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('sellers/{sellerId}/products/{productId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'seller_product.created',
      resourceId: context.params.productId,
      source: snapshot.ref.path,
      data: {
        sellerId: context.params.sellerId,
        ...snapshot.data(),
      },
    });
    return null;
  });

export const onProductCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('products/{productId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'product.created',
      resourceId: context.params.productId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onMerchantApiTestLogCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('merchantApiTestLogs/{testId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'merchant_api_test.created',
      resourceId: context.params.testId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onApiCallRecordCompleted = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('apiCallRecords/{callId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!statusChanged(before, after)) return null;

    const status = String(after.status || '').toLowerCase();
    if (status !== 'completed' && status !== 'failed') return null;

    await postAutomationWorkflowEvent({
      eventType: status === 'completed' ? 'api_call.completed' : 'api_call.failed',
      resourceId: context.params.callId,
      source: change.after.ref.path,
      data: {
        beforeStatus: before.status || null,
        afterStatus: after.status || null,
        call: after,
      },
    });
    return null;
  });

export const onSubscriptionCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('subscriptions/{subscriptionId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'subscription.created',
      resourceId: context.params.subscriptionId,
      source: snapshot.ref.path,
      data: snapshot.data(),
    });
    return null;
  });

export const onPurchaseCreated = functions
  .runWith({secrets: allWorkflowSecrets})
  .firestore.document('users/{userId}/purchases/{purchaseId}')
  .onCreate(async (snapshot, context) => {
    await postAutomationWorkflowEvent({
      eventType: 'purchase.created',
      resourceId: context.params.purchaseId,
      source: snapshot.ref.path,
      data: {
        userId: context.params.userId,
        ...snapshot.data(),
      },
    });
    return null;
  });
