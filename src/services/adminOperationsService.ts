import {
  collection,
  getDocs,
  limit,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type AdminSectionKey =
  | 'overview'
  | 'users'
  | 'sellers'
  | 'products'
  | 'orders'
  | 'payments'
  | 'ledger'
  | 'refunds'
  | 'workflows'
  | 'webhooks'
  | 'settlements'
  | 'audit'
  | 'settings';

export interface AdminRecord {
  id: string;
  collection: string;
  title: string;
  subtitle: string;
  status: string;
  owner: string;
  amount?: string;
  updatedAt?: Date;
  createdAt?: Date;
  raw: Record<string, unknown>;
}

export interface AdminDataset {
  key: AdminSectionKey;
  collectionName: string;
  label: string;
  description: string;
  rows: AdminRecord[];
  statusCounts: Record<string, number>;
  error?: string;
}

export interface AdminMetric {
  label: string;
  value: string;
  detail: string;
  tone: 'neutral' | 'good' | 'warning' | 'danger';
}

export interface AdminQueueItem {
  id: string;
  title: string;
  section: AdminSectionKey;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  owner: string;
  createdAt?: Date;
}

export interface AdminRiskItem {
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AdminSnapshot {
  datasets: Record<AdminSectionKey, AdminDataset>;
  metrics: AdminMetric[];
  queue: AdminQueueItem[];
  risks: AdminRiskItem[];
  loadedAt: Date;
}

const datasetConfigs: Array<Omit<AdminDataset, 'rows' | 'statusCounts' | 'error'>> = [
  {
    key: 'users',
    collectionName: 'users',
    label: '用户',
    description: '账号、角色、积分余额、登录状态和风险处置。',
  },
  {
    key: 'sellers',
    collectionName: 'sellers',
    label: '商家',
    description: '商家状态、KYC、余额、商品数量和结算资格。',
  },
  {
    key: 'products',
    collectionName: 'products',
    label: 'API 商品',
    description: '上架审核、价格、模型、可用性和安全配置。',
  },
  {
    key: 'orders',
    collectionName: 'purchases',
    label: '订单',
    description: '用户购买、授权、过期和撤销记录。',
  },
  {
    key: 'payments',
    collectionName: 'payment_transactions',
    label: '支付交易',
    description: 'Stripe Checkout、Customer Portal、退款请求、支付失败和争议。',
  },
  {
    key: 'ledger',
    collectionName: 'credit_ledger',
    label: '积分账本',
    description: '充值、消耗、退款、迁移和管理员修正。',
  },
  {
    key: 'refunds',
    collectionName: 'refunds',
    label: '退款',
    description: 'Stripe 退款申请、服务端执行、Webhook 回执、失败和争议联动。',
  },
  {
    key: 'workflows',
    collectionName: 'automationWorkflowEvents',
    label: '工作流',
    description: 'Activepieces/Node-RED/Windmill 事件、重试和死信。',
  },
  {
    key: 'webhooks',
    collectionName: 'webhook_events',
    label: 'Webhook',
    description: '支付与业务 Webhook 验签、处理、重放和失败。',
  },
  {
    key: 'settlements',
    collectionName: 'seller_settlements',
    label: '结算',
    description: '商家月结、平台费、退款抵扣和付款状态。',
  },
  {
    key: 'audit',
    collectionName: 'audit_logs',
    label: '审计',
    description: '管理员敏感操作、原因、前后状态和 requestId。',
  },
];

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

function stringify(value: unknown, fallback = '未记录'): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function money(data: DocumentData): string | undefined {
  const amount = data.amount ?? data.grossAmount ?? data.gross_amount ?? data.netAmount ?? data.total_earnings;
  const currency = data.currency ?? 'USD';
  if (typeof amount !== 'number') return undefined;
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function recordTitle(id: string, data: DocumentData): string {
  return stringify(
    data.name ??
      data.email ??
      data.product_name ??
      data.providerPaymentId ??
      data.providerSessionId ??
      data.eventId ??
      data.action ??
      data.title,
    id,
  );
}

function recordSubtitle(data: DocumentData): string {
  return stringify(
    data.description ??
      data.provider ??
      data.product_url ??
      data.eventType ??
      data.reason ??
      data.source ??
      data.planId ??
      data.period,
    '无补充信息',
  );
}

function recordOwner(data: DocumentData): string {
  return stringify(
    data.uid ??
      data.userId ??
      data.user_id ??
      data.sellerId ??
      data.seller_id ??
      data.actorId ??
      data.buyer_id ??
      data.email,
    '未归属',
  );
}

function recordStatus(data: DocumentData): string {
  return stringify(
    data.status ??
      data.processingStatus ??
      data.signatureStatus ??
      data.kyc_status ??
      data.is_active ??
      data.asset_verified,
    'unknown',
  );
}

function mapRecord(collectionName: string, docSnap: QueryDocumentSnapshot<DocumentData>): AdminRecord {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    collection: collectionName,
    title: recordTitle(docSnap.id, data),
    subtitle: recordSubtitle(data),
    status: recordStatus(data),
    owner: recordOwner(data),
    amount: money(data),
    createdAt: asDate(data.createdAt ?? data.created_at ?? data.receivedAt),
    updatedAt: asDate(data.updatedAt ?? data.updated_at ?? data.processedAt ?? data.reviewed_at),
    raw: data,
  };
}

function countStatuses(rows: AdminRecord[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}

async function readDataset(config: (typeof datasetConfigs)[number], maxRows: number): Promise<AdminDataset> {
  try {
    const snap = await getDocs(query(collection(db, config.collectionName), limit(maxRows)));
    const rows = snap.docs.map((docSnap) => mapRecord(config.collectionName, docSnap));
    return {
      ...config,
      rows,
      statusCounts: countStatuses(rows),
    };
  } catch (error) {
    return {
      ...config,
      rows: [],
      statusCounts: {},
      error: error instanceof Error ? error.message : '读取失败',
    };
  }
}

function buildMetrics(datasets: Record<AdminSectionKey, AdminDataset>): AdminMetric[] {
  const sellers = datasets.sellers.rows;
  const products = datasets.products.rows;
  const payments = datasets.payments.rows;
  const webhooks = datasets.webhooks.rows;
  const refunds = datasets.refunds.rows;
  const workflowErrors = datasets.workflows.rows.filter((row) => /fail|dead|error/i.test(row.status)).length;
  const failedWebhooks = webhooks.filter((row) => /fail|dead/i.test(row.status)).length;
  const pendingRefunds = refunds.filter((row) => /requested|reviewing|processing/i.test(row.status)).length;

  return [
    {
      label: '待审核商家',
      value: String(sellers.filter((row) => /pending|reviewing|none/i.test(row.status)).length),
      detail: '需要人工复核 KYC、资产和结算资格',
      tone: sellers.some((row) => /pending|reviewing|none/i.test(row.status)) ? 'warning' : 'good',
    },
    {
      label: '可售 API',
      value: String(products.filter((row) => /active|approved/i.test(row.status)).length),
      detail: `共读取 ${products.length} 个商品记录`,
      tone: products.length > 0 ? 'good' : 'neutral',
    },
    {
      label: '支付交易',
      value: String(payments.length),
      detail: '以本地账本和已验签 Webhook 为准',
      tone: payments.some((row) => /failed|disputed|cancelled/i.test(row.status)) ? 'danger' : 'neutral',
    },
    {
      label: '故障队列',
      value: String(failedWebhooks + workflowErrors + pendingRefunds),
      detail: 'Webhook、工作流和退款需要运营处理',
      tone: failedWebhooks + workflowErrors + pendingRefunds > 0 ? 'danger' : 'good',
    },
  ];
}

function buildQueue(datasets: Record<AdminSectionKey, AdminDataset>): AdminQueueItem[] {
  const watch: Array<{ section: AdminSectionKey; pattern: RegExp; reason: string; severity: AdminQueueItem['severity'] }> = [
    { section: 'sellers', pattern: /pending|reviewing|none/i, reason: '商家/KYC 等待人工审核', severity: 'medium' },
    { section: 'products', pattern: /pending|inactive|rejected/i, reason: '商品需要审核、修复或下架复核', severity: 'medium' },
    { section: 'refunds', pattern: /requested|reviewing|processing|failed/i, reason: '退款需要复核或异常处理', severity: 'high' },
    { section: 'webhooks', pattern: /failed|dead_lettered|unchecked/i, reason: 'Webhook 验签或处理失败', severity: 'high' },
    { section: 'workflows', pattern: /failed|dead|error|timeout/i, reason: '自动化工作流进入失败队列', severity: 'high' },
    { section: 'settlements', pattern: /draft|reviewing|failed/i, reason: '商家结算等待复核或失败', severity: 'medium' },
  ];

  return watch
    .flatMap((item) =>
      datasets[item.section].rows
        .filter((row) => item.pattern.test(row.status))
        .map((row) => ({
          id: row.id,
          title: row.title,
          section: item.section,
          severity: item.severity,
          reason: item.reason,
          owner: row.owner,
          createdAt: row.createdAt,
        })),
    )
    .slice(0, 12);
}

function buildRisks(datasets: Record<AdminSectionKey, AdminDataset>): AdminRiskItem[] {
  const risks: AdminRiskItem[] = [];
  const failedReads = Object.values(datasets).filter((dataset) => dataset.error);
  const auditRows = datasets.audit.rows.length;
  const webhookRows = datasets.webhooks.rows.length;
  const ledgerRows = datasets.ledger.rows.length;

  if (failedReads.length > 0) {
    risks.push({
      title: '后台数据权限未打通',
      detail: `${failedReads.length} 个集合读取失败，先检查 Firestore rules、管理员 custom claims 和索引。`,
      severity: 'high',
    });
  }

  if (auditRows === 0) {
    risks.push({
      title: '审计日志为空',
      detail: '生产后台的所有敏感操作必须写入 audit_logs，包含 actor、reason、before/after 和 requestId。',
      severity: 'high',
    });
  }

  if (webhookRows === 0 || ledgerRows === 0) {
    risks.push({
      title: '支付闭环证据不足',
      detail: '支付、退款、争议和积分账本必须形成可核验链路，支付上线前不能只依赖前端状态。',
      severity: 'medium',
    });
  }

  if (risks.length === 0) {
    risks.push({
      title: '后台基础链路正常',
      detail: '继续补服务端动作 API、审批策略和自动化工作流 smoke test。',
      severity: 'low',
    });
  }

  return risks;
}

export async function getAdminConsoleSnapshot(maxRows = 40): Promise<AdminSnapshot> {
  const resolved = await Promise.all(datasetConfigs.map((config) => readDataset(config, maxRows)));
  const baseDatasets: Partial<Record<AdminSectionKey, AdminDataset>> = {
    overview: {
      key: 'overview',
      collectionName: 'overview',
      label: '总览',
      description: '运营概览',
      rows: [],
      statusCounts: {},
    },
    settings: {
      key: 'settings',
      collectionName: 'settings',
      label: '系统配置',
      description: '支付、工作流、权限和上线闸门',
      rows: [],
      statusCounts: {},
    },
  };

  const datasets = resolved.reduce<Partial<Record<AdminSectionKey, AdminDataset>>>(
    (acc, dataset) => {
      acc[dataset.key] = dataset;
      return acc;
    },
    baseDatasets,
  ) as Record<AdminSectionKey, AdminDataset>;

  return {
    datasets,
    metrics: buildMetrics(datasets),
    queue: buildQueue(datasets),
    risks: buildRisks(datasets),
    loadedAt: new Date(),
  };
}
