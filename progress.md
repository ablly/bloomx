# 项目进度日志

## 2026-04-28 设计系统、WebGL 与 Make 工作流更新

- 已新增 `DESIGN.md`，明确 BloomX 的设计方向：可信交易、清晰结算、深色非纯黑、输入高对比、按钮状态完整。
- 已新增 `dna/bloomx/product-dna.md`，把项目定义固定为“商家出售闲置大模型 API 能力，用户用积分订阅并调用”的双边交易市场。
- 已新增 `MAKE_WORKFLOWS.md`，规划商家审核、API 健康巡检、充值发票、商家月结、售后工单 5 条 Make.com 自动化场景。
- 已接入 `playcanvas`，新增 `WebGLMarketField`，用 PlayCanvas WebGL 做可交互的买家、平台路由、商家供给网络背景。
- 已修复登录/注册弹窗输入框颜色，避免浅色输入框导致用户看不清输入内容。
- 已重写 `/dashboard` 个人中心关键中文文案，修复乱码并统一商业化控制台语气。
- 已更新中文 i18n 资源，主站中文与英文切换更完整。
- 已提交并推送到 GitHub：`d66b042 Refine BloomX design system and WebGL background`。
- `npm run build` 通过；Cloudflare 直接部署被阻止，原因是本机缺少 `CLOUDFLARE_API_TOKEN`。

## 下一步

1. 在 Cloudflare 里重新部署 GitHub 最新提交，或提供 `CLOUDFLARE_API_TOKEN` 让我直接部署。
2. 用线上 `https://bloomx.pages.dev/` 再测注册、验证码、登录、商家 API 上架前测试、用户订阅和真实调用。
3. 补齐 Make.com Webhook URL，把商家审核、售后工单和月结报表接到真实自动化场景。
4. 继续清理 Marketplace、Seller Dashboard、Product Detail 里残留的旧页面结构和硬编码文案。

## 2026-04-28 商家 API 交易闭环更新

- 已明确产品赛道：BloomX 是类似“闲鱼式”的模型 API 能力交易平台。
- 商家可以提交模型名称、API URL、API Key、价格和说明。
- 新增 `testMerchantApi` Cloud Function，商家 API 必须测试通过才允许上架。
- `invokeMerchantModel` 已改为 OpenAI 兼容请求体，用户调用失败会自动退款。
- 商家控制台已重写为：商家入驻、API 上架、市场订阅、积分与密钥、调用测试、结算与售后。
- 注册/登录弹窗已重写，中文和英文都可读，验证码流程指向真实邮箱。
- 全局输入框改为深色高对比，解决输入内容看不清的问题。
- `/dashboard` 个人中心已重写为更成熟的商业化结构。
- 主页模型清单已替换为当前主流模型方向。
- `npm --prefix functions run build` 通过。
- `npm run build` 通过。
- Firebase Functions 已部署成功。
- 最新进度已写入真实 Firestore：
  - `projectProgress/current`
  - `projectProgressReviews/review-20260428-045346`

## 当前阻塞

- Cloudflare Pages 还需要添加 `VITE_INVOKE_MERCHANT_MODEL_URL`。
- 真实支付、商家提现、售后工单和平台后台审核还未完成。
- 旧 Marketplace / Seller 子页面仍有部分硬编码英文，下一轮继续统一。

## 2026-04-28 Make.com 工作流网关补齐

- 已新增 `functions/src/makeWorkflows.ts`，把 Firestore 业务事件统一转成 Make Webhook 事件。
- 已导出 6 个 Functions：商家申请、售后工单、根交易、用户子交易、月结快照、API 健康快照。
- 已新增 `makeWorkflowEvents` 投递日志，支持 `delivered`、`failed`、`skipped` 三种状态。
- 已加 `X-BloomX-Signature` HMAC 签名头，Make 场景可校验事件来源。
- 已新增 `npm run make:hooks` 辅助脚本，可在提供 `MAKE_API_TOKEN` 和 `MAKE_TEAM_ID` 后创建或复用 5 个 Make Webhook。
- 已重写 `MAKE_WORKFLOWS.md`，从手工规划升级为 Webhook 命名、Secret、事件负载、场景模块和验证步骤。
- `npm --prefix functions run build` 通过。

## 2026-04-28 售后工单闭环补齐

- 已在 `CommercePlatformRuntime` 的“结算与售后”页新增真实工单提交表单。
- 用户可选择一条 `apiCallRecords`，标记 API 失败、质量异常、重复扣费或其他问题，并写入 `supportTickets`。
- 已展示用户自己的工单历史和处理状态。
- 已更新 Firestore rules，允许用户创建和读取自己的 `supportTickets`，管理员可更新/删除。
- 这会触发 `onSupportTicketCreated`，后续 Make Webhook 配好后自动通知运营。

## 2026-04-28 平台审核台补齐

- 已修复 `seller_applications` 字段契约：写入 `user_id`，同时兼容旧的 `uid` 字段读取。
- `CommercePlatformRuntime` 保存商家资料时会创建 `seller_applications/{uid}`，让 Make 商家审核工作流有真实触发源。
- 管理员用户会看到“平台审核”标签，可处理待审核商家申请。
- 审核通过会同步 `sellerProfiles/{uid}.status=verified`，并把 `users/{uid}.role` 更新为 `seller`。
- 管理员也可在同一审核台把售后工单推进到 `reviewing` 或 `resolved`。

## 下一步

1. 推送 GitHub 并等待 Cloudflare 自动部署。
2. 在 Cloudflare Pages 环境变量中添加：
   `VITE_INVOKE_MERCHANT_MODEL_URL=https://us-central1-bloomx-core-infra-26.cloudfunctions.net/invokeMerchantModel`
3. 重新部署 Cloudflare Pages。
4. 在 Make 创建 5 个 Custom Webhook，并把 URL 写入 Firebase Secret Manager。
5. 部署新增 Functions，提交一条商家申请并确认 `makeWorkflowEvents` 为 `delivered`。
6. 用一个真实 OpenAI 兼容商家 API 测试“上架前测试”。
7. 注册新用户并完成邮箱验证码闭环。
8. 订阅模型并测试成功调用、失败调用、扣费、退款、调用记录。

## 2026-04-28 Make MCP 工具箱对接

- 已确认 Make MCP 地址可以通过项目脚本连接。
- 当前 Make MCP 工具箱暴露工具数量为 0，说明还需要在 Make 页面里点击“+ 添加”，把 BloomX 场景发布为 MCP 工具。
- 已新增 `make/toolflows.bloomx.json`，固定 5 条 BloomX 自动化场景的 MCP 工具名、Webhook Secret、触发源、推荐 Make 模块和验收标准。
- 已新增 `npm run make:mcp:doctor`，用于检查 MCP 是否连通以及 5 个 BloomX 工具是否已经暴露。
- 已更新 `MAKE_WORKFLOWS.md`，把配置路径从单纯 Webhook 升级为 MCP 工具箱 + Webhook 双路径。

## 2026-04-29 n8n 自动化工作流替代方案

- 已确认当前本地可用工具里没有直接暴露 n8n MCP 控制工具，因此不依赖未授权的第三方连接器直接改 n8n 实例。
- 已查明 n8n 官方支持 MCP Server Trigger，适合后续把 n8n 工作流暴露给 AI 调用。
- 当前生产链路改为 n8n Webhook：Cloud Functions 会投递到 `N8N_*_WEBHOOK`，不再要求 Make Secret。
- 投递日志从 Make 专属语义升级到 `automationWorkflowEvents`。
- 已新增 5 个 n8n 工作流模板：
  - `n8n/workflows/bloomx-seller-application.json`
  - `n8n/workflows/bloomx-support-ticket.json`
  - `n8n/workflows/bloomx-payment-success.json`
  - `n8n/workflows/bloomx-monthly-settlement.json`
  - `n8n/workflows/bloomx-api-health.json`
- 已新增 `N8N_WORKFLOWS.md` 和 `n8n/README.md`，说明导入、激活、Secret 配置和验证步骤。
- 已新增 `npm run n8n:doctor`，可在提供 `N8N_BASE_URL` 和 `N8N_API_KEY` 后检查 n8n API 和 BloomX 工作流存在性。

## 2026-04-29 n8n MCP 实例操作完成

- 已连接用户提供的 n8n 远程 MCP server，工具数量为 25。
- 已通过 MCP 在 n8n 个人项目中创建并发布 5 条 BloomX 工作流：
  - `BloomX - Seller application review`
  - `BloomX - Support ticket triage`
  - `BloomX - Payment success receipt`
  - `BloomX - Monthly settlement snapshot`
  - `BloomX - API health monitor`
- 5 条工作流均为 active，并且 `availableInMCP=true`。
- 已将真实 workflow ID 写入 `N8N_WORKFLOWS.md` 和 `n8n/workflow-map.bloomx.json`；Production Webhook URL 只保存在 Firebase Secret Manager。
- 已新增 `npm run n8n:mcp:doctor`，用于检查远程 n8n MCP 连接和 BloomX 工作流状态。
- 已对 5 个 Production Webhook 进行 smoke test，全部返回 `ok=true`。
- Firebase Secret Manager 写入被本机 Firebase 登录过期阻止，需要先执行 `firebase login --reauth` 后再写入 `N8N_*_WEBHOOK`。

## 2026-04-29 BloomX 全项目事件总线

- 已新增 `N8N_EVENT_BUS_WEBHOOK` Secret。
- 已通过 n8n MCP 创建并发布 `BloomX - Event bus`，Workflow ID：`RUKS05m8KFQsDYSP`。
- Event bus Production URL 已写入 `N8N_EVENT_BUS_WEBHOOK`，仓库只保留 Secret 名称与路径。
- 已新增 Firestore 触发器，把用户、邮箱、商家、商品、API 上架、API 调用、订阅和购买等二级事件统一投递到 n8n event bus。
- 已写入 6 个 n8n Webhook Secret 到 Firebase Secret Manager。
- 已部署 Firebase Functions，新增/更新的 n8n 自动化触发器已上线。
- 已完成线上闭环 smoke test：写入 `email_logs/n8n-smoke-1777436102281` 后，`automationWorkflowEvents` 记录状态为 `delivered`，n8n event bus 返回 HTTP 200。
