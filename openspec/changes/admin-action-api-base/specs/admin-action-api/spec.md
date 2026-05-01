## ADDED Requirements

### Requirement: 管理员动作必须通过服务端 API 提交
系统 SHALL 提供服务端管理员动作 API，用于接收后台敏感操作请求，并禁止前端直接写入敏感业务状态。

#### Scenario: 管理员提交用户动作
- **WHEN** 管理员在 `/admin/users` 提交调整角色、冻结账号、修正积分或导出审计动作
- **THEN** 前端调用服务端管理员动作 API
- **AND** 服务端返回 requestId
- **AND** 前端显示该 requestId 作为追踪凭证

### Requirement: 管理员动作必须校验身份
系统 MUST 在服务端校验调用者是否为 Owner 邮箱或 admin 角色。

#### Scenario: 未登录调用动作 API
- **WHEN** 未登录用户调用管理员动作 API
- **THEN** 系统拒绝请求
- **AND** 系统不得写入业务状态

#### Scenario: 非管理员调用动作 API
- **WHEN** 非 Owner 且非 admin 角色用户调用管理员动作 API
- **THEN** 系统拒绝请求
- **AND** 系统不得写入业务状态

### Requirement: 第一版管理员动作必须只记录 dry-run 审计
系统 MUST 在第一版仅记录 dry-run 审计，不执行真实角色、积分、支付、退款、Webhook 或配置变更。

#### Scenario: dry-run 审计写入
- **WHEN** 管理员提交动作请求
- **THEN** 系统写入 `audit_logs`
- **AND** 审计记录包含 requestId、actor、actionType、targetCollection、targetId、reason、metadata、dryRun、beforeSummary 和 createdAt
- **AND** 系统不得修改目标文档

### Requirement: 管理员动作目标集合必须白名单限制
系统 MUST 限制管理员动作 API 只能针对明确允许的运营集合。

#### Scenario: 非法集合请求
- **WHEN** 请求的 targetCollection 不在白名单内
- **THEN** 系统拒绝请求
- **AND** 系统不得写入业务状态
