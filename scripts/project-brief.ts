import { execSync } from 'node:child_process';

const mode = process.argv[2] ?? 'brief';

const urls = {
  preview: 'http://127.0.0.1:5173/',
  admin: 'http://127.0.0.1:5173/admin',
  workflows: 'http://127.0.0.1:5173/workflows.html',
  legacyWorkflows: 'http://127.0.0.1:5173/n8n-workflows.html',
  hub: 'http://127.0.0.1:5173/project-hub.html',
  stripeDocs: 'https://docs.stripe.com/payments/payment-methods/overview',
  dodoDocs: 'https://docs.dodopayments.com/developer-resources/mcp-server',
};

const workflowOptions = [
  {
    name: 'Activepieces 自托管社区版',
    fit: 'BloomX 默认生产工作流平台；适合商家审核、售后工单、支付回执、事件总线、通知、失败重试和跨系统编排。',
    note: '免费自托管优先；需要自行维护备份、日志、密钥、监控和权限边界。',
  },
  {
    name: 'Node-RED',
    fit: '基础设施和轻量事件流补位；适合 API 健康巡检、HTTP 转发、内部事件桥接。',
    note: '不承担核心业务审批；复杂权限、审计和业务看板放回 BloomX 后台。',
  },
  {
    name: 'Windmill',
    fit: '脚本型后台任务补位；适合对账、批处理、数据修复、定时结算草稿。',
    note: '更偏工程/运营后台，不面向普通商家。',
  },
];

const workflowStandards = [
  '不再使用 n8n Cloud、Make.com 或其它收费 SaaS 作为默认生产自动化依赖。',
  '所有工作流必须有幂等键、重试策略、超时策略和失败死信记录。',
  '所有外部调用必须使用 Firebase Secret Manager 或自托管平台密钥管理，不允许把 token、API key 或 webhook secret 写进仓库。',
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
  '后台不使用 mock 数据：运营总览、表格、审计和风险项只读取真实 Firestore 集合；空状态会直接显示没有真实记录。',
  '服务端管理员动作 API 已升级为审批状态机：普通动作写入 pending_approval，审计页可审批执行或拒绝。',
  '当前只开放低风险真实执行：冻结/解冻用户、角色/积分带参数审批、提交复核、Webhook/工作流重放排队和审计摘要；支付、退款、结算和配置类动作继续锁定到专用生产 API。',
  '下一步实装 Stripe checkout、webhook、portal 和账本闭环，然后再开放支付相关后台动作。',
];

const sellerApiPlan = [
  '商家 API 商品不允许直接 active；提交后必须走服务端 Provider Adapter 抓模型、逐模型 smoke test、pending_review 管理员审核。',
  '第一批 Provider 类型覆盖 OpenAI、OpenAI Compatible、Anthropic、Gemini、Azure OpenAI、Mistral、Cohere、Groq、Together、OpenRouter、Ollama Gateway、Custom HTTP；AWS Bedrock 先登记类型并阻断，等待专用 SigV4/IAM 连接器。',
  '商家 API 密钥只提交给 Cloud Functions，使用 API_SECRET_ENCRYPTION_KEY 服务端加密保存到 merchantApiSecrets，不写入前端可读商品集合。',
  '测试日志写入 merchantApiTestLogs，商品测试通过才进入 pending_review；测试失败会写入 email_outbox 等待生产邮件服务通知商家。',
  '正式邮件通道必须接 Postmark/SES/Resend 等事务邮件服务，并完成 SPF、DKIM、DMARC 和自定义 Return-Path。',
];

const done = [
  '生产管理员后台：登录白名单、真实 Firestore 数据、审计表、低风险管理员动作审批状态机。',
  '商家 API 入驻：Provider Adapter 规划、密钥服务端加密、测试日志、pending_review 审核链路。',
  '前台交易体验：市场、详情、个人中心、商家后台围绕真实订阅、积分、Key、售后和调用状态重构。',
  '自动化事件层：Firestore 事件触发器、统一 automationWorkflowEvents 日志、签名 Webhook、免费工作流 Secret 命名。',
  '项目入口：预览页、项目总览页、免费工作流页、一键简报命令。',
];

const todo = [
  '把 Activepieces 自托管实例部署起来，并把 4 条业务流 Webhook 写入 WORKFLOW_* Secret。',
  '把 Node-RED API 健康巡检流和 Windmill 月结脚本接入真实环境。',
  '实装 Stripe checkout、webhook、customer portal、积分账本、退款/争议和管理员审核闭环。',
  '用真实商家 API 完成一次测试通过、管理员审核、上架、订阅、成功调用和失败退款。',
  '接入正式事务邮件服务，并完成 SPF、DKIM、DMARC 和 Return-Path。',
  '拆分仍偏大的前端主 chunk，补最小服务层测试。',
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
  console.log(`免费工作流访问页: ${urls.workflows}`);
  console.log(`旧 n8n 入口兼容跳转: ${urls.legacyWorkflows}`);
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
  printList('已经完成', done);
  console.log('');
  printList('还没完成', todo);
  console.log('');
  printList('支付平台规划', paymentPlan);
  console.log('');
  printList('管理员后台进度', adminPlan);
  console.log('');
  printList('商家 API 入驻与审核', sellerApiPlan);
  console.log('');
  console.log('当前交付规则: 中文文档、OpenSpec + Superpowers、Taste + Open Design、不使用 mock 数据或假页面、免费自托管工作流优先、Stripe 首发支付、Dodo Payments MoR 备选、完成后运行验证和自审，通过后推送 GitHub。');
  console.log('建议下一步: 先部署 Activepieces 自托管工作流和 WORKFLOW_* Secret，再实装 Stripe checkout/webhook/portal API。');
}

if (mode === 'links') {
  printLinks();
} else if (mode === 'workflows') {
  printWorkflowOptions();
} else if (mode === 'payments') {
  printList('支付平台规划', paymentPlan);
} else if (mode === 'admin') {
  printList('管理员后台进度', adminPlan);
} else if (mode === 'seller-api') {
  printList('商家 API 入驻与审核', sellerApiPlan);
} else {
  printBrief();
}
