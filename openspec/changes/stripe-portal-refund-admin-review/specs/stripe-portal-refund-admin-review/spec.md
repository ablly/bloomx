## ADDED Requirements

### Requirement: Stripe Customer Portal 服务端入口
系统 SHALL 只通过服务端为已登录用户创建 Stripe Customer Portal 会话，且不得向前端暴露 Stripe secret。

#### Scenario: 已登录用户打开账单管理入口
- **WHEN** 已登录用户请求管理自己的 Stripe 账单
- **THEN** 服务端 SHALL 查找该用户已有的 Stripe customer id
- **AND** 服务端 SHALL 使用 Stripe Billing Portal Sessions 创建会话
- **AND** 前端 SHALL 只接收 `portalUrl`

#### Scenario: 用户还没有 Stripe customer id
- **WHEN** 用户尚未有已支付交易或本地 customer 映射
- **THEN** 服务端 SHALL 拒绝创建 Portal 会话
- **AND** 前端 SHALL 显示中文错误提示

### Requirement: 管理员 Stripe 退款请求
系统 SHALL 只允许管理员通过服务端专用接口发起 Stripe 退款，并记录本地退款和审计信息。

#### Scenario: 管理员请求退款已支付交易
- **WHEN** 管理员为 `paid` 或 `refund_requested` 交易提交退款请求、金额和原因
- **THEN** 服务端 SHALL 校验管理员权限
- **AND** 服务端 SHALL 使用 Stripe Refunds API 创建退款
- **AND** 服务端 SHALL 写入 `refunds` 记录和 `audit_logs` 记录
- **AND** 服务端 SHALL 更新 `payment_transactions.status`

#### Scenario: 非管理员请求退款
- **WHEN** 非管理员用户调用退款接口
- **THEN** 服务端 SHALL 拒绝请求
- **AND** 不得调用 Stripe Refunds API

### Requirement: 退款和争议状态复核
系统 SHALL 保留退款和争议的本地运营状态，Webhook 事件不得直接绕过管理员复核和审计边界。

#### Scenario: Stripe 退款事件到达
- **WHEN** 服务端收到已验签的 Stripe refund 或 charge.refunded 事件
- **THEN** 服务端 SHALL 记录 `webhook_events`
- **AND** 服务端 SHALL 更新本地 `refunds` 和 `payment_transactions` 状态
- **AND** 服务端 SHALL 不自动扣减用户积分

#### Scenario: Stripe 争议事件到达
- **WHEN** 服务端收到已验签的 Stripe dispute 事件
- **THEN** 服务端 SHALL 记录争议摘要
- **AND** 服务端 SHALL 将交易标记为 `disputed`
- **AND** 管理员后台 SHALL 能在支付/退款/争议区域看到需要复核的状态
