## Context

BloomX 当前已经通过服务端创建 Stripe Checkout Session，并把支付成功事件作为积分入账权威来源。缺口在支付后的运营闭环：用户无法从 BloomX 进入 Stripe Customer Portal 查看账单，管理员也缺少服务端退款请求入口和统一审计记录。退款和争议不能由前端直接更改账本，必须通过服务端校验、Stripe API、Webhook 和管理员复核记录串起来。

## Goals / Non-Goals

**Goals:**

- 新增 `createStripePortalSession` callable，已登录用户只能为自己的 Stripe customer 创建 Portal 会话。
- 新增 `requestStripeRefund` callable，只有管理员/白名单邮箱可发起，必须校验交易状态、金额和原因。
- 退款请求写入 `refunds`，并把 `payment_transactions` 标记为 `refund_requested` 或后续 webhook 状态。
- Stripe 退款/争议 webhook 写入本地事件和交易状态，保留管理员复核空间。
- 前端账单入口只调用服务端拿 Portal URL；管理员后台说明专用退款/争议动作仍走服务端 API 和审计。

**Non-Goals:**

- 不自动扣减用户已发放积分，避免负余额和售后争议。
- 不实现商家自动扣款、自动分账或 Connect payout。
- 不提交真实 secret、Portal 配置 ID 或生产环境私有配置。
- 不把退款/争议动作开放给普通前端写入 Firestore。

## Decisions

1. **Customer Portal 由服务端创建。**
   - 原因：Portal session 需要 Stripe secret，且必须从本地交易中确认 `providerCustomerId` 属于当前用户。
   - 替代方案：前端使用 Stripe public key 直接创建。拒绝，因为 Portal session 不是前端安全边界。

2. **退款由管理员 callable 发起，Webhook 更新最终状态。**
   - 原因：退款是资金动作，需要管理员身份、原因、交易状态、金额校验和审计。
   - 替代方案：管理员前端直接改 Firestore。拒绝，因为无法保证 Stripe 与本地账本一致。

3. **退款/争议先记录，不自动扣减积分。**
   - 原因：用户可能已消耗积分，自动扣减可能造成负余额；售后策略需要单独定义。
   - 替代方案：退款成功即扣回积分。暂缓，后续结合售后和负余额规则再开规格。

4. **复用现有 admin email/role 规则。**
   - 原因：`runAdminAction` 已有管理员白名单和角色判断，支付专用 callable 可以保持一致的权限边界。
   - 替代方案：新增复杂 RBAC。暂不需要，后续可在专门权限规格里扩展。

## Risks / Trade-offs

- **Stripe customer id 缺失导致 Portal 不可用** → 前端显示中文错误，引导先完成一次成功支付；服务端拒绝创建。
- **退款请求重复提交** → 使用 `refunds` 记录、交易状态和 Stripe idempotency key 约束重复退款。
- **Webhook 与管理员请求顺序不一致** → Webhook 只做状态权威更新，管理员请求写审计和本地 pending 状态。
- **退款成功后积分未扣减** → 明确保留为剩余风险，管理员在售后/账本复核里处理。

## Migration Plan

1. 扩展 Functions 支付模块，导出 Portal 和退款 callable。
2. 扩展前端 checkout service，增加 Portal 会话请求。
3. 在 Dashboard Billing 区域增加“管理 Stripe 账单”入口和中文状态。
4. 更新管理员后台、环境示例和项目简报。
5. 运行前端构建、Functions 构建、OpenSpec 严格校验、工作流检查和项目简报。

## Open Questions

- 是否允许部分退款，本轮先允许管理员传入可选金额并由服务端限制不超过交易金额。
- 退款成功后积分是否扣回，后续需要结合售后策略、负余额策略和争议处理规则单独定义。
