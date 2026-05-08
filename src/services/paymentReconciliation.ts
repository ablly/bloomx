type AdminRecordLike = {
  id: string;
  collection: string;
  title: string;
  subtitle: string;
  status: string;
  owner: string;
  amount?: string;
  raw: Record<string, unknown>;
};

type AdminDatasetLike = {
  rows: AdminRecordLike[];
};

export type PaymentReconciliationDatasetMap = {
  payments?: AdminDatasetLike;
  ledger?: AdminDatasetLike;
  refunds?: AdminDatasetLike;
  webhooks?: AdminDatasetLike;
  disputes?: AdminDatasetLike;
};

export type PaymentReviewKind = 'refund' | 'dispute';

export interface PaymentMoneyTotal {
  value: number;
  currency: string;
  formatted: string;
}

export interface PaymentReviewItem {
  id: string;
  kind: PaymentReviewKind;
  status: string;
  severity: 'high' | 'medium';
  amount: PaymentMoneyTotal;
  transactionId: string;
  providerId: string;
  reason: string;
  owner: string;
}

export interface PaymentReconciliationSummary {
  provider: 'stripe';
  source: 'client_live' | 'server_snapshot';
  snapshotId?: string;
  snapshotStatus?: string;
  snapshotUpdatedAt?: string;
  environment?: string;
  collectedAmount: PaymentMoneyTotal;
  creditedAmount: PaymentMoneyTotal;
  failedWebhooks: number;
  pendingRefunds: number;
  openDisputes: number;
  requiresReview: number;
  transactionCount: number;
  ledgerEntryCount: number;
  reviewItems: PaymentReviewItem[];
  hasRecords: boolean;
}

const closedRefundStatuses = new Set(['completed', 'succeeded', 'approved', 'rejected', 'canceled', 'cancelled']);
const closedDisputeStatuses = new Set(['won', 'lost', 'closed', 'resolved']);

function rows(dataset?: AdminDatasetLike): AdminRecordLike[] {
  return dataset?.rows ?? [];
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value;
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

function currency(raw: Record<string, unknown>): string {
  return text(raw.currency, 'usd').toUpperCase();
}

function moneyTotal(value: number, nextCurrency: string): PaymentMoneyTotal {
  return {
    value,
    currency: nextCurrency,
    formatted: `${nextCurrency.toUpperCase()} ${(value / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  };
}

function creditTotal(value: number): PaymentMoneyTotal {
  return {
    value,
    currency: 'CREDITS',
    formatted: `${value.toLocaleString()} credits`,
  };
}

function amountFor(row: AdminRecordLike): number {
  return numberValue(row.raw.amount ?? row.raw.amount_total ?? row.raw.grossAmount ?? row.raw.netAmount);
}

function isPaymentCollected(row: AdminRecordLike): boolean {
  return /paid|completed|succeeded/i.test(row.status);
}

function isPaymentLedgerCredit(row: AdminRecordLike): boolean {
  const source = text(row.raw.source).toLowerCase();
  const delta = numberValue(row.raw.delta ?? row.raw.creditDelta ?? row.raw.credits);
  return delta > 0 && (!source || source === 'payment' || source === 'admin_adjustment' || source === 'migration');
}

function isWebhookFailed(row: AdminRecordLike): boolean {
  const processing = text(row.raw.processingStatus).toLowerCase();
  const signature = text(row.raw.signatureStatus).toLowerCase();
  return /failed|dead_lettered|dead|error/.test(`${row.status} ${processing} ${signature}`.toLowerCase());
}

function isRefundReview(row: AdminRecordLike): boolean {
  const status = row.status.toLowerCase();
  if (closedRefundStatuses.has(status)) return false;
  return /requested|pending|requires_action|failed|processing|reviewing|updated/.test(status);
}

function isDisputeRecord(row: AdminRecordLike): boolean {
  return Boolean(row.raw.providerDisputeId || row.raw.disputeStatus || /dispute|disputed/i.test(row.status));
}

function isDisputeReview(row: AdminRecordLike): boolean {
  const status = text(row.raw.disputeStatus, row.status).toLowerCase();
  return isDisputeRecord(row) && !closedDisputeStatuses.has(status);
}

function reviewItem(row: AdminRecordLike, kind: PaymentReviewKind): PaymentReviewItem {
  const raw = row.raw;
  const nextCurrency = currency(raw);
  return {
    id: row.id,
    kind,
    status: kind === 'dispute' ? text(raw.disputeStatus, row.status) : row.status,
    severity: /failed|fraud|needs_response|warning/i.test(`${row.status} ${raw.reason ?? ''}`) ? 'high' : 'medium',
    amount: moneyTotal(amountFor(row), nextCurrency),
    transactionId: text(raw.transactionId, 'unlinked'),
    providerId: text(
      kind === 'dispute' ? raw.providerDisputeId : raw.providerRefundId,
      text(raw.providerPaymentId, row.id),
    ),
    reason: text(raw.reason, row.subtitle),
    owner: row.owner,
  };
}

export function buildPaymentReconciliation(
  datasets: PaymentReconciliationDatasetMap,
): PaymentReconciliationSummary {
  const paymentRows = rows(datasets.payments);
  const ledgerRows = rows(datasets.ledger);
  const refundRows = rows(datasets.refunds);
  const webhookRows = rows(datasets.webhooks);
  const explicitDisputeRows = rows(datasets.disputes);
  const disputeRows = [...explicitDisputeRows, ...refundRows.filter(isDisputeRecord)];
  const allRows = [...paymentRows, ...ledgerRows, ...refundRows, ...webhookRows, ...explicitDisputeRows];
  const nextCurrency =
    allRows.map((row) => currency(row.raw)).find(Boolean) ?? 'USD';

  const collected = paymentRows
    .filter(isPaymentCollected)
    .reduce((sum, row) => sum + amountFor(row), 0);
  const credited = ledgerRows
    .filter(isPaymentLedgerCredit)
    .reduce((sum, row) => sum + numberValue(row.raw.delta ?? row.raw.creditDelta ?? row.raw.credits), 0);
  const refundReviews = refundRows.filter((row) => !isDisputeRecord(row) && isRefundReview(row));
  const disputeReviews = disputeRows.filter(isDisputeReview);
  const reviewItems = [
    ...refundReviews.map((row) => reviewItem(row, 'refund')),
    ...disputeReviews.map((row) => reviewItem(row, 'dispute')),
  ];

  return {
    provider: 'stripe',
    source: 'client_live',
    collectedAmount: moneyTotal(collected, nextCurrency),
    creditedAmount: creditTotal(credited),
    failedWebhooks: webhookRows.filter(isWebhookFailed).length,
    pendingRefunds: refundReviews.length,
    openDisputes: disputeReviews.length,
    requiresReview: reviewItems.length,
    transactionCount: paymentRows.length,
    ledgerEntryCount: ledgerRows.length,
    reviewItems,
    hasRecords: allRows.length > 0,
  };
}

function isMoneyTotal(value: unknown): value is PaymentMoneyTotal {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as PaymentMoneyTotal).value === 'number' &&
      typeof (value as PaymentMoneyTotal).currency === 'string' &&
      typeof (value as PaymentMoneyTotal).formatted === 'string',
  );
}

function isReviewItem(value: unknown): value is PaymentReviewItem {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as PaymentReviewItem).id === 'string' &&
      ((value as PaymentReviewItem).kind === 'refund' || (value as PaymentReviewItem).kind === 'dispute') &&
      isMoneyTotal((value as PaymentReviewItem).amount),
  );
}

export function applyServerPaymentReconciliationSnapshot(
  clientSummary: PaymentReconciliationSummary,
  snapshot: Record<string, unknown> | null | undefined,
): PaymentReconciliationSummary {
  const summary = snapshot?.summary;
  if (!summary || typeof summary !== 'object') return clientSummary;

  const raw = summary as Record<string, unknown>;
  if (!isMoneyTotal(raw.collectedAmount) || !isMoneyTotal(raw.creditedAmount)) return clientSummary;

  const reviewItems = Array.isArray(raw.reviewItems) ? raw.reviewItems.filter(isReviewItem) : [];

  return {
    provider: 'stripe',
    source: 'server_snapshot',
    snapshotId: text(raw.snapshotId, text(snapshot.id, 'current')),
    snapshotStatus: text(raw.snapshotStatus, text(snapshot.status, 'ready')),
    snapshotUpdatedAt: text(snapshot.updatedAt),
    environment: text(raw.environment, text(snapshot.environment)),
    collectedAmount: raw.collectedAmount,
    creditedAmount: raw.creditedAmount,
    failedWebhooks: numberValue(raw.failedWebhooks),
    pendingRefunds: numberValue(raw.pendingRefunds),
    openDisputes: numberValue(raw.openDisputes),
    requiresReview: numberValue(raw.requiresReview),
    transactionCount: numberValue(raw.transactionCount),
    ledgerEntryCount: numberValue(raw.ledgerEntryCount),
    reviewItems,
    hasRecords: raw.hasRecords === true,
  };
}
