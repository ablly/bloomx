## Why

用户已经明确表示不再使用收费或潜在收费的 n8n 路线。BloomX 的自动化必须回到免费、开源、可自托管、可审计、可迁移的方案，避免后续商家审核、售后、支付凭证、月结和 API 健康巡检被 n8n Cloud 或 Make.com 这类商业平台绑定。

## What Changes

- 将默认工作流平台改为 Activepieces 自托管社区版。
- 将 Node-RED 定位为轻量事件流、HTTP 转发和健康检查补位。
- 将 Windmill 定位为脚本型后台任务、批处理、对账和月结草稿补位。
- 移除 n8n 作为生产工作流、MCP 工具或默认验证项的要求。
- 保留 `automationWorkflowEvents` 事件日志和签名机制，但把 Secret 命名从 `N8N_*` 改为通用 `WORKFLOW_*`。
- 将项目入口从 `/n8n-workflows.html` 迁移到 `/workflows.html`，旧地址仅作为兼容跳转。

## Capabilities

### Modified Capabilities

- `delivery`：默认自动化平台从 n8n 改为免费自托管工作流栈。

## Impact

- 影响文件：
  - `functions/src/makeWorkflows.ts`
  - `functions/src/index.ts`
  - `functions/.env.example`
  - `package.json`
  - `scripts/project-brief.ts`
  - `public/workflows.html`
  - `public/n8n-workflows.html`
  - `public/project-hub.html`
  - `docs/SPEC_DELIVERY_WORKFLOW.md`
  - `openspec/specs/delivery/spec.md`
- 验证方式：
  - `npm run build`
  - `npm --prefix functions run build`
  - `npm run spec:validate:strict`
  - `npm run brief`
  - `npm run workflow-options`
