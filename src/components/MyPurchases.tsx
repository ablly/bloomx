import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, ExternalLink, KeyRound, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUserPurchases } from '../services/purchaseService';
import { useAuth } from '../contexts/AuthContext';
import type { Purchase } from '../types/marketplace';
import { FadeIn } from './ui';

const copy = {
  zh: {
    title: '我的订阅',
    subtitle: '管理已订阅的商家模型、调用端点和有效期。',
    back: '返回工作台',
    emptyTitle: '还没有激活订阅',
    emptyDesc: '去市场选择已通过测试的商家 API，订阅后即可用 BloomX 平台 Key 调用。',
    marketplace: '去市场看看',
    active: '有效',
    expired: '已过期',
    revoked: '已撤销',
    purchasedAt: '订阅时间',
    expiresAt: '有效期至',
    endpoint: 'API 端点',
    details: '查看详情',
    docs: '接入说明',
    total: '订阅数量',
    activeCount: '有效订阅',
    security: '统一 Key 调用',
    securityDesc: '不要直接暴露商家 Key；通过 BloomX 平台 Key 调用已订阅模型。',
    loading: '正在加载订阅...',
  },
  en: {
    title: 'My subscriptions',
    subtitle: 'Manage subscribed merchant models, call endpoints, and validity.',
    back: 'Back to workspace',
    emptyTitle: 'No active subscriptions yet',
    emptyDesc: 'Browse tested merchant APIs in the marketplace. After subscribing, call them with your BloomX platform key.',
    marketplace: 'Browse marketplace',
    active: 'Active',
    expired: 'Expired',
    revoked: 'Revoked',
    purchasedAt: 'Subscribed',
    expiresAt: 'Expires',
    endpoint: 'API endpoint',
    details: 'View details',
    docs: 'Integration notes',
    total: 'Total subscriptions',
    activeCount: 'Active subscriptions',
    security: 'Unified key calls',
    securityDesc: 'Do not expose merchant keys directly; call subscribed models through your BloomX platform key.',
    loading: 'Loading subscriptions...',
  },
} as const;

const MyPurchases = () => {
  const { currentUser } = useAuth();
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith('zh');
  const c = zh ? copy.zh : copy.en;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    void loadPurchases();
  }, [currentUser]);

  const loadPurchases = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await getUserPurchases(currentUser.uid);
      setPurchases(data);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const statusLabel = (status: Purchase['status']) => {
    if (status === 'active') return c.active;
    if (status === 'expired') return c.expired;
    return c.revoked;
  };

  const activeCount = purchases.filter((purchase) => purchase.status === 'active').length;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b0d] px-6 text-white">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] px-5 py-4 text-sm text-white/62">{c.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b0d] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <FadeIn direction="up" delay={0.1}>
          <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link to="/dashboard" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/68 transition hover:border-[#d76f37]/50 hover:text-white">
                <ArrowLeft size={16} />
                {c.back}
              </Link>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#2f6f5e]/40 bg-[#2f6f5e]/12 px-3 py-1 text-xs font-medium text-[#9be2c8]">
                <ShieldCheck size={14} />
                BloomX
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{c.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">{c.subtitle}</p>
            </div>
            <Link to="/marketplace" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#070b0d] transition hover:bg-white/88">
              {c.marketplace}
              <ExternalLink size={16} />
            </Link>
          </header>
        </FadeIn>

        {purchases.length === 0 ? (
          <FadeIn direction="up" delay={0.2}>
            <section className="rounded-xl border border-white/10 bg-[#0b1213]/86 p-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[#d76f37]/14">
                <ShoppingBag size={32} className="text-[#f2b36d]" />
              </div>
              <h2 className="text-2xl font-semibold">{c.emptyTitle}</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/56">{c.emptyDesc}</p>
              <Link to="/marketplace" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-[#070b0d]">
                {c.marketplace}
              </Link>
            </section>
          </FadeIn>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4">
              {purchases.map((purchase, index) => (
                <FadeIn key={purchase.id} direction="up" delay={0.06 * index}>
                  <article className="rounded-xl border border-white/10 bg-[#0b1213]/86 p-5 transition hover:border-[#d76f37]/42">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2f6f5e]/14">
                            <CheckCircle size={21} className="text-[#9be2c8]" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold">{purchase.product_name}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/48">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar size={14} />
                                {c.purchasedAt} {formatDate(purchase.createdAt)}
                              </span>
                              <span>{c.expiresAt} {formatDate(purchase.expiresAt)}</span>
                              <span className="rounded-full bg-[#2f6f5e]/16 px-2 py-1 text-[#9be2c8]">{statusLabel(purchase.status)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-[#050808] p-3">
                          <div className="mb-1 text-xs uppercase tracking-widest text-white/35">{c.endpoint}</div>
                          <div className="flex items-center justify-between gap-3">
                            <code className="truncate font-mono text-sm text-white/80">{purchase.product_url}</code>
                            <a href={purchase.product_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-white/60 hover:text-white" aria-label={c.endpoint}>
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 lg:w-36 lg:flex-col">
                        <Link to={`/product/${purchase.product_id}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white/76 hover:text-white">
                          {c.details}
                        </Link>
                        <Link to="/dashboard" className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-white/10 px-3 text-sm text-white/62 hover:text-white">
                          {c.docs}
                        </Link>
                      </div>
                    </div>
                  </article>
                </FadeIn>
              ))}
            </section>

            <aside className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-[#0b1213]/86 p-5">
                <div className="text-xs uppercase tracking-widest text-white/42">{c.total}</div>
                <div className="mt-2 text-4xl font-semibold">{purchases.length}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0b1213]/86 p-5">
                <div className="text-xs uppercase tracking-widest text-white/42">{c.activeCount}</div>
                <div className="mt-2 text-4xl font-semibold">{activeCount}</div>
              </div>
              <div className="rounded-xl border border-[#f2b36d]/24 bg-[#f2b36d]/10 p-5">
                <KeyRound size={24} className="mb-4 text-[#f2b36d]" />
                <h3 className="font-semibold">{c.security}</h3>
                <p className="mt-2 text-sm leading-6 text-[#f6d4aa]/80">{c.securityDesc}</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
