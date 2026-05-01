# 设计方案

## 设计原则

- 业务账本优先：BloomX 自己保存订单、积分、订阅、退款、结算和 Webhook 事件状态。
- Provider 可替换：业务层通过 `PaymentProviderAdapter` 调用支付平台，不直接依赖 Stripe 或 Dodo SDK 字段。
- Webhook 为准：支付成功、订阅变更、退款和争议以服务端 Webhook 事件处理结果为准。
- 管理员可复核：涉及钱、积分、退款、结算和异常事件，管理员后台必须可查、可重放、可审计。
- 测试/生产隔离：Stripe 和 Dodo 的测试环境、生产环境、密钥、Webhook endpoint 和回调处理都必须分离。

## 推荐平台路线

### 首发：Stripe

原因：

- 覆盖 Visa、Mastercard、Alipay、WeChat Pay。
- Checkout、Payment Element、Webhook、订阅、发票和风控生态成熟。
- 适合先验证全球用户购买积分和订阅套餐的路径。

限制：

- 标准 Stripe 通常不是 Merchant of Record，全球税务和合规责任更多落在 BloomX 自身。
- 微信/支付宝能力受账号地区、币种、产品模式和审批限制影响。

### 预留：Dodo Payments

原因：

- 适合作为 Merchant of Record 方向，降低全球税务、VAT/GST、争议和跨境销售复杂度。
- 支持 Dodo Payments MCP 和 Knowledge MCP，利于后续通过文档和 API 工具协作接入。

限制：

- 当前官方支付方式信息里，支付宝覆盖需要上线前再次确认。
- MoR 平台通常费用更高，对结算、退款和客户声明控制权更少。

## 核心抽象

```ts
type PaymentProvider = 'stripe' | 'dodo';

interface CreateCheckoutInput {
  userId: string;
  provider: PaymentProvider;
  productType: 'credits' | 'subscription';
  priceId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}

interface PaymentProviderAdapter {
  createCheckout(input: CreateCheckoutInput): Promise<{ checkoutUrl: string; providerSessionId: string }>;
  verifyWebhook(rawBody: string, signature: string): Promise<VerifiedWebhookEvent>;
  mapWebhookEvent(event: VerifiedWebhookEvent): Promise<PaymentDomainEvent>;
}
```

## 数据模型草案

- `payment_transactions`
  - provider、providerPaymentId、providerSessionId、userId、amount、currency、status、idempotencyKey、createdAt、updatedAt
- `credit_ledger`
  - userId、transactionId、delta、balanceAfter、reason、source、createdAt
- `subscriptions`
  - provider、providerSubscriptionId、userId、planId、status、currentPeriodStart、currentPeriodEnd
- `refunds`
  - providerRefundId、transactionId、amount、currency、reason、status、reviewedBy
- `webhook_events`
  - provider、eventId、eventType、signatureStatus、processingStatus、attempts、error、receivedAt、processedAt、replayOf
- `provider_customer_map`
  - provider、userId、providerCustomerId、environment
- `seller_settlements`
  - sellerId、period、grossAmount、platformFee、refundAmount、netAmount、status、approvedBy
- `audit_logs`
  - actorId、actorRole、action、targetType、targetId、before、after、reason、requestId

## 管理员后台最小入口

- 支付交易列表和详情
- 积分账本列表和手动修正申请
- 订阅状态和取消/同步入口
- 退款申请、复核和执行记录
- Webhook 事件、失败原因和重放入口
- 商家结算草稿、复核和确认
- 支付 provider 配置只读展示，不显示密钥明文

## 工作流配合

- Activepieces 负责支付成功通知、退款复核通知、结算草稿提醒和异常 Webhook 告警。
- Windmill 可用于定时对账、账本一致性检查和结算草稿生成。
- Node-RED 只用于轻量事件桥接和健康检查。

## 风险与缓解

- 风险：支付平台能力和可用地区变化。
  - 缓解：支付能力通过 provider 配置和运行时 capability 检查控制。
- 风险：Webhook 重复投递导致重复加积分。
  - 缓解：所有事件按 provider eventId 和业务 idempotencyKey 去重。
- 风险：税务和 MoR 责任不清。
  - 缓解：Stripe 首发时明确 BloomX 自担税务；Dodo 作为 MoR 备选上线前单独验收。
- 风险：管理员误操作影响账本。
  - 缓解：敏感操作必须二次确认、填写原因，并写入 audit_logs。
