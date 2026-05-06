import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PauseCircle,
  PlayCircle,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  toggleApiKey,
  updateApiKeyName,
  type ApiKey,
} from '../services/apiKeyService';
import {
  closeStripeCheckoutWindow,
  createStripeCheckout,
  createStripePortalSession,
  navigateStripeCheckoutWindow,
  openStripeCheckoutWindow,
  type CreditPlanId,
} from '../services/checkoutService';

interface DashboardProps {
  onLogout: () => void;
}

type DashboardTab = 'overview' | 'keys' | 'purchases' | 'usage' | 'billing' | 'settings';

type Notice = {
  type: 'success' | 'error' | 'info';
  message: string;
};

const copy = {
  zh: {
    workspace: '个人工作台',
    subtitle: '管理订阅、积分、API Key、账单和通知。',
    ready: '账户可用',
    topUp: '充值积分',
    credits: '可用积分',
    seller: '商家工作台',
    signOut: '退出登录',
    overview: '概览',
    keys: 'API Key',
    purchases: '我的订阅',
    usage: '用量',
    billing: '账单',
    settings: '设置',
    browse: '浏览市场',
    viewPurchases: '查看订阅',
    docs: '接入说明',
    usageLoop: '调用闭环',
    loopDesc: '订阅模型、创建 Key、发起调用、查看消费记录，保持一条清晰链路。',
    account: '当前账户',
    quickIntegration: 'OpenAI 兼容调用',
    integrationDesc: '使用统一平台 Key 调用已订阅模型，避免暴露商家密钥。',
    activeKeys: '可用 Key',
    serviceHealth: '服务状态',
    normal: '正常',
    createKey: '创建 API Key',
    keyName: 'Key 名称',
    keyNamePlaceholder: '例如：Production、Staging、Backend service',
    create: '创建',
    creating: '创建中...',
    cancel: '取消',
    secretOnce: '完整 Key 只显示一次',
    secretDesc: '请立即保存。关闭提示后，只能看到掩码，无法再次查看完整 Key。',
    keyWarning: '不要把 API Key 放进前端代码、公开仓库或公开文档。',
    noKeys: '还没有 API Key',
    noKeysDesc: '创建一个可命名的 Key 后，就能用标准 API 方式调用已订阅模型。',
    created: '创建时间',
    lastUsed: '最后使用',
    name: '名称',
    key: '密钥',
    status: '状态',
    actions: '操作',
    never: '从未',
    save: '保存',
    activate: '启用',
    pause: '停用',
    active: '可用',
    paused: '已停用',
    deleteKey: '删除 Key',
    deleteTitle: '删除这个 API Key？',
    deleteDesc: '删除后，使用该 Key 的服务会立即失效。此操作不可撤销。',
    keyCreated: 'API Key 已创建并保存。',
    keyCreateFailed: '创建失败，请稍后重试。',
    keyUpdated: '名称已保存。',
    keyUpdateFailed: '保存名称失败，请稍后重试。',
    keyStatusUpdated: 'Key 状态已更新。',
    keyStatusFailed: '状态更新失败，请稍后重试。',
    keyDeleted: 'API Key 已删除。',
    keyDeleteFailed: '删除失败，请稍后重试。',
    copied: '已复制。',
    copyFailed: '复制失败，请手动选择文本。',
    purchaseTitle: '订阅管理',
    purchaseDesc: '查看已订阅模型、端点、有效期和接入说明。',
    usageTitle: '用量与退款',
    usageDesc: '成功调用消耗积分，失败调用自动退款，并保留可追溯的服务记录。',
    billingTitle: '积分账单',
    billingDesc: '充值后的积分会进入账户余额，用于调用已订阅模型。',
    checkoutPrepared: '结账入口已准备好，接入支付后即可正式使用。',
    checkoutOpening: '正在打开 Stripe 支付',
    checkoutFailed: 'Stripe 支付入口打开失败，请稍后重试。',
    manageBilling: '管理 Stripe 账单',
    managingBilling: '正在打开账单',
    portalDesc: '查看 Stripe 账单、付款方式和收据。退款和争议仍需管理员复核。',
    portalNotReady: '还没有可管理的 Stripe 账单，请先完成一次积分购买。',
    portalFailed: 'Stripe 账单入口打开失败，请稍后重试。',
    settingsTitle: '账户资料',
    settingsDesc: '管理邮箱、账户类型和通知偏好。',
    savePrepared: '资料保存入口已准备好。',
    notifications: '通知偏好',
  },
  en: {
    workspace: 'Personal workspace',
    subtitle: 'Manage subscriptions, credits, API keys, billing, and notifications.',
    ready: 'Account ready',
    topUp: 'Top up credits',
    credits: 'Available credits',
    seller: 'Seller dashboard',
    signOut: 'Sign out',
    overview: 'Overview',
    keys: 'API Keys',
    purchases: 'Subscriptions',
    usage: 'Usage',
    billing: 'Billing',
    settings: 'Settings',
    browse: 'Browse marketplace',
    viewPurchases: 'View subscriptions',
    docs: 'Integration notes',
    usageLoop: 'Call loop',
    loopDesc: 'Subscribe to models, create keys, call APIs, and review spend in one clear path.',
    account: 'Current account',
    quickIntegration: 'OpenAI-compatible call',
    integrationDesc: 'Use one platform key to call subscribed models without exposing merchant secrets.',
    activeKeys: 'Active keys',
    serviceHealth: 'Service status',
    normal: 'Normal',
    createKey: 'Create API key',
    keyName: 'Key name',
    keyNamePlaceholder: 'For example: Production, Staging, Backend service',
    create: 'Create',
    creating: 'Creating...',
    cancel: 'Cancel',
    secretOnce: 'Full key is shown only once',
    secretDesc: 'Save it now. After closing this message, only the masked key will remain visible.',
    keyWarning: 'Do not put API keys in frontend code, public repositories, or public docs.',
    noKeys: 'No API keys yet',
    noKeysDesc: 'Create a named key to call subscribed models with a standard API flow.',
    created: 'Created',
    lastUsed: 'Last used',
    name: 'Name',
    key: 'Key',
    status: 'Status',
    actions: 'Actions',
    never: 'Never',
    save: 'Save',
    activate: 'Enable',
    pause: 'Disable',
    active: 'Active',
    paused: 'Disabled',
    deleteKey: 'Delete key',
    deleteTitle: 'Delete this API key?',
    deleteDesc: 'Services using this key will stop working immediately. This cannot be undone.',
    keyCreated: 'API key created and saved.',
    keyCreateFailed: 'Failed to create key. Please try again later.',
    keyUpdated: 'Name saved.',
    keyUpdateFailed: 'Failed to save name. Please try again later.',
    keyStatusUpdated: 'Key status updated.',
    keyStatusFailed: 'Failed to update status. Please try again later.',
    keyDeleted: 'API key deleted.',
    keyDeleteFailed: 'Failed to delete key. Please try again later.',
    copied: 'Copied.',
    copyFailed: 'Copy failed. Please select the text manually.',
    purchaseTitle: 'Subscription management',
    purchaseDesc: 'Review subscribed models, endpoints, expiry, and integration notes.',
    usageTitle: 'Usage and refunds',
    usageDesc: 'Successful calls spend credits, failed calls refund automatically, and service records remain traceable.',
    billingTitle: 'Credit billing',
    billingDesc: 'Top-ups add credits to your balance for subscribed model calls.',
    checkoutPrepared: 'Checkout is prepared and can be enabled after payment provider connection.',
    checkoutOpening: 'Opening Stripe Checkout',
    checkoutFailed: 'Failed to open Stripe Checkout. Please try again later.',
    manageBilling: 'Manage Stripe billing',
    managingBilling: 'Opening billing',
    portalDesc: 'Review Stripe invoices, payment methods, and receipts. Refunds and disputes still require admin review.',
    portalNotReady: 'No manageable Stripe billing record yet. Complete one credit purchase first.',
    portalFailed: 'Failed to open Stripe billing. Please try again later.',
    settingsTitle: 'Account details',
    settingsDesc: 'Manage email, account type, and notification preferences.',
    savePrepared: 'Profile saving is prepared.',
    notifications: 'Notification preferences',
  },
} as const;

const codeSample = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-bloomx-live-...",
  baseURL: "https://api.bloomx.io/v1"
});

await client.chat.completions.create({
  model: "merchant-model-id",
  messages: [{ role: "user", content: "Hello" }]
});`;

const tabIcons = {
  overview: LayoutDashboard,
  keys: KeyRound,
  purchases: ShoppingBag,
  usage: Activity,
  billing: CreditCard,
  settings: Settings,
} satisfies Record<DashboardTab, typeof LayoutDashboard>;

const Dashboard = ({ onLogout }: DashboardProps) => {
  const { currentUser, userProfile } = useAuth();
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith('zh');
  const c = zh ? copy.zh : copy.en;
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<ApiKey | null>(null);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [openingPortal, setOpeningPortal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<CreditPlanId | null>(null);

  const navItems = useMemo(
    () => [
      { id: 'overview' as const, label: c.overview },
      { id: 'keys' as const, label: c.keys },
      { id: 'purchases' as const, label: c.purchases },
      { id: 'usage' as const, label: c.usage },
      { id: 'billing' as const, label: c.billing },
      { id: 'settings' as const, label: c.settings },
    ],
    [c],
  );

  const balance = Number(userProfile?.credits ?? 0);
  const activeKeyCount = apiKeys.filter((key) => key.is_active).length;
  const accountName = currentUser?.email?.split('@')[0] || (zh ? '用户' : 'User');

  const accountCards = [
    {
      label: c.credits,
      value: balance.toFixed(2),
      note: zh ? '用于调用已订阅模型' : 'Used for subscribed model calls',
      icon: CreditCard,
    },
    {
      label: c.activeKeys,
      value: String(activeKeyCount),
      note: zh ? '可按用途或环境命名' : 'Name keys by purpose or environment',
      icon: KeyRound,
    },
    {
      label: c.serviceHealth,
      value: c.normal,
      note: zh ? '调用、账单与退款可追溯' : 'Calls, billing, and refunds are traceable',
      icon: ShieldCheck,
    },
  ];

  const creditPlans = [
    {
      id: 'starter' as const,
      name: zh ? '入门版' : 'Starter',
      price: '$10',
      credits: zh ? '1,000 平台积分' : '1,000 credits',
    },
    {
      id: 'creator' as const,
      name: zh ? '创作者版' : 'Creator',
      price: '$100',
      credits: zh ? '12,000 平台积分 · 20% 奖励' : '12,000 credits · 20% bonus',
    },
    {
      id: 'pro' as const,
      name: zh ? '专业版' : 'Pro',
      price: '$500',
      credits: zh ? '60,000 平台积分 · 20% 奖励' : '60,000 credits · 20% bonus',
    },
  ];

  useEffect(() => {
    if (!currentUser) return;
    if (activeTab !== 'keys' && apiKeys.length > 0) return;
    void loadKeys();
  }, [activeTab, currentUser]);

  const loadKeys = async () => {
    if (!currentUser) return;
    setLoadingKeys(true);
    try {
      const keys = await listApiKeys(currentUser.uid);
      setApiKeys(keys);
      setEditingNames(Object.fromEntries(keys.map((key) => [key.id, key.name])));
    } catch (error) {
      console.error('Failed to load API keys:', error);
      showNotice({ type: 'error', message: zh ? 'API Key 加载失败。' : 'Failed to load API keys.' });
    } finally {
      setLoadingKeys(false);
    }
  };

  const showNotice = (nextNotice: Notice) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const handleCreateKey = async () => {
    if (!currentUser) return;
    setCreatingKey(true);
    try {
      const { fullKey, record } = await createApiKey(currentUser.uid, newKeyName);
      setNewKeyFull(fullKey);
      setApiKeys((prev) => [record, ...prev]);
      setEditingNames((prev) => ({ ...prev, [record.id]: record.name }));
      setNewKeyName('');
      setShowCreateKey(false);
      setActiveTab('keys');
      showNotice({ type: 'success', message: c.keyCreated });
    } catch (error) {
      console.error('Failed to create API key:', error);
      showNotice({ type: 'error', message: c.keyCreateFailed });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleSaveName = async (key: ApiKey) => {
    if (!currentUser) return;
    const nextName = editingNames[key.id]?.trim() || key.name;
    try {
      await updateApiKeyName(currentUser.uid, key.id, nextName);
      setApiKeys((prev) => prev.map((item) => (item.id === key.id ? { ...item, name: nextName } : item)));
      showNotice({ type: 'success', message: c.keyUpdated });
    } catch (error) {
      console.error('Failed to update API key name:', error);
      showNotice({ type: 'error', message: c.keyUpdateFailed });
    }
  };

  const handleToggleKey = async (key: ApiKey) => {
    if (!currentUser) return;
    const nextActive = !key.is_active;
    try {
      await toggleApiKey(currentUser.uid, key.id, nextActive);
      setApiKeys((prev) => prev.map((item) => (item.id === key.id ? { ...item, is_active: nextActive } : item)));
      showNotice({ type: 'success', message: c.keyStatusUpdated });
    } catch (error) {
      console.error('Failed to update API key status:', error);
      showNotice({ type: 'error', message: c.keyStatusFailed });
    }
  };

  const confirmDeleteKey = async () => {
    if (!currentUser || !pendingDeleteKey) return;
    const keyId = pendingDeleteKey.id;
    setPendingDeleteKey(null);
    try {
      await deleteApiKey(currentUser.uid, keyId);
      setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
      showNotice({ type: 'success', message: c.keyDeleted });
    } catch (error) {
      console.error('Failed to delete API key:', error);
      showNotice({ type: 'error', message: c.keyDeleteFailed });
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotice({ type: 'success', message: c.copied });
    } catch {
      showNotice({ type: 'error', message: c.copyFailed });
    }
  };

  const handleOpenStripePortal = async () => {
    if (!currentUser) {
      showNotice({ type: 'error', message: zh ? '请先登录后再管理账单。' : 'Please sign in before managing billing.' });
      return;
    }

    setOpeningPortal(true);
    try {
      const portal = await createStripePortalSession();
      window.location.assign(portal.portalUrl);
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : c.portalFailed;
      showNotice({
        type: 'error',
        message: /customer|账单记录|failed-precondition/i.test(message) ? c.portalNotReady : message,
      });
      setOpeningPortal(false);
    }
  };

  const handleCreditCheckout = async (planId: CreditPlanId) => {
    if (!currentUser) {
      showNotice({ type: 'error', message: zh ? '请先登录后再购买积分。' : 'Please sign in before buying credits.' });
      return;
    }

    const checkoutWindow = openStripeCheckoutWindow(planId);
    setCheckoutPlan(planId);
    try {
      const checkout = await createStripeCheckout(planId);
      navigateStripeCheckoutWindow(checkoutWindow, checkout.checkoutUrl);
      showNotice({ type: 'info', message: zh ? 'Stripe 支付窗口已打开，支付成功后积分会自动入账。' : 'Stripe Checkout is open. Credits will be added after successful payment.' });
    } catch (error) {
      closeStripeCheckoutWindow(checkoutWindow);
      console.error('Failed to open Stripe checkout:', error);
      showNotice({
        type: 'error',
        message: error instanceof Error && error.message ? error.message : c.checkoutFailed,
      });
    } finally {
      setCheckoutPlan(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return c.never;
    return new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const renderNavButton = (item: (typeof navItems)[number]) => {
    const Icon = tabIcons[item.id];
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          active
            ? 'bg-[#d76f37] text-[#100806] shadow-[0_14px_34px_rgba(215,111,55,0.24)]'
            : 'text-white/62 hover:bg-white/7 hover:text-white'
        }`}
      >
        <Icon size={18} />
        <span className="whitespace-nowrap">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b0d] text-white">
      {notice && (
        <div className="motion-modal fixed right-5 top-5 z-50 max-w-sm rounded-xl border border-white/12 bg-[#111819]/95 px-4 py-3 text-sm shadow-2xl backdrop-blur">
          <div className="flex items-start gap-3">
            {notice.type === 'success' ? <Check size={18} className="mt-0.5 text-[#6fcf97]" /> : <AlertTriangle size={18} className="mt-0.5 text-[#f2b36d]" />}
            <span className="text-white/86">{notice.message}</span>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-white/10 bg-[#091011]/86 p-5 backdrop-blur-xl lg:flex">
          <div>
            <Link to="/" className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d76f37] font-bold text-[#100806]">B</div>
              <div>
                <div className="text-lg font-semibold tracking-tight">BloomX</div>
                <div className="text-xs text-white/42">{c.workspace}</div>
              </div>
            </Link>
            <nav className="space-y-1">{navItems.map(renderNavButton)}</nav>
          </div>

          <div className="space-y-3">
            <Link to="/seller/dashboard" className="flex min-h-11 items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/72 transition hover:border-[#d76f37]/50 hover:text-white">
              <span>{c.seller}</span>
              <ChevronRight size={16} />
            </Link>
            <button onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/58 transition hover:bg-white/7 hover:text-white">
              <LogOut size={18} />
              {c.signOut}
            </button>
          </div>
        </aside>

        <main className="w-full flex-1 overflow-y-auto">
          <div className="border-b border-white/10 bg-[#070b0d]/82 px-4 py-4 backdrop-blur lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d76f37] font-bold text-[#100806]">B</div>
                <span className="font-semibold">BloomX</span>
              </Link>
              <button onClick={onLogout} className="rounded-lg border border-white/10 p-2 text-white/70">
                <LogOut size={18} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">{navItems.map(renderNavButton)}</div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
            <header className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2f6f5e]/40 bg-[#2f6f5e]/12 px-3 py-1 text-xs font-medium text-[#9be2c8]">
                  <ShieldCheck size={14} />
                  {c.ready}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{navItems.find((item) => item.id === activeTab)?.label}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{c.subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-xs uppercase tracking-widest text-white/40">{c.credits}</div>
                  <div className="font-mono text-xl font-medium">{balance.toFixed(2)}</div>
                </div>
                <button onClick={() => setActiveTab('billing')} className="min-h-11 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#070b0d] transition hover:bg-white/88">
                  {c.topUp}
                </button>
              </div>
            </header>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                  {accountCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="motion-card rounded-xl border border-white/10 bg-white/[0.045] p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-xs uppercase tracking-widest text-white/42">{card.label}</span>
                          <Icon size={18} className="text-[#d76f37]" />
                        </div>
                        <div className="number-pop text-3xl font-semibold">{card.value}</div>
                        <div className="mt-2 text-sm text-white/50">{card.note}</div>
                      </div>
                    );
                  })}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">{c.usageLoop}</h2>
                        <p className="mt-1 text-sm leading-6 text-white/52">{c.loopDesc}</p>
                      </div>
                      <Link to="/marketplace" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/72 hover:border-[#d76f37]/50 hover:text-white">
                        {c.browse}
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        zh ? '选择已验证模型' : 'Choose a verified model',
                        zh ? '创建命名 API Key' : 'Create a named API key',
                        zh ? '按调用消耗积分' : 'Spend credits by call',
                      ].map((item, index) => (
                        <div key={item} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[#d76f37]/16 text-sm font-semibold text-[#f2b36d]">{index + 1}</div>
                          <p className="text-sm leading-6 text-white/72">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-6">
                    <h2 className="text-xl font-semibold">{c.account}</h2>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-lg font-bold text-[#070b0d]">{accountName.slice(0, 1).toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{accountName}</div>
                        <div className="truncate text-sm text-white/48">{currentUser?.email || ''}</div>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Link to="/my-purchases" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white/74 hover:text-white">
                        <ShoppingBag size={16} />
                        {c.viewPurchases}
                      </Link>
                      <Link to="/seller/dashboard" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white/74 hover:text-white">
                        <ReceiptText size={16} />
                        {c.seller}
                      </Link>
                    </div>
                  </div>
                </section>

                <section className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{c.quickIntegration}</h2>
                      <p className="mt-1 text-sm text-white/52">{c.integrationDesc}</p>
                    </div>
                    <Link to="/marketplace" className="hidden min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:text-white sm:inline-flex">
                      {c.docs}
                    </Link>
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#050808] p-4 font-mono text-[12px] leading-6 text-white/82">{codeSample}</pre>
                </section>
              </div>
            )}

            {activeTab === 'keys' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-2xl text-sm leading-6 text-white/58">{c.noKeysDesc}</p>
                  <button onClick={() => setShowCreateKey(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#070b0d] transition hover:bg-white/88">
                    <Plus size={16} />
                    {c.createKey}
                  </button>
                </div>

                {newKeyFull && (
                  <div className="motion-panel rounded-xl border border-[#2f6f5e]/45 bg-[#2f6f5e]/10 p-5">
                    <div className="mb-4 flex items-start gap-3">
                      <Check size={20} className="mt-0.5 text-[#9be2c8]" />
                      <div>
                        <h3 className="font-semibold">{c.secretOnce}</h3>
                        <p className="mt-1 text-sm text-white/58">{c.secretDesc}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#050808]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <code className="break-all font-mono text-sm text-white/86">{newKeyFull}</code>
                      <button onClick={() => void handleCopy(newKeyFull)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/76 hover:text-white">
                        <Copy size={16} />
                        {c.copied}
                      </button>
                    </div>
                  </div>
                )}

                {loadingKeys ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] py-14 text-center text-white/50">{zh ? '正在加载...' : 'Loading...'}</div>
                ) : apiKeys.length === 0 ? (
                  <div className="motion-panel rounded-xl border border-white/10 bg-white/[0.035] p-12 text-center">
                    <KeyRound size={44} className="mx-auto mb-4 text-white/26" />
                    <h3 className="mb-2 text-xl font-semibold">{c.noKeys}</h3>
                    <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-white/52">{c.noKeysDesc}</p>
                    <button onClick={() => setShowCreateKey(true)} className="min-h-11 rounded-lg bg-white px-5 text-sm font-semibold text-[#070b0d]">
                      {c.createKey}
                    </button>
                  </div>
                ) : (
                  <div className="motion-panel overflow-hidden rounded-xl border border-white/10 bg-[#0b1213]/86">
                    <div className="hidden grid-cols-[1.05fr_1.1fr_0.7fr_0.7fr_0.55fr_0.9fr] gap-4 border-b border-white/10 bg-white/[0.04] px-5 py-3 text-xs uppercase tracking-widest text-white/42 md:grid">
                      <span>{c.name}</span>
                      <span>{c.key}</span>
                      <span>{c.created}</span>
                      <span>{c.lastUsed}</span>
                      <span>{c.status}</span>
                      <span>{c.actions}</span>
                    </div>
                    <div className="divide-y divide-white/8">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="grid gap-3 px-5 py-4 text-sm text-white/72 md:grid-cols-[1.05fr_1.1fr_0.7fr_0.7fr_0.55fr_0.9fr] md:items-center">
                          <div className="flex gap-2">
                            <span className={`mt-3 h-2 w-2 shrink-0 rounded-full ${key.is_active ? 'bg-[#6fcf97]' : 'bg-white/28'}`} />
                            <input
                              value={editingNames[key.id] ?? key.name}
                              onChange={(event) => setEditingNames((prev) => ({ ...prev, [key.id]: event.target.value }))}
                              className="min-h-10 w-full rounded-lg border border-white/10 bg-[#050808] px-3 text-white focus:border-[#d76f37]/60 focus:outline-none"
                            />
                          </div>
                          <code className="break-all font-mono text-white/84">{key.key_prefix}{key.key_suffix ? key.key_suffix : ''}</code>
                          <span>{formatDate(key.createdAt)}</span>
                          <span>{formatDate(key.last_used)}</span>
                          <span className={`w-fit rounded-full px-2 py-1 text-xs ${key.is_active ? 'bg-[#2f6f5e]/16 text-[#9be2c8]' : 'bg-white/8 text-white/54'}`}>
                            {key.is_active ? c.active : c.paused}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => void handleSaveName(key)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-white/72 hover:text-white">{c.save}</button>
                            <button onClick={() => void handleToggleKey(key)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-white/72 hover:text-white">
                              {key.is_active ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                              {key.is_active ? c.pause : c.activate}
                            </button>
                            <button onClick={() => setPendingDeleteKey(key)} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300/20 px-3 text-red-200 hover:bg-red-400/10">{c.deleteKey}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 rounded-xl border border-[#f2b36d]/28 bg-[#f2b36d]/10 p-4 text-sm leading-6 text-[#f6d4aa]">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <p>{c.keyWarning}</p>
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <InfoAction icon={ShoppingBag} title={c.purchaseTitle} body={c.purchaseDesc} primary={c.viewPurchases} to="/my-purchases" secondary={c.browse} secondaryTo="/marketplace" />
            )}

            {activeTab === 'usage' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <InfoCard icon={Activity} title={c.usageTitle} body={c.usageDesc} />
                <section className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-6">
                  <h2 className="text-xl font-semibold">{zh ? '服务记录' : 'Service records'}</h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      [zh ? '成功调用' : 'Successful calls', '0'],
                      [zh ? '消耗积分' : 'Credits spent', '0.00'],
                      [zh ? '失败率' : 'Failure rate', '0%'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
                        <div className="text-xs text-white/42">{label}</div>
                        <div className="number-pop mt-2 font-mono text-2xl">{value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <InfoCard icon={CreditCard} title={c.billingTitle} body={c.billingDesc} value={balance.toFixed(2)} />
                <section className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-8">
                  <h2 className="mb-5 text-xl font-semibold">{c.topUp}</h2>
                  <div className="mb-5 grid gap-3">
                    {creditPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => void handleCreditCheckout(plan.id)}
                        disabled={checkoutPlan !== null}
                        className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-white/[0.045] px-4 text-left transition hover:border-[#d76f37]/50 disabled:cursor-wait disabled:opacity-60"
                      >
                        <span>
                          <span className="block font-semibold text-white/90">{plan.name} · {plan.price}</span>
                          <span className="mt-1 block text-sm text-white/48">{plan.credits}</span>
                        </span>
                        <span className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#070b0d]">
                          {checkoutPlan === plan.id ? c.checkoutOpening : (zh ? 'Stripe 支付' : 'Pay with Stripe')}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <ReceiptText size={18} className="mt-0.5 text-[#d76f37]" />
                      <p className="text-sm leading-6 text-white/58">{c.portalDesc}</p>
                    </div>
                    <button
                      onClick={() => void handleOpenStripePortal()}
                      disabled={openingPortal}
                      className="min-h-11 w-full rounded-lg border border-white/10 px-4 text-sm font-semibold text-white/78 transition hover:border-[#d76f37]/50 hover:text-white disabled:cursor-wait disabled:opacity-55"
                    >
                      {openingPortal ? c.managingBilling : c.manageBilling}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-6">
                  <h2 className="text-xl font-semibold">{c.settingsTitle}</h2>
                  <p className="mt-2 text-sm text-white/52">{c.settingsDesc}</p>
                  <div className="mt-6 grid gap-4">
                    <label className="text-xs uppercase tracking-widest text-white/42">
                      Email
                      <input value={currentUser?.email || ''} disabled className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#050808] px-3 font-normal normal-case tracking-normal text-white/70" />
                    </label>
                    <label className="text-xs uppercase tracking-widest text-white/42">
                      {zh ? '账户类型' : 'Account type'}
                      <input value={(userProfile?.role || 'buyer').toUpperCase()} disabled className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#050808] px-3 font-normal normal-case tracking-normal text-white/70" />
                    </label>
                  </div>
                  <button onClick={() => showNotice({ type: 'info', message: c.savePrepared })} className="mt-6 min-h-11 rounded-lg bg-white px-5 text-sm font-semibold text-[#070b0d]">
                    {zh ? '保存资料' : 'Save profile'}
                  </button>
                </section>
                <InfoCard icon={Bell} title={c.notifications} body={zh ? '接收账单、调用异常、订阅变化和商家结算提醒。' : 'Receive billing, call issue, subscription, and seller settlement alerts.'} />
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreateKey && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/62 px-4 backdrop-blur-sm">
          <div className="motion-modal w-full max-w-md rounded-xl border border-white/12 bg-[#101718] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">{c.createKey}</h2>
            <label className="mt-5 block text-xs uppercase tracking-widest text-white/42">
              {c.keyName}
              <input
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                placeholder={c.keyNamePlaceholder}
                className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-[#050808] px-3 text-sm normal-case tracking-normal text-white placeholder:text-white/34 focus:border-[#d76f37]/60 focus:outline-none"
              />
            </label>
            <p className="mt-4 text-sm leading-6 text-white/54">{c.secretDesc}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreateKey(false)} disabled={creatingKey} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm text-white/72 hover:text-white">{c.cancel}</button>
              <button onClick={() => void handleCreateKey()} disabled={creatingKey} className="min-h-11 rounded-lg bg-white px-4 text-sm font-semibold text-[#070b0d] disabled:opacity-50">
                {creatingKey ? c.creating : c.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteKey && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/62 px-4 backdrop-blur-sm">
          <div className="motion-modal w-full max-w-md rounded-xl border border-white/12 bg-[#101718] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold">{c.deleteTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-white/58">{c.deleteDesc}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setPendingDeleteKey(null)} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm text-white/72 hover:text-white">{c.cancel}</button>
              <button onClick={() => void confirmDeleteKey()} className="min-h-11 rounded-lg bg-red-300 px-4 text-sm font-semibold text-[#2a0707]">{c.deleteKey}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function InfoAction({
  icon: Icon,
  title,
  body,
  primary,
  to,
  secondary,
  secondaryTo,
}: {
  icon: typeof ShoppingBag;
  title: string;
  body: string;
  primary: string;
  to: string;
  secondary: string;
  secondaryTo: string;
}) {
  return (
    <section className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-8">
      <Icon size={42} className="mb-5 text-[#d76f37]" />
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/56">{body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={to} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#070b0d]">
          {primary}
          <ChevronRight size={16} />
        </Link>
        <Link to={secondaryTo} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/74 hover:text-white">
          {secondary}
        </Link>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  body,
  value,
}: {
  icon: typeof Activity;
  title: string;
  body: string;
  value?: string;
}) {
  return (
    <section className="motion-panel rounded-xl border border-white/10 bg-[#0b1213]/86 p-6">
      <Icon size={28} className="mb-4 text-[#d76f37]" />
      <h2 className="text-xl font-semibold">{title}</h2>
      {value && <div className="number-pop my-6 font-mono text-5xl">{value}</div>}
      <p className="mt-3 text-sm leading-6 text-white/56">{body}</p>
    </section>
  );
}

export default Dashboard;
