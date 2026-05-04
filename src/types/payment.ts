export type PaymentProvider = 'stripe';

export type PaymentEnvironment = 'test' | 'production';

export type PaymentProductType = 'credits' | 'subscription';

export type PaymentTransactionStatus =
  | 'created'
  | 'checkout_started'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'disputed'
  | 'cancelled';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type RefundStatus = 'requested' | 'reviewing' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';

export type WebhookSignatureStatus = 'unchecked' | 'verified' | 'failed';

export type WebhookProcessingStatus = 'received' | 'processing' | 'processed' | 'failed' | 'dead_lettered' | 'replayed';

export type LedgerSource = 'payment' | 'refund' | 'usage' | 'admin_adjustment' | 'migration';

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface PaymentProviderCapability {
  cards: boolean;
  alipay: boolean;
  wechatPay: boolean;
  subscriptions: boolean;
}

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  environment: PaymentEnvironment;
  enabled: boolean;
  displayName: string;
  publicKey?: string;
  secretRef: string;
  webhookSecretRef: string;
  capabilities: PaymentProviderCapability;
}

export interface CreateCheckoutInput {
  userId: string;
  provider: PaymentProvider;
  productType: PaymentProductType;
  priceId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  providerSessionId: string;
}

export interface VerifiedWebhookEvent {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  environment: PaymentEnvironment;
  signatureStatus: WebhookSignatureStatus;
  occurredAt: Date;
  payloadSummary: Record<string, unknown>;
}

export interface PaymentDomainEvent {
  provider: PaymentProvider;
  eventId: string;
  eventType:
    | 'checkout_completed'
    | 'payment_failed'
    | 'subscription_updated'
    | 'refund_updated'
    | 'dispute_updated'
    | 'unknown';
  providerPaymentId?: string;
  providerSessionId?: string;
  providerSubscriptionId?: string;
  userId?: string;
  transactionId?: string;
  money?: MoneyAmount;
  creditDelta?: number;
  rawType: string;
}

export interface PaymentTransaction {
  id: string;
  provider: PaymentProvider;
  environment: PaymentEnvironment;
  userId: string;
  providerPaymentId?: string;
  providerSessionId?: string;
  productType: PaymentProductType;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  transactionId?: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  source: LedgerSource;
  requestId: string;
  createdAt: Date;
}

export interface BillingSubscription {
  id: string;
  provider: PaymentProvider;
  environment: PaymentEnvironment;
  providerSubscriptionId: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  updatedAt: Date;
}

export interface RefundRecord {
  id: string;
  provider: PaymentProvider;
  providerRefundId?: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface WebhookEventRecord {
  id: string;
  provider: PaymentProvider;
  environment: PaymentEnvironment;
  eventId: string;
  eventType: string;
  signatureStatus: WebhookSignatureStatus;
  processingStatus: WebhookProcessingStatus;
  attempts: number;
  requestId: string;
  payloadSummary: Record<string, unknown>;
  error?: string;
  receivedAt: Date;
  processedAt?: Date;
  replayOf?: string;
}

export interface ProviderCustomerMap {
  id: string;
  provider: PaymentProvider;
  environment: PaymentEnvironment;
  userId: string;
  providerCustomerId: string;
  createdAt: Date;
}

export interface SellerSettlement {
  id: string;
  sellerId: string;
  period: string;
  grossAmount: number;
  platformFee: number;
  refundAmount: number;
  netAmount: number;
  currency: string;
  status: 'draft' | 'reviewing' | 'approved' | 'paid' | 'failed';
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: 'admin' | 'operator' | 'support' | 'finance' | 'reviewer';
  action: string;
  targetType: string;
  targetId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason: string;
  requestId: string;
  createdAt: Date;
}
