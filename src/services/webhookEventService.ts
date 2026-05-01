import type {
  PaymentDomainEvent,
  PaymentProvider,
  VerifiedWebhookEvent,
  WebhookEventRecord,
} from '../types/payment';

export interface WebhookIdempotencyInput {
  provider: PaymentProvider;
  eventId: string;
  requestId: string;
}

export function createWebhookIdempotencyKey(input: WebhookIdempotencyInput): string {
  return [input.provider, input.eventId, input.requestId].join(':');
}

export function buildWebhookEventRecord(
  event: VerifiedWebhookEvent,
  requestId: string,
  replayOf?: string,
): WebhookEventRecord {
  return {
    id: createWebhookIdempotencyKey({
      provider: event.provider,
      eventId: event.eventId,
      requestId,
    }),
    provider: event.provider,
    environment: event.environment,
    eventId: event.eventId,
    eventType: event.eventType,
    signatureStatus: event.signatureStatus,
    processingStatus: event.signatureStatus === 'verified' ? 'received' : 'failed',
    attempts: 0,
    requestId,
    payloadSummary: event.payloadSummary,
    error: event.signatureStatus === 'verified' ? undefined : 'Webhook signature failed verification.',
    receivedAt: new Date(),
    replayOf,
  };
}

export function canProcessWebhook(record: WebhookEventRecord): boolean {
  return record.signatureStatus === 'verified' && !['processed', 'processing'].includes(record.processingStatus);
}

export function summarizePaymentDomainEvent(event: PaymentDomainEvent): Record<string, unknown> {
  return {
    provider: event.provider,
    eventId: event.eventId,
    eventType: event.eventType,
    rawType: event.rawType,
    transactionId: event.transactionId,
    providerPaymentId: event.providerPaymentId,
    providerSessionId: event.providerSessionId,
    providerSubscriptionId: event.providerSubscriptionId,
    userId: event.userId,
    money: event.money,
    creditDelta: event.creditDelta,
  };
}

export function assertWebhookReplayReason(reason: string): void {
  if (reason.trim().length < 12) {
    throw new Error('Webhook replay requires an audit reason of at least 12 characters.');
  }
}
