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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

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
  pricePerCall: number;
  description: string;
  status: 'draft' | 'listed';
  healthStatus?: 'untested' | 'verified' | 'failed';
  lastTestLatencyMs?: number;
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
  creditsBalance: number;
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

type MerchantApiTestPayload = {
  endpoint: string;
  authHeader: string;
  apiKey: string;
  modelName: string;
  prompt: string;
};

type MerchantApiTestResult = {
  success: boolean;
  merchantStatus: number;
  latencyMs: number;
  responsePreview: string;
};

const emptyOffer = {
  modelName: '',
  category: 'chat',
  endpoint: '',
  apiKey: '',
  authHeader: 'Authorization',
  pricePerCall: 1,
  description: '',
  testPrompt: 'Reply with exactly: BloomX API test passed.',
};

const copy = {
  zh: {
    launcher: '商家与订阅控制台',
    title: 'BloomX 商家与订阅控制台',
    subtitleSignedOut: '登录后才能管理商家入驻、API 上架、市场订阅、积分钱包和调用记录。',
    signedOut: '未登录',
    close: '关闭',
    signIn: '去登录',
    tabs: {
      seller: '商家入驻',
      offers: 'API 上架',
      market: '市场订阅',
      wallet: '积分与密钥',
      calls: '调用测试',
      settlement: '结算与售后',
    },
    metrics: {
      listed: '上架 API',
      subscriptions: '订阅模型',
      credits: '积分余额',
      calls: '调用 / 消耗',
      revenue: '售卖 / 收入',
    },
    seller: {
      title: '商家资料',
      name: '商家名称',
      email: '联系邮箱',
      type: '类型',
      payout: '结算方式',
      save: '保存到 Firebase',
      saved: '商家资料已写入 Firebase，等待平台审核后进入正式供应池。',
      independent: '独立开发者',
      company: '公司主体',
      lab: '研究团队',
      manual: '手动提现',
      monthly: '月结',
      boundary: '商家资料保存到 sellerProfiles，API 商品保存到 apiOffers，密钥只保存到 merchantApiSecrets。',
    },
    offer: {
      title: '上传并测试你的 API',
      needSeller: '请先提交商家资料，再上架 API。',
      modelName: '模型名称',
      endpoint: 'OpenAI 兼容 Base URL 或 /chat/completions URL',
      apiKey: '商家 API Key',
      price: '每次调用积分',
      description: '商品说明',
      testPrompt: '上架前测试 Prompt',
      test: '测试 API',
      publish: '测试通过并上架',
      testing: '正在测试商家 API...',
      testPassed: 'API 测试通过',
      testFailed: 'API 测试失败，不能上架。请检查 URL、Key、模型名或余额。',
      published: 'API 已通过测试并上架到 Firebase 市场。',
      mine: '我的 API 商品',
      empty: '还没有上架 API。',
      unlist: '下架',
      relist: '重新测试并上架',
    },
    market: {
      empty: '市场暂时没有可订阅 API。',
      subscribe: '订阅',
      subscribed: '已订阅',
      paused: '已暂停',
      resume: '恢复订阅',
      mine: '我的订阅',
      noSubscriptions: '还没有订阅任何模型。',
      subscribedMsg: '订阅已写入 Firebase，可在调用测试里使用。',
    },
    wallet: {
      credits: '积分余额',
      desc: '积分用于调用已订阅的商家模型。后续可接 Stripe/微信/支付宝真实充值。',
      topup50: '充值 50',
      topup200: '充值 200',
      key: '平台 API Key',
      rotate: '重新生成',
      keyUpdated: '平台 API Key 已更新并保存到 Firebase。',
      added: '积分已写入 Firebase 钱包。',
    },
    calls: {
      title: '真实调用已订阅 API',
      model: '已订阅模型',
      select: '选择模型',
      prompt: 'Prompt',
      run: '调用并扣减积分',
      needSubscription: '请先订阅要调用的模型。',
      insufficient: '积分不足，请先充值后再调用。',
      success: '商家 API 已跑通，调用记录与扣费已写入 Firebase。',
      failed: '这个商家 API 暂时跑不通，已自动退款。请换一个模型或联系售后。',
      noFunction: '缺少 VITE_INVOKE_MERCHANT_MODEL_URL，已阻止模拟扣费，请先配置线上 Functions URL。',
      records: '调用记录',
      empty: '暂无调用记录。',
    },
    settlement: {
      title: '结算与售后规则',
      body: '商家收入来自成功调用的 earnedCredits。失败调用会给用户自动退还积分；争议订单可由平台人工审核 apiCallRecords、apiOfferStats 与 merchantApiTestLogs。',
      monthly: '月结：达到约定账期后统一结算。',
      manual: '手动提现：达到最低余额后提交结算申请。',
      support: '售后：API 失败、质量异常、重复扣费都应保留调用记录并进入人工工单。',
    },
  },
  en: {
    launcher: 'Merchant & Subscription Console',
    title: 'BloomX Merchant & Subscription Console',
    subtitleSignedOut: 'Sign in to manage merchant onboarding, API listings, marketplace subscriptions, credits, and call records.',
    signedOut: 'Signed out',
    close: 'Close',
    signIn: 'Sign in',
    tabs: {
      seller: 'Merchant',
      offers: 'List API',
      market: 'Subscribe',
      wallet: 'Credits & Keys',
      calls: 'Call Test',
      settlement: 'Settlement',
    },
    metrics: {
      listed: 'Listed APIs',
      subscriptions: 'Subscriptions',
      credits: 'Credits',
      calls: 'Calls / Spend',
      revenue: 'Sales / Revenue',
    },
    seller: {
      title: 'Merchant profile',
      name: 'Merchant name',
      email: 'Contact email',
      type: 'Type',
      payout: 'Settlement mode',
      save: 'Save to Firebase',
      saved: 'Merchant profile saved to Firebase and is waiting for platform review.',
      independent: 'Independent developer',
      company: 'Company',
      lab: 'Research team',
      manual: 'Manual withdrawal',
      monthly: 'Monthly settlement',
      boundary: 'Profiles live in sellerProfiles, public API listings live in apiOffers, and secrets stay in merchantApiSecrets.',
    },
    offer: {
      title: 'Upload and test your API',
      needSeller: 'Submit your merchant profile before listing an API.',
      modelName: 'Model name',
      endpoint: 'OpenAI-compatible Base URL or /chat/completions URL',
      apiKey: 'Merchant API Key',
      price: 'Credits per call',
      description: 'Listing description',
      testPrompt: 'Pre-listing test prompt',
      test: 'Test API',
      publish: 'Test and publish',
      testing: 'Testing merchant API...',
      testPassed: 'API test passed',
      testFailed: 'API test failed. Check URL, key, model name, or merchant balance.',
      published: 'API passed testing and was listed to the Firebase marketplace.',
      mine: 'My API listings',
      empty: 'No API listings yet.',
      unlist: 'Unlist',
      relist: 'Retest and relist',
    },
    market: {
      empty: 'No API listings are available yet.',
      subscribe: 'Subscribe',
      subscribed: 'Subscribed',
      paused: 'Paused',
      resume: 'Resume',
      mine: 'My subscriptions',
      noSubscriptions: 'No subscriptions yet.',
      subscribedMsg: 'Subscription saved to Firebase. You can now test calls.',
    },
    wallet: {
      credits: 'Credit balance',
      desc: 'Credits pay for subscribed merchant model calls. Real checkout can be connected to Stripe or local payment providers.',
      topup50: 'Top up 50',
      topup200: 'Top up 200',
      key: 'Platform API Key',
      rotate: 'Rotate key',
      keyUpdated: 'Platform API key updated in Firebase.',
      added: 'Credits added to Firebase wallet.',
    },
    calls: {
      title: 'Run a subscribed API',
      model: 'Subscribed model',
      select: 'Select a model',
      prompt: 'Prompt',
      run: 'Call and deduct credits',
      needSubscription: 'Subscribe to a model first.',
      insufficient: 'Insufficient credits. Top up before calling.',
      success: 'Merchant API completed. Record and billing are saved to Firebase.',
      failed: 'This merchant API is not responding. Credits were refunded. Try another model or contact support.',
      noFunction: 'VITE_INVOKE_MERCHANT_MODEL_URL is missing. Mock billing is blocked until the production Function URL is configured.',
      records: 'Call records',
      empty: 'No call records yet.',
    },
    settlement: {
      title: 'Settlement and after-sales',
      body: 'Merchant revenue comes from successful earnedCredits. Failed calls refund users automatically; disputes can be reviewed from apiCallRecords, apiOfferStats, and merchantApiTestLogs.',
      monthly: 'Monthly: settle on the agreed billing cycle.',
      manual: 'Manual: request payout after reaching the minimum balance.',
      support: 'Support: API failures, quality issues, and duplicate charges should keep call evidence and enter manual review.',
    },
  },
};

const panelStyles: Record<string, CSSProperties> = {
  launcher: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 70,
    border: '1px solid rgba(183,255,225,0.26)',
    background: 'rgba(8, 20, 18, 0.92)',
    color: '#f4fff8',
    borderRadius: 999,
    padding: '13px 18px',
    fontWeight: 800,
    boxShadow: '0 20px 70px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(16px)',
    cursor: 'pointer',
  },
  panel: {
    position: 'fixed',
    right: 24,
    bottom: 84,
    width: 'min(1160px, calc(100vw - 48px))',
    maxHeight: 'calc(100vh - 118px)',
    overflow: 'auto',
    zIndex: 70,
    border: '1px solid rgba(183,255,225,0.18)',
    borderRadius: 18,
    background: 'linear-gradient(160deg, rgba(6,13,15,0.98), rgba(13,42,36,0.95))',
    color: '#eefcf6',
    boxShadow: '0 34px 120px rgba(0,0,0,0.58)',
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
    borderBottom: '1px solid rgba(255,255,255,0.11)',
    background: 'rgba(5, 14, 15, 0.82)',
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
    background: '#ecfff4',
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
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.065)',
    padding: 18,
  },
  input: {
    width: '100%',
    border: '1px solid rgba(183,255,225,0.2)',
    borderRadius: 10,
    padding: '12px 13px',
    background: 'rgba(6,18,18,0.78)',
    color: '#f7fff9',
    caretColor: '#b7ffe1',
    outline: 'none',
  },
  label: {
    display: 'grid',
    gap: 7,
    fontSize: 12,
    color: 'rgba(239,255,249,0.74)',
    fontWeight: 800,
  },
  button: {
    border: 0,
    borderRadius: 10,
    padding: '12px 15px',
    background: '#f3fff7',
    color: '#09201d',
    fontWeight: 900,
    cursor: 'pointer',
  },
  ghostButton: {
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 10,
    padding: '12px 15px',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontWeight: 800,
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
    background: 'rgba(246,129,57,0.16)',
    color: '#ffb27f',
    fontSize: 12,
    fontWeight: 900,
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
  const { i18n } = useTranslation();
  const language = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const c = copy[language];
  const authState = useAuth() as { currentUser?: AuthUser | null; user?: AuthUser | null; loading?: boolean };
  const currentUser = authState.currentUser ?? authState.user ?? null;
  const authLoading = Boolean(authState.loading);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('seller');
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet>({ creditsBalance: 0, platformApiKey: '' });
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
  const [callForm, setCallForm] = useState({ offerId: '', prompt: '' });
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [lastApiTest, setLastApiTest] = useState<MerchantApiTestResult | null>(null);

  const subscriptionByOffer = useMemo(() => {
    const next = new Map<string, Subscription>();
    subscriptions.forEach((item) => next.set(item.offerId, item));
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
    [myOffers, subscriptions, callRecords, offerStats],
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
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          role: 'buyer',
          credits_balance: 25,
          platformApiKey,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setWallet({ creditsBalance: 25, platformApiKey });
    } else {
      const data = userSnap.data();
      const platformApiKey = String(data.platformApiKey || makePlatformApiKey(user.uid));
      const creditsBalance = toNumber(data.credits_balance ?? data.credits, 0);

      if (!data.platformApiKey || data.credits_balance === undefined) {
        await setDoc(userRef, { platformApiKey, credits_balance: creditsBalance, updatedAt: serverTimestamp() }, { merge: true });
      }

      setWallet({ creditsBalance, platformApiKey });
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
      setSellerForm((prev) => ({ ...prev, contactEmail: user.email ?? prev.contactEmail }));
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

    const mapOffer = (item: { id: string; data: () => Record<string, unknown> }, defaultStatus: ApiOffer['status']) => {
      const data = item.data();
      return {
        id: item.id,
        ownerId: String(data.ownerId || ''),
        sellerName: String(data.sellerName || ''),
        modelName: String(data.modelName || ''),
        category: String(data.category || 'chat'),
        endpoint: String(data.endpoint || ''),
        authHeader: String(data.authHeader || 'Authorization'),
        pricePerCall: toNumber(data.pricePerCall, 1),
        description: String(data.description || ''),
        status: (data.status as ApiOffer['status']) || defaultStatus,
        healthStatus: (data.healthStatus as ApiOffer['healthStatus']) || 'untested',
        lastTestLatencyMs: toNumber(data.lastTestLatencyMs, 0),
      };
    };

    setMyOffers(ownOffersSnap.docs.map((item) => mapOffer(item, 'draft')));
    setListedOffers(listedOffersSnap.docs.map((item) => mapOffer(item, 'listed')));
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
      }),
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
      }),
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
      }),
    );
  };

  useEffect(() => {
    if (!currentUser) {
      setSeller(null);
      setWallet({ creditsBalance: 0, platformApiKey: '' });
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
        setStatus(language === 'zh' ? 'Firebase 数据读取失败，请检查登录状态和 Firestore 规则。' : 'Failed to read Firebase data. Check auth state and Firestore rules.');
      })
      .finally(() => setIsBusy(false));
  }, [currentUser?.uid, language]);

  const saveSellerProfile = async () => {
    if (!currentUser) return;
    setIsBusy(true);
    await setDoc(
      doc(db, 'sellerProfiles', currentUser.uid),
      {
        ownerId: currentUser.uid,
        sellerName: sellerForm.sellerName.trim(),
        contactEmail: sellerForm.contactEmail.trim(),
        companyType: sellerForm.companyType,
        payoutMode: sellerForm.payoutMode,
        status: 'pending',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
    setStatus(c.seller.saved);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const testMerchantApi = async () => {
    const functions = getFunctions();
    const callable = httpsCallable<MerchantApiTestPayload, MerchantApiTestResult>(functions, 'testMerchantApi');
    const result = await callable({
      endpoint: offerForm.endpoint.trim(),
      authHeader: offerForm.authHeader.trim() || 'Authorization',
      apiKey: offerForm.apiKey.trim(),
      modelName: offerForm.modelName.trim(),
      prompt: offerForm.testPrompt.trim() || emptyOffer.testPrompt,
    });
    setLastApiTest(result.data);
    return result.data;
  };

  const createOffer = async () => {
    if (!currentUser || !seller) return;
    setIsBusy(true);
    setStatus(c.offer.testing);

    try {
      const testResult = await testMerchantApi();
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
        healthStatus: 'verified',
        lastTestLatencyMs: testResult.latencyMs,
        lastTestAt: serverTimestamp(),
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
      setStatus(`${c.offer.published} ${c.offer.testPassed}: ${testResult.latencyMs}ms.`);
      await refreshFirebaseState(currentUser);
    } catch (error) {
      console.error(error);
      setStatus(c.offer.testFailed);
    } finally {
      setIsBusy(false);
    }
  };

  const subscribeOffer = async (offer: ApiOffer) => {
    if (!currentUser || subscriptionByOffer.has(offer.id)) return;
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
    setStatus(c.market.subscribedMsg);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const updateOfferStatus = async (offer: ApiOffer, nextStatus: ApiOffer['status']) => {
    if (!currentUser || offer.ownerId !== currentUser.uid) return;
    setIsBusy(true);
    await updateDoc(doc(db, 'apiOffers', offer.id), { status: nextStatus, updatedAt: serverTimestamp() });
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const updateSubscriptionStatus = async (subscription: Subscription, nextStatus: Subscription['status']) => {
    if (!currentUser || subscription.userId !== currentUser.uid) return;
    setIsBusy(true);
    await updateDoc(doc(db, 'subscriptions', subscription.id), { status: nextStatus, updatedAt: serverTimestamp() });
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const addCredits = async (amount: number) => {
    if (!currentUser) return;
    setIsBusy(true);
    await setDoc(doc(db, 'users', currentUser.uid), { credits_balance: increment(amount), updatedAt: serverTimestamp() }, { merge: true });
    setStatus(c.wallet.added);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const rotatePlatformKey = async () => {
    if (!currentUser) return;
    setIsBusy(true);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      platformApiKey: makePlatformApiKey(currentUser.uid),
      updatedAt: serverTimestamp(),
    });
    setStatus(c.wallet.keyUpdated);
    await refreshFirebaseState(currentUser);
    setIsBusy(false);
  };

  const callPlatformApi = async () => {
    if (!currentUser) return;
    const subscription = subscriptions.find((item) => item.offerId === callForm.offerId && item.status === 'active');
    if (!subscription) {
      setStatus(c.calls.needSubscription);
      return;
    }
    if (wallet.creditsBalance < subscription.pricePerCall) {
      setStatus(c.calls.insufficient);
      return;
    }

    const functionUrl = import.meta.env.VITE_INVOKE_MERCHANT_MODEL_URL;
    if (!functionUrl || !wallet.platformApiKey) {
      setStatus(c.calls.noFunction);
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wallet.platformApiKey}`,
        },
        body: JSON.stringify({ modelName: subscription.modelName, prompt: callForm.prompt }),
      });

      if (!response.ok) {
        setStatus(c.calls.failed);
      } else {
        setStatus(c.calls.success);
      }
      setCallForm({ offerId: subscription.offerId, prompt: '' });
      await refreshFirebaseState(currentUser);
    } catch (error) {
      console.error(error);
      setStatus(c.calls.failed);
    } finally {
      setIsBusy(false);
    }
  };

  const renderGate = () => (
    <div style={panelStyles.card}>
      <span style={panelStyles.badge}>{c.signedOut}</span>
      <h3 style={{ margin: '16px 0 8px', fontSize: 22 }}>{c.title}</h3>
      <p style={panelStyles.muted}>{c.subtitleSignedOut}</p>
      <button style={{ ...panelStyles.button, marginTop: 14 }} onClick={openAuthEntry}>
        {c.signIn}
      </button>
    </div>
  );

  const renderSeller = () => (
    <div style={panelStyles.grid}>
      <div style={panelStyles.card}>
        <span style={panelStyles.badge}>{seller ? seller.status : 'draft'}</span>
        <h3 style={{ margin: '14px 0 12px', fontSize: 20 }}>{c.seller.title}</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={panelStyles.label}>
            {c.seller.name}
            <input style={panelStyles.input} value={sellerForm.sellerName} onChange={(event) => setSellerForm({ ...sellerForm, sellerName: event.target.value })} placeholder="BloomX Verified Supplier" />
          </label>
          <label style={panelStyles.label}>
            {c.seller.email}
            <input style={panelStyles.input} value={sellerForm.contactEmail} onChange={(event) => setSellerForm({ ...sellerForm, contactEmail: event.target.value })} placeholder="seller@example.com" />
          </label>
          <label style={panelStyles.label}>
            {c.seller.type}
            <select style={panelStyles.input} value={sellerForm.companyType} onChange={(event) => setSellerForm({ ...sellerForm, companyType: event.target.value })}>
              <option value="independent">{c.seller.independent}</option>
              <option value="company">{c.seller.company}</option>
              <option value="lab">{c.seller.lab}</option>
            </select>
          </label>
          <label style={panelStyles.label}>
            {c.seller.payout}
            <select style={panelStyles.input} value={sellerForm.payoutMode} onChange={(event) => setSellerForm({ ...sellerForm, payoutMode: event.target.value })}>
              <option value="manual">{c.seller.manual}</option>
              <option value="monthly">{c.seller.monthly}</option>
            </select>
          </label>
          <button style={panelStyles.button} disabled={isBusy || !sellerForm.sellerName || !sellerForm.contactEmail} onClick={saveSellerProfile}>
            {c.seller.save}
          </button>
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{language === 'zh' ? '数据边界' : 'Data boundary'}</h3>
        <p style={panelStyles.muted}>{c.seller.boundary}</p>
      </div>
    </div>
  );

  const renderOffers = () => (
    <div style={panelStyles.grid}>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{c.offer.title}</h3>
        {!seller && <p style={panelStyles.muted}>{c.offer.needSeller}</p>}
        <div style={{ display: 'grid', gap: 12, opacity: seller ? 1 : 0.45 }}>
          <label style={panelStyles.label}>
            {c.offer.modelName}
            <input style={panelStyles.input} value={offerForm.modelName} onChange={(event) => setOfferForm({ ...offerForm, modelName: event.target.value })} placeholder="gpt-5.1 / claude-opus-4.5 / deepseek-chat" />
          </label>
          <label style={panelStyles.label}>
            {c.offer.endpoint}
            <input style={panelStyles.input} value={offerForm.endpoint} onChange={(event) => setOfferForm({ ...offerForm, endpoint: event.target.value })} placeholder="https://api.example.com/v1" />
          </label>
          <label style={panelStyles.label}>
            {c.offer.apiKey}
            <input style={panelStyles.input} value={offerForm.apiKey} onChange={(event) => setOfferForm({ ...offerForm, apiKey: event.target.value })} placeholder="Only stored in merchantApiSecrets" type="password" />
          </label>
          <label style={panelStyles.label}>
            {c.offer.price}
            <input style={panelStyles.input} value={offerForm.pricePerCall} min={1} type="number" onChange={(event) => setOfferForm({ ...offerForm, pricePerCall: toNumber(event.target.value, 1) })} />
          </label>
          <label style={panelStyles.label}>
            {c.offer.testPrompt}
            <input style={panelStyles.input} value={offerForm.testPrompt} onChange={(event) => setOfferForm({ ...offerForm, testPrompt: event.target.value })} />
          </label>
          <label style={panelStyles.label}>
            {c.offer.description}
            <textarea style={{ ...panelStyles.input, minHeight: 88, resize: 'vertical' }} value={offerForm.description} onChange={(event) => setOfferForm({ ...offerForm, description: event.target.value })} placeholder="Latency, context window, rate limit, refund policy..." />
          </label>
          <button style={panelStyles.button} disabled={isBusy || !seller || !offerForm.modelName || !offerForm.endpoint || !offerForm.apiKey} onClick={createOffer}>
            {c.offer.publish}
          </button>
          {lastApiTest && <p style={panelStyles.muted}>{c.offer.testPassed}: HTTP {lastApiTest.merchantStatus}, {lastApiTest.latencyMs}ms</p>}
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{c.offer.mine}</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {myOffers.length === 0 && <p style={panelStyles.muted}>{c.offer.empty}</p>}
          {myOffers.map((offer) => {
            const stats = offerStats.find((item) => item.offerId === offer.id);
            return (
              <div key={offer.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
                <strong>{offer.modelName}</strong>
                <p style={panelStyles.muted}>{offer.description || offer.endpoint}</p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={panelStyles.badge}>{offer.pricePerCall} credits / call</span>
                  <span style={panelStyles.badge}>{offer.healthStatus || 'untested'} {offer.lastTestLatencyMs ? `${offer.lastTestLatencyMs}ms` : ''}</span>
                  <span style={panelStyles.badge}>{stats?.successfulCalls ?? 0} calls / {stats?.earnedCredits ?? 0} credits</span>
                  <button style={panelStyles.ghostButton} disabled={isBusy} onClick={() => updateOfferStatus(offer, offer.status === 'listed' ? 'draft' : 'listed')}>
                    {offer.status === 'listed' ? c.offer.unlist : c.offer.relist}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={panelStyles.grid}>
        {listedOffers.length === 0 && (
          <div style={panelStyles.card}>
            <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{c.market.empty}</h3>
          </div>
        )}
        {listedOffers.map((offer) => {
          const existingSubscription = subscriptionByOffer.get(offer.id);
          return (
            <div key={offer.id} style={panelStyles.card}>
              <span style={panelStyles.badge}>{offer.healthStatus || offer.category}</span>
              <h3 style={{ margin: '14px 0 8px', fontSize: 20 }}>{offer.modelName}</h3>
              <p style={panelStyles.muted}>{offer.description || offer.endpoint}</p>
              <p style={{ margin: '10px 0', color: '#fff' }}>{offer.sellerName}</p>
              <button style={existingSubscription ? panelStyles.ghostButton : panelStyles.button} disabled={isBusy || existingSubscription?.status === 'active'} onClick={() => existingSubscription ? updateSubscriptionStatus(existingSubscription, 'active') : subscribeOffer(offer)}>
                {existingSubscription?.status === 'active' ? c.market.subscribed : existingSubscription?.status === 'paused' ? c.market.resume : `${offer.pricePerCall} credits / call ${c.market.subscribe}`}
              </button>
            </div>
          );
        })}
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{c.market.mine}</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {subscriptions.length === 0 && <p style={panelStyles.muted}>{c.market.noSubscriptions}</p>}
          {subscriptions.map((subscription) => (
            <div key={subscription.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
              <strong>{subscription.modelName}</strong>
              <p style={panelStyles.muted}>{subscription.sellerName} / {subscription.pricePerCall} credits</p>
              <button style={panelStyles.ghostButton} disabled={isBusy} onClick={() => updateSubscriptionStatus(subscription, subscription.status === 'active' ? 'paused' : 'active')}>
                {subscription.status === 'active' ? c.market.paused : c.market.resume}
              </button>
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
        <h3 style={{ margin: '14px 0 8px', fontSize: 28 }}>{wallet.creditsBalance} credits</h3>
        <p style={panelStyles.muted}>{c.wallet.desc}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <button style={panelStyles.button} disabled={isBusy} onClick={() => addCredits(50)}>{c.wallet.topup50}</button>
          <button style={panelStyles.ghostButton} disabled={isBusy} onClick={() => addCredits(200)}>{c.wallet.topup200}</button>
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{c.wallet.key}</h3>
        <code style={{ display: 'block', wordBreak: 'break-all', color: '#c7f7e6' }}>{wallet.platformApiKey || '-'}</code>
        <button style={{ ...panelStyles.ghostButton, marginTop: 14 }} disabled={isBusy} onClick={rotatePlatformKey}>{c.wallet.rotate}</button>
      </div>
    </div>
  );

  const renderCalls = () => (
    <div style={panelStyles.grid}>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{c.calls.title}</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={panelStyles.label}>
            {c.calls.model}
            <select style={panelStyles.input} value={callForm.offerId} onChange={(event) => setCallForm({ ...callForm, offerId: event.target.value })}>
              <option value="">{c.calls.select}</option>
              {subscriptions.filter((item) => item.status === 'active').map((item) => (
                <option key={item.id} value={item.offerId}>{item.modelName}</option>
              ))}
            </select>
          </label>
          <label style={panelStyles.label}>
            {c.calls.prompt}
            <textarea style={{ ...panelStyles.input, minHeight: 110, resize: 'vertical' }} value={callForm.prompt} onChange={(event) => setCallForm({ ...callForm, prompt: event.target.value })} />
          </label>
          <button style={panelStyles.button} disabled={isBusy || !callForm.offerId || !callForm.prompt} onClick={callPlatformApi}>{c.calls.run}</button>
        </div>
      </div>
      <div style={panelStyles.card}>
        <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{c.calls.records}</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {callRecords.length === 0 && <p style={panelStyles.muted}>{c.calls.empty}</p>}
          {callRecords.map((record) => (
            <div key={record.id} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
              <strong>{record.modelName}</strong>
              <p style={panelStyles.muted}>{record.responsePreview}</p>
              <span style={panelStyles.badge}>-{record.cost} credits / {record.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettlement = () => (
    <div style={panelStyles.card}>
      <h3 style={{ margin: '0 0 12px', fontSize: 22 }}>{c.settlement.title}</h3>
      <p style={panelStyles.muted}>{c.settlement.body}</p>
      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        <span style={panelStyles.badge}>{c.settlement.monthly}</span>
        <span style={panelStyles.badge}>{c.settlement.manual}</span>
        <span style={panelStyles.badge}>{c.settlement.support}</span>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!currentUser) return renderGate();
    if (activeTab === 'seller') return renderSeller();
    if (activeTab === 'offers') return renderOffers();
    if (activeTab === 'market') return renderMarketplace();
    if (activeTab === 'wallet') return renderWallet();
    if (activeTab === 'calls') return renderCalls();
    return renderSettlement();
  };

  return (
    <>
      <button style={panelStyles.launcher} onClick={() => setOpen((value) => !value)}>
        {c.launcher}
      </button>
      {open && (
        <section style={panelStyles.panel} aria-label={c.launcher}>
          <div style={panelStyles.header}>
            <div>
              <div style={{ ...panelStyles.badge, marginBottom: 10 }}>
                {currentUser ? `UID ${currentUser.uid.slice(0, 8)}` : c.signedOut}
              </div>
              <h2 style={{ margin: 0, fontSize: 26 }}>{c.title}</h2>
              <p style={{ ...panelStyles.muted, margin: '8px 0 0' }}>
                {currentUser ? currentUser.email || currentUser.displayName : c.subtitleSignedOut}
              </p>
            </div>
            <button style={panelStyles.ghostButton} onClick={() => setOpen(false)}>{c.close}</button>
          </div>

          {currentUser && (
            <nav style={panelStyles.tabs}>
              {Object.entries(c.tabs).map(([key, label]) => (
                <button key={key} style={{ ...panelStyles.tab, ...(activeTab === key ? panelStyles.activeTab : {}) }} onClick={() => setActiveTab(key)}>
                  {label}
                </button>
              ))}
            </nav>
          )}

          <div style={panelStyles.content}>
            {authLoading && <p style={panelStyles.muted}>{language === 'zh' ? '正在确认登录状态...' : 'Checking auth state...'}</p>}
            {status && <p style={{ ...panelStyles.card, marginTop: 0 }}>{status}</p>}
            {currentUser && (
              <div style={{ ...panelStyles.grid, marginBottom: 16 }}>
                <div style={panelStyles.card}><span style={panelStyles.badge}>{c.metrics.listed}</span><h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{metrics.listedOffers}</h3></div>
                <div style={panelStyles.card}><span style={panelStyles.badge}>{c.metrics.subscriptions}</span><h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{metrics.activeSubscriptions}</h3></div>
                <div style={panelStyles.card}><span style={panelStyles.badge}>{c.metrics.credits}</span><h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{wallet.creditsBalance}</h3></div>
                <div style={panelStyles.card}><span style={panelStyles.badge}>{c.metrics.calls}</span><h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{metrics.totalCalls} / {metrics.spentCredits}</h3></div>
                <div style={panelStyles.card}><span style={panelStyles.badge}>{c.metrics.revenue}</span><h3 style={{ margin: '10px 0 0', fontSize: 26 }}>{metrics.merchantCalls} / {metrics.earnedCredits}</h3></div>
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
