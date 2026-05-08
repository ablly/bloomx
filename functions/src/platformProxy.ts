import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {findPlatformApiKeyRecord} from './platformApiKeys';
import {sellerEarningBreakdown} from './subscriptions';

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

  const keyRecord = await findPlatformApiKeyRecord(bearerToken);
  if (!keyRecord) {
    sendJson(response, 401, { error: 'invalid_platform_api_key' });
    return;
  }

  const userRef = firestore.collection('users').doc(keyRecord.uid);
  const userId = keyRecord.uid;
  const offerQuery = await firestore.collection('apiOffers').where('modelName', '==', modelName).limit(5).get();
  const modelNamesOfferQuery = offerQuery.empty
    ? await firestore.collection('apiOffers').where('modelNames', 'array-contains', modelName).limit(5).get()
    : null;
  const offerDocs = offerQuery.empty ? modelNamesOfferQuery?.docs ?? [] : offerQuery.docs;

  if (offerDocs.length === 0) {
    sendJson(response, 404, { error: 'model_not_found' });
    return;
  }

  const offerDoc = offerDocs.find((item) => item.data().status === 'listed');

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
  const usageLedgerRef = firestore.collection('credit_ledger').doc(`usage_${callRef.id}`);
  const refundLedgerRef = firestore.collection('credit_ledger').doc(`refund_${callRef.id}`);

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
        credits: Number((credits - pricePerCall).toFixed(6)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(usageLedgerRef, {
        id: usageLedgerRef.id,
        userId,
        transactionId: callRef.id,
        delta: -pricePerCall,
        balanceAfter: Number((credits - pricePerCall).toFixed(6)),
        reason: `API usage: ${modelName}`,
        source: 'usage',
        requestId: callRef.id,
        offerId: offerDoc.id,
        sellerId: String(offer.ownerId || offer.sellerId || ''),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(callRef, {
        userId,
        offerId: offerDoc.id,
        modelName,
        sellerName: offer.sellerName || '',
        prompt: prompt || input,
        status: 'queued',
        cost: pricePerCall,
        apiKeyId: keyRecord.keyId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transaction_failed';
    sendJson(response, message === 'insufficient_credits' ? 402 : 500, { error: message });
    return;
  }

  try {
    await keyRecord.ref.set({
      last_used: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

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
          credits: admin.firestore.FieldValue.increment(pricePerCall),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
      updates.push(
        refundLedgerRef.set({
          id: refundLedgerRef.id,
          userId,
          transactionId: callRef.id,
          delta: pricePerCall,
          reason: `API refund: ${modelName}`,
          source: 'refund',
          requestId: callRef.id,
          offerId: offerDoc.id,
          sellerId: String(offer.ownerId || offer.sellerId || ''),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
    } else {
      const earnings = sellerEarningBreakdown(pricePerCall);
      const sellerEarningRef = firestore.collection('seller_earnings').doc(callRef.id);
      const sellerScopedEarningRef = firestore
        .collection('sellers')
        .doc(String(offer.ownerId || offer.sellerId || 'unknown-seller'))
        .collection('earnings')
        .doc(callRef.id);
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
      updates.push(
        sellerEarningRef.set({
          id: callRef.id,
          seller_id: String(offer.ownerId || offer.sellerId || ''),
          product_id: offerDoc.id,
          buyer_id: userId,
          model: modelName,
          tokens_in: 0,
          tokens_out: 0,
          ...earnings,
          status: 'pending',
          source: 'usage',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );
      updates.push(
        sellerScopedEarningRef.set({
          id: callRef.id,
          seller_id: String(offer.ownerId || offer.sellerId || ''),
          product_id: offerDoc.id,
          buyer_id: userId,
          model: modelName,
          tokens_in: 0,
          tokens_out: 0,
          ...earnings,
          status: 'pending',
          source: 'usage',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
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
        credits: admin.firestore.FieldValue.increment(pricePerCall),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      refundLedgerRef.set({
        id: refundLedgerRef.id,
        userId,
        transactionId: callRef.id,
        delta: pricePerCall,
        reason: `API refund: ${modelName}`,
        source: 'refund',
        requestId: callRef.id,
        offerId: offerDoc.id,
        sellerId: String(offer.ownerId || offer.sellerId || ''),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
