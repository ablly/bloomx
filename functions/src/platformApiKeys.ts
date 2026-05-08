import * as admin from 'firebase-admin';
import {createHash, randomBytes} from 'crypto';
import * as functions from 'firebase-functions';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();
const PLATFORM_API_KEY_PREFIX = 'sk-bloomx-live-';

export type PlatformApiKeyRecord = {
  id: string;
  uid: string;
  name: string;
  key_prefix: string;
  key_suffix: string;
  key_hash: string;
  is_active: boolean;
  last_used: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
};

type ApiKeyMutationPayload = {
  keyId?: string;
  name?: string;
  isActive?: boolean;
};

function requireUid(context: functions.https.CallableContext): string {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Please sign in before managing API keys');
  }
  return uid;
}

function assertKeyName(value: unknown): string {
  const normalized = String(value || '').trim() || 'Production key';
  if (normalized.length > 80) {
    throw new functions.https.HttpsError('invalid-argument', 'API key name is too long');
  }
  return normalized;
}

function assertKeyId(value: unknown): string {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.includes('/') || normalized.length > 160) {
    throw new functions.https.HttpsError('invalid-argument', 'keyId is invalid');
  }
  return normalized;
}

export function hashPlatformApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function subscriptionSafeDocumentId(uid: string, keyId: string): string {
  return `${uid}_${keyId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function generatePlatformApiKey(): string {
  return `${PLATFORM_API_KEY_PREFIX}${randomBytes(27).toString('base64url')}`;
}

function maskPlatformApiKey(key: string) {
  return {
    key_prefix: `${key.slice(0, 18)}...`,
    key_suffix: key.slice(-6),
  };
}

export async function findPlatformApiKeyRecord(fullKey: string) {
  const keyHash = hashPlatformApiKey(fullKey);
  const querySnap = await firestore
    .collectionGroup('api_keys')
    .where('key_hash', '==', keyHash)
    .where('is_active', '==', true)
    .limit(1)
    .get();

  if (querySnap.empty) {
    return null;
  }

  const keyDoc = querySnap.docs[0];
  const uid = keyDoc.ref.parent.parent?.id;
  if (!uid) {
    return null;
  }

  return {
    uid,
    keyId: keyDoc.id,
    ref: keyDoc.ref,
    data: keyDoc.data() as PlatformApiKeyRecord,
  };
}

export const createPlatformApiKey = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: ApiKeyMutationPayload, context) => {
    const uid = requireUid(context);
    const name = assertKeyName(data.name);
    const fullKey = generatePlatformApiKey();
    const keyHash = hashPlatformApiKey(fullKey);
    const masked = maskPlatformApiKey(fullKey);
    const keyRef = firestore.collection('users').doc(uid).collection('api_keys').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    await keyRef.set({
      id: keyRef.id,
      uid,
      name,
      key_prefix: masked.key_prefix,
      key_suffix: masked.key_suffix,
      key_hash: keyHash,
      is_active: true,
      last_used: null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      fullKey,
      record: {
        id: keyRef.id,
        uid,
        name,
        key_prefix: masked.key_prefix,
        key_suffix: masked.key_suffix,
        key_hash: keyHash,
        is_active: true,
        last_used: null,
        createdAt: new Date().toISOString(),
      },
    };
  });

export const updatePlatformApiKeyName = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: ApiKeyMutationPayload, context) => {
    const uid = requireUid(context);
    const keyId = assertKeyId(data.keyId);
    const name = assertKeyName(data.name);

    await firestore.collection('users').doc(uid).collection('api_keys').doc(keyId).set({
      name,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    return {success: true};
  });

export const setPlatformApiKeyStatus = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: ApiKeyMutationPayload, context) => {
    const uid = requireUid(context);
    const keyId = assertKeyId(data.keyId);
    const isActive = Boolean(data.isActive);

    await firestore.collection('users').doc(uid).collection('api_keys').doc(keyId).set({
      is_active: isActive,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    return {success: true};
  });

export const deletePlatformApiKey = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: ApiKeyMutationPayload, context) => {
    const uid = requireUid(context);
    const keyId = assertKeyId(data.keyId);

    await firestore.collection('users').doc(uid).collection('api_keys').doc(keyId).delete();
    return {success: true};
  });
