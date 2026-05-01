import * as admin from 'firebase-admin';
import {createCipheriv, createHash, randomBytes} from 'crypto';
import * as functions from 'firebase-functions';
import {defineSecret} from 'firebase-functions/params';
import {
  fetchProviderModels,
  smokeTestProviderModel,
  supportedProviderTypes,
  type AuthType,
  type NormalizedModel,
  type ProviderAuth,
  type ProviderType,
  type SmokeTestResult,
} from './providerAdapters';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();
const API_SECRET_ENCRYPTION_KEY = defineSecret('API_SECRET_ENCRYPTION_KEY');
const DEFAULT_ADMIN_EMAIL = 'zqhablly@gmail.com';

type ProviderApiPayload = {
  providerType?: ProviderType;
  baseUrl?: string;
  authType?: AuthType;
  authValue?: string;
  authHeaderName?: string;
  modelIds?: string[];
};

type SubmitSellerApiPayload = ProviderApiPayload & {
  name?: string;
  description?: string;
  pricing?: {
    input_per_1k?: number;
    output_per_1k?: number;
  };
};

function assertString(value: unknown, field: string, maxLength = 500): string {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new functions.https.HttpsError('invalid-argument', `${field} is required`);
  }
  if (normalized.length > maxLength) {
    throw new functions.https.HttpsError('invalid-argument', `${field} is too long`);
  }
  return normalized;
}

function assertProviderType(value: unknown): ProviderType {
  const providerType = String(value || '').trim() as ProviderType;
  if (!supportedProviderTypes.includes(providerType)) {
    throw new functions.https.HttpsError('invalid-argument', 'Unsupported provider type');
  }
  return providerType;
}

function assertAuthType(value: unknown): AuthType {
  const authType = String(value || 'bearer').trim() as AuthType;
  if (!['bearer', 'api_key', 'basic'].includes(authType)) {
    throw new functions.https.HttpsError('invalid-argument', 'Unsupported auth type');
  }
  return authType;
}

function assertPricing(value: SubmitSellerApiPayload['pricing']) {
  const input = Number(value?.input_per_1k);
  const output = Number(value?.output_per_1k);
  if (!Number.isFinite(input) || input < 0 || input > 1000) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input price');
  }
  if (!Number.isFinite(output) || output < 0 || output > 1000) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid output price');
  }
  return {
    input_per_1k: input,
    output_per_1k: output,
  };
}

function assertModelIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new functions.https.HttpsError('invalid-argument', 'modelIds must be an array');
  }
  const ids = value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 100);

  if (ids.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Select at least one model');
  }

  if (ids.some((id) => id.length > 160 || /[\r\n]/.test(id))) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid model id');
  }

  return Array.from(new Set(ids));
}

function payloadToProviderRequest(data: ProviderApiPayload) {
  const providerType = assertProviderType(data.providerType);
  const auth: ProviderAuth = {
    type: assertAuthType(data.authType),
    value: String(data.authValue || '').trim(),
    headerName: data.authHeaderName ? String(data.authHeaderName).trim().slice(0, 80) : undefined,
  };

  return {
    providerType,
    baseUrl: assertString(data.baseUrl, 'baseUrl', 500),
    auth,
  };
}

async function getApprovedSeller(uid: string) {
  const snap = await firestore.collection('sellers')
    .where('uid', '==', uid)
    .where('status', '==', 'approved')
    .limit(1)
    .get();

  if (snap.empty) {
    throw new functions.https.HttpsError('permission-denied', 'Approved seller profile is required');
  }

  return {
    id: snap.docs[0].id,
    data: snap.docs[0].data(),
  };
}

function requireAuth(context: functions.https.CallableContext) {
  const uid = context.auth?.uid;
  const email = String(context.auth?.token.email || '').trim().toLowerCase();
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in is required');
  }
  return {uid, email};
}

function keyMaterial(): Buffer {
  const configured = API_SECRET_ENCRYPTION_KEY.value() || process.env.API_SECRET_ENCRYPTION_KEY;
  if (!configured || configured.length < 32) {
    throw new functions.https.HttpsError('failed-precondition', 'API secret encryption key is not configured');
  }
  return createHash('sha256').update(configured).digest();
}

function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function summarizeModels(models: NormalizedModel[]) {
  return models.slice(0, 200).map((model) => ({
    id: model.id,
    name: model.name,
    owner: model.owner || null,
    source: model.source,
  }));
}

async function writeTestLog(input: {
  uid: string;
  sellerId: string;
  productId?: string;
  providerType: ProviderType;
  baseUrl: string;
  type: 'model_fetch' | 'smoke_test' | 'submit_product';
  status: 'passed' | 'failed';
  models?: NormalizedModel[];
  selectedModels?: string[];
  smokeResults?: SmokeTestResult[];
  error?: string;
}) {
  const ref = await firestore.collection('merchantApiTestLogs').add({
    uid: input.uid,
    sellerId: input.sellerId,
    productId: input.productId || null,
    providerType: input.providerType,
    baseUrl: input.baseUrl,
    type: input.type,
    status: input.status,
    modelCount: input.models?.length ?? null,
    models: input.models ? summarizeModels(input.models) : null,
    selectedModels: input.selectedModels || null,
    smokeResults: input.smokeResults || null,
    error: input.error || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function enqueueEmail(input: {
  template: string;
  recipient: string;
  locale?: 'zh-CN' | 'en-US';
  data: Record<string, unknown>;
  dedupeKey: string;
}) {
  await firestore.collection('email_outbox').doc(input.dedupeKey).set({
    template: input.template,
    recipient: input.recipient,
    locale: input.locale || 'zh-CN',
    data: input.data,
    status: 'queued',
    attempts: 0,
    dedupeKey: input.dedupeKey,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
}

async function runSmokeTests(request: ReturnType<typeof payloadToProviderRequest>, modelIds: string[]) {
  const results: SmokeTestResult[] = [];
  for (const modelId of modelIds) {
    results.push(await smokeTestProviderModel({
      ...request,
      modelId,
      timeoutMs: 30000,
    }));
  }
  return results;
}

export const fetchSellerApiModels = functions
  .runWith({secrets: [API_SECRET_ENCRYPTION_KEY], invoker: 'public'})
  .https.onCall(async (data: ProviderApiPayload, context) => {
    const actor = requireAuth(context);
    const seller = await getApprovedSeller(actor.uid);
    const request = payloadToProviderRequest(data);

    try {
      const models = await fetchProviderModels({...request, timeoutMs: 30000});
      const testLogId = await writeTestLog({
        uid: actor.uid,
        sellerId: seller.id,
        providerType: request.providerType,
        baseUrl: request.baseUrl,
        type: 'model_fetch',
        status: 'passed',
        models,
      });

      return {
        success: true,
        testLogId,
        models,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Model fetch failed';
      const testLogId = await writeTestLog({
        uid: actor.uid,
        sellerId: seller.id,
        providerType: request.providerType,
        baseUrl: request.baseUrl,
        type: 'model_fetch',
        status: 'failed',
        error: message,
      });
      throw new functions.https.HttpsError('failed-precondition', message, {testLogId});
    }
  });

export const testSellerApiModels = functions
  .runWith({secrets: [API_SECRET_ENCRYPTION_KEY], invoker: 'public'})
  .https.onCall(async (data: ProviderApiPayload, context) => {
    const actor = requireAuth(context);
    const seller = await getApprovedSeller(actor.uid);
    const request = payloadToProviderRequest(data);
    const modelIds = assertModelIds(data.modelIds);
    const results = await runSmokeTests(request, modelIds);
    const passed = results.every((result) => result.ok);
    const testLogId = await writeTestLog({
      uid: actor.uid,
      sellerId: seller.id,
      providerType: request.providerType,
      baseUrl: request.baseUrl,
      type: 'smoke_test',
      status: passed ? 'passed' : 'failed',
      selectedModels: modelIds,
      smokeResults: results,
      error: passed ? undefined : 'One or more selected models failed smoke test',
    });

    return {
      success: passed,
      testLogId,
      results,
    };
  });

export const submitSellerApiProduct = functions
  .runWith({secrets: [API_SECRET_ENCRYPTION_KEY], invoker: 'public'})
  .https.onCall(async (data: SubmitSellerApiPayload, context) => {
    const actor = requireAuth(context);
    const seller = await getApprovedSeller(actor.uid);
    const request = payloadToProviderRequest(data);
    const modelIds = assertModelIds(data.modelIds);
    const pricing = assertPricing(data.pricing);
    const name = assertString(data.name, 'name', 120);
    const description = assertString(data.description, 'description', 3000);

    const fetchedModels = await fetchProviderModels({...request, timeoutMs: 30000});
    const knownModelIds = new Set(fetchedModels.map((model) => model.id));
    const missingModels = modelIds.filter((modelId) => !knownModelIds.has(modelId));
    if (missingModels.length > 0) {
      throw new functions.https.HttpsError('failed-precondition', `Selected models are not returned by provider: ${missingModels.join(', ')}`);
    }

    const smokeResults = await runSmokeTests(request, modelIds);
    const passed = smokeResults.every((result) => result.ok);
    const globalProductRef = firestore.collection('products').doc();
    const productId = globalProductRef.id;
    const status = passed ? 'pending_review' : 'test_failed';
    const testLogId = await writeTestLog({
      uid: actor.uid,
      sellerId: seller.id,
      productId,
      providerType: request.providerType,
      baseUrl: request.baseUrl,
      type: 'submit_product',
      status: passed ? 'passed' : 'failed',
      models: fetchedModels,
      selectedModels: modelIds,
      smokeResults,
      error: passed ? undefined : 'One or more selected models failed smoke test',
    });

    const productData = {
      seller_id: seller.id,
      seller_uid: actor.uid,
      name,
      description,
      base_url: request.baseUrl,
      provider_type: request.providerType,
      auth_type: request.auth.type,
      models: modelIds,
      fetched_models_count: fetchedModels.length,
      pricing,
      status,
      rating: 0,
      total_sales: 0,
      review_count: 0,
      is_verified: false,
      last_test_log_id: testLogId,
      submitted_by: actor.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.runTransaction(async (transaction) => {
      const sellerProductRef = firestore.collection('sellers').doc(seller.id).collection('products').doc(productId);
      const secretRef = firestore.collection('merchantApiSecrets').doc(productId);
      transaction.set(globalProductRef, productData);
      transaction.set(sellerProductRef, productData);
      transaction.set(secretRef, {
        ownerId: actor.uid,
        sellerId: seller.id,
        productId,
        providerType: request.providerType,
        authType: request.auth.type,
        authHeaderName: request.auth.headerName || null,
        encryptedAuthValue: encryptSecret(request.auth.value),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    if (passed) {
      await enqueueEmail({
        template: 'admin.product.pending_review',
        recipient: process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL,
        dedupeKey: `admin-product-review-${productId}`,
        data: {
          productId,
          sellerId: seller.id,
          sellerName: seller.data.name || null,
          productName: name,
          providerType: request.providerType,
          testLogId,
        },
      });
    } else if (actor.email) {
      await enqueueEmail({
        template: 'seller.product.test_failed',
        recipient: actor.email,
        dedupeKey: `seller-product-test-failed-${productId}`,
        data: {
          productId,
          productName: name,
          providerType: request.providerType,
          testLogId,
          failedModels: smokeResults.filter((result) => !result.ok).map((result) => result.modelId),
        },
      });
    }

    return {
      success: passed,
      productId,
      status,
      testLogId,
      smokeResults,
    };
  });
