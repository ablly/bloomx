## Why

管理员后台现在能登录、查看真实记录并选择记录，但所有敏感动作仍停留在禁用占位。生产后台下一步必须先建立服务端审计动作 API，让角色调整、冻结、积分修正、Webhook 重放等动作有统一入口、权限校验和审计日志，而不是从前端直接写数据。

## What Changes

- 新增 Firebase callable function：`runAdminAction`。
- `runAdminAction` 校验调用者是否为 Owner 邮箱或 admin 角色。
- `runAdminAction` 接收 actionType、targetCollection、targetId、reason、dryRun 和 metadata。
- 第一版只记录 dry-run 审计，不直接修改用户、支付、账本或配置数据。
- 新增前端服务封装，让后台按钮调用服务端动作 API 并显示 requestId。
- `/admin/users` 的记录检查器动作从禁用占位升级为可提交 dry-run 审计动作。

## Capabilities

### New Capabilities

- `admin-action-api`: 管理员服务端动作 API、权限校验、dry-run 审计和前端动作提交。

### Modified Capabilities

## Impact

- 新增 `functions/src/adminActions.ts`
- 修改 `functions/src/index.ts` 导出 callable function
- 新增 `src/services/adminActionService.ts`
- 修改 `src/components/admin/AdminOperations.tsx`
- 后续可扩展真实写操作，但本次不执行真实数据变更
