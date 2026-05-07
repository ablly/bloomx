## Why

BloomX 已经具备 Stripe Checkout、Webhook 入账、Customer Portal 和管理员退款请求骨架，但管理员后台仍缺少面向生产运营的支付对账工作台。现在需要把 `payment_transactions`、`credit_ledger`、`refunds`、`webhook_events` 等真实集合汇总成可复核的运营视图，避免支付状态只停留在服务端日志或分散表格中。

## What Changes

- 新增管理员支付对账工作台，集中展示支付交易、积分账本、Webhook、退款和争议的关键状态。
- 新增退款/争议复核队列，突出待处理、处理中、失败和需要人工复核的记录。
- 新增前端可测试的支付运营聚合逻辑，用真实 Firestore 记录结构生成统计卡片、异常列表和空状态。
- 更新管理员后台支付区文案，明确 Stripe-only provider、Webhook 幂等、积分账本、退款/争议不自动扣减积分的运营边界。
- 不新增支付 provider；Dodo Payments 不作为本轮实现目标。

## Capabilities

### New Capabilities

- `payment-reconciliation-admin-console`: 管理员可检索、汇总、复核 Stripe 支付、积分账本、Webhook、退款和争议记录的后台能力。

### Modified Capabilities

- `delivery`: 增补支付运营后台必须提供可审计、可复核的对账入口。

## Impact

- Affected UI: `src/components/admin/AdminOperations.tsx`
- Affected services: `src/services/adminOperationsService.ts`
- Affected scripts/tests: 新增最小测试脚本和 `npm` 验证入口
- Affected specs: `openspec/changes/payment-reconciliation-admin-console/specs/**`
- No new external dependency, no new payment provider, no client-side Stripe secret exposure.
