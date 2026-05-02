import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CreditCard, DollarSign, LayoutDashboard, LogOut, Package, Plus, Settings, ShieldCheck, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerByUid } from '../../services/sellerService';
import { getSellerProducts } from '../../services/productService';
import type { Product, Seller } from '../../types/marketplace';

type SellerTab = 'overview' | 'products' | 'earnings' | 'withdraw' | 'settings';

const copy = {
  zh: {
    title: '商家工作台',
    subtitle: '管理 API 供给、测试状态、收入结算和提现资料。',
    notSeller: '还不是商家',
    becomeSellerDesc: '提交申请后，BloomX 会进行审核，并通过邮件或站内通知告知结果。',
    applyNow: '提交商家申请',
    signOut: '退出登录',
    overview: '概览',
    products: 'API 商品',
    earnings: '收益',
    withdraw: '提现',
    settings: '设置',
    totalProducts: '商品数',
    totalEarnings: '累计收益',
    available: '可提现',
    pending: '待结算',
    kycStatus: 'KYC 状态',
    accountStatus: '账户状态',
    manageProducts: '管理已上架和待审核的商家 API。',
    addProduct: '新增 API 商品',
    noProducts: '还没有 API 商品',
    addFirstProduct: '添加第一个 API，让平台完成连通性测试后上架。',
    name: '名称',
    models: '模型',
    pricing: '价格',
    status: '状态',
    sales: '销量',
    earningsDesc: '成功调用会计入商家收益，失败调用会给用户退款并保留售后记录。',
    withdrawDesc: '提现资料会用于后续结算；当前页面先保留账户状态和余额入口。',
    settingsDesc: '商家资料、银行账户和通知偏好会在后续版本开放编辑。',
    automation: '结算与通知',
    automationDesc: '月度结算、支付回执和健康提醒会由平台统一处理。',
  },
  en: {
    title: 'Seller dashboard',
    subtitle: 'Manage API supply, test status, settlement revenue, and payout details.',
    notSeller: 'Not a seller yet',
    becomeSellerDesc: 'After applying, BloomX reviews your profile and sends updates by email or in-app notice.',
    applyNow: 'Apply as seller',
    signOut: 'Sign out',
    overview: 'Overview',
    products: 'API products',
    earnings: 'Earnings',
    withdraw: 'Withdraw',
    settings: 'Settings',
    totalProducts: 'Products',
    totalEarnings: 'Total earnings',
    available: 'Available',
    pending: 'Pending',
    kycStatus: 'KYC status',
    accountStatus: 'Account status',
    manageProducts: 'Manage listed and pending merchant APIs.',
    addProduct: 'Add API product',
    noProducts: 'No API products yet',
    addFirstProduct: 'Add your first API and let BloomX test it before listing.',
    name: 'Name',
    models: 'Models',
    pricing: 'Pricing',
    status: 'Status',
    sales: 'Sales',
    earningsDesc: 'Successful calls become seller revenue. Failed calls refund users and remain available for support review.',
    withdrawDesc: 'Payout details will be used for settlement. This page keeps account status and balance ready.',
    settingsDesc: 'Merchant profile, bank account, and notification preferences will be editable in a later pass.',
    automation: 'Settlement and notices',
    automationDesc: 'Monthly settlement, payment receipts, and health alerts are handled by the platform.',
  },
} as const;

const SellerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith('zh');
  const c = zh ? copy.zh : copy.en;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SellerTab>('overview');

  useEffect(() => {
    if (currentUser) {
      void loadSellerData();
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

  const navItems = useMemo(
    () => [
      { id: 'overview' as const, label: c.overview, icon: LayoutDashboard },
      { id: 'products' as const, label: c.products, icon: Package },
      { id: 'earnings' as const, label: c.earnings, icon: DollarSign },
      { id: 'withdraw' as const, label: c.withdraw, icon: CreditCard },
      { id: 'settings' as const, label: c.settings, icon: Settings },
    ],
    [c],
  );

  const metricCards = seller
    ? [
        { label: c.totalProducts, value: products.length.toString(), tone: 'text-white' },
        { label: c.totalEarnings, value: `${seller.total_earnings?.toFixed(2) || '0.00'}`, tone: 'text-white' },
        { label: c.available, value: `${seller.available_balance?.toFixed(2) || '0.00'}`, tone: 'text-[#9be2c8]' },
        { label: c.pending, value: `${seller.pending_balance?.toFixed(2) || '0.00'}`, tone: 'text-[#f2b36d]' },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b0d] px-6 text-white">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] px-5 py-4 text-sm text-white/62">
          {zh ? '正在加载商家资料...' : 'Loading seller profile...'}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b0d] p-6 text-white">
        <div className="max-w-md rounded-xl border border-white/10 bg-[#0b1213]/88 p-8 text-center">
          <Package size={48} className="mx-auto mb-4 text-white/30" />
          <h2 className="mb-3 text-2xl font-semibold">{c.notSeller}</h2>
          <p className="mb-6 text-sm leading-6 text-white/58">{c.becomeSellerDesc}</p>
          <button onClick={() => navigate('/')} className="min-h-11 rounded-lg bg-white px-6 text-sm font-semibold text-[#070b0d] hover:bg-white/88">
            {c.applyNow}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070b0d] text-white">
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-white/10 bg-[#091011]/86 p-5 lg:flex">
        <div>
          <button className="mb-8 flex items-center gap-3 text-left" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d76f37] font-bold text-[#100806]">B</div>
            <div>
              <div className="text-lg font-semibold">BloomX</div>
              <div className="text-xs text-white/42">{c.title}</div>
            </div>
          </button>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-[#d76f37] text-[#100806]' : 'text-white/62 hover:bg-white/7 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button onClick={() => void logout()} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/58 hover:bg-white/7 hover:text-white">
          <LogOut size={18} />
          {c.signOut}
        </button>
      </aside>

      <main className="w-full flex-1 overflow-y-auto">
        <div className="border-b border-white/10 px-4 py-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => navigate('/')} className="font-semibold">BloomX</button>
            <button onClick={() => void logout()} className="rounded-lg border border-white/10 p-2 text-white/70">
              <LogOut size={18} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`min-h-10 shrink-0 rounded-lg px-3 text-sm ${activeTab === item.id ? 'bg-[#d76f37] text-[#100806]' : 'border border-white/10 text-white/64'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
          <header className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2f6f5e]/40 bg-[#2f6f5e]/12 px-3 py-1 text-xs font-medium text-[#9be2c8]">
              <ShieldCheck size={14} />
              {seller.status}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{navItems.find((item) => item.id === activeTab)?.label}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{c.subtitle}</p>
          </header>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-4">
                {metricCards.map((card) => (
                  <div key={card.label} className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
                    <div className="text-xs uppercase tracking-widest text-white/42">{card.label}</div>
                    <div className={`mt-3 font-mono text-3xl font-semibold ${card.tone}`}>{card.value}</div>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#0b1213]/88 p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Star size={19} className="text-[#f2b36d]" />
                    {c.kycStatus}
                  </h2>
                  <StatusPill status={seller.kyc_status || 'none'} />
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0b1213]/88 p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Clock size={19} className="text-[#9be2c8]" />
                    {c.accountStatus}
                  </h2>
                  <StatusPill status={seller.status} />
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-[#0b1213]/88 p-6">
                <h2 className="text-xl font-semibold">{c.automation}</h2>
                <p className="mt-2 text-sm leading-6 text-white/56">{c.automationDesc}</p>
              </section>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/58">{c.manageProducts}</p>
                <button onClick={() => navigate('/seller/products/new')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#070b0d] hover:bg-white/88">
                  <Plus size={16} />
                  {c.addProduct}
                </button>
              </div>

              {products.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-12 text-center">
                  <Package size={48} className="mx-auto mb-4 text-white/24" />
                  <h2 className="mb-2 text-xl font-semibold">{c.noProducts}</h2>
                  <p className="text-sm text-white/52">{c.addFirstProduct}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1213]/88">
                  <div className="hidden grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.5fr] gap-4 border-b border-white/10 bg-white/[0.04] px-5 py-3 text-xs uppercase tracking-widest text-white/42 md:grid">
                    <span>{c.name}</span>
                    <span>{c.models}</span>
                    <span>{c.pricing}</span>
                    <span>{c.status}</span>
                    <span>{c.sales}</span>
                  </div>
                  <div className="divide-y divide-white/8">
                    {products.map((product) => (
                      <button key={product.id} onClick={() => navigate(`/seller/products/${product.id}`)} className="grid w-full gap-3 px-5 py-4 text-left text-sm text-white/72 hover:bg-white/[0.035] md:grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.5fr] md:items-center">
                        <span className="font-medium text-white">{product.name}</span>
                        <span>{product.models?.slice(0, 2).join(', ')}{product.models?.length > 2 && ` +${product.models.length - 2}`}</span>
                        <span className="font-mono">{product.pricing?.input_per_1k} / {product.pricing?.output_per_1k}</span>
                        <StatusPill status={product.status} compact />
                        <span>{product.total_sales || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'earnings' && (
            <InfoPanel icon={DollarSign} title={c.earnings} body={c.earningsDesc} metrics={metricCards.slice(1, 4)} />
          )}

          {activeTab === 'withdraw' && (
            <InfoPanel icon={CreditCard} title={c.withdraw} body={c.withdrawDesc} metrics={metricCards.slice(2, 4)} />
          )}

          {activeTab === 'settings' && (
            <InfoPanel icon={Settings} title={c.settings} body={c.settingsDesc} metrics={[{ label: c.accountStatus, value: seller.status, tone: 'text-white' }]} />
          )}
        </div>
      </main>
    </div>
  );
};

function StatusPill({ status, compact = false }: { status: string; compact?: boolean }) {
  const tone = status === 'approved' || status === 'active'
    ? 'bg-[#2f6f5e]/16 text-[#9be2c8]'
    : status === 'pending' || status === 'pending_review'
      ? 'bg-[#f2b36d]/14 text-[#f6d4aa]'
      : 'bg-white/10 text-white/62';

  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm ${tone} ${compact ? 'text-xs' : ''}`}>{status}</span>;
}

function InfoPanel({
  icon: Icon,
  title,
  body,
  metrics,
}: {
  icon: typeof DollarSign;
  title: string;
  body: string;
  metrics: Array<{ label: string; value: string; tone: string }>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-xl border border-white/10 bg-[#0b1213]/88 p-6">
        <Icon size={32} className="mb-4 text-[#d76f37]" />
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/56">{body}</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
            <div className="text-xs uppercase tracking-widest text-white/42">{metric.label}</div>
            <div className={`mt-3 font-mono text-3xl font-semibold ${metric.tone}`}>{metric.value}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default SellerDashboard;
