## ADDED Requirements

### Requirement: 管理员商品审核上架状态机
系统 SHALL 提供明确的服务端管理员动作，把已通过测试的 API 商品推进到上架、拒绝或暂停状态。

#### Scenario: 管理员批准商品上架
- **GIVEN** 商品存在于 `products/{productId}` 且状态为 `pending_review`
- **WHEN** 管理员审批执行 `approve_product_listing`
- **THEN** 服务端 SHALL 把 `products/{productId}` 更新为 `active`
- **AND** 服务端 SHALL 同步更新 `sellers/{sellerId}/products/{productId}`
- **AND** 服务端 SHALL 写入 `apiOffers/{productId}`，状态为 `listed`
- **AND** 服务端 SHALL 把 `merchantApiSecrets/{productId}` 标记为 `active`

#### Scenario: 管理员拒绝商品上架
- **GIVEN** 商品存在于 `products/{productId}`
- **WHEN** 管理员审批执行 `reject_product_listing`
- **THEN** 服务端 SHALL 把商品状态更新为 `rejected`
- **AND** 服务端 SHALL 同步禁用对应 `apiOffers` 和 `merchantApiSecrets`

#### Scenario: 管理员暂停已上架商品
- **GIVEN** 商品已经上架或处于可售状态
- **WHEN** 管理员审批执行 `suspend_product_listing`
- **THEN** 服务端 SHALL 把商品状态更新为 `suspended`
- **AND** 服务端 SHALL 把对应 `apiOffers` 标记为 `suspended`
- **AND** 运行时调用 SHALL 不再把该商品视为 `listed`

### Requirement: 多模型商品运行时查询
系统 SHALL 支持一个上架商品包含多个可调用模型。

#### Scenario: 调用商品中的非首个模型
- **GIVEN** `apiOffers/{productId}` 包含 `modelNames`
- **WHEN** 用户调用 `modelNames` 中任意模型
- **THEN** 服务端 SHALL 能找到该 listed offer
- **AND** 服务端 SHALL 继续使用 `merchantApiSecrets/{productId}` 调用商家接口
