## 1. 服务端动作 API

- [x] 1.1 新增 `functions/src/adminActions.ts`。
- [x] 1.2 实现 `runAdminAction` callable function。
- [x] 1.3 校验 Owner 邮箱或 admin 角色。
- [x] 1.4 限制 targetCollection 白名单。
- [x] 1.5 写入 `audit_logs` dry-run 审计并返回 requestId。

## 2. 前端接入

- [x] 2.1 新增 `src/services/adminActionService.ts`。
- [x] 2.2 将后台记录检查器动作按钮接入服务端动作 API。
- [x] 2.3 显示提交中、成功、失败和 requestId。

## 3. 验证

- [x] 3.1 运行 functions TypeScript 构建。
- [x] 3.2 运行前端生产构建。
- [x] 3.3 运行 OpenSpec 严格校验。
- [x] 3.4 探测 `/admin/users` 页面。
- [x] 3.5 扫描本次变更文件中的敏感信息。
