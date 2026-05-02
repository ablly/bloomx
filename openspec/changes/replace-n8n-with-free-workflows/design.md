## Overview

BloomX 工作流进入“免费自托管优先”模式。后端仍然由 Firebase Functions 监听业务事件并投递 Webhook，前端和后台仍读取 `automationWorkflowEvents` 做审计；变化点是目标平台和命名不再绑定 n8n 或 Make。

## Architecture

### Provider Policy

- 默认：Activepieces 自托管社区版。
- 补位：Node-RED 用于轻量事件流和基础设施编排。
- 补位：Windmill 用于脚本型后台任务、批处理、对账和月结草稿。
- 禁止默认：n8n Cloud、Make.com。
- n8n 自托管也不作为 BloomX 默认方案，只保留历史迁移参考，不再出现在生产入口和验证命令中。

### Secret Contract

统一使用：

- `WORKFLOW_SIGNING_SECRET`
- `WORKFLOW_SELLER_APPLICATION_WEBHOOK`
- `WORKFLOW_SUPPORT_TICKET_WEBHOOK`
- `WORKFLOW_PAYMENT_SUCCESS_WEBHOOK`
- `WORKFLOW_SETTLEMENT_REPORT_WEBHOOK`
- `WORKFLOW_API_HEALTH_WEBHOOK`
- `WORKFLOW_EVENT_BUS_WEBHOOK`

### Event Log

继续使用 `automationWorkflowEvents`，记录：

- `provider`
- `eventType`
- `resourceId`
- `source`
- `status`
- `providerStatus`
- `responsePreview`
- `createdAt`

`provider` 允许值为 `activepieces`、`node-red`、`windmill`。

## Migration

1. 后端改读 `WORKFLOW_*` Secret。
2. 文档和页面改成免费工作流总览。
3. 删除 n8n doctor 脚本和 n8n 模板目录。
4. 新增通用 `workflow:doctor`，只检查仓库侧免费工作流配置和模板完整性。
5. 旧 `/n8n-workflows.html` 保留为跳转页，避免历史链接 404。
