import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

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

const normalizeChatEndpoint = (endpoint: string) => {
  const trimmed = endpoint.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
  if (/\/v1$/i.test(trimmed)) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
};

const merchantHeaders = (authHeader: string, apiKey: string) => ({
  'Content-Type': 'application/json',
  [authHeader]: authHeader.toLowerCase() === 'authorization' && !/^Bearer\s+/i.test(apiKey)
    ? `Bearer ${apiKey}`
    : apiKey,
});

export type MerchantApiTestPayload = {
  endpoint?: string;
  authHeader?: string;
  apiKey?: string;
  modelName?: string;
  prompt?: string;
};

export const callMerchantChat = async (payload: MerchantApiTestPayload) => {
  const endpoint = normalizeChatEndpoint(String(payload.endpoint || ''));
  const authHeader = String(payload.authHeader || 'Authorization').trim() || 'Authorization';
  const apiKey = String(payload.apiKey || '').trim();
  const modelName = String(payload.modelName || '').trim();
  const prompt = String(payload.prompt || 'Reply with exactly: BloomX API test passed.').trim();

  if (!endpoint || !apiKey || !modelName) {
    throw new Error('missing_merchant_api_config');
  }

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: merchantHeaders(authHeader, apiKey),
    body: JSON.stringify({
      model: modelName,
      messages: [{role: 'user', content: prompt}],
      max_tokens: 64,
      temperature: 0,
    }),
  });
  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    latencyMs: Date.now() - startedAt,
    text,
    endpoint,
  };
};

const sendJson = (response: any, status: number, body: unknown) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.status(status).json(body);
};

export const invokeMerchantModel = functions.https.onRequest(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'method_not_allowed' });
    return;
  }

  const bearerToken = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const { modelName, prompt, input } = request.body || {};

  if (!bearerToken || !modelName || (!prompt && !input)) {
    sendJson(response, 400, { error: 'missing_api_key_or_payload' });
    return;
  }

  const userQuery = await firestore.collection('users').where('platformApiKey', '==', bearerToken).limit(1).get();
  if (userQuery.empty) {
    sendJson(response, 401, { error: 'invalid_platform_api_key' });
    return;
  }

  const userRef = userQuery.docs[0].ref;
  const userId = userQuery.docs[0].id;
  const offerQuery = await firestore.collection('apiOffers').where('modelName', '==', modelName).limit(5).get();

  if (offerQuery.empty) {
    sendJson(response, 404, { error: 'model_not_found' });
    return;
  }

  const offerDoc = offerQuery.docs.find((item) => item.data().status === 'listed');

  if (!offerDoc) {
    sendJson(response, 404, { error: 'model_not_listed' });
    return;
  }

  const offer = offerDoc.data();
  const pricePerCall = Number(offer.pricePerCall || 1);
  const subscriptionQuery = await firestore
    .collection('subscriptions')
    .where('userId', '==', userId)
    .limit(50)
    .get();

  const activeSubscription = subscriptionQuery.docs.find(
    (item) => item.data().offerId === offerDoc.id && item.data().status === 'active'
  );

  if (!activeSubscription) {
    sendJson(response, 403, { error: 'subscription_required' });
    return;
  }

  const secretDoc = await firestore.collection('merchantApiSecrets').doc(offerDoc.id).get();

  if (!secretDoc.exists) {
    sendJson(response, 409, { error: 'merchant_secret_missing' });
    return;
  }

  const secret = secretDoc.data() || {};
  const callRef = firestore.collection('apiCallRecords').doc();

  try {
    await firestore.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const userData = userSnap.data() || {};
      const credits = Number(userData.credits_balance ?? userData.credits ?? 0);

      if (credits < pricePerCall) {
        throw new Error('insufficient_credits');
      }

      transaction.update(userRef, {
        credits_balance: admin.firestore.FieldValue.increment(-pricePerCall),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(callRef, {
        userId,
        offerId: offerDoc.id,
        modelName,
        sellerName: offer.sellerName || '',
        prompt: prompt || input,
        status: 'queued',
        cost: pricePerCall,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transaction_failed';
    sendJson(response, message === 'insufficient_credits' ? 402 : 500, { error: message });
    return;
  }

  try {
    const authHeader = String(secret.authHeader || 'Authorization');
    const merchantResponse = await callMerchantChat({
      endpoint: String(secret.endpoint),
      authHeader,
      apiKey: String(secret.apiKey),
      modelName,
      prompt: String(prompt || input),
    });
    const text = merchantResponse.text;

    const updates: Promise<unknown>[] = [
      callRef.update({
        status: merchantResponse.ok ? 'completed' : 'failed',
        responsePreview: text.slice(0, 1200),
        merchantStatus: merchantResponse.status,
        latencyMs: merchantResponse.latencyMs,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ];

    if (!merchantResponse.ok) {
      updates.push(
        userRef.update({
          credits_balance: admin.firestore.FieldValue.increment(pricePerCall),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
    } else {
      updates.push(
        firestore
          .collection('apiOfferStats')
          .doc(offerDoc.id)
          .set(
            {
              offerId: offerDoc.id,
              ownerId: offer.ownerId || '',
              modelName,
              sellerName: offer.sellerName || '',
              successfulCalls: admin.firestore.FieldValue.increment(1),
              earnedCredits: admin.firestore.FieldValue.increment(pricePerCall),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          )
      );
    }

    await Promise.all(updates);

    sendJson(response, merchantResponse.ok ? 200 : 502, {
      id: callRef.id,
      modelName,
      cost: pricePerCall,
      output: text,
    });
  } catch (error) {
    await Promise.all([
      userRef.update({
        credits_balance: admin.firestore.FieldValue.increment(pricePerCall),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      callRef.update({
        status: 'failed',
        responsePreview: error instanceof Error ? error.message : 'merchant_call_failed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ]);
    sendJson(response, 502, { error: 'merchant_call_failed' });
  }
});
