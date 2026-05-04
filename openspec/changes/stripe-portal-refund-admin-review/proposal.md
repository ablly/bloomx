## Why

上一轮已经完成 Stripe Checkout、Webhook 验签和积分入账骨架，但用户还没有账单自助入口，退款/争议也只能停留在事件记录层。BloomX 作为交易市场，需要把用户进入 Stripe Customer Portal、管理员发起退款、争议复核和本地账本审计接到服务端闭环里。

## What Changes

- 新增 `createStripePortalSession` callable，让已登录用户通过服务端创建 Stripe Customer Portal 会话。
- 新增管理员专用退款请求 callable，要求管理员权限、原因、交易状态校验和审计记录。
- 新增退款/争议本地记录规则，Webhook 与管理员动作都写入 `refunds`、`payment_transactions`、`audit_logs` 或 `webhook_events`。
- 前端账单入口新增“管理 Stripe 账单”入口，只调用 Cloud Functions，不接触 Stripe secret。
- 管理员后台支付/退款/争议文案明确：退款与争议必须经过服务端专用 API 和审计日志。

## Capabilities

### New Capabilities

- `stripe-portal-refund-admin-review`: Stripe Customer Portal、管理员退款请求、退款/争议记录和后台复核边界。

### Modified Capabilities

无。

## Impact

- 影响 `functions/src/payments.ts` 支付函数和导出入口。
- 影响前端账单/定价相关 service 与 Dashboard Billing UI。
- 影响管理员后台支付/退款/争议说明、项目简报和环境变量示例。
- 不提交任何真实 Stripe secret、Portal 配置 ID 或生产 Price ID。
