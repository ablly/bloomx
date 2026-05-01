import { execSync } from 'node:child_process';

const mode = process.argv[2] ?? 'brief';

const urls = {
  preview: 'http://127.0.0.1:5173/',
  n8n: 'http://127.0.0.1:5173/n8n-workflows.html',
  hub: 'http://127.0.0.1:5173/project-hub.html',
  n8nCloud: 'https://ablly.app.n8n.cloud',
  dodoDocs: 'https://docs.dodopayments.com/developer-resources/mcp-server',
};

const workflowOptions = [
  {
    name: 'Activepieces 自托管社区版',
    fit: 'BloomX 默认生产工作流平台；MIT core，适合审批、Webhook、通知、失败重试和跨系统编排。',
    note: '企业功能另有商业版；生产要自建备份、日志、密钥、监控和权限边界。',
  },
  {
    name: 'Node-RED',
    fit: '基础设施和轻量事件流补位；适合健康检查、HTTP 转发、内部事件桥接。',
    note: '不作为核心业务审批平台；复杂权限、审计和业务看板放回 BloomX 管理后台。',
  },
  {
    name: 'Windmill',
    fit: '脚本型后台任务补位；适合批处理、对账、数据修复、定时结算草稿。',
    note: '比可视化工作流更工程化；面向开发/运营后台，不面向普通商家。',
  },
  {
    name: 'n8n 自托管迁移兼容',
    fit: '只用于复用既有 n8n 模板或临时迁移；不再使用 n8n Cloud 作为默认生产依赖。',
    note: '需要确认许可证、备份、版本锁定和自托管运维成本。',
  },
];

const productionWorkflowStandards = [
  '所有工作流必须有幂等键、重试策略、超时策略和失败死信记录。',
  '所有外部调用必须使用密钥管理，不允许把 token、API key 或 webhook secret 写进仓库。',
  '关键流程必须记录 requestId、actor、input summary、output summary、error、duration 和重放入口。',
  '支付、结算、退款、商家审核必须有管理员复核入口和审计日志。',
  '测试环境与生产环境必须分离，Webhook 必须验签，生产变更必须可回滚。',
];

const paymentPlan = [
  'Dodo Payments 作为默认支付平台候选，用于一次性付款、订阅、积分充值、退款和后续用量/积分账单。',
  'Dodo MCP 分两类：Payments MCP 负责 API 操作，Knowledge MCP 负责文档搜索；本项目后续接入前必须配置测试 API key 和 webhook key。',
  '支付链路必须服务端落单：前端只拿 checkout/portal 链接，订单状态以 Dodo Webhook 和本地账本为准。',
  '必须建立 payment_transactions、credit_ledger、subscriptions、refunds、seller_settlements、webhook_events 等账本集合。',
  '上线前必须完成测试模式、Webhook 验签、幂等处理、退款/争议、税务/MoR 责任确认和管理员对账页。',
];

const adminPlan = [
  '需要管理员后台，而且是生产必需，不是锦上添花。',
  '最低范围：用户、商家申请、API 商品审核、订单/订阅、积分账本、退款、工作流运行、Webhook 事件、结算、审计日志、系统配置。',
  '权限至少分为 admin、operator、support、finance、reviewer；所有敏感操作必须写审计日志。',
];

function run(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '无法读取';
  }
}

function printLinks() {
  console.log('BloomX 常用入口');
  console.log('');
  console.log('启动本地预览: npm run dev -- --host 127.0.0.1');
  console.log(`项目预览页: ${urls.preview}`);
  console.log(`n8n 工作流访问页: ${urls.n8n}`);
  console.log(`项目总览页: ${urls.hub}`);
  console.log(`n8n 云端实例: ${urls.n8nCloud}`);
  console.log(`Dodo Payments MCP 文档: ${urls.dodoDocs}`);
}

function printWorkflowOptions() {
  console.log('免费/开源工作流路线');
  console.log('');
  for (const option of workflowOptions) {
    console.log(`- ${option.name}`);
    console.log(`  适合: ${option.fit}`);
    console.log(`  注意: ${option.note}`);
  }
  console.log('');
  console.log('生产标准');
  for (const item of productionWorkflowStandards) {
    console.log(`- ${item}`);
  }
}

function printPaymentPlan() {
  console.log('Dodo Payments 支付规划');
  console.log('');
  for (const item of paymentPlan) {
    console.log(`- ${item}`);
  }
}

function printAdminPlan() {
  console.log('管理员后台判断');
  console.log('');
  for (const item of adminPlan) {
    console.log(`- ${item}`);
  }
}

function printBrief() {
  const branch = run('git branch --show-current');
  const commit = run('git rev-parse --short HEAD');
  const dirtyCount = run('git status --short').split(/\r?\n/).filter(Boolean).length;

  console.log('BloomX 简报');
  console.log('');
  console.log(`当前分支: ${branch}`);
  console.log(`当前提交: ${commit}`);
  console.log(`未提交变更数量: ${dirtyCount}`);
  console.log('');
  printLinks();
  console.log('');
  printWorkflowOptions();
  console.log('');
  printPaymentPlan();
  console.log('');
  printAdminPlan();
  console.log('');
  console.log('当前交付规则: 中文文档、OpenSpec + Superpowers、Taste + Open Design、Activepieces 免费自托管优先、Dodo Payments 支付方向、完成后运行验证和自审、审核通过后推送 GitHub。');
  console.log('当前建议下一步: 先做管理员后台 MVP + 商家入驻审核工作流 + Dodo Payments 测试支付规格，形成真正可运营闭环。');
}

if (mode === 'links') {
  printLinks();
} else if (mode === 'workflows') {
  printWorkflowOptions();
} else if (mode === 'payments') {
  printPaymentPlan();
} else if (mode === 'admin') {
  printAdminPlan();
} else {
  printBrief();
}
