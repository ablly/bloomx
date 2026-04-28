import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Seller } from '../types/marketplace';

export async function createSellerProfile(
  uid: string,
  data: {
    name: string;
    description: string;
    logo_url?: string;
  }
): Promise<Seller> {
  const colRef = collection(db, 'sellers');
  const docRef = await addDoc(colRef, {
    uid,
    name: data.name,
    description: data.description,
    logo_url: data.logo_url || '',
    status: 'pending',
    kyc_status: 'none',
    asset_verified: false,
    total_products: 0,
    total_earnings: 0,
    available_balance: 0,
    pending_balance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    uid,
    name: data.name,
    description: data.description,
    logo_url: data.logo_url || '',
    status: 'pending',
    kyc_status: 'none',
    asset_verified: false,
    total_products: 0,
    total_earnings: 0,
    available_balance: 0,
    pending_balance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getSellerByUid(uid: string): Promise<Seller | null> {
  const colRef = collection(db, 'sellers');
  const q = query(colRef, where('uid', '==', uid));
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  
  const data = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    uid: data.uid,
    name: data.name,
    description: data.description,
    logo_url: data.logo_url,
    status: data.status,
    kyc_status: data.kyc_status,
    asset_verified: data.asset_verified,
    total_products: data.total_products,
    total_earnings: data.total_earnings,
    available_balance: data.available_balance,
    pending_balance: data.pending_balance,
    bank_account: data.bank_account,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function getSellerById(sellerId: string): Promise<Seller | null> {
  const docRef = doc(db, 'sellers', sellerId);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return null;
  
  const data = snap.data();
  return {
    id: snap.id,
    uid: data.uid,
    name: data.name,
    description: data.description,
    logo_url: data.logo_url,
    status: data.status,
    kyc_status: data.kyc_status,
    asset_verified: data.asset_verified,
    total_products: data.total_products,
    total_earnings: data.total_earnings,
    available_balance: data.available_balance,
    pending_balance: data.pending_balance,
    bank_account: data.bank_account,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function updateSellerStatus(
  sellerId: string,
  status: 'approved' | 'rejected' | 'suspended'
): Promise<void> {
  const docRef = doc(db, 'sellers', sellerId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function updateSellerKyc(
  sellerId: string,
  kycStatus: 'pending' | 'approved' | 'rejected'
): Promise<void> {
  const docRef = doc(db, 'sellers', sellerId);
  await updateDoc(docRef, {
    kyc_status: kycStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function updateSellerBalance(
  sellerId: string,
  availableBalance: number,
  pendingBalance: number
): Promise<void> {
  const docRef = doc(db, 'sellers', sellerId);
  await updateDoc(docRef, {
    available_balance: availableBalance,
    pending_balance: pendingBalance,
    updatedAt: serverTimestamp(),
  });
}
