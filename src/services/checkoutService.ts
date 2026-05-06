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

export type CheckoutWindow = Window | null;

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

export function openStripeCheckoutWindow(planId: CreditPlanId): CheckoutWindow {
  const checkoutWindow = window.open(
    '',
    `bloomx-stripe-${planId}`,
    'popup=yes,width=520,height=760,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes',
  );

  if (checkoutWindow) {
    checkoutWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>BloomX Stripe Checkout</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              background: #f6f2ea;
              color: #171c16;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            main { text-align: center; padding: 32px; }
            .mark { width: 38px; height: 38px; margin: 0 auto 18px; border-radius: 999px; border: 1px solid rgba(41,48,39,.18); display: grid; place-items: center; }
            .dot { width: 10px; height: 10px; border-radius: 999px; background: #637151; animation: pulse 1.2s ease-in-out infinite; }
            p { margin: 0; color: rgba(41,48,39,.66); line-height: 1.6; }
            @keyframes pulse { 0%, 100% { transform: scale(.72); opacity: .48; } 50% { transform: scale(1); opacity: 1; } }
          </style>
        </head>
        <body>
          <main>
            <div class="mark"><div class="dot"></div></div>
            <h1>Opening Stripe Checkout</h1>
            <p>Please keep this window open.</p>
          </main>
        </body>
      </html>
    `);
    checkoutWindow.document.close();
  }

  return checkoutWindow;
}

export function navigateStripeCheckoutWindow(checkoutWindow: CheckoutWindow, checkoutUrl: string): void {
  if (checkoutWindow && !checkoutWindow.closed) {
    checkoutWindow.location.href = checkoutUrl;
    return;
  }

  window.location.assign(checkoutUrl);
}

export function closeStripeCheckoutWindow(checkoutWindow: CheckoutWindow): void {
  if (checkoutWindow && !checkoutWindow.closed) {
    checkoutWindow.close();
  }
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
