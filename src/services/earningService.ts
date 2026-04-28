import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const PLATFORM_FEE_PERCENT = 0.10;

export async function createEarning(
  sellerId: string,
  data: {
    product_id: string;
    buyer_id: string;
    model: string;
    tokens_in: number;
    tokens_out: number;
    gross_amount: number;
  }
): Promise<void> {
  const platformFee = data.gross_amount * PLATFORM_FEE_PERCENT;
  const sellerEarnings = data.gross_amount * (1 - PLATFORM_FEE_PERCENT);

  const colRef = collection(db, 'sellers', sellerId, 'earnings');
  await addDoc(colRef, {
    seller_id: sellerId,
    product_id: data.product_id,
    buyer_id: data.buyer_id,
    model: data.model,
    tokens_in: data.tokens_in,
    tokens_out: data.tokens_out,
    gross_amount: data.gross_amount,
    platform_fee: platformFee,
    seller_earnings: sellerEarnings,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function getSellerEarnings(sellerId: string) {
  const colRef = collection(db, 'sellers', sellerId, 'earnings');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
  }));
}

export async function settleEarnings(sellerId: string): Promise<void> {
  const colRef = collection(db, 'sellers', sellerId, 'earnings');
  const q = query(
    colRef,
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  
  const batch: Promise<void>[] = [];
  for (const d of snap.docs) {
    batch.push(updateDoc(d.ref, { status: 'available' }));
  }
  
  await Promise.all(batch);
}
