import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { db } from '../lib/firebase';

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key_suffix: string;
  key_hash: string;
  uid: string;
  is_active: boolean;
  last_used: Date | null;
  createdAt: Date;
}

const functions = getFunctions(app);

export async function createApiKey(uid: string, name: string): Promise<{ fullKey: string; record: ApiKey }> {
  const createPlatformApiKey = httpsCallable(functions, 'createPlatformApiKey');
  const result = await createPlatformApiKey({ name });
  const data = result.data as {
    fullKey: string;
    record: Omit<ApiKey, 'createdAt' | 'last_used'> & {
      createdAt: string;
      last_used?: string | null;
    };
  };

  return {
    fullKey: data.fullKey,
    record: {
      id: data.record.id,
      name: data.record.name,
      key_prefix: data.record.key_prefix,
      key_suffix: data.record.key_suffix,
      key_hash: data.record.key_hash,
      uid,
      is_active: data.record.is_active,
      last_used: data.record.last_used ? new Date(data.record.last_used) : null,
      createdAt: new Date(data.record.createdAt),
    },
  };
}

export async function listApiKeys(uid: string): Promise<ApiKey[]> {
  const colRef = collection(db, 'users', uid, 'api_keys');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((entry) => {
    const data = entry.data();
    const storedPrefix = String(data.key_prefix || 'sk-bloomx-live-...');
    const keyPrefix = storedPrefix.startsWith('sk-') ? storedPrefix : 'sk-bloomx-legacy...';
    return {
      id: entry.id,
      name: String(data.name || data.label || 'Production key'),
      key_prefix: keyPrefix,
      key_suffix: String(data.key_suffix || ''),
      key_hash: String(data.key_hash || ''),
      uid: String(data.uid || uid),
      is_active: data.is_active !== false,
      last_used: data.last_used?.toDate?.() ?? null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function updateApiKeyName(_uid: string, keyId: string, name: string): Promise<void> {
  const updatePlatformApiKeyName = httpsCallable(functions, 'updatePlatformApiKeyName');
  await updatePlatformApiKeyName({
    keyId,
    name: name.trim() || 'Production key',
  });
}

export async function toggleApiKey(_uid: string, keyId: string, isActive: boolean): Promise<void> {
  const setPlatformApiKeyStatus = httpsCallable(functions, 'setPlatformApiKeyStatus');
  await setPlatformApiKeyStatus({
    keyId,
    isActive,
  });
}

export async function deleteApiKey(_uid: string, keyId: string): Promise<void> {
  const deletePlatformApiKey = httpsCallable(functions, 'deletePlatformApiKey');
  await deletePlatformApiKey({ keyId });
}
