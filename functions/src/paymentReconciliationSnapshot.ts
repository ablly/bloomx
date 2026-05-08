import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  adminRoleForIdentity,
  allowedAdminEmails,
  isAdminIdentity,
} from './adminAuthorization';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

type Actor = {
  uid: string;
  email: string;
  role: string;
};

type ReconciliationRow = {
  id: string;
  status: string;
  owner: string;
  raw: admin.firestore.DocumentData;
};

function paymentEnvironment(): 'test' | 'production' {
  return process.env.STRIPE_ENVIRONMENT === 'production' ? 'production' : 'test';
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function currency(raw: admin.firestore.DocumentData): string {
  return text(raw.currency, 'usd').toUpperCase();
}

function moneyTotal(value: number, nextCurrency: string) {
  return {
    value,
    currency: nextCurrency,
    formatted: `${nextCurrency.toUpperCase()} ${(value / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  };
}

function creditTotal(value: number) {
  return {
    value,
    currency: 'CREDITS',
    formatted: `${value.toLocaleString()} credits`,
  };
}

function rowFromDoc(doc: admin.firestore.QueryDocumentSnapshot): ReconciliationRow {
  const raw = doc.data();
  return {
    id: doc.id,
    status: text(raw.status ?? raw.processingStatus ?? raw.signatureStatus, 'unknown'),
    owner: text(raw.userId ?? raw.uid ?? raw.email ?? raw.actor?.email, '未归属'),
    raw,
  };
}

async function readRows(collectionName: string, maxRows = 200): Promise<ReconciliationRow[]> {
  const snap = await firestore.collection(collectionName).limit(maxRows).get();
  return snap.docs.map(rowFromDoc);
}

function amountFor(row: ReconciliationRow): number {
  return numberValue(row.raw.amount ?? row.raw.amount_total ?? row.raw.grossAmount ?? row.raw.netAmount);
}

function isPaymentCollected(row: ReconciliationRow): boolean {
  return /paid|completed|succeeded/i.test(row.status);
}

function isLedgerCredit(row: ReconciliationRow): boolean {
  const source = text(row.raw.source).toLowerCase();
  const delta = numberValue(row.raw.delta ?? row.raw.creditDelta ?? row.raw.credits);
  return delta > 0 && (!source || source === 'payment' || source === 'admin_adjustment' || source === 'migration');
}

function isWebhookFailed(row: ReconciliationRow): boolean {
  const processing = text(row.raw.processingStatus).toLowerCase();
  const signature = text(row.raw.signatureStatus).toLowerCase();
  return /failed|dead_lettered|dead|error/.test(`${row.status} ${processing} ${signature}`.toLowerCase());
}

function isDispute(row: ReconciliationRow): boolean {
  return Boolean(row.raw.providerDisputeId || row.raw.disputeStatus || /dispute|disputed/i.test(row.status));
}

function isRefundReview(row: ReconciliationRow): boolean {
  return !['completed', 'succeeded', 'approved', 'rejected', 'canceled', 'cancelled'].includes(row.status.toLowerCase())
    && /requested|pending|requires_action|failed|processing|reviewing|updated/.test(row.status.toLowerCase());
}

function isDisputeReview(row: ReconciliationRow): boolean {
  const status = text(row.raw.disputeStatus, row.status).toLowerCase();
  return isDispute(row) && !['won', 'lost', 'closed', 'resolved'].includes(status);
}

function reviewItem(row: ReconciliationRow, kind: 'refund' | 'dispute') {
  const raw = row.raw;
  const providerId = kind === 'dispute'
    ? text(raw.providerDisputeId, text(raw.providerPaymentId, row.id))
    : text(raw.providerRefundId, text(raw.providerPaymentId, row.id));

  return {
    id: row.id,
    kind,
    status: kind === 'dispute' ? text(raw.disputeStatus, row.status) : row.status,
    severity: /failed|fraud|needs_response|warning/i.test(`${row.status} ${raw.reason ?? ''}`) ? 'high' : 'medium',
    amount: moneyTotal(amountFor(row), currency(raw)),
    transactionId: text(raw.transactionId, 'unlinked'),
    providerId,
    reason: text(raw.reason, '需要运营复核'),
    owner: row.owner,
  };
}

async function assertAdmin(context: functions.https.CallableContext): Promise<Actor> {
  const uid = context.auth?.uid;
  const email = String(context.auth?.token.email || '').trim().toLowerCase();

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Admin snapshot refresh requires sign in');
  }

  const allowedByEmail = allowedAdminEmails().includes(email);
  const userSnap = await firestore.collection('users').doc(uid).get();
  const role = String(userSnap.data()?.role || '');
  const token = context.auth?.token as Record<string, unknown>;

  if (!isAdminIdentity({uid, email, token}) && role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin role is required');
  }

  return {
    uid,
    email,
    role: allowedByEmail ? 'owner' : adminRoleForIdentity({uid, email, token}, role),
  };
}

async function buildAndWritePaymentReconciliationSnapshot(actor?: Actor) {
  const [payments, ledger, refunds, webhooks] = await Promise.all([
    readRows('payment_transactions'),
    readRows('credit_ledger'),
    readRows('refunds'),
    readRows('webhook_events'),
  ]);
  const allRows = [...payments, ...ledger, ...refunds, ...webhooks];
  const nextCurrency = allRows.map((row) => currency(row.raw)).find(Boolean) ?? 'USD';
  const refundReviews = refunds.filter((row) => !isDispute(row) && isRefundReview(row));
  const disputeReviews = refunds.filter(isDisputeReview);
  const reviewItems = [
    ...refundReviews.map((row) => reviewItem(row, 'refund')),
    ...disputeReviews.map((row) => reviewItem(row, 'dispute')),
  ];
  const now = admin.firestore.FieldValue.serverTimestamp();
  const summary = {
    provider: 'stripe',
    source: 'server_snapshot',
    snapshotId: 'current',
    snapshotStatus: 'ready',
    environment: paymentEnvironment(),
    collectedAmount: moneyTotal(payments.filter(isPaymentCollected).reduce((sum, row) => sum + amountFor(row), 0), nextCurrency),
    creditedAmount: creditTotal(ledger.filter(isLedgerCredit).reduce((sum, row) => sum + numberValue(row.raw.delta ?? row.raw.creditDelta ?? row.raw.credits), 0)),
    failedWebhooks: webhooks.filter(isWebhookFailed).length,
    pendingRefunds: refundReviews.length,
    openDisputes: disputeReviews.length,
    requiresReview: reviewItems.length,
    transactionCount: payments.length,
    ledgerEntryCount: ledger.length,
    reviewItems,
    hasRecords: allRows.length > 0,
  };

  await firestore.collection('payment_reconciliation_snapshots').doc('current').set({
    id: 'current',
    provider: 'stripe',
    environment: paymentEnvironment(),
    status: 'ready',
    summary,
    inputCounts: {
      payments: payments.length,
      ledger: ledger.length,
      refunds: refunds.length,
      webhooks: webhooks.length,
    },
    refreshedBy: actor ?? null,
    updatedAt: now,
    createdAt: now,
  }, {merge: true});

  return summary;
}

export const refreshPaymentReconciliationSnapshot = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (_data, context) => {
    const actor = await assertAdmin(context);
    const summary = await buildAndWritePaymentReconciliationSnapshot(actor);
    return {
      success: true,
      summary,
    };
  });

export const scheduledPaymentReconciliationSnapshot = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    await buildAndWritePaymentReconciliationSnapshot();
    return null;
  });
