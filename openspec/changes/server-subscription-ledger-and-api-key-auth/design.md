## Context

BloomX 已经把充值路径迁到了 Stripe Checkout + Webhook，但“订阅一个模型并用平台 Key 调用”的交易闭环还停留在混合模式：

- Dashboard 用前端 Web Crypto 生成/哈希 key，再直接把哈希写入 Firestore。
- Product Detail 用前端 transaction 直接扣 `users.credits_balance` 并写 `purchases`。
- `invokeMerchantModel` 在函数里扣余额，但没有复用前端生成的 key 子集合，也没有完整写 usage/refund ledger。

这意味着系统已经有界面和数据集合，但没有统一的服务端权威来源。

## Goals / Non-Goals

**Goals**

- 让平台 API Key 的创建和生命周期管理都通过 Functions 完成，避免完整 key 或关键状态由前端直接写入。
- 让 Marketplace 订阅购买通过单个 callable 完成，事务内写入 `subscriptions`、`purchases`、`credit_ledger`、`seller_earnings`。
- 让 `invokeMerchantModel` 通过哈希 key 子集合完成鉴权，并把每次调用的扣费、退款、卖家收入写入统一集合。
- 保持现有页面结构尽量不变，优先替换底层服务调用。

**Non-Goals**

- 本轮不处理商品审核到 `apiOffers` 上架的完整状态机，只假设已上架商品的 `productId/offerId` 可用。
- 本轮不实现真实端到端 smoke test 脚本，只补最小代码测试和构建验证。
- 本轮不重构现有所有前端读取路径，例如购买列表仍可读 `users/{uid}/purchases`。

## Decisions

1. **Platform API Key 使用服务端生成明文 + 哈希存储**
   - 前端只在创建成功时收到一次完整 key。
   - Firestore 中继续保留 `users/{uid}/api_keys/{keyId}` 结构，减少 Dashboard 读路径变更。
   - `invokeMerchantModel` 使用 `collectionGroup('api_keys')` 按 `key_hash` 和 `is_active` 查询。

2. **Marketplace 订阅使用确定性文档 ID**
   - 采用 `subscriptionDocId(uid, productId)` 作为 `subscriptions`、`purchases` 和账本关联主键。
   - 这样在重复点击或重试时更容易做到幂等和去重。

3. **订阅购买事务内一次写完四类数据**
   - 更新 `users/{uid}` 积分余额。
   - 写 `subscriptions/{subscriptionId}`。
   - 写 `purchases/{subscriptionId}` 与 `users/{uid}/purchases/{productId}`。
   - 写 `credit_ledger/subscription_<subscriptionId>` 与 `seller_earnings/<subscriptionId>`，并镜像到 `sellers/{sellerId}/earnings/{subscriptionId}`。

4. **调用扣费与失败退款分别写 ledger**
   - 成功调用写负向 `usage` 账本。
   - 失败调用写正向 `refund` 账本。
   - 卖家收入只在成功调用时写入，避免失败调用形成脏收入。

## Risks / Trade-offs

- **旧 Firestore 规则如果仍允许前端直写，不会自动阻止旧路径。**
  - 本轮先替换应用入口，后续应配合 rules test 做强约束。

- **`apiOffers` 与 `products` 的上架状态仍未完全统一。**
  - 订阅购买以 `products/{productId}` 为主，调用仍以 `apiOffers.modelName` 为主，短期内依赖现有 `productId === offerId` 约定。

- **卖家收入模型目前仍以 credits 为单位。**
  - 这与真实法币结算不是一回事，但足以支撑本轮“交易闭环可审计”的目标。

## Migration Plan

1. 新增 `functions/src/platformApiKeys.ts` 与 `functions/src/subscriptions.ts`。
2. 更新 `functions/src/platformProxy.ts` 与 `functions/src/index.ts`。
3. 更新前端 `apiKeyService` 和 `purchaseService`，改为调用 callable functions。
4. 增加最小测试，覆盖 key 哈希和订阅主键/分账规则。
5. 运行 `npm run build`、`npm --prefix functions run build`、相关测试、`npm run spec:validate:strict`、`npm run workflow:doctor`、`npm run brief`。

## Open Questions

- `apiOffers` 与 `products` 状态机后续是否统一成单一 listing source。
- seller earnings 后续是否需要拆分为“订阅订金收入”和“按调用收入”两个类型。
