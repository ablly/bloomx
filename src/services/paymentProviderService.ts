import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentDomainEvent,
  PaymentProvider,
  PaymentProviderCapability,
  PaymentProviderConfig,
  VerifiedWebhookEvent,
} from '../types/payment';

export interface PaymentProviderAdapter {
  provider: PaymentProvider;
  capabilities: PaymentProviderCapability;
  assertConfigured(): void;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyWebhook(rawBody: string, signature: string): Promise<VerifiedWebhookEvent>;
  mapWebhookEvent(event: VerifiedWebhookEvent): Promise<PaymentDomainEvent>;
}

class PaymentProviderConfigurationError extends Error {
  constructor(provider: PaymentProvider, missing: string[]) {
    super(`${provider} payment provider is not configured. Missing: ${missing.join(', ')}`);
    this.name = 'PaymentProviderConfigurationError';
  }
}

const providerConfigs: Record<PaymentProvider, PaymentProviderConfig> = {
  stripe: {
    provider: 'stripe',
    environment: import.meta.env.MODE === 'production' ? 'production' : 'test',
    enabled: import.meta.env.VITE_ENABLE_STRIPE_PAYMENTS === 'true',
    displayName: 'Stripe',
    publicKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    secretRef: 'STRIPE_SECRET_KEY',
    webhookSecretRef: 'STRIPE_WEBHOOK_SECRET',
    capabilities: {
      cards: true,
      alipay: true,
      wechatPay: true,
      subscriptions: true,
    },
  },
};

function missingConfig(config: PaymentProviderConfig): string[] {
  const missing: string[] = [];

  if (!config.enabled) {
    missing.push(`VITE_ENABLE_${config.provider.toUpperCase()}_PAYMENTS`);
  }

  if (config.provider === 'stripe' && !config.publicKey) {
    missing.push('VITE_STRIPE_PUBLISHABLE_KEY');
  }

  return missing;
}

function createNotImplementedAdapter(provider: PaymentProvider): PaymentProviderAdapter {
  const config = providerConfigs[provider];

  return {
    provider,
    capabilities: config.capabilities,
    assertConfigured() {
      const missing = missingConfig(config);
      if (missing.length > 0) {
        throw new PaymentProviderConfigurationError(provider, missing);
      }
    },
    async createCheckout(input) {
      this.assertConfigured();
      throw new Error(
        `${input.provider} checkout must be created by a server endpoint. Frontend code must never hold payment secrets.`,
      );
    },
    async verifyWebhook() {
      throw new Error(`${provider} webhook verification must run on the server with ${config.webhookSecretRef}.`);
    },
    async mapWebhookEvent(event) {
      return {
        provider,
        eventId: event.eventId,
        eventType: 'unknown',
        rawType: event.eventType,
      };
    },
  };
}

const adapters: Record<PaymentProvider, PaymentProviderAdapter> = {
  stripe: createNotImplementedAdapter('stripe'),
};

export function getPaymentProviderConfig(provider: PaymentProvider): PaymentProviderConfig {
  return providerConfigs[provider];
}

export function listPaymentProviderConfigs(): PaymentProviderConfig[] {
  return Object.values(providerConfigs);
}

export function getPaymentProviderAdapter(provider: PaymentProvider): PaymentProviderAdapter {
  return adapters[provider];
}

export function chooseDefaultPaymentProvider(required: Partial<PaymentProviderCapability> = {}): PaymentProvider {
  const candidates: PaymentProvider[] = ['stripe'];
  const matchesRequiredCapabilities = (provider: PaymentProvider) => {
    const capabilities = providerConfigs[provider].capabilities;
    return Object.entries(required).every(([key, value]) => capabilities[key as keyof PaymentProviderCapability] === value);
  };
  const enabledMatch = candidates.find((provider) => providerConfigs[provider].enabled && matchesRequiredCapabilities(provider));
  const configuredMatch = candidates.find(matchesRequiredCapabilities);

  return enabledMatch ?? configuredMatch ?? 'stripe';
}
