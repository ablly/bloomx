## Context

商家通过 `submitSellerApiProduct` 提交商品时，系统已经写入：

- `products/{productId}`：公开商品草稿，状态为 `pending_review` 或 `test_failed`。
- `sellers/{sellerId}/products/{productId}`：卖家视角商品记录。
- `merchantApiSecrets/{productId}`：服务端加密保存的商家 API 密钥。

但运行时调用走 `apiOffers`，当前没有稳定动作把商品转换为可调用的 offer。

## Goals / Non-Goals

**Goals**

- 管理员通过审核请求审批后，商品能进入 `active`，并生成 `apiOffers/{productId}`。
- 拒绝商品时，商品和 offer 状态都进入不可售状态。
- 暂停商品时，商品从 Marketplace 和运行时调用中下线。
- 所有动作保留现有管理员动作审批机制，最终执行写入 `audit_logs`。

**Non-Goals**

- 本轮不新增独立商品审核页面，只复用管理员后台记录详情动作。
- 本轮不实现邮件通知发送闭环，只保留状态与审计。
- 本轮不处理旧前端 `productService.createProduct` 密钥路径的彻底移除。

## Decisions

1. **审核动作继续走两步审批**
   - 管理员先在商品详情提交动作请求。
   - 再到审计请求中审批执行或拒绝。
   - 这样与现有高风险动作模型保持一致。

2. **`apiOffers` 使用 `productId` 作为文档 ID**
   - 运行时 `merchantApiSecrets/{offerId}` 已使用商品 ID 存储密钥。
   - offer ID 与 product ID 一致可避免密钥复制和额外映射。

3. **批准上架写 `modelName` 和 `modelNames`**
   - `modelName` 保持兼容旧单模型查询。
   - `modelNames` 支持一个商品挂多个模型，运行时可用 array-contains 兜底。

4. **暂停商品使用 `suspended` 状态**
   - Marketplace 只读取 `active`，因此 `suspended` 不会出现在可售列表。
   - `apiOffers` 同步写 `status: "suspended"`，运行时过滤 `listed`，不会被调用。

## Risks / Trade-offs

- `apiOffers.modelNames` 查询在大规模数据下可能需要索引；本轮只做低吞吐运营闭环。
- 管理员后台仍是通用记录详情，不如专用商品审核队列高效；下一轮应增加明确队列和筛选。
- 商品状态类型扩大到 `suspended`，旧 UI 会按通用异常状态展示。

## Migration Plan

1. 扩展管理员动作白名单和前端动作类型。
2. 实现商品审核执行逻辑和 `apiOffers` 构建 helper。
3. 更新平台代理查询逻辑，支持 `modelNames`。
4. 增加测试与 OpenSpec 变更。
5. 跑构建、测试、规格校验和 Chrome 页面检查。
