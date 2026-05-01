import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  CreditCard,
  FileClock,
  RefreshCcw,
  ShieldAlert,
  WalletCards,
} from 'lucide-react';
import { listPaymentProviderConfigs } from '../../services/paymentProviderService';
import { useAuth } from '../../contexts/AuthContext';

type AdminTab = 'payments' | 'ledger' | 'webhooks';

const adminRoles = new Set(['admin', 'operator', 'support', 'finance', 'reviewer']);

const tabConfig: Record<AdminTab, { label: string; description: string; icon: typeof CreditCard }> = {
  payments: {
    label: '支付交易',
    description: '查看 Stripe/Dodo 交易、退款、订阅和对账状态。',
    icon: CreditCard,
  },
  ledger: {
    label: '积分账本',
    description: '追踪充值、退款、调用消耗和管理员修正。',
    icon: WalletCards,
  },
  webhooks: {
    label: 'Webhook 事件',
    description: '查看验签、处理状态、失败原因和重放入口。',
    icon: FileClock,
  },
};

const samplePayments = [
  { id: 'pay_pending_stripe_test', provider: 'Stripe', status: 'checkout_started', amount: 'USD 29.00' },
  { id: 'pay_dodo_mor_placeholder', provider: 'Dodo Payments', status: 'provider_reserved', amount: 'USD 0.00' },
];

const sampleLedger = [
  { id: 'ledger_topup_preview', source: 'payment', delta: '+2,900', note: '等待 Stripe Webhook 确认后入账' },
  { id: 'ledger_refund_preview', source: 'refund', delta: '-600', note: '退款完成后冲回积分' },
];

const sampleWebhooks = [
  { id: 'evt_checkout_completed', provider: 'Stripe', status: 'verified', action: '更新交易和积分账本' },
  { id: 'evt_subscription_updated', provider: 'Dodo Payments', status: 'reserved', action: 'MoR 备选通道事件映射' },
];

function getTab(pathname: string): AdminTab {
  if (pathname.includes('/admin/ledger')) return 'ledger';
  if (pathname.includes('/admin/webhooks')) return 'webhooks';
  return 'payments';
}

export default function AdminOperations() {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const tab = getTab(location.pathname);
  const active = tabConfig[tab];
  const ActiveIcon = active.icon;
  const role = userProfile?.role ?? 'buyer';

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!adminRoles.has(role)) {
    return (
      <main className="min-h-screen bg-[#070b0d] px-4 py-10 text-white">
        <section className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#0b1213]/90 p-8">
          <ShieldAlert className="mb-4 text-[#e6b45c]" size={32} />
          <h1 className="text-2xl font-semibold">需要管理员权限</h1>
          <p className="mt-3 text-sm leading-6 text-white/58">
            当前账号角色为 {role}。支付对账、积分修正、Webhook 重放和退款复核都属于敏感操作，必须由管理员或授权运营角色执行。
          </p>
          <Link to="/dashboard" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/74 hover:text-white">
            <ArrowLeft size={16} />
            返回控制台
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b0d] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm text-white/52 hover:text-white">
              <ArrowLeft size={16} />
              返回用户控制台
            </Link>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#78c6a3]/35 bg-[#78c6a3]/10 px-3 py-1 text-xs font-semibold text-[#9be2c8]">
              <Activity size={14} />
              管理员运营后台 MVP
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">支付与账本运营</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
              这里先建立生产级骨架：所有支付状态以服务端账本和已验签 Webhook 为准，Stripe 首发，Dodo Payments 保留 MoR 备选。
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/62">
            当前角色：<span className="font-semibold text-white">{role}</span>
          </div>
        </header>

        <nav className="mb-6 flex gap-2 overflow-x-auto">
          {(Object.keys(tabConfig) as AdminTab[]).map((item) => {
            const Icon = tabConfig[item].icon;
            const selected = item === tab;
            return (
              <Link
                key={item}
                to={`/admin/${item}`}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition ${
                  selected ? 'bg-white text-[#070b0d]' : 'border border-white/10 text-white/64 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tabConfig[item].label}
              </Link>
            );
          })}
        </nav>

        <section className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-xl border border-white/10 bg-[#0b1213]/90 p-5">
            <ActiveIcon className="mb-4 text-[#78c6a3]" size={28} />
            <h2 className="text-xl font-semibold">{active.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/56">{active.description}</p>
            <div className="mt-6 space-y-3">
              {listPaymentProviderConfigs().map((provider) => (
                <div key={provider.provider} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{provider.displayName}</strong>
                    <span className={`rounded-full px-2 py-1 text-xs ${provider.enabled ? 'bg-[#2f6f5e]/18 text-[#9be2c8]' : 'bg-white/8 text-white/46'}`}>
                      {provider.enabled ? '已启用' : '未启用'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/46">
                    secretRef: {provider.secretRef}; webhookSecretRef: {provider.webhookSecretRef}
                  </p>
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-xl border border-white/10 bg-[#0b1213]/90">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold">运营数据骨架</h2>
              <p className="mt-1 text-sm text-white/48">当前是安全骨架和字段约束，不会执行真实支付或退款。</p>
            </div>
            <div className="divide-y divide-white/8">
              {tab === 'payments' &&
                samplePayments.map((item) => (
                  <RecordRow key={item.id} title={item.id} meta={`${item.provider} / ${item.amount}`} status={item.status} />
                ))}
              {tab === 'ledger' &&
                sampleLedger.map((item) => (
                  <RecordRow key={item.id} title={item.id} meta={`${item.source} / ${item.delta}`} status={item.note} />
                ))}
              {tab === 'webhooks' &&
                sampleWebhooks.map((item) => (
                  <RecordRow key={item.id} title={item.id} meta={`${item.provider} / ${item.action}`} status={item.status} />
                ))}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/38"
              >
                <RefreshCcw size={16} />
                重放失败事件
              </button>
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 cursor-not-allowed items-center rounded-lg bg-white/30 px-4 text-sm font-semibold text-[#070b0d]/70"
              >
                导出审计摘要
              </button>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function RecordRow({ title, meta, status }: { title: string; meta: string; status: string }) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="font-mono text-sm text-white/86">{title}</div>
        <div className="mt-1 text-sm text-white/48">{meta}</div>
      </div>
      <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs text-white/58">{status}</span>
    </div>
  );
}
