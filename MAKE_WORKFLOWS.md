# BloomX Make.com MCP 与自动化工作流

更新时间：2026-04-28

## 当前状态

BloomX 项目侧已经补上 Make 工作流网关。Cloud Functions 会在关键业务事件发生时，把标准 JSON 事件推送到 Make.com 的 Custom Webhook，并在 Firestore 的 `makeWorkflowEvents` 集合记录投递状态。

我已经验证过你提供的 Make MCP 地址可以连接，但当前 Make MCP 工具箱暴露的工具数量是 0。也就是说：MCP 连接本身可用，下一步需要在 Make 的 MCP 工具箱里点击“+ 添加”，把下面 5 个场景发布成工具。Make 暴露工具后，可以用项目里的 doctor 命令再次检查。

## MCP 自检

本地不要把密钥写进仓库，运行时临时设置环境变量即可：

```powershell
$env:MAKE_MCP_URL="https://eu1.make.com/mcp/server/994c9fcc-9318-48ee-9860-38c585e9ed9f"
$env:MAKE_MCP_KEY="<your-make-mcp-key>"
npm run make:mcp:doctor
```

期望看到 5 个工具：

- `bloomx_seller_application`
- `bloomx_support_ticket`
- `bloomx_payment_success`
- `bloomx_monthly_settlement`
- `bloomx_api_health`

如果输出显示连接成功但工具数量为 0，请回到 Make 的 MCP 工具箱，给 BloomX 添加场景工具。完整工具流清单在 `make/toolflows.bloomx.json`。

## 需要在 Make 创建的 5 个场景

| 场景 | MCP 工具名 | Make Webhook 名称 | Firebase Secret |
| --- | --- | --- | --- |
| 商家入驻审核 | `bloomx_seller_application` | `bloomx_seller_application` | `MAKE_SELLER_APPLICATION_WEBHOOK` |
| 售后工单 | `bloomx_support_ticket` | `bloomx_support_ticket` | `MAKE_SUPPORT_TICKET_WEBHOOK` |
| 支付成功 / 积分充值 | `bloomx_payment_success` | `bloomx_payment_success` | `MAKE_PAYMENT_SUCCESS_WEBHOOK` |
| 商家月结报表 | `bloomx_monthly_settlement` | `bloomx_monthly_settlement` | `MAKE_SETTLEMENT_REPORT_WEBHOOK` |
| API 健康巡检 | `bloomx_api_health` | `bloomx_api_health` | `MAKE_API_HEALTH_WEBHOOK` |

## 部署 Secret

```bash
firebase functions:secrets:set MAKE_WORKFLOW_SIGNING_SECRET
firebase functions:secrets:set MAKE_SELLER_APPLICATION_WEBHOOK
firebase functions:secrets:set MAKE_SUPPORT_TICKET_WEBHOOK
firebase functions:secrets:set MAKE_PAYMENT_SUCCESS_WEBHOOK
firebase functions:secrets:set MAKE_SETTLEMENT_REPORT_WEBHOOK
firebase functions:secrets:set MAKE_API_HEALTH_WEBHOOK
```

`MAKE_WORKFLOW_SIGNING_SECRET` 是 BloomX 和 Make 之间的共享签名密钥。Make 收到请求后可以校验 `X-BloomX-Signature`：

```text
sha256=<HMAC_SHA256(JSON body)>
```

## 事件负载

每个 Make Webhook 都会收到统一格式：

```json
{
  "id": "makeWorkflowEvents document id",
  "eventType": "seller_application.created",
  "resourceId": "business document id",
  "source": "Firestore path or scheduler name",
  "occurredAt": "2026-04-28T00:00:00.000Z",
  "data": {}
}
```

请求头：

```text
Content-Type: application/json
X-BloomX-Event-Type: <eventType>
X-BloomX-Event-Id: <makeWorkflowEvents id>
X-BloomX-Signature: sha256=<signature>
```

## 场景 1：商家入驻审核

触发器：`seller_applications/{applicationId}` 创建。

Make 模块建议：

1. `Webhooks / Custom webhook` 接收 `seller_application.created`。
2. `Google Sheets` 或 `Notion` 写入审核队列。
3. `Gmail` 通知审核人，标题可用 `BloomX 商家入驻待审核 - {{data.name}}`。
4. 审核人在 BloomX 管理员审核台通过或拒绝申请。

## 场景 2：售后工单

触发器：`supportTickets/{ticketId}` 创建。

Make 模块建议：

1. 接收 `support_ticket.created`。
2. 在 `Notion` 或 `Google Sheets` 创建工单记录。
3. 根据 `data.issueType` 和 `data.priority` 路由给不同处理人。
4. 邮件通知平台运营。

## 场景 3：支付成功 / 积分充值

触发器：

- `transactions/{transactionId}` 创建。
- `users/{userId}/transactions/{transactionId}` 创建。

只有 `status` 为 `succeeded`、`success`、`completed` 或 `paid` 的交易会推送。

Make 模块建议：

1. 接收 `payment.succeeded`。
2. 写入财务流水表。
3. 给用户发送充值成功或付款凭证。
4. 可选：同步到会计系统。

## 场景 4：商家月结报表

触发器：每月 1 日 09:00，`Asia/Shanghai`。

Cloud Functions 汇总：

- `apiOfferStats` 最近最多 500 条。
- `settlements` 中 `status=pending` 最近最多 500 条。

Make 模块建议：

1. 接收 `settlement.monthly_snapshot`。
2. 写入 Google Sheets 月结表。
3. 给商家和平台财务发送邮件。
4. 财务确认后，把 `settlements/{id}.status` 更新为 `paid`。

## 场景 5：API 健康巡检

触发器：每 30 分钟。

Cloud Functions 推送：

- `apiOffers` 中 `status=listed` 的商品。
- `apiCallRecords` 中 `status=failed` 的失败调用记录。

Make 模块建议：

1. 接收 `api_health.snapshot`。
2. 用 Make Router 按失败数量或失败率分支。
3. Gmail/Slack 通知平台运营。
4. 对连续失败的商家 API，后续可进入人工审核或下架流程。

## 已新增的 Cloud Functions

- `onSellerApplicationCreated`
- `onSupportTicketCreated`
- `onPaymentTransactionCreated`
- `onUserPaymentTransactionCreated`
- `sendMonthlySettlementSnapshotToMake`
- `sendApiHealthSnapshotToMake`

## 验证方式

1. 在 Make 中创建 5 个 Custom Webhook。
2. 在 MCP 工具箱里把 5 个场景添加为工具。
3. 把 5 个 Webhook URL 写入 Firebase Secret Manager。
4. 部署 Functions：

```bash
npm --prefix functions run build
firebase deploy --only functions
```

5. 提交一条商家申请或售后工单。
6. 检查 Firestore 的 `makeWorkflowEvents`：
   - `delivered` 表示 Make 已接收。
   - `failed` 表示 Make 返回非 2xx 或网络失败。
   - `skipped` 表示对应 Webhook URL 还没有配置。

7. 运行 MCP doctor：

```bash
npm run make:mcp:doctor
```

当 5 个工具都出现后，BloomX 的 Make MCP 工具流就配置完整。
