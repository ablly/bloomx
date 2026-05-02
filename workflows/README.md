# BloomX 免费自托管工作流

BloomX 不再使用 n8n 作为默认工作流方案。当前默认路线是：

- Activepieces 自托管社区版：商家审核、售后工单、支付回执、事件总线等业务编排。
- Node-RED：API 健康巡检、轻量 HTTP 转发、基础设施事件流。
- Windmill：商家月结快照、批处理、对账、数据修复脚本。

## Firebase Secret

生产环境只写入通用工作流 Secret：

```bash
firebase functions:secrets:set WORKFLOW_SIGNING_SECRET
firebase functions:secrets:set WORKFLOW_SELLER_APPLICATION_WEBHOOK
firebase functions:secrets:set WORKFLOW_SUPPORT_TICKET_WEBHOOK
firebase functions:secrets:set WORKFLOW_PAYMENT_SUCCESS_WEBHOOK
firebase functions:secrets:set WORKFLOW_SETTLEMENT_REPORT_WEBHOOK
firebase functions:secrets:set WORKFLOW_API_HEALTH_WEBHOOK
firebase functions:secrets:set WORKFLOW_EVENT_BUS_WEBHOOK
```

真实 Webhook URL 只保存到 Firebase Secret Manager，不写入仓库。

## 自检

```bash
npm run workflow:doctor
npm run workflow-options
```

`workflow:doctor` 只检查仓库侧免费工作流映射是否完整，不连接任何商业平台。
