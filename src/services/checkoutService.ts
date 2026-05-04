import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';

export type CreditPlanId = 'starter' | 'creator' | 'pro';

export interface CreateCheckoutResponse {
  checkoutUrl: string;
  transactionId: string;
  providerSessionId: string;
}

export interface CreatePortalResponse {
  portalUrl: string;
}

const functions = getFunctions(app);

function newIdempotencyKey(planId: CreditPlanId): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${planId}:${crypto.randomUUID()}`;
  }
  return `${planId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export async function createStripeCheckout(planId: CreditPlanId): Promise<CreateCheckoutResponse> {
  const createPaymentCheckout = httpsCallable(functions, 'createPaymentCheckout');
  const origin = window.location.origin;
  const result = await createPaymentCheckout({
    planId,
    successUrl: `${origin}/dashboard?checkout=success`,
    cancelUrl: `${origin}/#pricing`,
    idempotencyKey: newIdempotencyKey(planId),
  });

  const data = result.data as Partial<CreateCheckoutResponse>;
  if (!data.checkoutUrl || !data.transactionId || !data.providerSessionId) {
    throw new Error('服务端没有返回可用的 Stripe Checkout 地址');
  }

  return {
    checkoutUrl: data.checkoutUrl,
    transactionId: data.transactionId,
    providerSessionId: data.providerSessionId,
  };
}

export async function createStripePortalSession(): Promise<CreatePortalResponse> {
  const createPortalSession = httpsCallable(functions, 'createStripePortalSession');
  const result = await createPortalSession({
    returnUrl: `${window.location.origin}/dashboard`,
  });

  const data = result.data as Partial<CreatePortalResponse>;
  if (!data.portalUrl) {
    throw new Error('服务端没有返回可用的 Stripe 账单管理地址');
  }

  return { portalUrl: data.portalUrl };
}
