## Context

BloomX 已经建立支付 provider 抽象、管理员账本规划、Webhook 事件服务骨架和定价 UI，但真实交易仍缺少服务端入口。Stripe 官方 Checkout 流程要求服务端创建 Session，订单履约必须通过 Webhook 保障可靠性，并且重复投递或用户刷新不能重复履约。现有前端不能持有密钥，也不能仅凭 successUrl 给用户发放积分。

## Goals / Non-Goals

**Goals:**

- 在 Cloud Functions 新增 `createPaymentCheckout` callable，创建 Stripe Checkout Session。
- 在 Cloud Functions 新增 `handleStripeWebhook` HTTP endpoint，使用 Stripe webhook secret 验签。
- 使用 Firestore 记录交易、Webhook 事件和积分账本，并保证同一 provider event 不重复入账。
- 前端定价按钮只请求 checkout URL，并对未配置、未登录、失败状态给出中文反馈。
- 保留 Stripe 测试/生产隔离，不再规划 Dodo Payments 作为项目支付通道。

**Non-Goals:**

- 不提交任何真实 secret、webhook secret 或 Stripe Price ID。
- 不做商家自动分账打款；商家结算仍走管理员复核和后续结算规格。
- 不仅凭前端跳转回调发放积分。

## Decisions

1. **Stripe Checkout Session 只能在 Functions 创建。**
   - 原因：Stripe secret、Price ID 选择、idempotencyKey 和交易记录必须由服务端控制。
   - 替代方案：前端直接创建支付链接。拒绝，因为无法保证积分账本、审计和 provider 切换边界。

2. **套餐使用服务端白名单映射。**
   - 原因：前端只能传 `starter` 或 `scale`，服务端从环境变量读取 `STRIPE_PRICE_STARTER`、`STRIPE_PRICE_SCALE`。
   - 替代方案：前端传任意 Price ID。拒绝，因为会让价格和产品边界绕过后端审核。

3. **Webhook 是积分入账权威来源。**
   - 原因：用户可能不回到 successUrl，Webhook 失败会重试，服务端事件更可靠。
   - 替代方案：successUrl 触发发放。拒绝，只允许后续做“查询/补偿”，不作为权威。

4. **Firestore 事务做幂等入账。**
   - 原因：同一 Stripe event 或同一 Checkout Session 可能被重复投递或并发处理，事务可以同时检查交易状态并写入积分账本。
   - 替代方案：只靠 Stripe event 去重表。保留但不单独依赖，因为交易状态也必须防重复。

5. **支付 provider 收敛为 Stripe-only。**
   - 原因：用户已明确要求项目只用 Stripe。代码、文档、简报和管理员文案不再把 Dodo 作为默认或备选支付路线。

## Risks / Trade-offs

- **环境变量未配置导致用户无法购买** → 前端显示明确中文错误，管理员按 `.env.example` 和 Firebase Secret 配置。
- **Webhook raw body 被框架改写导致验签失败** → HTTP Function 读取 `req.rawBody`，并保留验签失败记录。
- **Stripe 事件字段和 Firestore 类型不完全一致** → 服务端只存统一字段和必要 provider 摘要，provider 原始 payload 不进入前端。
- **退款/争议只记录未扣减积分** → 本轮只做记录和管理员复核入口，避免自动扣减带来负余额争议。
- **单一 Stripe provider 的迁移风险** → 本项目当前以速度和一致性优先，后续如需 MoR 或税务代扣可重新开变更评估。

## Migration Plan

1. 安装 Functions 端 Stripe SDK。
2. 新增服务端支付函数并导出。
3. 新增前端 checkout service，并把定价按钮接到服务端。
4. 补充环境变量示例与中文提示。
5. 运行前端构建、Functions 构建、OpenSpec 严格校验、工作流检查和项目简报。
6. 部署时配置 Firebase Secret、Stripe Price ID 和 Webhook endpoint，再用 Stripe CLI 或 Dashboard 测试 `checkout.session.completed`。

## Open Questions

- 真实生产套餐币种和 Price ID 由管理员在 Stripe Dashboard 创建后填入环境。
- 退款/争议是否自动扣减积分，后续需要结合售后规则和负余额策略单独定义。
