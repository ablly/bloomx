# BloomX n8n 自动化工作流

更新时间：2026-04-29

## 结论

n8n 比 Make 更适合 BloomX 当前阶段。原因是 BloomX 的核心需求是“业务事件触发自动化”：商家申请、售后工单、支付成功、月结、API 健康巡检。这类链路用 n8n 的普通 Webhook 工作流最直接、最稳定。

n8n 也支持 MCP。推荐路径是：

1. 生产业务事件先走 Webhook。
2. 等 Webhook 跑稳后，再用 n8n 的 `MCP Server Trigger` 暴露“人工/AI 按需调用”的工具。

## 项目侧已经完成

- Cloud Functions 自动化网关已改为 n8n。
- 配置了 `N8N_*_WEBHOOK` 后，事件会投递到 n8n。
- 投递日志写入 Firestore：`automationWorkflowEvents`。
- 已提供 5 个 n8n 工作流模板：`n8n/workflows/*.json`。
- 已提供工作流地图：`n8n/workflow-map.bloomx.json`。
- 已提供 n8n API 自检命令：`npm run n8n:doctor`。
- 已安装 n8n 相关技能：工作流模式、MCP 工具、节点配置、表达式、验证和 JavaScript Code 节点。
- 已安装并注册本机 `n8n-mcp@2.48.0` 到 Codex MCP 配置。
- 已通过你提供的 n8n 远程 MCP 创建并发布 5 条 BloomX 工作流。

## 5 条工作流

| 场景 | n8n 模板 | Firebase Secret |
| --- | --- | --- |
| 商家入驻审核 | `n8n/workflows/bloomx-seller-application.json` | `N8N_SELLER_APPLICATION_WEBHOOK` |
| 售后工单分流 | `n8n/workflows/bloomx-support-ticket.json` | `N8N_SUPPORT_TICKET_WEBHOOK` |
| 支付成功凭证 | `n8n/workflows/bloomx-payment-success.json` | `N8N_PAYMENT_SUCCESS_WEBHOOK` |
| 商家月结快照 | `n8n/workflows/bloomx-monthly-settlement.json` | `N8N_SETTLEMENT_REPORT_WEBHOOK` |
| API 健康巡检 | `n8n/workflows/bloomx-api-health.json` | `N8N_API_HEALTH_WEBHOOK` |
| 全项目事件总线 | n8n MCP 创建 | `N8N_EVENT_BUS_WEBHOOK` |

## 已通过 MCP 创建的 n8n 工作流

| 场景 | Workflow ID | Webhook Secret / Path |
| --- | --- | --- |
| 商家入驻审核 | `WE9Iws9S43ETPRtk` | `N8N_SELLER_APPLICATION_WEBHOOK` / `bloomx/seller-application` |
| 售后工单分流 | `9vnpmUael8mGlHbY` | `N8N_SUPPORT_TICKET_WEBHOOK` / `bloomx/support-ticket` |
| 支付成功凭证 | `MWSzkpDrdKgHXl9d` | `N8N_PAYMENT_SUCCESS_WEBHOOK` / `bloomx/payment-success` |
| 商家月结快照 | `gx2qLC7znhKWyv6v` | `N8N_SETTLEMENT_REPORT_WEBHOOK` / `bloomx/monthly-settlement` |
| API 健康巡检 | `VSteT3SW4ATR2vEk` | `N8N_API_HEALTH_WEBHOOK` / `bloomx/api-health` |
| 全项目事件总线 | `RUKS05m8KFQsDYSP` | `N8N_EVENT_BUS_WEBHOOK` / `bloomx/event-bus` |

真实 Production Webhook URL 只保存到 Firebase Secret Manager，不写入仓库文档。

## 全项目事件总线覆盖范围

除了 5 个独立主流程，以下事件会统一进入 `N8N_EVENT_BUS_WEBHOOK`：

- `user.created`
- `user.deleted`
- `email_log.created`
- `seller_profile.created`
- `api_offer.created`
- `api_offer.status_changed`
- `seller_product.created`
- `product.created`
- `merchant_api_test.created`
- `api_call.completed`
- `api_call.failed`
- `subscription.created`
- `purchase.created`

## 你在 n8n 里要做的事

1. 打开 n8n。
2. 进入 Workflows。
3. 选择 Import from File。
4. 依次导入 `n8n/workflows` 下面 5 个 JSON 文件。
5. 打开每个工作流，进入 Webhook 节点。
6. 复制 Production URL。
7. 激活工作流。
8. 把 5 个 Production URL 写入 Firebase Secret Manager。

## Firebase Secret

```bash
firebase functions:secrets:set N8N_SELLER_APPLICATION_WEBHOOK
firebase functions:secrets:set N8N_SUPPORT_TICKET_WEBHOOK
firebase functions:secrets:set N8N_PAYMENT_SUCCESS_WEBHOOK
firebase functions:secrets:set N8N_SETTLEMENT_REPORT_WEBHOOK
firebase functions:secrets:set N8N_API_HEALTH_WEBHOOK
firebase functions:secrets:set MAKE_WORKFLOW_SIGNING_SECRET
```

`MAKE_WORKFLOW_SIGNING_SECRET` 这个名字保留是为了兼容旧 Make 配置，它现在作为通用的 BloomX 自动化签名密钥使用。

## 部署

```bash
npm --prefix functions run build
firebase deploy --only functions
```

## 验证

提交一条商家申请或售后工单，然后检查：

- n8n Executions 是否收到执行记录。
- Firestore `automationWorkflowEvents` 是否出现 `delivered`。
- 如果是 `skipped`，说明对应的 `N8N_*_WEBHOOK` 还没有写入 Secret。
- 如果是 `failed`，查看 `providerStatus` 和 `responsePreview`。

已完成验证：

- 5 个主流程 Production Webhook 均返回 `ok=true`。
- 事件总线 Production Webhook 返回 `ok=true`。
- 6 个 n8n Webhook URL 已写入 Firebase Secret Manager。
- Firebase Functions 已部署。
- 线上闭环 smoke test 已通过：Firestore `email_logs` 创建事件成功投递到 n8n event bus，`automationWorkflowEvents.status=delivered`。

## n8n API 自检

如果你有 n8n API Key：

```powershell
$env:N8N_BASE_URL="https://your-n8n-host"
$env:N8N_API_KEY="<your-n8n-api-key>"
npm run n8n:doctor
```

## MCP 后续增强

n8n 官方支持 `MCP Server Trigger`，可以让 n8n 工作流作为 MCP server 暴露给 MCP client。后续可以新增一个 “BloomX Ops MCP” 工作流，把这些动作暴露给 AI：

- 查询待审核商家。
- 查询高优先级售后工单。
- 触发月结快照。
- 查询 API 健康告警。
- 生成运营日报。

当前先不把生产事件链路绑到 MCP，是因为 Webhook 更容易部署、测试和恢复。

## 本机 n8n-mcp 状态

已安装：

```bash
npm install -g n8n-mcp@2.48.0
```

已注册到 Codex 配置。本机文档型 MCP 保留为 `n8n-docs-mcp`，你提供的远程 n8n MCP 已注册为 `n8n-mcp`。

```toml
[mcp_servers.n8n-docs-mcp]
type = "stdio"
command = "cmd"
args = ["/c", "npx", "-y", "n8n-mcp@2.48.0"]
env = { MCP_MODE = "stdio", MCP_LOG_LEVEL = "error" }
```

当前已验证可用的基础工具数量为 7：

- `tools_documentation`
- `search_nodes`
- `get_node`
- `validate_node`
- `get_template`
- `search_templates`
- `validate_workflow`

这些工具不需要 n8n 实例凭据，可以用于搜索节点、生成工作流、校验工作流和查模板。

如果要让我通过 MCP 直接创建、更新、激活你的 n8n 实例工作流，还需要在 MCP server 环境里补充：

```bash
N8N_API_URL=https://your-n8n-host
N8N_API_KEY=your-n8n-api-key
```

补齐后会启用管理类工具，例如 `n8n_create_workflow`、`n8n_update_partial_workflow`、`n8n_list_workflows` 和 `n8n_test_workflow`。
