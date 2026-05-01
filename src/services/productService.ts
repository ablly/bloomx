import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { encryptValue, decryptValue } from '../lib/encryption';
import type { Product } from '../types/marketplace';

export async function createProduct(
  sellerId: string,
  data: {
    name: string;
    description: string;
    base_url: string;
    auth_type: 'bearer' | 'api_key' | 'basic';
    auth_value: string;
    models: string[];
    pricing: {
      input_per_1k: number;
      output_per_1k: number;
    };
  }
): Promise<Product> {
  const encryptedAuth = await encryptValue(data.auth_value);
  
  const productData = {
    seller_id: sellerId,
    name: data.name,
    description: data.description,
    base_url: data.base_url,
    auth_type: data.auth_type,
    auth_value_encrypted: encryptedAuth,
    models: data.models,
    pricing: data.pricing,
    status: 'pending_review',
    rating: 0,
    total_sales: 0,
    review_count: 0,
    is_verified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // 1. 写入卖家子集合
  const sellerColRef = collection(db, 'sellers', sellerId, 'products');
  const sellerDocRef = await addDoc(sellerColRef, productData);
  
  // 2. 同时写入全局 products 集合（用于 Marketplace 查询）
  const globalColRef = collection(db, 'products');
  await addDoc(globalColRef, {
    ...productData,
    product_id: sellerDocRef.id, // 保存子集合的 ID
  });

  return {
    id: sellerDocRef.id,
    seller_id: sellerId,
    name: data.name,
    description: data.description,
    base_url: data.base_url,
    auth_type: data.auth_type,
    auth_value_encrypted: encryptedAuth,
    models: data.models,
    pricing: data.pricing,
    status: 'pending_review',
    rating: 0,
    total_sales: 0,
    review_count: 0,
    is_verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getSellerProducts(sellerId: string): Promise<Product[]> {
  const colRef = collection(db, 'sellers', sellerId, 'products');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      seller_id: data.seller_id,
      name: data.name,
      description: data.description,
      base_url: data.base_url,
      auth_type: data.auth_type,
      auth_value_encrypted: data.auth_value_encrypted,
      models: data.models,
      pricing: data.pricing,
      status: data.status,
      rating: data.rating,
      total_sales: data.total_sales,
      review_count: data.review_count,
      is_verified: data.is_verified,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function getProductById(productId: string): Promise<Product | null> {
  const colRef = collection(db, 'products');
  const q = query(colRef, where('__name__', '==', productId), limit(1));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    const data = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      seller_id: data.seller_id,
      name: data.name,
      description: data.description,
      base_url: data.base_url,
      auth_type: data.auth_type,
      auth_value_encrypted: data.auth_value_encrypted,
      models: data.models,
      pricing: data.pricing,
      status: data.status,
      rating: data.rating,
      total_sales: data.total_sales,
      review_count: data.review_count,
      is_verified: data.is_verified,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  }
  
  return null;
}

export async function getActiveProducts(
  limitCount: number = 20
): Promise<Product[]> {
  const colRef = collection(db, 'products');
  const q = query(
    colRef,
    where('status', '==', 'active'),
    orderBy('total_sales', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      seller_id: data.seller_id,
      name: data.name,
      description: data.description,
      base_url: data.base_url,
      auth_type: data.auth_type,
      auth_value_encrypted: data.auth_value_encrypted,
      models: data.models,
      pricing: data.pricing,
      status: data.status,
      rating: data.rating,
      total_sales: data.total_sales,
      review_count: data.review_count,
      is_verified: data.is_verified,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function updateProductStatus(
  sellerId: string,
  productId: string,
  status: 'active' | 'inactive' | 'rejected'
): Promise<void> {
  const docRef = doc(db, 'sellers', sellerId, 'products', productId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(
  sellerId: string,
  productId: string
): Promise<void> {
  const docRef = doc(db, 'sellers', sellerId, 'products', productId);
  await deleteDoc(docRef);
}

export async function getProductAuthValue(
  sellerId: string,
  productId: string
): Promise<string | null> {
  const docRef = doc(db, 'sellers', sellerId, 'products', productId);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return null;
  
  const data = snap.data();
  return decryptValue(data.auth_value_encrypted);
}
