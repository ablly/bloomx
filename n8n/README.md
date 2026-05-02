# BloomX n8n 工作流

BloomX 现在推荐用 n8n 作为主自动化平台。项目里的 Cloud Functions 会读取 `N8N_*_WEBHOOK` Secret，并把业务事件投递到 n8n。

## 操作顺序

1. 在 n8n 里导入 `n8n/workflows` 下的 5 个 JSON 模板。
2. 打开每个工作流，根据你的实际工具补上 Gmail、Notion、Google Sheets、Slack 等节点凭据。
3. 激活工作流。
4. 在每个 Webhook 节点里复制 Production URL。
5. 写入 Firebase Secret Manager：

```bash
firebase functions:secrets:set N8N_SELLER_APPLICATION_WEBHOOK
firebase functions:secrets:set N8N_SUPPORT_TICKET_WEBHOOK
firebase functions:secrets:set N8N_PAYMENT_SUCCESS_WEBHOOK
firebase functions:secrets:set N8N_SETTLEMENT_REPORT_WEBHOOK
firebase functions:secrets:set N8N_API_HEALTH_WEBHOOK
firebase functions:secrets:set MAKE_WORKFLOW_SIGNING_SECRET
```

6. 部署 Functions：

```bash
npm --prefix functions run build
firebase deploy --only functions
```

7. 提交一条商家申请或售后工单，检查 Firestore 的 `automationWorkflowEvents` 是否为 `delivered`。

## n8n MCP

n8n 的 MCP 能力适合第二阶段使用：当你想让 AI 主动调用 n8n 工作流时，可以在 n8n 里创建带 `MCP Server Trigger` 的工作流。当前 BloomX 的生产事件链路先用 Webhook，因为它更稳定、权限边界更清晰，也更容易排查。

## 自检

如果你有 n8n API Key，可以运行：

```powershell
$env:N8N_BASE_URL="https://your-n8n-host"
$env:N8N_API_KEY="<your-n8n-api-key>"
npm run n8n:doctor
```

这个命令会检查 n8n API 是否能访问，以及 5 个 BloomX 工作流是否已存在。
