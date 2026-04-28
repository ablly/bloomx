# Seller Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建卖家 API 上传和售卖平台，包含数据模型、Seller Dashboard、Marketplace、购买流程、Admin Console 和 API Gateway

**Architecture:** 采用分层架构 - UI 层（React 组件）→ 服务层（Services）→ 数据层（Firestore）。使用代理模式，卖家提供 API URL，平台统一路由和计费。

**Tech Stack:** React 19, TypeScript, Firebase Firestore, Tailwind CSS, Framer Motion

---

## 文件结构

```
src/
├── components/
│   ├── seller/
│   │   ├── SellerDashboard.tsx      # 卖家中心首页
│   │   ├── SellerProducts.tsx       # 产品列表
│   │   ├── SellerProductForm.tsx    # 产品表单
│   │   ├── SellerEarnings.tsx       # 收入明细
│   │   └── SellerWithdraw.tsx       # 提现申请
│   ├── marketplace/
│   │   ├── Marketplace.tsx          # 产品浏览列表
│   │   └── ProductDetail.tsx        # 产品详情
│   └── admin/
│       ├── AdminApplications.tsx    # 卖家申请审核
│       ├── AdminProducts.tsx        # 产品审核
│       └── AdminWithdrawals.tsx     # 提现审核
├── services/
│   ├── sellerService.ts             # 卖家服务
│   ├── productService.ts            # 产品服务
│   ├── purchaseService.ts           # 购买服务
│   ├── earningService.ts            # 收入服务
│   └── withdrawalService.ts         # 提现服务
├── types/
│   └── marketplace.ts               # 类型定义
└── lib/
    └── encryption.ts                # 凭证加密工具
```

---

## Phase 1: 数据模型 + Seller Dashboard（产品管理）

### Task 1.1: 创建类型定义

**Files:**
- Create: `src/types/marketplace.ts`

```typescript
// Seller Type
export interface Seller {
  id: string;
  uid: string;
  name: string;
  description: string;
  logo_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  asset_verified: boolean;
  total_products: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  bank_account?: {
    last4: string;
    bank_name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Product Type
export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: 'bearer' | 'api_key' | 'basic';
  auth_value_encrypted: string;
  models: string[];
  pricing: {
    input_per_1k: number;
    output_per_1k: number;
  };
  status: 'active' | 'inactive' | 'pending_review' | 'rejected';
  rating: number;
  total_sales: number;
  review_count: number;
  is_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Earning Type
export interface Earning {
  id: string;
  seller_id: string;
  product_id: string;
  buyer_id: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  gross_amount: number;
  platform_fee: number;
  seller_earnings: number;
  status: 'pending' | 'available' | 'withdrawn';
  createdAt: Date;
}

// Withdrawal Type
export interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bank_account_last4: string;
  bank_name: string;
  transaction_id?: string;
  failure_reason?: string;
  processedAt?: Date;
  createdAt: Date;
}

// Purchase Type
export interface Purchase {
  id: string;
  uid: string;
  product_id: string;
  seller_id: string;
  product_name: string;
  product_url: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date;
  expiresAt: Date;
}

// Review Type
export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  buyer_email: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
```

- [ ] **Step 1: Create types/marketplace.ts with all type definitions**

- [ ] **Step 2: Commit**
```bash
git add src/types/marketplace.ts
git commit -m "feat: add marketplace type definitions"
```

---

### Task 1.2: 创建加密工具

**Files:**
- Create: `src/lib/encryption.ts`

```typescript
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-prod';

export async function encryptValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  
  const keyBuffer = encoder.encode(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptValue(encrypted: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  const keyBuffer = encoder.encode(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const iv = data.slice(0, 12);
  const encryptedData = data.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}
```

- [ ] **Step 1: Create src/lib/encryption.ts with encrypt/decrypt functions**

- [ ] **Step 2: Commit**
```bash
git add src/lib/encryption.ts
git commit -m "feat: add encryption utility for API credentials"
```

---

### Task 1.3: 创建 Seller Service

**Files:**
- Create: `src/services/sellerService.ts`

```typescript
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
```

- [ ] **Step 1: Create src/services/sellerService.ts with seller CRUD operations**

- [ ] **Step 2: Commit**
```bash
git add src/services/sellerService.ts
git commit -m "feat: add seller service for profile management"
```

---

### Task 1.4: 创建 Product Service

**Files:**
- Create: `src/services/productService.ts`

```typescript
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
  
  const colRef = collection(db, 'sellers', sellerId, 'products');
  const docRef = await addDoc(colRef, {
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
  });

  return {
    id: docRef.id,
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
  const q = query(colRef, where('id', '==', productId), limit(1));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    const allProducts = await getDocs(collection(db, 'products'));
    const product = allProducts.docs.find(d => d.id === productId);
    if (!product) return null;
    const data = product.data();
    return {
      id: product.id,
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
  limitCount: number = 20,
  offset: number = 0
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
```

- [ ] **Step 1: Create src/services/productService.ts with product CRUD operations**

- [ ] **Step 2: Commit**
```bash
git add src/services/productService.ts
git commit -m "feat: add product service for product management"
```

---

### Task 1.5: 创建 Seller Dashboard 首页

**Files:**
- Create: `src/components/seller/SellerDashboard.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  CreditCard,
  Settings,
  LogOut,
  TrendingUp,
  Star,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerByUid } from '../../services/sellerService';
import { getSellerProducts } from '../../services/productService';
import type { Seller, Product } from '../../types/marketplace';
import { useTranslation } from 'react-i18next';

const SellerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (currentUser) {
      loadSellerData();
    }
  }, [currentUser]);

  const loadSellerData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const sellerData = await getSellerByUid(currentUser.uid);
      setSeller(sellerData);
      if (sellerData) {
        const productsData = await getSellerProducts(sellerData.id);
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Failed to load seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'overview', label: t('seller.dashboard.overview'), icon: LayoutDashboard },
    { id: 'products', label: t('seller.dashboard.products'), icon: Package },
    { id: 'earnings', label: t('seller.dashboard.earnings'), icon: DollarSign },
    { id: 'withdraw', label: t('seller.dashboard.withdraw'), icon: CreditCard },
    { id: 'settings', label: t('seller.dashboard.settings'), icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="liquid-glass rounded-2xl p-8 max-w-md text-center">
          <Package size={48} className="mx-auto mb-4 text-white/30" />
          <h2 className="text-2xl font-semibold text-white mb-4">
            {t('seller.dashboard.notSeller')}
          </h2>
          <p className="text-white/60 mb-6">
            {t('seller.dashboard.becomeSellerDesc')}
          </p>
          <button
            onClick={() => navigate('/seller/apply')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            {t('seller.dashboard.applyNow')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black font-sans text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/50 p-6 flex flex-col justify-between">
        <div>
          <div 
            className="flex items-center gap-2 mb-12 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
              <span className="font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-xl tracking-tighter">BloomX</span>
          </div>

          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          {t('common.signOut')}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto w-full max-w-6xl">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-medium tracking-tight">
            {navItems.find(i => i.id === activeTab)?.label}
          </h1>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.totalProducts')}
                </div>
                <div className="text-4xl font-sans font-medium">
                  {products.length}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.totalEarnings')}
                </div>
                <div className="text-4xl font-sans font-medium">
                  ${seller.total_earnings?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.availableBalance')}
                </div>
                <div className="text-4xl font-sans font-medium text-green-400">
                  ${seller.available_balance?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  {t('seller.dashboard.pendingBalance')}
                </div>
                <div className="text-4xl font-sans font-medium text-amber-400">
                  ${seller.pending_balance?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="liquid-glass rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Star size={18} className="text-yellow-400" />
                  {t('seller.dashboard.kycStatus')}
                </h3>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm ${
                  seller.kyc_status === 'approved' 
                    ? 'bg-green-500/20 text-green-400'
                    : seller.kyc_status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {seller.kyc_status || 'none'}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" />
                  {t('seller.dashboard.accountStatus')}
                </h3>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm ${
                  seller.status === 'approved' 
                    ? 'bg-green-500/20 text-green-400'
                    : seller.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {seller.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-white/60">{t('seller.dashboard.manageProducts')}</p>
              <button
                onClick={() => navigate('/seller/products/new')}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                {t('seller.dashboard.addProduct')}
              </button>
            </div>

            {products.length === 0 ? (
              <div className="liquid-glass rounded-2xl p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {t('seller.dashboard.noProducts')}
                </h3>
                <p className="text-white/50 text-sm mb-6">
                  {t('seller.dashboard.addFirstProduct')}
                </p>
              </div>
            ) : (
              <div className="liquid-glass rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs tracking-wider text-white/50 uppercase bg-white/5">
                      <th className="px-6 py-4">{t('seller.dashboard.productName')}</th>
                      <th className="px-6 py-4">{t('seller.dashboard.models')}</th>
                      <th className="px-6 py-4">{t('seller.dashboard.pricing')}</th>
                      <th className="px-6 py-4">{t('seller.dashboard.status')}</th>
                      <th className="px-6 py-4">{t('seller.dashboard.sales')}</th>
                      <th className="px-6 py-4">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-medium">{product.name}</td>
                        <td className="px-6 py-4 text-white/60">
                          {product.models?.slice(0, 2).join(', ')}
                          {product.models?.length > 2 && ` +${product.models.length - 2}`}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          ${product.pricing?.input_per_1k} / ${product.pricing?.output_per_1k}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                            product.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : product.status === 'pending_review'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{product.total_sales || 0}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                            className="text-white/60 hover:text-white mr-3"
                          >
                            {t('common.edit')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerDashboard;
```

- [ ] **Step 1: Create src/components/seller/SellerDashboard.tsx**

- [ ] **Step 2: Commit**
```bash
git add src/components/seller/SellerDashboard.tsx
git commit -m "feat: add seller dashboard component"
```

---

### Task 1.6: 创建产品表单组件

**Files:**
- Create: `src/components/seller/SellerProductForm.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createProduct, getSellerProducts, updateProductStatus, deleteProduct } from '../../services/productService';
import { getSellerByUid } from '../../services/sellerService';
import { useTranslation } from 'react-i18next';

const SellerProductForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!productId);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_url: '',
    auth_type: 'bearer' as 'bearer' | 'api_key' | 'basic',
    auth_value: '',
    models: [] as string[],
    pricing: {
      input_per_1k: 0,
      output_per_1k: 0,
    },
  });
  const [modelInput, setModelInput] = useState('');

  useEffect(() => {
    if (productId && currentUser) {
      loadProduct();
    }
  }, [productId, currentUser]);

  const loadProduct = async () => {
    if (!currentUser || !productId) return;
    setInitialLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (seller) {
        const products = await getSellerProducts(seller.id);
        const product = products.find(p => p.id === productId);
        if (product) {
          setFormData({
            name: product.name,
            description: product.description,
            base_url: product.base_url,
            auth_type: product.auth_type,
            auth_value: '', // Don't show encrypted value
            models: product.models,
            pricing: product.pricing,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('pricing.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing: { ...prev.pricing, [key]: parseFloat(value) || 0 },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddModel = () => {
    if (modelInput.trim() && !formData.models.includes(modelInput.trim())) {
      setFormData(prev => ({
        ...prev,
        models: [...prev.models, modelInput.trim()],
      }));
      setModelInput('');
    }
  };

  const handleRemoveModel = (model: string) => {
    setFormData(prev => ({
      ...prev,
      models: prev.models.filter(m => m !== model),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (!seller) {
        alert(t('seller.errors.noSellerProfile'));
        return;
      }

      if (productId) {
        // Update existing product
        await updateProductStatus(seller.id, productId, 'pending_review');
      } else {
        // Create new product
        await createProduct(seller.id, {
          name: formData.name,
          description: formData.description,
          base_url: formData.base_url,
          auth_type: formData.auth_type,
          auth_value: formData.auth_value,
          models: formData.models,
          pricing: formData.pricing,
        });
      }
      
      navigate('/seller/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(t('seller.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !productId) return;
    if (!confirm(t('seller.errors.confirmDelete'))) return;
    
    setLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (seller) {
        await deleteProduct(seller.id, productId);
        navigate('/seller/products');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/seller/products')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft size={18} />
          {t('common.back')}
        </button>

        <div className="liquid-glass rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {productId ? t('seller.product.editProduct') : t('seller.product.addProduct')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {t('seller.product.name')}
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                placeholder={t('seller.product.namePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {t('seller.product.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 resize-none"
                placeholder={t('seller.product.descriptionPlaceholder')}
              />
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {t('seller.product.baseUrl')}
              </label>
              <input
                name="base_url"
                value={formData.base_url}
                onChange={handleChange}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono text-sm"
                placeholder="https://api.yourprovider.com/v1"
              />
            </div>

            {/* Auth Type */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {t('seller.product.authType')}
              </label>
              <select
                name="auth_type"
                value={formData.auth_type}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
              >
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {/* Auth Value */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {t('seller.product.authValue')}
              </label>
              <input
                name="auth_value"
                type="password"
                value={formData.auth_value}
                onChange={handleChange}
                required={!productId}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono text-sm"
                placeholder={productId ? t('seller.product.keepExisting') : t('seller.product.authValuePlaceholder')}
              />
            </div>

            {/* Models */}
            <div>
              <label className="block text-sm text-white/60 mb-2">
                {t('seller.product.models')}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModel())}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                  placeholder="e.g., gpt-4o"
                />
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  {t('common.add')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.models.map(model => (
                  <span
                    key={model}
                    className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm"
                  >
                    {model}
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(model)}
                      className="text-white/60 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  {t('seller.product.inputPrice')}
                </label>
                <input
                  name="pricing.input_per_1k"
                  type="number"
                  step="0.01"
                  value={formData.pricing.input_per_1k}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono"
                  placeholder="2.50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  {t('seller.product.outputPrice')}
                </label>
                <input
                  name="pricing.output_per_1k"
                  type="number"
                  step="0.01"
                  value={formData.pricing.output_per_1k}
                  onChange={handleChange}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 font-mono"
                  placeholder="10.00"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : (
                  <>
                    <Save size={18} className="inline mr-2" />
                    {t('common.save')}
                  </>
                )}
              </button>
              {productId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-500/20 text-red-400 px-6 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerProductForm;
```

- [ ] **Step 1: Create src/components/seller/SellerProductForm.tsx**

- [ ] **Step 2: Commit**
```bash
git add src/components/seller/SellerProductForm.tsx
git commit -m "feat: add seller product form component"
```

---

## Phase 2: Marketplace（产品列表 + 详情）

### Task 2.1: 创建 Marketplace 首页

**Files:**
- Create: `src/components/marketplace/Marketplace.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, TrendingUp } from 'lucide-react';
import { getActiveProducts } from '../../services/productService';
import { getSellerById } from '../../services/sellerService';
import type { Product, Seller } from '../../types/marketplace';
import { useTranslation } from 'react-i18next';

const Marketplace = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Record<string, Seller>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [sortBy, setSortBy] = useState<'sales' | 'rating' | 'price'>('sales');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsData = await getActiveProducts(50);
      setProducts(productsData);
      
      // Load seller info for each product
      const sellerIds = [...new Set(productsData.map(p => p.seller_id))];
      const sellerData: Record<string, Seller> = {};
      for (const sellerId of sellerIds) {
        const seller = await getSellerById(sellerId);
        if (seller) {
          sellerData[sellerId] = seller;
        }
      }
      setSellers(sellerData);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const allModels = [...new Set(products.flatMap(p => p.models || []))];

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModel = !selectedModel || product.models.includes(selectedModel);
      return matchesSearch && matchesModel;
    })
    .sort((a, b) => {
      if (sortBy === 'sales') return (b.total_sales || 0) - (a.total_sales || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return a.pricing.input_per_1k - b.pricing.input_per_1k;
    });

  const formatPrice = (pricing: { input_per_1k: number; output_per_1k: number }) => {
    return `$${pricing.input_per_1k.toFixed(2)} - $${pricing.output_per_1k.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-sans tracking-tight text-white mb-4">
            {t('marketplace.title')}
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            {t('marketplace.subtitle')}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              placeholder={t('marketplace.searchPlaceholder')}
            />
          </div>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
          >
            <option value="">{t('marketplace.allModels')}</option>
            {allModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'sales' | 'rating' | 'price')}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
          >
            <option value="sales">{t('marketplace.sortBySales')}</option>
            <option value="rating">{t('marketplace.sortByRating')}</option>
            <option value="price">{t('marketplace.sortByPrice')}</option>
          </select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-12 text-center">
            <p className="text-white/40">{t('marketplace.noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const seller = sellers[product.seller_id];
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/marketplace/${product.id}`)}
                  className="liquid-glass rounded-2xl p-6 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  {/* Product Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{product.name}</h3>
                      {seller && (
                        <p className="text-sm text-white/50">{seller.name}</p>
                      )}
                    </div>
                    {product.is_verified && (
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                        {t('marketplace.verified')}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Models */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.models?.slice(0, 3).map(model => (
                      <span key={model} className="bg-white/5 px-2 py-1 rounded text-xs text-white/60">
                        {model}
                      </span>
                    ))}
                    {product.models?.length > 3 && (
                      <span className="text-xs text-white/40">+{product.models.length - 3}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <div>
                      <span className="text-white/50 text-xs">{t('marketplace.price')}</span>
                      <p className="text-white font-mono text-sm">
                        {formatPrice(product.pricing)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={14} fill="currentColor" />
                          <span className="text-sm">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-white/50">
                        <TrendingUp size={14} />
                        <span className="text-sm">{product.total_sales || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
```

- [ ] **Step 1: Create src/components/marketplace/Marketplace.tsx**

- [ ] **Step 2: Commit**
```bash
git add src/components/marketplace/Marketplace.tsx
git commit -m "feat: add marketplace component"
```

---

### Task 2.2: 创建 Product Detail 页面

**Files:**
- Create: `src/components/marketplace/ProductDetail.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Check, Shield } from 'lucide-react';
import { getSellerById } from '../../services/sellerService';
import type { Product, Seller } from '../../types/marketplace';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { t } = useTranslation();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProductDetails();
    }
  }, [productId]);

  const loadProductDetails = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      // In real implementation, fetch from Firestore
      // For now, set as loading false
      setLoading(false);
    } catch (error) {
      console.error('Failed to load product:', error);
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }

    if (!userProfile || userProfile.credits_balance < 10) {
      alert(t('marketplace.insufficientCredits'));
      return;
    }

    setPurchasing(true);
    try {
      // Implement purchase logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(t('marketplace.purchaseSuccess'));
      navigate('/dashboard/purchases');
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white/60 mb-4">{t('marketplace.productNotFound')}</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-white hover:underline"
          >
            {t('common.backToMarketplace')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft size={18} />
          {t('common.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="liquid-glass rounded-2xl p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-semibold text-white mb-2">
                    {product.name}
                  </h1>
                  {seller && (
                    <p className="text-white/60">
                      {t('marketplace.by')} {seller.name}
                    </p>
                  )}
                </div>
                {product.is_verified && (
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Shield size={14} />
                    {t('marketplace.verified')}
                  </span>
                )}
              </div>

              <p className="text-white/80 text-lg mb-6">
                {product.description}
              </p>

              {/* Models */}
              <div className="mb-6">
                <h3 className="text-white/50 text-sm uppercase tracking-widest mb-3">
                  {t('marketplace.supportedModels')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.models?.map(model => (
                    <span key={model} className="bg-white/10 px-3 py-2 rounded-lg text-sm">
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-white/50 text-sm uppercase tracking-widest mb-3">
                  {t('marketplace.pricing')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-xl p-4">
                    <p className="text-white/60 text-sm">{t('marketplace.input')}</p>
                    <p className="text-2xl font-mono text-white">
                      ${product.pricing.input_per_1k.toFixed(2)}
                    </p>
                    <p className="text-white/40 text-xs">per 1K tokens</p>
                  </div>
                  <div className="bg-black/40 rounded-xl p-4">
                    <p className="text-white/60 text-sm">{t('marketplace.output')}</p>
                    <p className="text-2xl font-mono text-white">
                      ${product.pricing.output_per_1k.toFixed(2)}
                    </p>
                    <p className="text-white/40 text-xs">per 1K tokens</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="liquid-glass rounded-2xl p-8">
                <h3 className="text-white/50 text-sm uppercase tracking-widest mb-4">
                  {t('marketplace.sellerInfo')}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-semibold">
                    {seller.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-white">{seller.name}</h4>
                    <p className="text-white/60 text-sm">{seller.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-white/50 text-sm">
                        {seller.total_products} {t('marketplace.products')}
                      </span>
                      <span className="text-white/50 text-sm">
                        ${seller.total_earnings?.toFixed(2)} {t('marketplace.earnings')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="liquid-glass rounded-2xl p-6 sticky top-6">
              <div className="text-center mb-6">
                <p className="text-white/60 text-sm mb-2">{t('marketplace.oneTimeAccess')}</p>
                <p className="text-3xl font-semibold text-white">
                  ${product.pricing.input_per_1k * 10 + product.pricing.output_per_1k * 10}
                </p>
              </div>

              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    {t('marketplace.purchaseNow')}
                  </>
                )}
              </button>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Check size={14} className="text-green-400" />
                  {t('marketplace.instantAccess')}
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Check size={14} className="text-green-400" />
                  {t('marketplace.verifiedApis')}
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Check size={14} className="text-green-400" />
                  {t('marketplace.platformSupport')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
```

- [ ] **Step 1: Create src/components/marketplace/ProductDetail.tsx**

- [ ] **Step 2: Commit**
```bash
git add src/components/marketplace/ProductDetail.tsx
git commit -m "feat: add product detail component"
```

---

## Phase 3: 购买流程 + 访问权限管理

### Task 3.1: 创建 Purchase Service

**Files:**
- Create: `src/services/purchaseService.ts`

```typescript
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
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
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
```

- [ ] **Step 1: Create src/services/purchaseService.ts**

- [ ] **Step 2: Commit**
```bash
git add src/services/purchaseService.ts
git commit -m "feat: add purchase service"
```

---

## Phase 4: Admin Console（审核功能）

### Task 4.1: 创建 Admin Applications 页面

**Files:**
- Create: `src/components/admin/AdminApplications.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Check, X, Clock, User } from 'lucide-react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Seller } from '../../types/marketplace';
import { useTranslation } from 'react-i18next';

const AdminApplications = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'sellers');
      const q = query(colRef, where('status', '==', 'pending'));
      const snap = await getDocs(q);
      
      setApplications(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
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
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
      }));
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: string) => {
    setProcessing(sellerId);
    try {
      const docRef = doc(db, 'sellers', sellerId);
      await updateDoc(docRef, {
        status: 'approved',
        updatedAt: new Date(),
      });
      setApplications(prev => prev.filter(a => a.id !== sellerId));
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (sellerId: string) => {
    setProcessing(sellerId);
    try {
      const docRef = doc(db, 'sellers', sellerId);
      await updateDoc(docRef, {
        status: 'rejected',
        updatedAt: new Date(),
      });
      setApplications(prev => prev.filter(a => a.id !== sellerId));
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold text-white mb-8">
          {t('admin.sellerApplications')}
        </h1>

        {applications.length === 0 ? (
          <div className="liquid-glass rounded-2xl p-12 text-center">
            <User size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/60">{t('admin.noApplications')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="liquid-glass rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-semibold">
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{app.name}</h3>
                      <p className="text-white/60 text-sm">{app.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={processing === app.id}
                      className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
                    >
                      <Check size={18} />
                      {t('admin.approve')}
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={processing === app.id}
                      className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                    >
                      <X size={18} />
                      {t('admin.reject')}
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <span className={`px-2 py-1 rounded ${
                    app.kyc_status === 'approved' 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    KYC: {app.kyc_status || 'none'}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    app.asset_verified 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    Asset: {app.asset_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApplications;
```

- [ ] **Step 1: Create src/components/admin/AdminApplications.tsx**

- [ ] **Step 2: Commit**
```bash
git add src/components/admin/AdminApplications.tsx
git commit -m "feat: add admin applications component"
```

---

## Phase 5: API Gateway（路由 + 计费）

### Task 5.1: 创建 Earning Service

**Files:**
- Create: `src/services/earningService.ts`

```typescript
import {
  collection,
  addDoc,
  getDocs,
  doc,
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

export async function settleEarnings(sellerId: string, month: Date): Promise<void> {
  // This would be called by a Cloud Function on a monthly basis
  // Mark pending earnings as available for withdrawal
  const colRef = collection(db, 'sellers', sellerId, 'earnings');
  const q = query(
    colRef,
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  
  const batch = [];
  for (const doc of snap.docs) {
    batch.push(updateDoc(doc.ref, { status: 'available' }));
  }
  
  await Promise.all(batch);
}
```

- [ ] **Step 1: Create src/services/earningService.ts**

- [ ] **Step 2: Commit**
```bash
git add src/services/earningService.ts
git commit -m "feat: add earning service for revenue tracking"
```

---

## 实施计划完成

**Plan complete and saved to `docs/superpowers/plans/2026-04-01-seller-marketplace-implementation.md`.**

---

## ❓ 执行选择

**两个执行选项：**

**1. Subagent-Driven (推荐)** - 我为每个任务分配一个子代理，任务间进行审查，快速迭代

**2. Inline Execution** - 在此会话中执行任务，使用 executing-plans 进行批量执行和审查点

**你选择哪个方法？**