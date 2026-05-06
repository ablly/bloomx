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
const CHECKOUT_TIMEOUT_MS = 18000;

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error('Stripe 支付后端响应超时，请确认 Cloud Functions 已部署并可访问。')), ms);
  });
}

export function normalizeCheckoutError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error || '');
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  const combined = `${code} ${rawMessage}`.toLowerCase();

  if (combined.includes('not-found') || combined.includes('404')) {
    return '支付后端 createPaymentCheckout 还没有部署到 Firebase Functions。请先重新登录 Firebase 并部署支付函数。';
  }

  if (combined.includes('unauthenticated')) {
    return '请先登录后再购买积分套餐。';
  }

  if (combined.includes('stripe secret') || combined.includes('stripe_secret_key')) {
    return 'Stripe 收款密钥没有配置。请在 Firebase Secret Manager 配置 STRIPE_SECRET_KEY。';
  }

  if (combined.includes('stripe_price')) {
    return 'Stripe Price ID 没有配置。请配置 STRIPE_PRICE_STARTER、STRIPE_PRICE_CREATOR、STRIPE_PRICE_PRO。';
  }

  if (combined.includes('timeout') || combined.includes('超时')) {
    return 'Stripe 支付后端响应超时，请确认 Cloud Functions 已部署、Firebase 登录有效、网络可访问。';
  }

  return rawMessage || 'Stripe 支付入口打开失败，请稍后重试。';
}

function newIdempotencyKey(planId: CreditPlanId): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${planId}:${crypto.randomUUID()}`;
  }
  return `${planId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export async function createStripeCheckout(planId: CreditPlanId): Promise<CreateCheckoutResponse> {
  const createPaymentCheckout = httpsCallable(functions, 'createPaymentCheckout');
  const origin = window.location.origin;
  const result = await Promise.race([
    createPaymentCheckout({
      planId,
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/#pricing`,
      idempotencyKey: newIdempotencyKey(planId),
    }),
    timeoutPromise(CHECKOUT_TIMEOUT_MS),
  ]);

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

export function showStripeCheckoutWindowError(checkoutWindow: CheckoutWindow, error: unknown): void {
  if (!checkoutWindow || checkoutWindow.closed) return;
  const message = normalizeCheckoutError(error)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  checkoutWindow.document.open();
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
          main { max-width: 420px; padding: 34px; }
          h1 { margin: 0 0 12px; font-size: 28px; line-height: 1.08; }
          p { margin: 0; color: rgba(41,48,39,.72); line-height: 1.65; }
          button { margin-top: 24px; min-height: 42px; border: 0; border-radius: 14px; background: #111610; color: #f6f2ea; padding: 0 18px; font-weight: 700; cursor: pointer; }
          .line { width: 46px; height: 2px; background: #637151; margin-bottom: 18px; }
        </style>
      </head>
      <body>
        <main>
          <div class="line"></div>
          <h1>Stripe Checkout 未打开</h1>
          <p>${message}</p>
          <button onclick="window.close()">关闭</button>
        </main>
      </body>
    </html>
  `);
  checkoutWindow.document.close();
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
