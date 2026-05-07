import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPaymentReconciliation,
  type PaymentReconciliationDatasetMap,
} from '../src/services/paymentReconciliation.ts';

function record(id: string, collection: string, status: string, raw: Record<string, unknown>) {
  return {
    id,
    collection,
    title: String(raw.providerPaymentId ?? raw.providerRefundId ?? raw.eventId ?? id),
    subtitle: String(raw.reason ?? raw.eventType ?? 'fixture'),
    status,
    owner: String(raw.userId ?? raw.owner ?? 'user_1'),
    amount: typeof raw.amount === 'number' ? `${raw.currency ?? 'USD'} ${raw.amount}` : undefined,
    raw,
  };
}

function dataset(key: keyof PaymentReconciliationDatasetMap, rows: ReturnType<typeof record>[]) {
  return {
    key,
    collectionName: String(key),
    label: String(key),
    description: String(key),
    rows,
    statusCounts: {},
  };
}

test('buildPaymentReconciliation summarizes Stripe payment operations and review queues', () => {
  const summary = buildPaymentReconciliation({
    payments: dataset('payments', [
      record('tx_1', 'payment_transactions', 'paid', {
        provider: 'stripe',
        amount: 4900,
        currency: 'USD',
        providerPaymentId: 'pi_paid',
        userId: 'user_1',
      }),
      record('tx_2', 'payment_transactions', 'failed', {
        provider: 'stripe',
        amount: 2900,
        currency: 'USD',
        providerPaymentId: 'pi_failed',
        userId: 'user_2',
      }),
    ]),
    ledger: dataset('ledger', [
      record('ledger_1', 'credit_ledger', 'posted', {
        source: 'payment',
        delta: 5000,
        transactionId: 'tx_1',
      }),
      record('ledger_2', 'credit_ledger', 'posted', {
        source: 'usage',
        delta: -300,
        transactionId: 'usage_1',
      }),
    ]),
    refunds: dataset('refunds', [
      record('refund_1', 'refunds', 'processing', {
        provider: 'stripe',
        amount: 1200,
        currency: 'USD',
        transactionId: 'tx_1',
        providerRefundId: 're_pending',
        reason: 'customer request',
      }),
      record('refund_2', 'refunds', 'completed', {
        provider: 'stripe',
        amount: 400,
        currency: 'USD',
        transactionId: 'tx_0',
        providerRefundId: 're_done',
      }),
    ]),
    webhooks: dataset('webhooks', [
      record('evt_1', 'webhook_events', 'processed', {
        eventId: 'evt_paid',
        eventType: 'checkout.session.completed',
        processingStatus: 'processed',
      }),
      record('evt_2', 'webhook_events', 'failed', {
        eventId: 'evt_refund_failed',
        eventType: 'charge.refunded',
        processingStatus: 'failed',
      }),
    ]),
    disputes: dataset('disputes', [
      record('dp_1', 'disputes', 'needs_response', {
        provider: 'stripe',
        amount: 900,
        currency: 'USD',
        transactionId: 'tx_2',
        providerDisputeId: 'dp_open',
        reason: 'fraudulent',
      }),
      record('dp_2', 'disputes', 'won', {
        provider: 'stripe',
        amount: 300,
        currency: 'USD',
        transactionId: 'tx_1',
        providerDisputeId: 'dp_won',
      }),
    ]),
  });

  assert.equal(summary.provider, 'stripe');
  assert.equal(summary.collectedAmount.value, 4900);
  assert.equal(summary.creditedAmount.value, 5000);
  assert.equal(summary.creditedAmount.formatted, '5,000 credits');
  assert.equal(summary.failedWebhooks, 1);
  assert.equal(summary.pendingRefunds, 1);
  assert.equal(summary.openDisputes, 1);
  assert.equal(summary.reviewItems.length, 2);
  assert.equal(summary.reviewItems[0].kind, 'refund');
  assert.equal(summary.reviewItems[1].kind, 'dispute');
});
