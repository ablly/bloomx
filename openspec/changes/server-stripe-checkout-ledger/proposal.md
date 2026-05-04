## Why

现有支付工作已经完成 provider 抽象、管理员账本规划和前端骨架，但真实购买积分仍缺少服务端结账入口、Webhook 验签处理和积分入账闭环。BloomX 的交易市场必须把支付密钥、幂等键、订单状态和积分发放锁在服务端，不能依赖前端返回页判断支付成功。

## What Changes

- 新增 Firebase Cloud Functions 支付入口，用 Stripe Checkout 创建积分套餐结账会话。
- 新增 Stripe Webhook 处理入口，以验签事件作为支付成功、失败、退款、争议和订阅状态的权威输入。
- 新增服务端本地账本写入：`payment_transactions`、`webhook_events`、`credit_ledger`。
- 前端定价按钮只调用服务端创建 checkout，并跳转到 Stripe 返回的 URL。
- 不引入任何真实密钥、Price ID 或生产环境私有配置。

## Capabilities

### New Capabilities

- `server-payment-ledger`: 服务端支付结账、Webhook 幂等、积分账本和前端结账入口的生产边界。

### Modified Capabilities

无。该变更作为 `payment-provider-abstraction-and-admin-ledger` 之后的增量能力存在，并按最新产品决策收敛为 Stripe-only 支付路线。

## Impact

- 影响 `functions/src` Cloud Functions 入口和依赖。
- 影响前端定价组件与支付服务调用。
- 影响环境变量示例、项目简报和支付说明。
- 新增 Stripe SDK 依赖，仅用于服务端 Functions。
- 需要管理员在 Firebase/部署环境配置 Stripe secret、webhook secret 和套餐 price id 后才能真实收款。
