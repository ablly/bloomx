import { execSync } from 'node:child_process';

const mode = process.argv[2] ?? 'brief';

const urls = {
  preview: 'http://127.0.0.1:5173/',
  admin: 'http://127.0.0.1:5173/admin',
  workflows: 'http://127.0.0.1:5173/n8n-workflows.html',
  hub: 'http://127.0.0.1:5173/project-hub.html',
  stripeDocs: 'https://docs.stripe.com/payments/payment-methods/overview',
  dodoDocs: 'https://docs.dodopayments.com/developer-resources/mcp-server',
};

const workflowOptions = [
  {
    name: 'Activepieces 自托管社区版',
    fit: 'BloomX 默认生产工作流平台；适合审批、Webhook、通知、失败重试和跨系统编排。',
    note: '需要自建备份、日志、密钥管理、监控和权限边界；n8n Cloud 不作为默认生产依赖。',
  },
  {
    name: 'Node-RED',
    fit: '基础设施和轻量事件流补位；适合健康检查、HTTP 转发、内部事件桥接。',
    note: '不承担核心业务审批；复杂权限、审计和业务看板放回 BloomX 后台。',
  },
  {
    name: 'Windmill',
    fit: '脚本型后台任务补位；适合对账、批处理、数据修复、定时结算草稿。',
    note: '更偏工程/运营后台，不面向普通商家。',
  },
  {
    name: 'n8n 自托管迁移兼容',
    fit: '只用于复用旧模板或临时迁移；不再把 n8n Cloud 当成默认生产方案。',
    note: '如果后续启用，必须确认许可证、备份、版本锁定和自托管运维成本。',
  },
];

const workflowStandards = [
  '所有工作流必须有幂等键、重试策略、超时策略和失败死信记录。',
  '所有外部调用必须使用密钥管理，不允许把 token、API key 或 webhook secret 写进仓库。',
  '关键流程必须记录 requestId、actor、输入摘要、输出摘要、错误、耗时和重放入口。',
  '支付、结算、退款、商家审核必须有管理员复核入口和审计日志。',
  '测试环境与生产环境必须分离，生产变更必须可回滚。',
];

const paymentPlan = [
  '支付路线：Stripe 首发，Dodo Payments 保留 Merchant of Record 备选。',
  'Stripe 首发覆盖 Visa、Mastercard、Alipay 和 WeChat Pay；使用 Checkout Sessions、Billing、Customer Portal 和 Connect Accounts v2。',
  '前端只拿 checkout/portal 链接，不接触 secret key，不直接创建支付对象。',
  '订单、积分、订阅和退款状态以服务端账本和已验签 Webhook 为准，不能只凭 success_url 改状态。',
  'Dodo Payments 后续用于 MoR、全球税务、VAT/GST、争议和跨境销售合规的备选路线。',
  '上线前必须完成 Webhook raw body 验签、幂等处理、测试模式、退款/争议、对账页和管理员审计。',
];

const adminPlan = [
  '/admin 现在要求登录；未登录不会看到后台数据面板。',
  '默认只允许 zqhablly@gmail.com 进入后台，可用 VITE_ADMIN_ALLOWED_EMAILS 扩展白名单。',
  '管理员密码不写入代码、文档或仓库，只在登录时提交给认证服务。',
  'Firestore 已限制后台运营集合：支付交易、积分账本、退款、Webhook、结算、工作流事件和审计日志禁止前端写入。',
  '服务端管理员动作 API 已有 dry-run 基座：后台按钮可写 audit_logs 并返回 requestId，但暂不直接改生产数据。',
  '下一步把 dry-run 升级为真实审批动作：商家审核、商品上下架、退款复核、Webhook 重放、结算批准、权限变更和配置保存。',
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
  console.log(`管理员后台: ${urls.admin}`);
  console.log(`工作流访问页: ${urls.workflows}`);
  console.log(`项目总览页: ${urls.hub}`);
  console.log(`Stripe 支付方式文档: ${urls.stripeDocs}`);
  console.log(`Dodo Payments MCP 文档: ${urls.dodoDocs}`);
}

function printList(title: string, items: string[]) {
  console.log(title);
  console.log('');
  for (const item of items) console.log(`- ${item}`);
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
  printList('生产标准', workflowStandards);
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
  printList('支付平台规划', paymentPlan);
  console.log('');
  printList('管理员后台进度', adminPlan);
  console.log('');
  console.log('当前交付规则: 中文文档、OpenSpec + Superpowers、Taste + Open Design、免费自托管工作流优先、Stripe 首发支付、Dodo Payments MoR 备选、完成后运行验证和自审，通过后推送 GitHub。');
  console.log('建议下一步: 先把 Admin Action dry-run 升级为真实可审批动作，再实装 Stripe checkout/webhook/portal API。');
}

if (mode === 'links') {
  printLinks();
} else if (mode === 'workflows') {
  printWorkflowOptions();
} else if (mode === 'payments') {
  printList('支付平台规划', paymentPlan);
} else if (mode === 'admin') {
  printList('管理员后台进度', adminPlan);
} else {
  printBrief();
}
