# 支付能力规格变更

## ADDED Requirements

### Requirement: 支付平台抽象层
系统 SHALL 通过统一支付 provider 抽象层接入第三方支付平台，避免业务代码直接绑定单一支付平台。

#### Scenario: 创建支付 checkout
- GIVEN 用户准备购买积分或订阅套餐
- WHEN 系统创建 checkout
- THEN 业务层通过统一 provider adapter 创建支付会话
- AND 记录 provider、providerSessionId、idempotencyKey 和本地交易记录
- AND 前端只接收 checkoutUrl，不接收支付密钥

#### Scenario: 切换支付 provider
- GIVEN 系统同时存在 Stripe 和 Dodo Payments 配置
- WHEN 某个地区、币种或支付方式需要切换 provider
- THEN 系统通过 provider 配置选择支付平台
- AND 不得修改订单、积分和订阅账本的业务结构

### Requirement: Stripe 作为首发支付通道
系统 SHALL 优先用 Stripe 首发覆盖 Visa、Mastercard、Alipay 和 WeChat Pay 支付需求。

#### Scenario: 全球用户购买积分
- GIVEN 用户位于支持的地区并选择银行卡、支付宝或微信支付
- WHEN 用户购买积分套餐
- THEN 系统优先使用 Stripe 创建 checkout
- AND 支付成功后由 Stripe Webhook 驱动本地交易和积分账本更新

### Requirement: Dodo Payments 作为 MoR 备选通道
系统 SHALL 为 Dodo Payments 预留 provider adapter，用于后续 Merchant of Record、全球税务和合规需求。

#### Scenario: 启用 Dodo Payments
- GIVEN BloomX 决定在某地区或产品线上启用 Dodo Payments
- WHEN 管理员配置 Dodo provider
- THEN 系统可以通过 Dodo adapter 创建 checkout 或订阅
- AND Webhook 事件仍进入统一 webhook_events 和 payment_transactions 账本

### Requirement: 支付账本以服务端事件为准
系统 SHALL 以服务端交易记录和已验签 Webhook 事件作为支付、积分和订阅状态的权威来源。

#### Scenario: Webhook 重复投递
- GIVEN 支付 provider 重复投递同一个事件
- WHEN 系统处理 Webhook
- THEN 系统按 provider eventId 和 idempotencyKey 去重
- AND 不得重复增加积分或重复变更订阅状态

#### Scenario: 前端返回成功页
- GIVEN 用户从 checkout 成功页返回 BloomX
- WHEN 前端展示支付结果
- THEN 前端只显示“处理中”或查询服务端状态
- AND 不得仅凭 successUrl 直接发放积分

### Requirement: 管理员支付运营后台
系统 SHALL 提供管理员入口管理支付交易、积分账本、订阅、退款、Webhook 和商家结算。

#### Scenario: Webhook 处理失败
- GIVEN 一个支付 Webhook 处理失败
- WHEN 管理员进入 Webhook 事件详情
- THEN 管理员可以查看失败原因、原始摘要、尝试次数和 requestId
- AND 管理员可以在权限允许时触发重放

#### Scenario: 退款复核
- GIVEN 用户申请退款或支付 provider 产生争议
- WHEN 管理员处理退款
- THEN 系统记录复核人、原因、前后状态和账本影响
- AND 退款完成后更新 payment_transactions、refunds 和 credit_ledger
