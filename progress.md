# 项目进度日志

## 2026-05-02 免费工作流路线纠偏

- 用户明确不再使用 n8n，项目默认自动化路线已改为免费自托管工作流栈。
- 后端自动化投递从 `N8N_*` Secret 改为通用 `WORKFLOW_*` Secret。
- 默认 provider 变更为：
  - `activepieces`：商家审核、售后工单、支付回执、事件总线。
  - `node-red`：API 健康巡检。
  - `windmill`：商家月结快照。
- 保留 `automationWorkflowEvents` 作为统一投递日志，继续记录 delivered / failed / skipped、provider 状态和响应摘要。
- 新增 `WORKFLOWS.md`、`workflows/README.md`、`workflows/free-workflow-map.bloomx.json`。
- 新增 `npm run workflow:doctor`，只检查仓库侧免费工作流映射，不连接任何商业平台。
- 新增 `/workflows.html` 免费工作流访问页；旧 `/n8n-workflows.html` 只做兼容跳转。
- 删除 n8n 模板、n8n doctor、Make MCP / hook 脚本和旧 Make / n8n 工作流文档。
- 更新 OpenSpec delivery 规格：新自动化默认 Activepieces，自托管轻量/脚本场景可用 Node-RED / Windmill，禁止把 n8n 或 Make 作为默认生产依赖。

## 已完成的主链路

- 生产管理员后台：登录白名单、真实 Firestore 数据、审计表、低风险管理员动作审批状态机。
- 商家 API 入驻：Provider Adapter 规划、密钥服务端加密、测试日志、pending_review 审核链路。
- 前台交易体验：市场、详情、个人中心、商家后台围绕真实订阅、积分、Key、售后和调用状态重构。
- 自动化事件层：Firestore 事件触发器、统一 `automationWorkflowEvents` 日志、签名 Webhook、免费工作流 Secret 命名。
- 项目入口：预览页、项目总览页、免费工作流页、一键简报命令。

## 当前阻塞

- GitHub 推送仍依赖本机能访问 `github.com:443`；上次推送因网络连接失败，本地 `main` 仍 ahead 远端。
- 免费工作流实例尚未部署：Activepieces、Node-RED、Windmill 都需要实际自托管地址和 Webhook URL。
- `WORKFLOW_*` Secret 尚未写入 Firebase Secret Manager。
- Cloudflare Pages 仍需补 `VITE_INVOKE_MERCHANT_MODEL_URL` 并重新部署。

## 下一步

1. 部署 Activepieces 自托管社区版。
2. 建立商家审核、售后工单、支付回执、事件总线 4 条 Activepieces 工作流。
3. 部署 Node-RED API 健康巡检流。
4. 部署 Windmill 月结快照脚本。
5. 写入 `WORKFLOW_*` Secret 并部署 Firebase Functions。
6. 做一次 Firestore 到免费工作流的 smoke test，确认 `automationWorkflowEvents.status=delivered`。
7. 实装 Stripe checkout、webhook、portal 和积分/订单/退款账本。
