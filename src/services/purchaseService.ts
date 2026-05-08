import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { db } from '../lib/firebase';
import type { Purchase } from '../types/marketplace';

const defaultSubscriptionPrice = 10;
const functions = getFunctions(app);

function normalizeDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date();
}

function mapPurchase(id: string, data: Record<string, unknown>): Purchase {
  return {
    id,
    uid: String(data.uid ?? data.buyer_id ?? ''),
    product_id: String(data.product_id ?? ''),
    seller_id: String(data.seller_id ?? ''),
    product_name: String(data.product_name ?? ''),
    product_url: String(data.product_url ?? ''),
    status: (data.status as Purchase['status']) || 'active',
    createdAt: normalizeDate(data.createdAt),
    expiresAt: normalizeDate(data.expiresAt),
  };
}

async function findExistingActivePurchase(uid: string, productId: string): Promise<Purchase | null> {
  const colRef = collection(db, 'users', uid, 'purchases');
  const q = query(colRef, where('product_id', '==', productId));
  const snap = await getDocs(q);
  const match = snap.docs.find((entry) => entry.data().status === 'active');
  return match ? mapPurchase(match.id, match.data()) : null;
}

export async function createPurchase(
  uid: string,
  data: {
    product_id: string;
    seller_id: string;
    product_name: string;
    product_url: string;
    priceCredits?: number;
  }
): Promise<Purchase> {
  const existing = await findExistingActivePurchase(uid, data.product_id);
  if (existing) return existing;

  const createMarketplaceSubscription = httpsCallable(functions, 'createMarketplaceSubscription');
  const result = await createMarketplaceSubscription({
    productId: data.product_id,
    priceCredits: data.priceCredits ?? defaultSubscriptionPrice,
  });
  const payload = result.data as {
    purchase: {
      id: string;
      uid: string;
      product_id: string;
      seller_id: string;
      product_name: string;
      product_url: string;
      status: Purchase['status'];
      createdAt: string;
      expiresAt: string;
    };
  };

  return {
    id: payload.purchase.id,
    uid: payload.purchase.uid,
    product_id: payload.purchase.product_id,
    seller_id: payload.purchase.seller_id,
    product_name: payload.purchase.product_name,
    product_url: payload.purchase.product_url,
    status: payload.purchase.status,
    createdAt: new Date(payload.purchase.createdAt),
    expiresAt: new Date(payload.purchase.expiresAt),
  };
}

export async function getUserPurchases(uid: string): Promise<Purchase[]> {
  const colRef = collection(db, 'users', uid, 'purchases');
  const snap = await getDocs(colRef);
  
  return snap.docs
    .map((entry) => mapPurchase(entry.id, entry.data()))
    .filter((purchase) => purchase.status === 'active')
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export async function hasProductAccess(uid: string, productId: string): Promise<boolean> {
  return Boolean(await findExistingActivePurchase(uid, productId));
}

export async function revokePurchase(
  uid: string,
  purchaseId: string
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'purchases', purchaseId);
  await updateDoc(docRef, {
    status: 'revoked',
  });
}
