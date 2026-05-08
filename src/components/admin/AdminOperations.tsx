import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  Database,
  FileClock,
  Filter,
  KeyRound,
  Layers3,
  LockKeyhole,
  LogIn,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import {
  subscribeAdminConsoleSnapshot,
  type AdminDataset,
  type AdminMetric,
  type AdminRecord,
  type AdminRiskItem,
  type AdminSectionKey,
  type AdminSnapshot,
} from '../../services/adminOperationsService';
import {
  approveAdminAction,
  refreshPaymentReconciliationSnapshot,
  rejectAdminAction,
  runAdminAction,
  type AdminActionType,
} from '../../services/adminActionService';
import { listPaymentProviderConfigs } from '../../services/paymentProviderService';
import { useAuth } from '../../contexts/AuthContext';

const adminRoles = new Set(['admin', 'operator', 'support', 'finance', 'reviewer']);
const allowedAdminEmails = String(import.meta.env.VITE_ADMIN_ALLOWED_EMAILS || 'zqhablly@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const primaryAdminEmail = allowedAdminEmails[0] ?? 'zqhablly@gmail.com';

function isAllowedAdminEmail(email?: string | null): boolean {
  return Boolean(email && allowedAdminEmails.includes(email.trim().toLowerCase()));
}

interface SectionConfig {
  key: AdminSectionKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  action: string;
}

const sections: SectionConfig[] = [
  {
    key: 'overview',
    label: '运营总览',
    shortLabel: '总览',
    icon: BarChart3,
    description: '收入、风险、待办、系统闸门和生产状态。',
    action: '导出运营日报',
  },
  {
    key: 'users',
    label: '用户与权限',
    shortLabel: '用户',
    icon: Users,
    description: '账号、角色、积分余额、冻结和风控。',
    action: '调整用户权限',
  },
  {
    key: 'sellers',
    label: '商家审核',
    shortLabel: '商家',
    icon: Store,
    description: '商家申请、KYC、资产验证和结算资格。',
    action: '审核商家',
  },
  {
    key: 'products',
    label: 'API 商品',
    shortLabel: '商品',
    icon: PackageCheck,
    description: '商品上架、价格、模型、可用性和下架策略。',
    action: '复核商品',
  },
  {
    key: 'orders',
    label: '订单授权',
    shortLabel: '订单',
    icon: ReceiptText,
    description: '购买授权、到期、撤销和售后关联。',
    action: '撤销授权',
  },
  {
    key: 'payments',
    label: '支付交易',
    shortLabel: '支付',
    icon: CreditCard,
    description: 'Stripe Checkout、Portal、退款请求、争议和账本状态。',
    action: '提交支付复核',
  },
  {
    key: 'ledger',
    label: '积分账本',
    shortLabel: '账本',
    icon: WalletCards,
    description: '充值、消耗、退款、迁移和管理员修正。',
    action: '发起账本修正',
  },
  {
    key: 'refunds',
    label: '退款复核',
    shortLabel: '退款',
    icon: RefreshCcw,
    description: 'Stripe 退款申请、服务端执行、Webhook 回执和争议复核。',
    action: '复核退款',
  },
  {
    key: 'workflows',
    label: '免费工作流',
    shortLabel: '工作流',
    icon: Workflow,
    description: 'Activepieces、Node-RED、Windmill 事件、重试和死信。',
    action: '重放工作流',
  },
  {
    key: 'webhooks',
    label: 'Webhook 事件',
    shortLabel: 'Webhook',
    icon: FileClock,
    description: '验签、幂等、处理结果、重放和失败队列。',
    action: '重放 Webhook',
  },
  {
    key: 'settlements',
    label: '商家结算',
    shortLabel: '结算',
    icon: BookOpen,
    description: '月结快照、平台费、退款抵扣和付款状态。',
    action: '批准结算',
  },
  {
    key: 'audit',
    label: '审计日志',
    shortLabel: '审计',
    icon: ShieldCheck,
    description: '敏感操作、操作者、原因、前后状态和 requestId。',
    action: '导出审计包',
  },
  {
    key: 'settings',
    label: '系统配置',
    shortLabel: '配置',
    icon: Settings,
    description: '支付 Provider、工作流密钥、上线闸门和权限策略。',
    action: '更新配置',
  },
];

const sectionMap = new Map(sections.map((section) => [section.key, section]));

function getSection(pathname: string): AdminSectionKey {
  const maybeSection = pathname.split('/').filter(Boolean)[1] as AdminSectionKey | undefined;
  if (maybeSection && sectionMap.has(maybeSection)) return maybeSection;
  return 'overview';
}

function formatDate(date?: Date): string {
  if (!date) return '未记录';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toneClass(tone: AdminMetric['tone'] | AdminRiskItem['severity']) {
  if (tone === 'good' || tone === 'low') return 'border-[#78c6a3]/25 bg-[#78c6a3]/8 text-[#9be2c8]';
  if (tone === 'warning' || tone === 'medium') return 'border-[#d9b46a]/25 bg-[#d9b46a]/10 text-[#efd18c]';
  if (tone === 'danger' || tone === 'high') return 'border-[#e07d6b]/30 bg-[#e07d6b]/10 text-[#f0a091]';
  return 'border-white/10 bg-white/[0.035] text-white/68';
}

function statusTone(status: string) {
  if (/active|approved|paid|processed|verified|available|completed|true/i.test(status)) return 'text-[#9be2c8] border-[#78c6a3]/22 bg-[#78c6a3]/8';
  if (/pending|reviewing|processing|draft|trialing|unchecked|none/i.test(status)) return 'text-[#efd18c] border-[#d9b46a]/22 bg-[#d9b46a]/10';
  if (/failed|rejected|suspended|dead|disputed|cancelled|false|revoked/i.test(status)) return 'text-[#f0a091] border-[#e07d6b]/24 bg-[#e07d6b]/10';
  return 'text-white/58 border-white/10 bg-white/[0.035]';
}

function rawString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function auditActorLabel(row: AdminRecord): string {
  const actor = row.raw.actor;
  if (actor && typeof actor === 'object') {
    const actorRecord = actor as Record<string, unknown>;
    return rawString(actorRecord.email) || rawString(actorRecord.uid) || rawString(actorRecord.role) || '未知操作者';
  }
  return rawString(row.raw.actorEmail) || rawString(row.raw.actorId) || row.owner;
}

function auditTargetCollection(row: AdminRecord): string {
  return rawString(row.raw.targetCollection) || row.collection;
}

function auditWithinTime(row: AdminRecord, filter: string): boolean {
  if (filter === 'all') return true;
  const timestamp = row.updatedAt ?? row.createdAt;
  if (!timestamp) return false;
  const hours = filter === '24h' ? 24 : filter === '7d' ? 24 * 7 : filter === '30d' ? 24 * 30 : 0;
  return hours > 0 && Date.now() - timestamp.getTime() <= hours * 60 * 60 * 1000;
}

export default function AdminOperations() {
  const { currentUser, userProfile, loading: authLoading, login, logout } = useAuth();
  const location = useLocation();
  const activeKey = getSection(location.pathname);
  const activeSection = sectionMap.get(activeKey) ?? sections[0];
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditActorFilter, setAuditActorFilter] = useState('all');
  const [auditTargetFilter, setAuditTargetFilter] = useState('all');
  const [auditTimeFilter, setAuditTimeFilter] = useState('all');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const role = String(userProfile?.role ?? (currentUser ? 'buyer' : 'preview'));
  const isAdminEmail = isAllowedAdminEmail(currentUser?.email);
  const isAdminProfile = adminRoles.has(role);
  const isAuthorized = Boolean(currentUser && (isAdminEmail || isAdminProfile));

  useEffect(() => {
    let alive = true;
    if (authLoading) return () => {
      alive = false;
    };

    if (!currentUser || !isAuthorized) {
      setSnapshot(null);
      setLoading(false);
      setError(null);
      return () => {
        alive = false;
      };
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeAdminConsoleSnapshot((result) => {
      if (!alive) return;
      setSnapshot(result);
      setLoading(false);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [authLoading, currentUser, isAuthorized]);

  const dataset = snapshot?.datasets[activeKey];

  useEffect(() => {
    setSelectedRecordId(null);
    setSearch('');
    setStatusFilter('all');
    setAuditActorFilter('all');
    setAuditTargetFilter('all');
    setAuditTimeFilter('all');
  }, [activeKey]);
  const statusOptions = useMemo(() => {
    if (!dataset) return ['all'];
    return ['all', ...Object.keys(dataset.statusCounts)];
  }, [dataset]);
  const auditActorOptions = useMemo(() => {
    if (activeKey !== 'audit' || !dataset) return ['all'];
    return ['all', ...Array.from(new Set(dataset.rows.map(auditActorLabel).filter(Boolean))).sort()];
  }, [activeKey, dataset]);
  const auditTargetOptions = useMemo(() => {
    if (activeKey !== 'audit' || !dataset) return ['all'];
    return ['all', ...Array.from(new Set(dataset.rows.map(auditTargetCollection).filter(Boolean))).sort()];
  }, [activeKey, dataset]);

  const visibleRows = useMemo(() => {
    const rows = dataset?.rows ?? [];
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const matchesAuditActor = activeKey !== 'audit' || auditActorFilter === 'all' || auditActorLabel(row) === auditActorFilter;
      const matchesAuditTarget = activeKey !== 'audit' || auditTargetFilter === 'all' || auditTargetCollection(row) === auditTargetFilter;
      const matchesAuditTime = activeKey !== 'audit' || auditWithinTime(row, auditTimeFilter);
      const content = `${row.title} ${row.subtitle} ${row.owner} ${row.status} ${row.id} ${rawString(row.raw.actionType)} ${auditActorLabel(row)} ${auditTargetCollection(row)}`.toLowerCase();
      return matchesStatus && matchesAuditActor && matchesAuditTarget && matchesAuditTime && content.includes(search.trim().toLowerCase());
    });
  }, [activeKey, auditActorFilter, auditTargetFilter, auditTimeFilter, dataset, search, statusFilter]);

  const canRunSensitiveActions = isAuthorized;
  const selectedRecord = visibleRows.find((row) => row.id === selectedRecordId) ?? visibleRows[0];

  if (authLoading) {
    return (
      <main className="min-h-[100dvh] bg-[#070b0d] px-4 py-10 text-white">
        <SkeletonGrid />
      </main>
    );
  }

  if (!currentUser) {
    return <AdminLogin onLogin={login} onLogout={logout} />;
  }

  if (!isAuthorized) {
    return <AccessDenied role={role} email={currentUser.email} onLogout={logout} />;
  }

  return (
    <main className="min-h-[100dvh] bg-[#070b0d] text-white">
      <div className="grid min-h-[100dvh] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-[#090f10]/95 px-4 py-5 lg:border-b-0 lg:border-r lg:px-5">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/56 transition hover:text-white">
            <ArrowLeft size={16} />
            返回项目首页
          </Link>
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#78c6a3]/30 bg-[#78c6a3]/10 px-3 py-1 text-xs font-semibold text-[#9be2c8]">
              <Activity size={14} />
              商业后台控制台
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">BloomX Admin</h1>
            <p className="mt-2 text-sm leading-6 text-white/48">运营、支付、工作流、审计和结算统一后台。</p>
          </div>
          <nav className="grid gap-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const selected = section.key === activeKey;
              return (
                <Link
                  key={section.key}
                  to={section.key === 'overview' ? '/admin' : `/admin/${section.key}`}
                  className={`group grid grid-cols-[22px_1fr_auto] items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition active:translate-y-px ${
                    selected
                      ? 'bg-white text-[#070b0d]'
                      : 'text-white/60 hover:bg-white/[0.055] hover:text-white'
                  }`}
                >
                  <Icon size={17} />
                  <span>{section.shortLabel}</span>
                  <span className={`font-mono text-xs ${selected ? 'text-[#070b0d]/50' : 'text-white/30'}`}>
                    {snapshot?.datasets[section.key]?.rows.length ?? 0}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 grid gap-4 border-b border-white/10 pb-5 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/42">
                <span>管理员后台</span>
                <span>/</span>
                <span className="text-white/72">{activeSection.label}</span>
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{activeSection.label}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/56">{activeSection.description}</p>
            </div>
            <div className="grid gap-2 text-sm text-white/62 sm:grid-cols-2 xl:min-w-[420px]">
              <StatusPill label="身份" value={adminRoles.has(role) ? role : 'owner'} icon={isAuthorized ? ShieldCheck : LockKeyhole} />
              <StatusPill label="更新" value={snapshot ? formatDate(snapshot.loadedAt) : '读取中'} icon={Clock3} />
            </div>
          </header>

          {error && (
            <section className="mb-6 rounded-lg border border-[#e07d6b]/25 bg-[#e07d6b]/10 p-4 text-sm text-[#f0a091]">
              {error}
            </section>
          )}

          {activeKey === 'overview' ? (
            <OverviewPanel snapshot={snapshot} loading={loading} />
          ) : activeKey === 'settings' ? (
            <SettingsPanel canRunActions={canRunSensitiveActions} />
          ) : (
            <DataPanel
              section={activeSection}
              dataset={dataset}
              rows={visibleRows}
              loading={loading}
              search={search}
              statusFilter={statusFilter}
              statusOptions={statusOptions}
              auditActorFilter={auditActorFilter}
              auditActorOptions={auditActorOptions}
              auditTargetFilter={auditTargetFilter}
              auditTargetOptions={auditTargetOptions}
              auditTimeFilter={auditTimeFilter}
              canRunActions={canRunSensitiveActions}
              selectedRecord={selectedRecord}
              onSelectRecord={setSelectedRecordId}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
              onAuditActorFilter={setAuditActorFilter}
              onAuditTargetFilter={setAuditTargetFilter}
              onAuditTimeFilter={setAuditTimeFilter}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function AdminLogin({
  onLogin,
  onLogout,
}: {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: { message?: string; messageZh?: string } }>;
  onLogout: () => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!password) {
      setError('请输入管理员账号密码。');
      return;
    }

    setSubmitting(true);
    const result = await onLogin(primaryAdminEmail, password);
    setSubmitting(false);
    setPassword('');

    if (!result.success) {
      setError('登录失败：Firebase Auth 里的账号密码不匹配，或者这个管理员邮箱还没有创建。请在 Firebase 控制台创建/重置该邮箱账号后再登录。');
      return;
    }

    if (!isAllowedAdminEmail(primaryAdminEmail)) {
      await onLogout();
      setError('当前账号不在管理员白名单内。');
    }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#070b0d] px-4 py-10 text-white">
      <section className="w-full max-w-[560px]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#0b1213]/90 p-7 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.8)] sm:p-8">
          <div className="flex items-center gap-3">
            <LogIn className="text-[#9be2c8]" size={22} />
            <div>
              <h2 className="text-xl font-semibold">管理员登录</h2>
              <p className="mt-1 text-sm text-white/45">密码只在登录时提交，不写入前端代码或仓库。</p>
            </div>
          </div>

          <div className="mt-7 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/72">管理员邮箱</span>
              <input
                value={primaryAdminEmail}
                readOnly
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-sm text-white/70 outline-none"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/72">密码</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-sm outline-none transition placeholder:text-white/28 focus:border-[#78c6a3]/45"
                placeholder="输入管理员密码"
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-[#e07d6b]/25 bg-[#e07d6b]/10 px-4 py-3 text-sm text-[#f0a091]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-[#070b0d] transition hover:bg-white/88 active:translate-y-px disabled:cursor-wait disabled:bg-white/50"
          >
            {submitting ? '正在登录' : '进入管理员后台'}
          </button>
        </form>
      </section>
    </main>
  );
}

function AccessDenied({ role, email, onLogout }: { role: string; email: string | null; onLogout: () => Promise<void> }) {
  return (
    <main className="min-h-[100dvh] bg-[#070b0d] px-4 py-10 text-white">
      <section className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#0b1213]/90 p-8">
        <ShieldAlert className="mb-4 text-[#d9b46a]" size={32} />
        <h1 className="text-2xl font-semibold">需要管理员权限</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          当前登录邮箱为 {email || '未知'}，角色为 {role}。此后台只允许 {primaryAdminEmail} 进入。
        </p>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/74 hover:text-white"
        >
          退出当前账号
        </button>
      </section>
    </main>
  );
}

function StatusPill({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

function OverviewPanel({ snapshot, loading }: { snapshot: AdminSnapshot | null; loading: boolean }) {
  if (loading) return <SkeletonGrid />;
  if (!snapshot) return <EmptyState title="后台数据未加载" detail="刷新页面或检查 Firebase 配置。" />;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <article key={metric.label} className={`rounded-xl border p-5 ${toneClass(metric.tone)}`}>
            <div className="text-sm opacity-80">{metric.label}</div>
            <div className="mt-3 font-mono text-3xl font-semibold">{metric.value}</div>
            <div className="mt-2 text-xs leading-5 opacity-70">{metric.detail}</div>
          </article>
        ))}
      </section>

      <PaymentReconciliationPanel summary={snapshot.paymentReconciliation} />

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-xl border border-white/10 bg-[#0b1213]/88">
          <PanelHeader title="运营待办队列" detail="只展示真实集合里需要处理的记录，不使用假数据。" icon={AlertTriangle} />
          <div className="divide-y divide-white/8">
            {snapshot.queue.length === 0 ? (
              <EmptyState title="暂无待办" detail="没有读取到 pending、failed、dead_lettered 或 reviewing 状态记录。" compact />
            ) : (
              snapshot.queue.map((item) => (
                <div key={`${item.section}-${item.id}`} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="mt-1 text-sm text-white/48">{item.reason} / owner: {item.owner}</div>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs ${toneClass(item.severity)}`}>{item.severity}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-[#0b1213]/88">
          <PanelHeader title="生产风险" detail="上线前必须逐项清掉。" icon={ShieldAlert} />
          <div className="grid gap-3 p-5">
            {snapshot.risks.map((risk) => (
              <div key={risk.title} className={`rounded-lg border p-4 ${toneClass(risk.severity)}`}>
                <div className="font-semibold">{risk.title}</div>
                <div className="mt-2 text-sm leading-5 opacity-75">{risk.detail}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0b1213]/88">
        <PanelHeader title="模块数据覆盖" detail="读取 Firestore 运营集合，失败会直接暴露，不隐藏问题。" icon={Database} />
        <div className="grid gap-px overflow-hidden rounded-b-xl bg-white/8 md:grid-cols-2 xl:grid-cols-3">
          {sections
            .filter((section) => !['overview', 'settings'].includes(section.key))
            .map((section) => {
              const dataset = snapshot.datasets[section.key];
              const Icon = section.icon;
              return (
                <Link key={section.key} to={`/admin/${section.key}`} className="bg-[#0b1213] p-5 transition hover:bg-white/[0.045]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-[#9be2c8]" />
                      <span className="font-semibold">{section.label}</span>
                    </div>
                    <span className="font-mono text-sm text-white/50">{dataset?.rows.length ?? 0}</span>
                  </div>
                  <div className="mt-2 text-sm leading-5 text-white/42">
                    {dataset?.error ? `读取失败：${dataset.error}` : section.description}
                  </div>
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}

function PaymentReconciliationPanel({
  summary,
}: {
  summary: AdminSnapshot['paymentReconciliation'];
}) {
  const [refreshState, setRefreshState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const cards = [
    {
      label: 'Stripe 实收',
      value: summary.collectedAmount.formatted,
      detail: `${summary.transactionCount} 笔 payment_transactions，以 paid/completed/succeeded 为准`,
      tone: 'good' as const,
    },
    {
      label: '积分入账',
      value: summary.creditedAmount.formatted,
      detail: `${summary.ledgerEntryCount} 条 credit_ledger，只统计 payment/admin/migration 正向入账`,
      tone: 'neutral' as const,
    },
    {
      label: 'Webhook 失败',
      value: String(summary.failedWebhooks),
      detail: 'failed、dead_lettered、signature failed 都进入复核范围',
      tone: summary.failedWebhooks > 0 ? 'danger' as const : 'good' as const,
    },
    {
      label: '需人工复核',
      value: String(summary.requiresReview),
      detail: `${summary.pendingRefunds} 个退款，${summary.openDisputes} 个争议`,
      tone: summary.requiresReview > 0 ? 'warning' as const : 'good' as const,
    },
  ];
  const refreshServerSnapshot = async () => {
    setRefreshState('submitting');
    try {
      const result = await refreshPaymentReconciliationSnapshot();
      setRefreshState(result.success ? 'success' : 'error');
    } catch {
      setRefreshState('error');
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#0b1213]/88">
      <PanelHeader
        title="支付对账工作台"
        detail={`Stripe-only：${summary.source === 'server_snapshot' ? '当前使用服务端对账快照' : '当前使用实时客户端聚合兜底'}；Checkout、Webhook、积分账本、退款和争议必须能相互追溯。`}
        icon={CreditCard}
      />
      <div className="grid gap-3 border-b border-white/10 p-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className={`rounded-lg border p-4 ${toneClass(card.tone)}`}>
            <div className="text-xs opacity-75">{card.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold">{card.value}</div>
            <div className="mt-2 text-xs leading-5 opacity-70">{card.detail}</div>
          </article>
        ))}
      </div>
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/82">运营边界</div>
              <div className="mt-1 text-xs text-white/38">
                {summary.source === 'server_snapshot' ? `服务端快照 ${summary.snapshotStatus ?? 'ready'}` : '尚无服务端快照，正在使用实时兜底'}
              </div>
            </div>
            <button
              type="button"
              disabled={refreshState === 'submitting'}
              onClick={() => void refreshServerSnapshot()}
              className="min-h-10 rounded-lg border border-[#78c6a3]/25 bg-[#78c6a3]/10 px-3 text-xs font-semibold text-[#9be2c8] transition hover:bg-[#78c6a3]/14 disabled:cursor-wait disabled:opacity-55"
            >
              {refreshState === 'submitting' ? '刷新中' : '刷新服务端快照'}
            </button>
          </div>
          {refreshState === 'success' && <div className="mt-3 rounded-lg border border-[#78c6a3]/25 bg-[#78c6a3]/10 px-3 py-2 text-xs text-[#9be2c8]">快照刷新请求已提交，实时订阅会自动回写最新结果。</div>}
          {refreshState === 'error' && <div className="mt-3 rounded-lg border border-[#e07d6b]/25 bg-[#e07d6b]/10 px-3 py-2 text-xs text-[#f0a091]">快照刷新失败，请检查管理员权限或 Functions 部署状态。</div>}
          <div className="mt-3 grid gap-2 text-sm leading-6 text-white/48">
            <p>支付对象只来自服务端白名单套餐和 Stripe Price ID，前端只请求 Checkout 或 Portal 链接。</p>
            <p>订单、积分、退款、争议状态以已验签 Webhook、本地账本和管理员审计为准，不凭 success_url 改账。</p>
            <p>幂等键贯穿 checkout、webhook_events、credit_ledger 和 refunds，失败记录必须可重放、可审计。</p>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/82">退款/争议复核队列</div>
              <div className="mt-1 text-xs text-white/42">只显示真实集合里处于处理中、失败或需响应的记录。</div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${toneClass(summary.requiresReview > 0 ? 'warning' : 'good')}`}>
              {summary.requiresReview} items
            </span>
          </div>
          {summary.reviewItems.length === 0 ? (
            <EmptyState
              title={summary.hasRecords ? '暂无退款或争议待复核' : '暂无真实支付记录'}
              detail={summary.hasRecords ? '当前没有 processing、failed、needs_response 等状态。' : 'Firestore 尚未读取到 payment_transactions、credit_ledger、refunds 或 webhook_events。'}
              compact
            />
          ) : (
            <div className="divide-y divide-white/8 rounded-lg border border-white/10">
              {summary.reviewItems.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-white/86">{item.providerId}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone(item.status)}`}>{item.status}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${toneClass(item.severity)}`}>{item.kind}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/42">
                      tx: {item.transactionId} / owner: {item.owner} / reason: {item.reason}
                    </div>
                  </div>
                  <div className="font-mono text-sm text-white/68">{item.amount.formatted}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DataPanel({
  section,
  dataset,
  rows,
  loading,
  search,
  statusFilter,
  statusOptions,
  auditActorFilter,
  auditActorOptions,
  auditTargetFilter,
  auditTargetOptions,
  auditTimeFilter,
  canRunActions,
  selectedRecord,
  onSelectRecord,
  onSearch,
  onStatusFilter,
  onAuditActorFilter,
  onAuditTargetFilter,
  onAuditTimeFilter,
}: {
  section: SectionConfig;
  dataset?: AdminDataset;
  rows: AdminRecord[];
  loading: boolean;
  search: string;
  statusFilter: string;
  statusOptions: string[];
  auditActorFilter: string;
  auditActorOptions: string[];
  auditTargetFilter: string;
  auditTargetOptions: string[];
  auditTimeFilter: string;
  canRunActions: boolean;
  selectedRecord?: AdminRecord;
  onSelectRecord: (id: string) => void;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onAuditActorFilter: (value: string) => void;
  onAuditTargetFilter: (value: string) => void;
  onAuditTimeFilter: (value: string) => void;
}) {
  const Icon = section.icon;
  const isAudit = section.key === 'audit';

  if (loading) return <SkeletonGrid />;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0b1213]/88">
      <PanelHeader title={section.label} detail={dataset?.description ?? section.description} icon={Icon} />
      <div className={`grid gap-3 border-b border-white/10 p-4 ${isAudit ? 'lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(150px,auto))_auto]' : 'lg:grid-cols-[1fr_auto_auto]'}`}>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={isAudit ? '搜索 requestId、动作、原因、操作者' : '搜索 ID、名称、状态、owner'}
            className="min-h-11 w-full rounded-lg border border-white/10 bg-white/[0.035] pl-10 pr-3 text-sm outline-none transition placeholder:text-white/28 focus:border-[#78c6a3]/45"
          />
        </label>
        <label className="relative min-w-[180px]">
          <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilter(event.target.value)}
            className="min-h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#0e1718] pl-10 pr-3 text-sm outline-none focus:border-[#78c6a3]/45"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? '全部状态' : status}
              </option>
            ))}
          </select>
        </label>
        {isAudit && (
          <>
            <label className="relative min-w-[170px]">
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
              <select
                value={auditActorFilter}
                onChange={(event) => onAuditActorFilter(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#0e1718] pl-10 pr-3 text-sm outline-none focus:border-[#78c6a3]/45"
              >
                {auditActorOptions.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor === 'all' ? '全部操作者' : actor}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative min-w-[170px]">
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
              <select
                value={auditTargetFilter}
                onChange={(event) => onAuditTargetFilter(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#0e1718] pl-10 pr-3 text-sm outline-none focus:border-[#78c6a3]/45"
              >
                {auditTargetOptions.map((target) => (
                  <option key={target} value={target}>
                    {target === 'all' ? '全部目标集合' : target}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative min-w-[150px]">
              <Clock3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
              <select
                value={auditTimeFilter}
                onChange={(event) => onAuditTimeFilter(event.target.value)}
                className="min-h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#0e1718] pl-10 pr-3 text-sm outline-none focus:border-[#78c6a3]/45"
              >
                <option value="all">全部时间</option>
                <option value="24h">最近 24 小时</option>
                <option value="7d">最近 7 天</option>
                <option value="30d">最近 30 天</option>
              </select>
            </label>
          </>
        )}
        <ServerActionButton enabled={canRunActions} label={section.action} />
      </div>
      {section.key === 'workflows' && <WorkflowHealthStrip rows={dataset?.rows ?? []} />}

      {dataset?.error ? (
        <EmptyState title="集合读取失败" detail={dataset.error} />
      ) : rows.length === 0 ? (
        <EmptyState title="暂无可显示记录" detail="没有读取到真实记录，或当前筛选条件没有匹配项。" />
      ) : (
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DataTable rows={rows} selectedId={selectedRecord?.id} onSelectRecord={onSelectRecord} />
          <RecordInspector section={section} record={selectedRecord} canRunActions={canRunActions} />
        </div>
      )}
    </section>
  );
}

function WorkflowHealthStrip({ rows }: { rows: AdminRecord[] }) {
  const failed = rows.filter((row) => /failed|error|timeout/i.test(row.status)).length;
  const deadLettered = rows.filter((row) => /dead|dead_lettered/i.test(row.status)).length;
  const queued = rows.filter((row) => /queued|retry|processing/i.test(row.status)).length;

  const items = [
    { label: '失败事件', value: failed, tone: failed > 0 ? 'danger' : 'good' },
    { label: '失败死信', value: deadLettered, tone: deadLettered > 0 ? 'danger' : 'good' },
    { label: '重试/处理中', value: queued, tone: queued > 0 ? 'warning' : 'neutral' },
  ] as const;

  return (
    <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className={`rounded-lg border px-4 py-3 ${toneClass(item.tone)}`}>
          <div className="text-xs opacity-75">{item.label}</div>
          <div className="mt-1 font-mono text-2xl font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function DataTable({
  rows,
  selectedId,
  onSelectRecord,
}: {
  rows: AdminRecord[];
  selectedId?: string;
  onSelectRecord: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/35">
          <tr>
            <th className="px-5 py-3 font-medium">记录</th>
            <th className="px-5 py-3 font-medium">状态</th>
            <th className="px-5 py-3 font-medium">归属</th>
            <th className="px-5 py-3 font-medium">金额</th>
            <th className="px-5 py-3 font-medium">时间</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {rows.map((row) => (
            <tr
              key={`${row.collection}-${row.id}`}
              onClick={() => onSelectRecord(row.id)}
              className={`cursor-pointer transition hover:bg-white/[0.035] ${
                selectedId === row.id ? 'bg-[#78c6a3]/8' : ''
              }`}
            >
              <td className="px-5 py-4">
                <div className="font-mono text-sm text-white/88">{row.title}</div>
                <div className="mt-1 max-w-xl truncate text-xs text-white/42">{row.subtitle}</div>
                <div className="mt-1 font-mono text-[11px] text-white/24">{row.collection}/{row.id}</div>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusTone(row.status)}`}>{row.status}</span>
              </td>
              <td className="px-5 py-4 font-mono text-xs text-white/50">{row.owner}</td>
              <td className="px-5 py-4 font-mono text-sm text-white/68">{row.amount ?? '未记录'}</td>
              <td className="px-5 py-4 text-white/48">{formatDate(row.updatedAt ?? row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function valueOf(record: AdminRecord | undefined, keys: string[], fallback = '未记录'): string {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record.raw[key];
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return formatDate(value.toDate());
    }
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? '是' : '否';
    return String(value);
  }
  return fallback;
}

function environmentOf(record: AdminRecord | undefined): string {
  return valueOf(record, ['environment', 'stripeEnvironment', 'providerEnvironment'], '未标记');
}

function RecordInspector({
  section,
  record,
  canRunActions,
}: {
  section: SectionConfig;
  record?: AdminRecord;
  canRunActions: boolean;
}) {
  const [actionState, setActionState] = useState<{
    status: 'idle' | 'submitting' | 'success' | 'error';
    message: string;
    requestId?: string;
  }>({ status: 'idle', message: '' });
  const [roleDraft, setRoleDraft] = useState('seller');
  const [creditDelta, setCreditDelta] = useState('');

  useEffect(() => {
    if (!record) return;
    const currentRole = valueOf(record, ['role'], 'buyer');
    setRoleDraft(currentRole === 'admin' ? 'buyer' : 'seller');
    setCreditDelta('');
    setActionState({ status: 'idle', message: '' });
  }, [record?.id]);

  if (!record) return null;

  const fields = section.key === 'users'
    ? [
        ['邮箱', valueOf(record, ['email'])],
        ['角色', valueOf(record, ['role'])],
        ['积分余额', valueOf(record, ['credits_balance', 'credits'], '0')],
        ['邮箱验证', valueOf(record, ['emailVerified'])],
        ['最近登录', valueOf(record, ['lastLoginAt'])],
      ]
    : section.key === 'refunds'
      ? [
          ['环境', environmentOf(record)],
          ['Stripe 退款 ID', valueOf(record, ['providerRefundId', 'providerDisputeId', 'providerPaymentId'])],
          ['交易 ID', valueOf(record, ['transactionId'])],
          ['金额', record.amount ?? valueOf(record, ['amount'])],
          ['账本影响', valueOf(record, ['ledgerImpact', 'creditImpact'], '需人工复核后确认')],
          ['Webhook 事件', valueOf(record, ['providerEventId', 'lastProviderEventId'])],
          ['审计链路', valueOf(record, ['requestId', 'lastAdminActionRequestId', 'refundId'])],
        ]
      : section.key === 'workflows'
        ? [
            ['工作流', valueOf(record, ['workflowName', 'workflow', 'name'], record.title)],
            ['Provider', valueOf(record, ['provider', 'platform'], 'Activepieces/Node-RED/Windmill')],
            ['状态', record.status],
            ['事件 ID', valueOf(record, ['eventId', 'sourceId', 'requestId'], record.id)],
            ['失败原因', valueOf(record, ['error', 'deadLetterReason', 'failureReason'], '未记录')],
            ['重试次数', valueOf(record, ['attempts', 'retryCount'], '0')],
            ['审计链路', valueOf(record, ['adminActionRequestId', 'lastAdminActionRequestId', 'requestId'])],
          ]
      : section.key === 'payments' || section.key === 'webhooks' || section.key === 'ledger'
        ? [
            ['环境', environmentOf(record)],
            ['归属', record.owner],
            ['状态', record.status],
            ['Stripe/Provider ID', valueOf(record, ['providerPaymentId', 'providerSessionId', 'providerRefundId', 'eventId', 'providerEventId'])],
            ['交易/账本 ID', valueOf(record, ['transactionId', 'requestId'], record.id)],
            ['金额', record.amount ?? valueOf(record, ['amount', 'delta'])],
            ['更新时间', formatDate(record.updatedAt)],
          ]
    : [
        ['归属', record.owner],
        ['状态', record.status],
        ['金额', record.amount ?? '未记录'],
        ['创建时间', formatDate(record.createdAt)],
        ['更新时间', formatDate(record.updatedAt)],
      ];

  const isAuditRequest = section.key === 'audit' && record.collection === 'audit_logs';
  const requestStatus = valueOf(record, ['status'], record.status);
  const requestCanBeReviewed = /pending_approval|dry_run_recorded|execution_failed/i.test(requestStatus);

  const plannedActions: Array<{ label: string; actionType: AdminActionType }> = isAuditRequest
    ? [
        { label: '审批并执行', actionType: 'approve_admin_action' },
        { label: '拒绝请求', actionType: 'reject_admin_action' },
      ]
    : section.key === 'users'
      ? [
          { label: '调整角色', actionType: 'adjust_user_role' },
          { label: '冻结账号', actionType: 'freeze_user' },
          { label: '修正积分', actionType: 'adjust_user_credits' },
          { label: '导出用户审计', actionType: 'export_user_audit' },
        ]
      : [
          { label: '提交复核', actionType: 'submit_review' },
          { label: '重放失败事件', actionType: 'replay_failed_event' },
          { label: '导出摘要', actionType: 'export_record_summary' },
        ];

  const submitAction = async (actionType: AdminActionType, label: string) => {
    const metadata: Record<string, string | number | boolean | null> = {
      section: section.key,
      recordTitle: record.title,
      currentStatus: record.status,
    };

    if (actionType === 'adjust_user_role') {
      metadata.nextRole = roleDraft;
    }

    if (actionType === 'adjust_user_credits') {
      const parsedDelta = Number(creditDelta);
      if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
        setActionState({ status: 'error', message: '请输入非 0 的积分调整量，审批执行时服务端会再次校验。' });
        return;
      }
      metadata.creditDelta = parsedDelta;
    }

    setActionState({ status: 'submitting', message: `${label} 提交中` });
    try {
      const result = actionType === 'approve_admin_action'
        ? await approveAdminAction(record.id, `审批执行管理员动作: ${record.title}`)
        : actionType === 'reject_admin_action'
          ? await rejectAdminAction(record.id, `拒绝管理员动作: ${record.title}`)
          : await runAdminAction({
              actionType,
              targetCollection: record.collection,
              targetId: record.id,
              reason: `提交管理员动作审批: ${label}`,
              metadata,
            });

      if (!result.success) {
        setActionState({
          status: 'error',
          message: result.error || `${label} 未执行，已写入审计错误`,
          requestId: result.requestId,
        });
        return;
      }

      setActionState({
        status: 'success',
        message: actionType === 'approve_admin_action'
          ? '请求已审批并执行，审计日志已回写'
          : actionType === 'reject_admin_action'
            ? '请求已拒绝，审计日志已回写'
            : `${label} 已提交审批，等待在审计页执行`,
        requestId: result.requestId,
      });
    } catch (error) {
      setActionState({
        status: 'error',
        message: error instanceof Error ? error.message : `${label} 提交失败`,
      });
    }
  };

  return (
    <aside className="border-t border-white/10 bg-[#091011]/95 p-5 xl:border-l xl:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-white/35">Record Inspector</div>
          <h3 className="mt-2 text-lg font-semibold">{record.title}</h3>
          <p className="mt-1 break-all font-mono text-xs text-white/36">{record.collection}/{record.id}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs ${statusTone(record.status)}`}>{record.status}</span>
      </div>

      <div className="mt-5 grid gap-2">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2">
            <div className="text-xs text-white/35">{label}</div>
            <div className="mt-1 break-all text-sm font-semibold text-white/82">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-[#d9b46a]/25 bg-[#d9b46a]/10 p-3 text-xs leading-5 text-[#efd18c]">
        {isAuditRequest
          ? '审计请求只能在这里审批或拒绝；服务端会校验权限、动作白名单和目标记录，资金/结算类动作不会被直接执行。'
          : '敏感操作会先写入服务端审批请求，不从前端直接改生产数据。审批执行入口在审计页，所有结果会回写 audit_logs。'}
      </div>

      {section.key === 'users' && !isAuditRequest && (
        <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3">
          <label className="grid gap-2 text-xs text-white/55">
            调整角色目标
            <select
              value={roleDraft}
              onChange={(event) => setRoleDraft(event.target.value)}
              className="min-h-10 rounded-lg border border-white/10 bg-[#0e1718] px-3 text-sm text-white outline-none focus:border-[#78c6a3]/45"
            >
              <option value="buyer">buyer</option>
              <option value="seller">seller</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="grid gap-2 text-xs text-white/55">
            积分调整量
            <input
              value={creditDelta}
              onChange={(event) => setCreditDelta(event.target.value)}
              inputMode="decimal"
              placeholder="例如 100 或 -50"
              className="min-h-10 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-[#78c6a3]/45"
            />
          </label>
        </div>
      )}

      <div className="mt-4 grid gap-2">
        {plannedActions.map((action) => (
          <ServerActionButton
            key={action.actionType}
            enabled={canRunActions && actionState.status !== 'submitting' && (!isAuditRequest || requestCanBeReviewed)}
            label={action.label}
            compact
            onRun={() => void submitAction(action.actionType, action.label)}
          />
        ))}
      </div>

      {actionState.status !== 'idle' && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-xs leading-5 ${
            actionState.status === 'success'
              ? 'border-[#78c6a3]/25 bg-[#78c6a3]/10 text-[#9be2c8]'
              : actionState.status === 'error'
                ? 'border-[#e07d6b]/25 bg-[#e07d6b]/10 text-[#f0a091]'
                : 'border-white/10 bg-white/[0.035] text-white/55'
          }`}
        >
          <div>{actionState.message}</div>
          {actionState.requestId && <div className="mt-1 font-mono text-white/70">requestId: {actionState.requestId}</div>}
        </div>
      )}
    </aside>
  );
}

function ServerActionButton({
  enabled,
  label,
  compact = false,
  onRun,
}: {
  enabled: boolean;
  label: string;
  compact?: boolean;
  onRun?: () => void;
}) {
  const canRun = enabled && Boolean(onRun);

  return (
    <button
      type="button"
      disabled={!canRun}
      onClick={onRun}
      title={canRun ? '提交服务端审批动作' : enabled ? '该动作等待可执行状态或服务端策略' : '需要管理员权限'}
      className={`rounded-lg border px-4 text-sm font-semibold transition active:translate-y-px ${
        canRun
          ? 'border-[#78c6a3]/25 bg-[#78c6a3]/10 text-[#9be2c8] hover:bg-[#78c6a3]/14'
          : 'border-white/10 bg-white/[0.035] text-white/38'
      } ${
        compact ? 'min-h-10 text-left' : 'min-h-11'
      }`}
    >
      {label}
    </button>
  );
}

function SettingsPanel({ canRunActions }: { canRunActions: boolean }) {
  const providers = listPaymentProviderConfigs();
  const gates = [
    { label: '管理员 custom claims', status: 'required', detail: '生产必须由服务端写入 admin/operator/finance/reviewer 权限。' },
    { label: 'Stripe-only 支付通道', status: 'ready', detail: '当前只使用 Stripe Checkout、Customer Portal、Webhook 和服务端退款请求；不启用 Dodo Payments。' },
    { label: 'Webhook 验签与幂等', status: 'required', detail: '支付、退款和争议状态必须来自服务端验签事件、本地账本和审计记录。' },
    { label: '审计日志', status: 'required', detail: '所有敏感动作必须写 audit_logs，禁止只改前端状态。' },
    { label: '免费工作流平台', status: 'ready', detail: 'Activepieces 自托管为主，Node-RED/Windmill 补位，不再使用 n8n 默认链路。' },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-xl border border-white/10 bg-[#0b1213]/88">
        <PanelHeader title="支付配置" detail="只展示密钥引用，不展示真实密钥。" icon={KeyRound} />
        <div className="grid gap-3 p-5">
          {providers.map((provider) => (
            <div key={provider.provider} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{provider.displayName}</div>
                  <div className="mt-1 text-xs text-white/42">{provider.environment}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${statusTone(provider.enabled ? 'active' : 'inactive')}`}>
                  {provider.enabled ? '已启用' : '未启用'}
                </span>
              </div>
              <div className="mt-4 grid gap-2 font-mono text-xs text-white/48">
                <span>secretRef: {provider.secretRef}</span>
                <span>webhookSecretRef: {provider.webhookSecretRef}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0b1213]/88">
        <PanelHeader title="上线闸门" detail="这些不是文案，是生产前必须落地的控制点。" icon={Layers3} />
        <div className="divide-y divide-white/8">
          {gates.map((gate) => (
            <div key={gate.label} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="font-semibold">{gate.label}</div>
                <div className="mt-1 text-sm leading-5 text-white/46">{gate.detail}</div>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs ${statusTone(gate.status)}`}>{gate.status}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-5">
          <button
            type="button"
            disabled={!canRunActions}
            className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${
              canRunActions ? 'bg-white text-[#070b0d]' : 'cursor-not-allowed border border-white/10 bg-white/[0.035] text-white/36'
            }`}
          >
            保存生产配置
          </button>
        </div>
      </section>
    </div>
  );
}

function PanelHeader({ title, detail, icon: Icon }: { title: string; detail: string; icon: LucideIcon }) {
  return (
    <div className="border-b border-white/10 px-5 py-4">
      <div className="flex items-center gap-3">
        <Icon className="text-[#9be2c8]" size={19} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-1 text-sm leading-5 text-white/45">{detail}</p>
    </div>
  );
}

function EmptyState({ title, detail, compact = false }: { title: string; detail: string; compact?: boolean }) {
  return (
    <div className={`grid place-items-center px-5 text-center ${compact ? 'py-8' : 'py-16'}`}>
      <div>
        <CheckCircle2 className="mx-auto mb-3 text-white/28" size={28} />
        <div className="font-semibold text-white/80">{title}</div>
        <div className="mt-2 max-w-lg text-sm leading-6 text-white/42">{detail}</div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/[0.035]" />
      ))}
    </div>
  );
}
