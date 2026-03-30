import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ApiKey {
    id: string;
    key_prefix: string;
    key_hash: string;
    uid: string;
    is_active: boolean;
    last_used: Date | null;
    createdAt: Date;
}

// ─── Generate a random API key ─────────────────────────────────
function generateKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'bx_live_';
    for (let i = 0; i < 40; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Simple client-side hash (in production, use Web Crypto API)
async function hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// ─── Create ─────────────────────────────────────────────────────
export async function createApiKey(uid: string): Promise<{ fullKey: string; record: ApiKey }> {
    const fullKey = generateKey();
    const keyHash = await hashKey(fullKey);
    const prefix = fullKey.slice(0, 16) + '...';

    const colRef = collection(db, 'users', uid, 'api_keys');
    const docRef = await addDoc(colRef, {
        key_prefix: prefix,
        key_hash: keyHash,
        uid,
        is_active: true,
        last_used: null,
        createdAt: serverTimestamp(),
    });

    return {
        fullKey,
        record: {
            id: docRef.id,
            key_prefix: prefix,
            key_hash: keyHash,
            uid,
            is_active: true,
            last_used: null,
            createdAt: new Date(),
        },
    };
}

// ─── List ───────────────────────────────────────────────────────
export async function listApiKeys(uid: string): Promise<ApiKey[]> {
    const colRef = collection(db, 'users', uid, 'api_keys');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            key_prefix: data.key_prefix,
            key_hash: data.key_hash,
            uid: data.uid,
            is_active: data.is_active,
            last_used: data.last_used?.toDate?.() ?? null,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
    });
}

// ─── Toggle active/inactive ─────────────────────────────────────
export async function toggleApiKey(uid: string, keyId: string, isActive: boolean): Promise<void> {
    const ref = doc(db, 'users', uid, 'api_keys', keyId);
    await updateDoc(ref, { is_active: isActive });
}

// ─── Delete ─────────────────────────────────────────────────────
export async function deleteApiKey(uid: string, keyId: string): Promise<void> {
    const ref = doc(db, 'users', uid, 'api_keys', keyId);
    await deleteDoc(ref);
}
