## Why

管理员登录可用后，`/admin/users` 不能只停留在通用表格。运营人员需要快速点选一条真实记录，看到关键字段、安全状态和后续动作边界，才像一个能继续扩展到生产的后台。

## What Changes

- 后台列表支持点选记录，并在右侧显示记录检查面板。
- 用户模块显示邮箱、角色、积分余额、邮箱验证和最近登录等关键字段。
- 非用户模块显示归属、状态、金额、创建时间和更新时间。
- 敏感操作按钮保持禁用占位，明确下一步必须接服务端审计动作 API。

## Capabilities

### New Capabilities

- `admin-record-inspector`: 后台记录点选、详情检查、安全动作边界和用户运营快照。

### Modified Capabilities

## Impact

- 影响 `src/components/admin/AdminOperations.tsx`
- 不新增真实写操作，不改变 Firestore 写入边界
