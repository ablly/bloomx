import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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

function randomSecret(byteLength: number): string {
  const values = new Uint8Array(byteLength);
  crypto.getRandomValues(values);
  const binary = Array.from(values, (value) => String.fromCharCode(value)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function generateKey(): string {
  return `sk-bloomx-live-${randomSecret(36)}`;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function maskKey(key: string) {
  return {
    key_prefix: `${key.slice(0, 18)}...`,
    key_suffix: key.slice(-6),
  };
}

export async function createApiKey(uid: string, name: string): Promise<{ fullKey: string; record: ApiKey }> {
  const normalizedName = name.trim() || 'Production key';
  const fullKey = generateKey();
  const keyHash = await hashKey(fullKey);
  const { key_prefix, key_suffix } = maskKey(fullKey);

  const colRef = collection(db, 'users', uid, 'api_keys');
  const docRef = await addDoc(colRef, {
    name: normalizedName,
    key_prefix,
    key_suffix,
    key_hash: keyHash,
    uid,
    is_active: true,
    last_used: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    fullKey,
    record: {
      id: docRef.id,
      name: normalizedName,
      key_prefix,
      key_suffix,
      key_hash: keyHash,
      uid,
      is_active: true,
      last_used: null,
      createdAt: new Date(),
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

export async function updateApiKeyName(uid: string, keyId: string, name: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'api_keys', keyId);
  await updateDoc(ref, {
    name: name.trim() || 'Production key',
    updatedAt: serverTimestamp(),
  });
}

export async function toggleApiKey(uid: string, keyId: string, isActive: boolean): Promise<void> {
  const ref = doc(db, 'users', uid, 'api_keys', keyId);
  await updateDoc(ref, {
    is_active: isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApiKey(uid: string, keyId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'api_keys', keyId);
  await deleteDoc(ref);
}
