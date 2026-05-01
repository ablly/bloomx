## ADDED Requirements

### Requirement: Admin actions SHALL use an approval state machine

敏感管理员动作 MUST 先写入审计请求，再由管理员在审计页审批或拒绝。

#### Scenario: Creating an action request

- **Given** 管理员在后台记录检查器点击敏感动作
- **When** 前端调用 `runAdminAction` 且未指定 dry-run
- **Then** 服务端必须创建 `audit_logs` 记录
- **And** 状态必须为 `pending_approval`
- **And** 目标业务文档不得立即被修改

#### Scenario: Approving an action request

- **Given** `audit_logs/{requestId}` 的状态为 `pending_approval` 或 `dry_run_recorded`
- **When** 管理员在审计页提交审批执行
- **Then** 服务端必须重新校验管理员身份
- **And** 只允许执行白名单动作
- **And** 必须回写审批人、审批时间、执行状态、beforeSummary 和 afterSummary

#### Scenario: Rejecting an action request

- **Given** `audit_logs/{requestId}` 尚未进入终态
- **When** 管理员提交拒绝
- **Then** 服务端必须把状态改为 `rejected`
- **And** 必须记录拒绝人、拒绝原因和拒绝时间

### Requirement: Execution SHALL be scoped to safe MVP actions

第一版真实执行 SHALL 只允许不触碰支付资金流的低风险动作。

#### Scenario: Executing safe actions

- **Given** 请求动作为 `freeze_user`、`unfreeze_user`、`submit_review`、`replay_failed_event`、`export_record_summary` 或 `export_user_audit`
- **When** 管理员审批执行
- **Then** 服务端可以写入对应目标集合的状态字段或审计结果

#### Scenario: Blocking parameterized actions

- **Given** 请求动作为 `adjust_user_role` 或 `adjust_user_credits`
- **When** metadata 缺少明确的 `nextRole` 或 `creditDelta`
- **Then** 服务端必须拒绝执行并把错误写回审计日志
