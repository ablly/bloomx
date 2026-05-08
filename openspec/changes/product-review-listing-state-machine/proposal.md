## Why

BloomX 的商家 API 入驻已经能完成 Provider 模型抓取、逐模型 smoke test、服务端密钥加密和 `pending_review` 提交，但管理员审核通过后还没有明确的上架执行动作。

当前风险是：

- 管理员只能提交泛化 `submit_review`，不能把商品推进到真实可售状态。
- `products`、`sellers/{sellerId}/products`、`apiOffers` 和 `merchantApiSecrets` 状态可能不一致。
- `invokeMerchantModel` 依赖 `apiOffers` 查找已上架模型，但商品提交链路并不保证写入 `apiOffers`。

这会阻断“商家提交 -> 管理员审核 -> 用户订阅 -> 平台 Key 调用”的生产闭环。

## What Changes

- 新增管理员动作：`approve_product_listing`、`reject_product_listing`、`suspend_product_listing`。
- 审批执行时同步更新 `products/{productId}`、`sellers/{sellerId}/products/{productId}`、`apiOffers/{productId}` 和 `merchantApiSecrets/{productId}`。
- 批准上架时生成可被平台代理调用读取的 `apiOffers` 记录。
- 拒绝和暂停时禁用公开 offer 与商家密钥运行状态。
- 管理员后台商品记录详情显示专用动作按钮。
- `invokeMerchantModel` 增加 `apiOffers.modelNames array-contains` 兜底查询，支持一个商品包含多个模型。

## Capabilities

### New Capabilities

- `product-review-listing-state-machine`: 管理员商品审核到上架、拒绝、暂停的服务端状态机。

### Modified Capabilities

- `invokeMerchantModel`: 支持按 `apiOffers.modelNames` 查找已上架模型。

## Impact

- 影响 `functions/src/adminActions.ts` 和 `functions/src/platformProxy.ts`。
- 影响管理员前端动作类型与商品记录操作按钮。
- 影响 Marketplace 商品状态类型。
- 新增最小测试覆盖 offer 构建、状态校验和模型列表归一化。
