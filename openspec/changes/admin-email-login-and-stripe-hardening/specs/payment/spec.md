## ADDED Requirements

### Requirement: Stripe 首发支付集成必须走服务端会话
系统 SHALL 以 Stripe Checkout Sessions 作为首发一次性支付和订阅购买入口，前端不得接触 Stripe secret key 或直接创建支付对象。

#### Scenario: 用户购买积分或订阅
- **WHEN** 用户发起购买积分或订阅
- **THEN** 前端调用服务端 checkout API
- **AND** 服务端创建 Stripe Checkout Session
- **AND** 前端只接收可跳转的 checkout url 或 portal url

### Requirement: 订阅管理必须使用 Billing 和 Customer Portal
系统 SHALL 使用 Stripe Billing 管理订阅生命周期，并使用 Customer Portal 处理用户自助变更、更新支付方式和取消订阅。

#### Scenario: 用户管理订阅
- **WHEN** 已订阅用户请求管理订阅
- **THEN** 服务端为该用户创建 Customer Portal Session
- **AND** 用户通过 Stripe 托管 Portal 完成支付方式、发票或订阅变更
- **AND** 本地订阅状态必须等待 Webhook 事件确认

### Requirement: Marketplace 能力必须预留 Connect Accounts v2
系统 SHALL 为后续商家入驻和结算预留 Stripe Connect Accounts v2 能力，支付 provider 抽象不得把平台锁死为单一自营收款模式。

#### Scenario: 商家结算能力扩展
- **WHEN** BloomX 开启商家结算或平台分账
- **THEN** 系统通过 provider adapter 接入 Stripe Connect Accounts v2
- **AND** 本地记录 connected account、charge type、settlement status 和 reconciliation id

### Requirement: Stripe Webhook 必须验签并幂等处理
系统 MUST 使用 Stripe raw request body、`Stripe-Signature` 和 webhook endpoint secret 验证事件，并按 provider eventId/idempotencyKey 去重。

#### Scenario: Webhook 重复投递
- **WHEN** Stripe 重复投递同一事件
- **THEN** 系统只处理一次账本变更
- **AND** 系统记录重复事件但不得重复发放积分、重复开通订阅或重复退款

#### Scenario: Webhook 签名无效
- **WHEN** Webhook 签名验证失败
- **THEN** 系统拒绝处理事件
- **AND** 系统不得更新 `payment_transactions`、`credit_ledger`、`subscriptions` 或 `refunds`

### Requirement: 前端成功页不得作为支付权威来源
系统 MUST 以服务端账本和已验签 Webhook 作为支付、积分、订阅和退款状态的权威来源。

#### Scenario: 用户从 success_url 返回
- **WHEN** 用户从 Stripe Checkout success_url 返回 BloomX
- **THEN** 前端最多显示处理中或查询服务端状态
- **AND** 前端不得仅凭 success_url 发放积分或改变订阅状态

### Requirement: 禁止使用不适合当前路线的旧支付路径
系统 MUST 不使用 Charges API、Sources API 或前端直接收集卡号的 Card Element 作为 BloomX 首发支付实现。

#### Scenario: 实现首发支付代码
- **WHEN** 开发支付 checkout、订阅或付款方式收集能力
- **THEN** 系统使用 Checkout Sessions、Billing、Customer Portal、Setup Intents 或 Payment Element 等当前推荐能力
- **AND** 不得新增 Charges、Sources 或前端直连 secret key 的实现
