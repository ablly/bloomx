import { useEffect, useMemo, useState } from 'react';
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
  getAdminConsoleSnapshot,
  type AdminDataset,
  type AdminMetric,
  type AdminRecord,
  type AdminRiskItem,
  type AdminSectionKey,
  type AdminSnapshot,
} from '../../services/adminOperationsService';
import { listPaymentProviderConfigs } from '../../services/paymentProviderService';
import { useAuth } from '../../contexts/AuthContext';

const adminRoles = new Set(['admin', 'operator', 'support', 'finance', 'reviewer']);

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
    description: 'Stripe/Dodo 交易、订阅、争议和 checkout 状态。',
    action: '打开支付详情',
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
    description: '退款申请、批准、拒绝、失败和争议处理。',
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

export default function AdminOperations() {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const activeKey = getSection(location.pathname);
  const activeSection = sectionMap.get(activeKey) ?? sections[0];
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const role = String(userProfile?.role ?? (currentUser ? 'buyer' : 'preview'));
  const isPreview = !currentUser;
  const isAuthorized = Boolean(currentUser && adminRoles.has(role));

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getAdminConsoleSnapshot()
      .then((result) => {
        if (!alive) return;
        setSnapshot(result);
      })
      .catch((nextError) => {
        if (!alive) return;
        setError(nextError instanceof Error ? nextError.message : '后台数据读取失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const dataset = snapshot?.datasets[activeKey];
  const statusOptions = useMemo(() => {
    if (!dataset) return ['all'];
    return ['all', ...Object.keys(dataset.statusCounts)];
  }, [dataset]);

  const visibleRows = useMemo(() => {
    const rows = dataset?.rows ?? [];
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const content = `${row.title} ${row.subtitle} ${row.owner} ${row.status} ${row.id}`.toLowerCase();
      return matchesStatus && content.includes(search.trim().toLowerCase());
    });
  }, [dataset, search, statusFilter]);

  const canRunSensitiveActions = isAuthorized && !isPreview;

  if (currentUser && !adminRoles.has(role)) {
    return <AccessDenied role={role} />;
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
              <StatusPill label="身份" value={isPreview ? '预览模式' : role} icon={isAuthorized ? ShieldCheck : LockKeyhole} />
              <StatusPill label="更新" value={snapshot ? formatDate(snapshot.loadedAt) : '读取中'} icon={Clock3} />
            </div>
          </header>

          {isPreview && (
            <section className="mb-6 rounded-lg border border-[#d9b46a]/25 bg-[#d9b46a]/10 p-4 text-sm leading-6 text-[#efd18c]">
              当前是未登录预览。可以查看后台结构、生产闸门和集合读取状态；真实审批、退款、Webhook 重放、结算批准、配置变更必须使用管理员账号和服务端审计 API。
            </section>
          )}

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
              canRunActions={canRunSensitiveActions}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function AccessDenied({ role }: { role: string }) {
  return (
    <main className="min-h-[100dvh] bg-[#070b0d] px-4 py-10 text-white">
      <section className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#0b1213]/90 p-8">
        <ShieldAlert className="mb-4 text-[#d9b46a]" size={32} />
        <h1 className="text-2xl font-semibold">需要管理员权限</h1>
        <p className="mt-3 text-sm leading-6 text-white/58">
          当前账号角色为 {role}。支付对账、积分修正、Webhook 重放、退款复核、商家结算和审计导出必须由授权运营角色执行。
        </p>
        <Link to="/dashboard" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm text-white/74 hover:text-white">
          <ArrowLeft size={16} />
          返回控制台
        </Link>
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

function DataPanel({
  section,
  dataset,
  rows,
  loading,
  search,
  statusFilter,
  statusOptions,
  canRunActions,
  onSearch,
  onStatusFilter,
}: {
  section: SectionConfig;
  dataset?: AdminDataset;
  rows: AdminRecord[];
  loading: boolean;
  search: string;
  statusFilter: string;
  statusOptions: string[];
  canRunActions: boolean;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
}) {
  const Icon = section.icon;

  if (loading) return <SkeletonGrid />;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0b1213]/88">
      <PanelHeader title={section.label} detail={dataset?.description ?? section.description} icon={Icon} />
      <div className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/32" size={16} />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索 ID、名称、状态、owner"
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
        <button
          type="button"
          disabled={!canRunActions}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition active:translate-y-px ${
            canRunActions
              ? 'bg-white text-[#070b0d] hover:bg-white/88'
              : 'cursor-not-allowed border border-white/10 bg-white/[0.035] text-white/36'
          }`}
        >
          {section.action}
        </button>
      </div>

      {dataset?.error ? (
        <EmptyState title="集合读取失败" detail={dataset.error} />
      ) : rows.length === 0 ? (
        <EmptyState title="暂无可显示记录" detail="没有读取到真实记录，或当前筛选条件没有匹配项。" />
      ) : (
        <DataTable rows={rows} />
      )}
    </section>
  );
}

function DataTable({ rows }: { rows: AdminRecord[] }) {
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
            <tr key={`${row.collection}-${row.id}`} className="transition hover:bg-white/[0.025]">
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

function SettingsPanel({ canRunActions }: { canRunActions: boolean }) {
  const providers = listPaymentProviderConfigs();
  const gates = [
    { label: '管理员 custom claims', status: 'required', detail: '生产必须由服务端写入 admin/operator/finance/reviewer 权限。' },
    { label: '支付 Provider 抽象', status: 'ready', detail: 'Stripe 首发，Dodo Payments 保留 MoR 备选。' },
    { label: 'Webhook 验签与幂等', status: 'required', detail: '所有支付状态必须来自服务端验签事件和本地账本。' },
    { label: '审计日志', status: 'required', detail: '所有敏感动作必须写 audit_logs，禁止只改前端状态。' },
    { label: '免费工作流平台', status: 'ready', detail: 'Activepieces 自托管为主，Node-RED/Windmill 补位，n8n 仅迁移参考。' },
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
