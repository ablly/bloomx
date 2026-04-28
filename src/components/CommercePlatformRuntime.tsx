import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

type AuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

type SellerProfile = {
  id: string;
  ownerId: string;
  sellerName: string;
  contactEmail: string;
  companyType: string;
  status: 'draft' | 'pending' | 'verified';
  payoutMode: string;
};

type ApiOffer = {
  id: string;
  ownerId: string;
  sellerName: string;
  modelName: string;
  category: string;
  endpoint: string;
  authHeader: string;
  apiKey?: string;
  pricePerCall: number;
  description: string;
  status: 'draft' | 'listed';
};

type Subscription = {
  id: string;
  userId: string;
  offerId: string;
  modelName: string;
  sellerName: string;
  pricePerCall: number;
  status: 'active' | 'paused';
};

type UserWallet = {
  credits: number;
  platformApiKey: string;
};

type ApiCallRecord = {
  id: string;
  userId: string;
  modelName: string;
  prompt: string;
  status: 'completed' | 'queued' | 'failed';
  cost: number;
  responsePreview: string;
};

type ApiOfferStats = {
  id: string;
  offerId: string;
  successfulCalls: number;
  earnedCredits: number;
};

const emptyOffer = {
  modelName: '',
  category: 'chat',
  endpoint: '',
  apiKey: '',
  authHeader: 'Authorization',
  pricePerCall: 1,
  description: '',
};

const panelStyles: Record<string, CSSProperties> = {
  launcher: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 70,
    border: '1px solid rgba(255,255,255,0.26)',
    background: 'rgba(12, 22, 24, 0.82)',
    color: '#fff',
    borderRadius: 999,
    padding: '13px 18px',
    fontWeight: 700,
    boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(16px)',
    cursor: 'pointer',
  },
  panel: {
    position: 'fixed',
    right: 24,
    bottom: 84,
    width: 'min(1120px, calc(100vw - 48px))',
    maxHeight: 'calc(100vh - 118px)',
    overflow: 'auto',
    zIndex: 70,
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 24,
    background: 'linear-gradient(160deg, rgba(8,15,18,0.94), rgba(15,45,43,0.92))',
    color: '#eefcf6',
    boxShadow: '0 34px 120px rgba(0,0,0,0.55)',
    backdropFilter: 'blur(22px)',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '22px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(7, 16, 18, 0.72)',
    backdropFilter: 'blur(18px)',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '16px 24px 0',
  },
  tab: {
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 999,
    padding: '9px 13px',
    color: '#dff5ed',
    background: 'rgba(255,255,255,0.06)',
    cursor: 'pointer',
    fontSize: 13,
  },
  activeTab: {
    background: '#eaf8f0',
    color: '#0b211f',
  },
  content: {
    padding: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.07)',
    padding: 18,
  },
  input: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 12,
    padding: '12px 13px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    outline: 'none',
  },
  label: {
    display: 'grid',
    gap: 7,
    fontSize: 12,
    color: 'rgba(239,255,249,0.7)',
    fontWeight: 700,
  },
  button: {
    border: 0,
    borderRadius: 12,
    padding: '12px 15px',
    background: '#f3fff7',
    color: '#09201d',
    fontWeight: 800,
    cursor: 'pointer',
  },
  ghostButton: {
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 12,
    padding: '12px 15px',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  muted: {
    color: 'rgba(239,255,249,0.68)',
    fontSize: 13,
    lineHeight: 1.6,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '5px 9px',
    background: 'rgba(246, 129, 57, 0.16)',
    color: '#ffb27f',
    fontSize: 12,
    fontWeight: 800,
  },
};

const toNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const makePlatformApiKey = (uid: string) =>
  `bx_${uid.slice(0, 8)}_${Math.random().toString(36).slice(2, 14)}`;

const openAuthEntry = () => {
  const buttons = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
  const authEntry = buttons.find((item) => /登录|注册|sign in|log in|start/i.test(item.textContent || ''));
  authEntry?.click();
};

function CommercePlatformRuntime() {
  const authState = useAuth() as {
    currentUser?: AuthUser | null;
    user?: AuthUser | null;
    loading?: boolean;
  };
  const currentUser = authState.currentUser ?? authState.user ?? null;
  const authLoading = Boolean(authState.loading);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('seller');
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet>({ credits: 0, platformApiKey: '' });
  const [myOffers, setMyOffers] = useState<ApiOffer[]>([]);
  const [offerStats, setOfferStats] = useState<ApiOfferStats[]>([]);
  const [listedOffers, setListedOffers] = useState<ApiOffer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [callRecords, setCallRecords] = useState<ApiCallRecord[]>([]);
  const [sellerForm, setSellerForm] = useState({
    sellerName: '',
    contactEmail: '',
    companyType: 'independent',
    payoutMode: 'manual',
  });
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [callForm, setCallForm] = useState({ modelName: '', prompt: '' });
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const subscriptionByOffer = useMemo(() => {
    const next = new Map<string, Subscription>();
    subscriptions.forEach((item) => next.set(item.offerId, item));
    return next;
  }, [subscriptions]);
  
  const subscribedModels = useMemo(() => {
    const next = new Set<string>();
    subscriptions.forEach((item) => next.add(item.offerId));
    return next;
  }, [subscriptions]);
  
  const metrics = useMemo(
    () => ({
      listedOffers: myOffers.filter((item) => item.status === 'listed').length,
      activeSubscriptions: subscriptions.filter((item) => item.status === 'active').length,
      totalCalls: callRecords.length,
      spentCredits: callRecords.reduce((sum, item) => sum + item.cost, 0),
      merchantCalls: offerStats.reduce((sum, item) => sum + item.successfulCalls, 0),
      earnedCredits: offerStats.reduce((sum, item) => sum + item.earnedCredits, 0),
    }),
    [myOffers, subscriptions, callRecords, offerStats]
  );

  const refreshFirebaseState = async (user: AuthUser) => {
    const userRef = doc(db, 'users', user.uid);
    const sellerRef = doc(db, 'sellerProfiles', user.uid);

    const [userSnap, sellerSnap] = await Promise.all([getDoc(userRef), getDoc(sellerRef)]);
    if (!userSnap.exists()) {
      const platformApiKey = makePlatformApiKey(user.uid);
      await setDoc(
        userRef,
        {
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          credits_balance: 25,
          platformApiKey,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setWallet({ credits: 25, platformApiKey });
    } else {
      const data = userSnap.data();
      const platformApiKey = String(data.platformApiKey || makePlatformApiKey(user.uid));

      if (!data.platformApiKey) {
        await setDoc(
          userRef,
          {
            platformApiKey,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      setWallet({
        credits: toNumber(data.credits_balance ?? data.credits, 0),
        platformApiKey,
      });
    }

    if (sellerSnap.exists()) {
      const data = sellerSnap.data();
      const profile: SellerProfile = {
        id: user.uid,
        ownerId: String(data.ownerId || user.uid),
        sellerName: String(data.sellerName || ''),
        contactEmail: String(data.contactEmail || user.email || ''),
        companyType: String(data.companyType || 'independent'),
        status: (data.status as SellerProfile['status']) || 'draft',
        payoutMode: String(data.payoutMode || 'manual'),
      };
      setSeller(profile);
      setSellerForm({
        sellerName: profile.sellerName,
        contactEmail: profile.contactEmail,
        companyType: profile.companyType,
        payoutMode: profile.payoutMode,
      });
    } else {
      setSeller(null);
      setSellerForm((prev) => ({
        ...prev,
        contactEmail: user.email ?? prev.contactEmail,
      }));
    }

    const ownOffersQuery = query(collection(db, 'apiOffers'), where('ownerId', '==', user.uid), limit(30));
    const listedOffersQuery = query(collection(db, 'apiOffers'), where('status', '==', 'listed'), limit(40));
    const subscriptionsQuery = query(collection(db, 'subscriptions'), where('userId', '==', user.uid), limit(30));
    const callsQuery = query(collection(db, 'apiCallRecords'), where('userId', '==', user.uid), limit(30));
    const offerStatsQuery = query(collection(db, 'apiOfferStats'), where('ownerId', '==', user.uid), limit(50));
    const [ownOffersSnap, listedOffersSnap, subscriptionsSnap, callsSnap, offerStatsSnap] = await Promise.all([
      getDocs(ownOffersQuery),
      getDocs(listedOffersQuery),
      getDocs(subscriptionsQuery),
      getDocs(callsQuery),
      getDocs(offerStatsQuery),
    ]);

    setMyOffers(
      ownOffersSnap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          ownerId: String(data.ownerId || ''),
          sellerName: String(data.sellerName || ''),
          modelName: String(data.modelName || ''),
          category: String(data.category || 'chat'),
          endpoint: String(data.endpoint || ''),
          authHeader: String(data.authHeader || 'Authorization'),
          apiKey: String(data.apiKey || ''),
          pricePerCall: toNumber(data.pricePerCall, 1),
          description: String(data.description || ''),
          status: (data.status as ApiOffer['status']) || 'draft',
        };
      })
    );

    setListedOffers(
      listedOffersSnap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          ownerId: String(data.ownerId || ''),
          sellerName: String(data.sellerName || ''),
          modelName: String(data.modelName || ''),
          category: String(data.category || 'chat'),
          endpoint: String(data.endpoint || ''),
          authHeader: String(data.authHeader || 'Authorization'),
          apiKey: String(data.apiKey || ''),
          pricePerCall: toNumber(data.pricePerCall, 1),
          description: String(data.description || ''),
          status: (data.status as ApiOffer['status']) || 'listed',
        };
      })
    );

    setSubscriptions(
      subscriptionsSnap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          userId: String(data.userId || user.uid),
          offerId: String(data.offerId || ''),
          modelName: String(data.modelName || ''),
          sellerName: String(data.sellerName || ''),
          pricePerCall: toNumber(data.pricePerCall, 1),
          status: (data.status as Subscription['status']) || 'active',
        };
      })
    );

    setCallRecords(
      callsSnap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          userId: String(data.userId || user.uid),
          modelName: String(data.modelName || ''),
          prompt: String(data.prompt || ''),
          status: (data.status as ApiCallRecord['status']) || 'queued',
          cost: toNumber(data.cost, 0),
          responsePreview: String(data.responsePreview || ''),
        };
      })
    );

    setOfferStats(
      offerStatsSnap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          offerId: String(data.offerId || item.id),
          successfulCalls: toNumber(data.successfulCalls, 0),
          earnedCredits: toNumber(data.earnedCredits, 0),
        };
      })
    );
  };

  useEffect(() => {
    if (!currentUser) {
      setSeller(null);
      setWallet({ credits: 0, platformApiKey: '' });
      setMyOffers([]);
      setOfferStats([]);
      setSubscriptions([]);
      setCallRecords([]);
      setStatus('');
      return;
    }

    setIsBusy(true);
    refreshFirebaseState(currentUser)
      .catch((error) => {
        console.error(error);
        setStatus('Firebase 数据读取失败，请检查登录状态和 Firestore 规则。');
      })
      .finally(() => setIsBusy(false));
  }, [currentUser?.uid]);

  const saveSellerProfile = async () => {
    if (!currentUser) return;
    setIsBusy(true);
    const profile = {
      ownerId: currentUser.uid,
      sellerName: sellerForm.sellerName.trim(),
      contactEmail: sellerForm.contactEmail.trim(),
      companyType: sellerForm.companyType,
      payoutMode: sellerForm.payoutMode,
      status: 'pending',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'sellerProfiles', currentUser.uid), profile, { merge: true });
    setStatus('商家资料已提交到 Firebase，等待审核后可正式展示。');
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const createOffer = async () => {
    if (!currentUser || !seller) return;
    setIsBusy(true);
    const publicOffer = {
      ownerId: currentUser.uid,
      sellerName: seller.sellerName,
      modelName: offerForm.modelName.trim(),
      category: offerForm.category,
      endpoint: offerForm.endpoint.trim(),
      authHeader: offerForm.authHeader.trim() || 'Authorization',
      pricePerCall: toNumber(offerForm.pricePerCall, 1),
      description: offerForm.description.trim(),
      status: 'listed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const offerRef = await addDoc(collection(db, 'apiOffers'), publicOffer);
    await setDoc(doc(db, 'merchantApiSecrets', offerRef.id), {
      ownerId: currentUser.uid,
      offerId: offerRef.id,
      authHeader: publicOffer.authHeader,
      apiKey: offerForm.apiKey.trim(),
      endpoint: publicOffer.endpoint,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    setOfferForm(emptyOffer);
    setStatus('API 已上架到 Firebase 市场，用户现在可以订阅。');
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const subscribeOffer = async (offer: ApiOffer) => {
    if (!currentUser || subscribedModels.has(offer.id)) return;
    setIsBusy(true);
    await addDoc(collection(db, 'subscriptions'), {
      userId: currentUser.uid,
      offerId: offer.id,
      modelName: offer.modelName,
      sellerName: offer.sellerName,
      pricePerCall: offer.pricePerCall,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setStatus(`已订阅 ${offer.modelName}，可在平台 API 中调用。`);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const updateOfferStatus = async (offer: ApiOffer, status: ApiOffer['status']) => {
    if (!currentUser || offer.ownerId !== currentUser.uid) return;
    setIsBusy(true);
    await updateDoc(doc(db, 'apiOffers', offer.id), {
      status,
      updatedAt: serverTimestamp(),
    });
    setStatus(status === 'listed' ? `${offer.modelName} 已重新上架。` : `${offer.modelName} 已下架。`);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const updateSubscriptionStatus = async (subscription: Subscription, status: Subscription['status']) => {
    if (!currentUser || subscription.userId !== currentUser.uid) return;
    setIsBusy(true);
    await updateDoc(doc(db, 'subscriptions', subscription.id), {
      status,
      updatedAt: serverTimestamp(),
    });
    setStatus(status === 'active' ? `${subscription.modelName} 订阅已恢复。` : `${subscription.modelName} 订阅已暂停。`);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const addCredits = async (amount: number) => {
    if (!currentUser) return;
    setIsBusy(true);
    await setDoc(
      doc(db, 'users', currentUser.uid),
      {
        credits_balance: increment(amount),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setStatus(`已向 Firebase 钱包增加 ${amount} 积分。`);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const rotatePlatformKey = async () => {
    if (!currentUser) return;
    setIsBusy(true);
    const platformApiKey = makePlatformApiKey(currentUser.uid);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      platformApiKey,
      updatedAt: serverTimestamp(),
    });
    setStatus('平台 API Key 已更新并保存到 Firebase。');
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const callPlatformApi = async () => {
    if (!currentUser) return;
    const subscription = subscriptions.find((item) => item.modelName === callForm.modelName && item.status === 'active');
    if (!subscription) {
      setStatus('请先订阅要调用的模型。');
      return;
    }
    if (wallet.credits < subscription.pricePerCall) {
      setStatus('积分不足，先充值后再调用。');
      return;
    }

    setIsBusy(true);
    const functionUrl = import.meta.env.VITE_INVOKE_MERCHANT_MODEL_URL;

    if (functionUrl && wallet.platformApiKey) {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wallet.platformApiKey}`,
        },
        body: JSON.stringify({
          modelName: subscription.modelName,
          prompt: callForm.prompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setStatus(`平台 API 调用失败：${errorText || response.status}`);
        setIsBusy(false);
        return;
      }

      setStatus('平台 API 已通过 Firebase Function 调用商家模型。');
    } else {
      const recordPayload = {
        userId: currentUser.uid,
        modelName: subscription.modelName,
        prompt: callForm.prompt,
        status: 'queued',
        cost: subscription.pricePerCall,
        responsePreview: '开发模式：未配置 VITE_INVOKE_MERCHANT_MODEL_URL，已先写入 Firebase 调用记录。',
        createdAt: serverTimestamp(),
      };
      await Promise.all([
        addDoc(collection(db, 'apiCallRecords'), recordPayload),
        updateDoc(doc(db, 'users', currentUser.uid), {
          credits_balance: increment(-subscription.pricePerCall),
          updatedAt: serverTimestamp(),
        }),
      ]);
      setStatus('开发模式调用记录和积分扣减已写入 Firebase。');
    }

    setCallForm({ modelName: subscription.modelName, prompt: '' });
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const renderGate = () => (
    <div style={panelStyles.card}>
      <span style={panelStyles.badge}>登录后可见</span>
      <h3 style={{ margin: '16px 0 8px', fontSize: 22 }}>控制台、设置和交易数据需要登录</h3>
      <p style={panelStyles.muted}>
        未登录状态只展示首页和市场入口；商家入驻、API 上架、订阅、积分钱包、平台 API Key 与调用记录都会绑定到当前 Firebase 用户。
      </p>
      <button style={{ ...panelStyles.button, marginTop: 14 }} onClick={openAuthEntry}>
        去登录
      </button>
    </div>
  );

  const renderSeller = () => (
    <div style={panelStyles.grid}>
      <div style={panelStyles.card}>
        <span style={panelStyles.badge}>{seller ? seller.status : '未提交'}</span>
        <h3 style={{ margin: '14px 0 12px', fontSize: 20 }}>商家注册</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={panelStyles.label}>
            商家名称
            <input
              style={panelStyles.input}
              value={sellerForm.sellerName}
              onChange={(event) => setSellerForm({ ...sellerForm, sellerName: event.target.value })}
              placeholder="例如 BloomX Verified Supplier"
            />
          </label>
          <label style={panelStyles.label}>
            联系邮箱
            <input
              style={panelStyles.input}
              value={sellerForm.contactEmail}
              onChange={(event) => setSellerForm({ ...sellerForm, contactEmail: event.target.value })}
              placeholder="seller@example.com"
            />
          </label>
          <label style={panelStyles.label}>
            类型
            <select
              style={panelStyles.input}
              value={sellerForm.companyType}
              onChange={(event) => setSellerForm({ ...sellerForm, companyType: event.target.value })}
            >
              <option value="independent">独立开发者</option>
              <option value="company">公司主体</option>
              <option value="lab">研究团队</option>
            </select>
          </label>
          <label style={panelStyles.label}>
            结算方式
            <select
              style={panelStyles.input}
              value={sellerForm.payoutMode}
              onChange={(event) => setSellerForm({ ...sellerForm, payoutMode: event.target.value })}
            >
              <option value="manual">人工结算</option>
              <option value="monthly">月结</option>
            </select>
          </label>
          <button
            style={panelStyles.button}
            disabled={isBusy || !sellerForm.sellerName || !sellerForm.contactEmail}
            onClick={saveSellerProfile}
          >
            保存到 Firebase
          </button>
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>商家数据边界</h3>
        <p style={panelStyles.muted}>
          商家资料保存到 <strong>sellerProfiles</strong>，API 商品保存到 <strong>apiOffers</strong>。控制台只在登录后读取当前 UID 下的数据。
        </p>
      </div>
    </div>
  );

  const renderOffers = () => (
    <div style={panelStyles.grid}>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>上传自己的 API</h3>
        {!seller && <p style={panelStyles.muted}>请先提交商家注册资料。</p>}
        <div style={{ display: 'grid', gap: 12, opacity: seller ? 1 : 0.45 }}>
          <label style={panelStyles.label}>
            模型名称
            <input
              style={panelStyles.input}
              value={offerForm.modelName}
              onChange={(event) => setOfferForm({ ...offerForm, modelName: event.target.value })}
              placeholder="例如 xianyu-gpt-lite"
            />
          </label>
          <label style={panelStyles.label}>
            API Endpoint
            <input
              style={panelStyles.input}
              value={offerForm.endpoint}
              onChange={(event) => setOfferForm({ ...offerForm, endpoint: event.target.value })}
              placeholder="https://api.example.com/v1/chat"
            />
          </label>
          <label style={panelStyles.label}>
            商家 API Key
            <input
              style={panelStyles.input}
              value={offerForm.apiKey}
              onChange={(event) => setOfferForm({ ...offerForm, apiKey: event.target.value })}
              placeholder="仅用于后端代理调用"
              type="password"
            />
          </label>
          <label style={panelStyles.label}>
            每次调用积分
            <input
              style={panelStyles.input}
              value={offerForm.pricePerCall}
              min={1}
              type="number"
              onChange={(event) => setOfferForm({ ...offerForm, pricePerCall: toNumber(event.target.value, 1) })}
            />
          </label>
          <label style={panelStyles.label}>
            描述
            <textarea
              style={{ ...panelStyles.input, minHeight: 88, resize: 'vertical' }}
              value={offerForm.description}
              onChange={(event) => setOfferForm({ ...offerForm, description: event.target.value })}
              placeholder="说明模型能力、延迟、输入格式"
            />
          </label>
          <button
            style={panelStyles.button}
            disabled={isBusy || !seller || !offerForm.modelName || !offerForm.endpoint || !offerForm.apiKey}
            onClick={createOffer}
          >
            上架售卖
          </button>
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>我的 API 商品</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {myOffers.length === 0 && <p style={panelStyles.muted}>还没有上架的 API。</p>}
          {myOffers.map((offer) => (
            <div key={offer.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
              <strong>{offer.modelName}</strong>
              <p style={panelStyles.muted}>{offer.description || offer.endpoint}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={panelStyles.badge}>{offer.pricePerCall} credits / call</span>
                <span style={panelStyles.badge}>
                  sales {offerStats.find((item) => item.offerId === offer.id)?.successfulCalls ?? 0} · earned{' '}
                  {offerStats.find((item) => item.offerId === offer.id)?.earnedCredits ?? 0}
                </span>
                <button
                  style={panelStyles.ghostButton}
                  disabled={isBusy}
                  onClick={() => updateOfferStatus(offer, offer.status === 'listed' ? 'draft' : 'listed')}
                >
                  {offer.status === 'listed' ? '下架' : '重新上架'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={panelStyles.grid}>
        {listedOffers.length === 0 && (
          <div style={panelStyles.card}>
            <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>市场暂无 API</h3>
            <p style={panelStyles.muted}>商家上架后，这里会从 Firebase 读取可订阅模型。</p>
          </div>
        )}
        {listedOffers.map((offer) => {
          const existingSubscription = subscriptionByOffer.get(offer.id);

          return (
            <div key={offer.id} style={panelStyles.card}>
              <span style={panelStyles.badge}>{offer.category}</span>
              <h3 style={{ margin: '14px 0 8px', fontSize: 20 }}>{offer.modelName}</h3>
              <p style={panelStyles.muted}>{offer.description || '商家暂未填写描述。'}</p>
              <p style={{ margin: '10px 0', color: '#fff' }}>{offer.sellerName}</p>
              <button
                style={existingSubscription ? panelStyles.ghostButton : panelStyles.button}
                disabled={isBusy || existingSubscription?.status === 'active'}
                onClick={() =>
                  existingSubscription
                    ? updateSubscriptionStatus(existingSubscription, 'active')
                    : subscribeOffer(offer)
                }
              >
                {existingSubscription?.status === 'active'
                  ? '已订阅'
                  : existingSubscription?.status === 'paused'
                    ? '恢复订阅'
                    : `${offer.pricePerCall} 积分/次 订阅`}
              </button>
            </div>
          );
        })}
      </div>

      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>我的订阅</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {subscriptions.length === 0 && <p style={panelStyles.muted}>还没有订阅任何模型。</p>}
          {subscriptions.map((subscription) => (
            <div key={subscription.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
              <strong>{subscription.modelName}</strong>
              <p style={panelStyles.muted}>
                {subscription.sellerName} · {subscription.pricePerCall} credits / call
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={panelStyles.badge}>{subscription.status}</span>
                <button
                  style={panelStyles.ghostButton}
                  disabled={isBusy}
                  onClick={() =>
                    updateSubscriptionStatus(subscription, subscription.status === 'active' ? 'paused' : 'active')
                  }
                >
                  {subscription.status === 'active' ? '暂停' : '恢复'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div style={panelStyles.grid}>
      <div style={panelStyles.card}>
        <span style={panelStyles.badge}>Firebase users/{currentUser?.uid}</span>
        <h3 style={{ margin: '14px 0 8px', fontSize: 28 }}>{wallet.credits} credits</h3>
        <p style={panelStyles.muted}>积分用于调用已订阅的商家模型。</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <button style={panelStyles.button} disabled={isBusy} onClick={() => addCredits(50)}>
            充值 50
          </button>
          <button style={panelStyles.ghostButton} disabled={isBusy} onClick={() => addCredits(200)}>
            充值 200
          </button>
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>平台 API Key</h3>
        <code style={{ display: 'block', wordBreak: 'break-all', color: '#c7f7e6' }}>
          {wallet.platformApiKey || '登录后自动生成'}
        </code>
        <button style={{ ...panelStyles.ghostButton, marginTop: 14 }} disabled={isBusy} onClick={rotatePlatformKey}>
          重新生成
        </button>
      </div>
    </div>
  );

  const renderCalls = () => (
    <div style={panelStyles.grid}>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>调用平台内 API</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={panelStyles.label}>
            已订阅模型
            <select
              style={panelStyles.input}
              value={callForm.modelName}
              onChange={(event) => setCallForm({ ...callForm, modelName: event.target.value })}
            >
              <option value="">选择模型</option>
              {subscriptions
                .filter((item) => item.status === 'active')
                .map((item) => (
                  <option key={item.id} value={item.modelName}>
                    {item.modelName}
                  </option>
                ))}
            </select>
          </label>
          <label style={panelStyles.label}>
            Prompt
            <textarea
              style={{ ...panelStyles.input, minHeight: 110, resize: 'vertical' }}
              value={callForm.prompt}
              onChange={(event) => setCallForm({ ...callForm, prompt: event.target.value })}
              placeholder="输入要发送给商家模型的请求"
            />
          </label>
          <button style={panelStyles.button} disabled={isBusy || !callForm.modelName || !callForm.prompt} onClick={callPlatformApi}>
            调用并扣减积分
          </button>
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>调用记录</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {callRecords.length === 0 && <p style={panelStyles.muted}>暂无调用记录。</p>}
          {callRecords.map((record) => (
            <div key={record.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
              <strong>{record.modelName}</strong>
              <p style={panelStyles.muted}>{record.responsePreview}</p>
              <span style={panelStyles.badge}>-{record.cost} credits · {record.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!currentUser) return renderGate();
    if (activeTab === 'seller') return renderSeller();
    if (activeTab === 'offers') return renderOffers();
    if (activeTab === 'market') return renderMarketplace();
    if (activeTab === 'wallet') return renderWallet();
    return renderCalls();
  };

  return (
    <>
      <button style={panelStyles.launcher} onClick={() => setOpen((value) => !value)}>
        Platform Console
      </button>
      {open && (
        <section style={panelStyles.panel} aria-label="Platform Console">
          <div style={panelStyles.header}>
            <div>
              <div style={{ ...panelStyles.badge, marginBottom: 10 }}>
                {currentUser ? `UID ${currentUser.uid.slice(0, 8)}` : '未登录'}
              </div>
              <h2 style={{ margin: 0, fontSize: 26 }}>BloomX 商家与订阅控制台</h2>
              <p style={{ ...panelStyles.muted, margin: '8px 0 0' }}>
                {currentUser ? currentUser.email || '已登录用户' : '登录后才会显示设置、钱包、订阅和控制台数据。'}
              </p>
            </div>
            <button style={panelStyles.ghostButton} onClick={() => setOpen(false)}>
              关闭
            </button>
          </div>

          {currentUser && (
            <nav style={panelStyles.tabs}>
              {[
                ['seller', '商家注册'],
                ['offers', 'API 上架'],
                ['market', '市场订阅'],
                ['wallet', '积分与密钥'],
                ['calls', '平台调用'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  style={{ ...panelStyles.tab, ...(activeTab === key ? panelStyles.activeTab : {}) }}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}

          <div style={panelStyles.content}>
            {authLoading && <p style={panelStyles.muted}>正在确认登录状态...</p>}
            {status && <p style={{ ...panelStyles.card, marginTop: 0 }}>{status}</p>}
            {currentUser && (
              <div style={{ ...panelStyles.grid, marginBottom: 16 }}>
                <div style={panelStyles.card}>
                  <span style={panelStyles.badge}>上架 API</span>
                  <h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{metrics.listedOffers}</h3>
                </div>
                <div style={panelStyles.card}>
                  <span style={panelStyles.badge}>订阅模型</span>
                  <h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{metrics.activeSubscriptions}</h3>
                </div>
                <div style={panelStyles.card}>
                  <span style={panelStyles.badge}>积分余额</span>
                  <h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{wallet.credits}</h3>
                </div>
                <div style={panelStyles.card}>
                  <span style={panelStyles.badge}>调用 / 消耗</span>
                  <h3 style={{ margin: '10px 0 0', fontSize: 26 }}>
                    {metrics.totalCalls} / {metrics.spentCredits}
                  </h3>
                </div>
                <div style={panelStyles.card}>
                  <span style={panelStyles.badge}>售卖 / 收入</span>
                  <h3 style={{ margin: '10px 0 0', fontSize: 26 }}>
                    {metrics.merchantCalls} / {metrics.earnedCredits}
                  </h3>
                </div>
              </div>
            )}
            {renderContent()}
          </div>
        </section>
      )}
    </>
  );
}

export default CommercePlatformRuntime;
