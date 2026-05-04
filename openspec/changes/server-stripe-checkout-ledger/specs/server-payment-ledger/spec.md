## ADDED Requirements

### Requirement: Stripe-only 服务端结账
系统 SHALL 只通过 Stripe 创建 BloomX 积分套餐结账会话，且结账会话必须由服务端创建。

#### Scenario: 已登录用户创建积分套餐 checkout
- **WHEN** 已登录用户选择受支持的积分套餐并请求结账
- **THEN** 服务端 SHALL 使用 Stripe Checkout Sessions 创建结账会话
- **AND** 服务端 SHALL 记录本地 `payment_transactions` 交易
- **AND** 前端 SHALL 只接收 `checkoutUrl`、`transactionId` 和 `providerSessionId`

#### Scenario: 前端传入未授权套餐
- **WHEN** 前端传入不存在或未启用的套餐标识
- **THEN** 服务端 SHALL 拒绝创建 checkout
- **AND** 不得把任意 Stripe Price ID 交由前端控制

### Requirement: Stripe Webhook 验签和幂等处理
系统 SHALL 以已验签的 Stripe Webhook 事件作为支付、退款、争议和订阅状态的权威来源。

#### Scenario: Stripe 发送支付成功事件
- **WHEN** 服务端收到 `checkout.session.completed`
- **THEN** 服务端 SHALL 验证 Stripe webhook signature
- **AND** 按 Stripe event id 记录 `webhook_events`
- **AND** 在 Firestore 事务中把交易标记为 `paid`
- **AND** 只在首次成功处理时增加用户积分

#### Scenario: Stripe 重复投递同一事件
- **WHEN** 服务端收到已处理过的 Stripe event id
- **THEN** 系统 SHALL 返回成功响应
- **AND** 不得重复增加积分

### Requirement: Stripe-only 支付运营文案
系统 SHALL 把支付路线、管理员配置和项目简报收敛为 Stripe-only，避免继续提示 Dodo Payments 是默认或备选支付方案。

#### Scenario: 管理员查看支付配置
- **WHEN** 管理员进入支付配置区域
- **THEN** 页面 SHALL 只展示 Stripe provider 配置状态
- **AND** 文案 SHALL 指向 Stripe Checkout、Webhook、退款和争议处理

#### Scenario: 项目简报输出支付规划
- **WHEN** 用户运行 `npm run brief` 或 `npm run payment-plan`
- **THEN** 输出 SHALL 明确 BloomX 当前只使用 Stripe 作为支付 provider
- **AND** 不得再把 Dodo Payments 写成项目默认支付备选
