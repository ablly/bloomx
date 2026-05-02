# BloomX 免费工作流路线

更新时间：2026-05-02

## 结论

BloomX 不再使用 n8n 或 Make.com 作为默认自动化平台。当前生产路线改为全免费自托管：

- Activepieces 自托管社区版：默认业务编排平台。
- Node-RED：轻量事件流和 API 健康巡检补位。
- Windmill：脚本型后台任务、批处理、对账和月结补位。

## 工作流清单

| 场景 | 默认平台 | Firebase Secret | 触发源 |
| --- | --- | --- | --- |
| 商家入驻审核 | Activepieces | `WORKFLOW_SELLER_APPLICATION_WEBHOOK` | `seller_applications/{applicationId}` |
| 售后工单分流 | Activepieces | `WORKFLOW_SUPPORT_TICKET_WEBHOOK` | `supportTickets/{ticketId}` |
| 支付成功凭证 | Activepieces | `WORKFLOW_PAYMENT_SUCCESS_WEBHOOK` | `transactions/{transactionId}` 和 `users/{userId}/transactions/{transactionId}` |
| 商家月结快照 | Windmill | `WORKFLOW_SETTLEMENT_REPORT_WEBHOOK` | 每月 1 日 09:00，Asia/Shanghai |
| API 健康巡检 | Node-RED | `WORKFLOW_API_HEALTH_WEBHOOK` | 每 30 分钟 |
| 全项目事件总线 | Activepieces | `WORKFLOW_EVENT_BUS_WEBHOOK` | 用户、邮箱、商家、商品、API 调用、订阅、购买等二级事件 |

## Secret

```bash
firebase functions:secrets:set WORKFLOW_SIGNING_SECRET
firebase functions:secrets:set WORKFLOW_SELLER_APPLICATION_WEBHOOK
firebase functions:secrets:set WORKFLOW_SUPPORT_TICKET_WEBHOOK
firebase functions:secrets:set WORKFLOW_PAYMENT_SUCCESS_WEBHOOK
firebase functions:secrets:set WORKFLOW_SETTLEMENT_REPORT_WEBHOOK
firebase functions:secrets:set WORKFLOW_API_HEALTH_WEBHOOK
firebase functions:secrets:set WORKFLOW_EVENT_BUS_WEBHOOK
```

真实 Webhook URL 只写入 Secret Manager，不写入仓库。

## 验证

```bash
npm run workflow:doctor
npm run workflow-options
npm run spec:validate:strict
```

工作流页面：

```text
http://127.0.0.1:5173/workflows.html
```

旧 `/n8n-workflows.html` 只是兼容跳转。
