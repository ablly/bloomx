import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Purchase } from '../types/marketplace';

export async function createPurchase(
  uid: string,
  data: {
    product_id: string;
    seller_id: string;
    product_name: string;
    product_url: string;
  }
): Promise<Purchase> {
  const colRef = collection(db, 'users', uid, 'purchases');
  const docRef = await addDoc(colRef, {
    uid,
    product_id: data.product_id,
    seller_id: data.seller_id,
    product_name: data.product_name,
    product_url: data.product_url,
    status: 'active',
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });

  return {
    id: docRef.id,
    uid,
    product_id: data.product_id,
    seller_id: data.seller_id,
    product_name: data.product_name,
    product_url: data.product_url,
    status: 'active',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };
}

export async function getUserPurchases(uid: string): Promise<Purchase[]> {
  const colRef = collection(db, 'users', uid, 'purchases');
  const q = query(colRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      uid: data.uid,
      product_id: data.product_id,
      seller_id: data.seller_id,
      product_name: data.product_name,
      product_url: data.product_url,
      status: data.status,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      expiresAt: data.expiresAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function hasProductAccess(uid: string, productId: string): Promise<boolean> {
  const colRef = collection(db, 'users', uid, 'purchases');
  const q = query(
    colRef,
    where('product_id', '==', productId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  return !snap.empty;
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
