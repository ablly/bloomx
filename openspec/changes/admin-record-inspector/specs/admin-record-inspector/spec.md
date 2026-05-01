## ADDED Requirements

### Requirement: 管理员后台必须支持记录检查面板
系统 SHALL 在后台列表页支持选择一条记录，并显示该记录的详情检查面板。

#### Scenario: 管理员点选列表记录
- **WHEN** 管理员在 `/admin/users` 或其他后台列表页点击一条记录
- **THEN** 系统在详情面板中显示该记录的标题、集合路径、状态和关键字段
- **AND** 被选中的表格行必须有可见选中状态

### Requirement: 用户记录必须显示运营关键字段
系统 SHALL 在用户模块的记录检查面板中显示用户运营需要的关键字段。

#### Scenario: 查看用户详情
- **WHEN** 管理员选中用户记录
- **THEN** 系统显示邮箱、角色、积分余额、邮箱验证和最近登录
- **AND** 字段缺失时显示明确 fallback，而不是空白或崩溃

### Requirement: 敏感动作必须保持服务端审计边界
系统 MUST 不从前端直接执行角色调整、冻结、积分修正、退款、Webhook 重放或配置保存。

#### Scenario: 查看敏感动作入口
- **WHEN** 管理员查看记录检查面板
- **THEN** 系统显示后续动作入口
- **AND** 动作入口必须保持禁用或指向后续服务端审计 API
- **AND** 系统说明这些动作需要写入 audit_logs 并携带 requestId、actor、reason、before/after
