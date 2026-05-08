## Why

BloomX 当前已经有 Dashboard API Key 管理界面、Marketplace 订阅界面和 `invokeMerchantModel` 调用入口，但底层交易闭环仍然断裂：

- 前端创建的是 `users/{uid}/api_keys/{keyId}` 哈希记录，服务端却仍然用 `users.platformApiKey` 明文查用户。
- Marketplace 订阅仍然在前端直接扣积分并写 `purchases`，绕过服务端账本、审计和幂等。
- `invokeMerchantModel` 只做余额增减，没有把调用扣费、失败退款和卖家收入完整写入账本集合。

这些问题会直接影响支付后的可调用性、运营审计可信度和生产安全边界，因此需要优先改成服务端主导。

## What Changes

- 新增服务端 Platform API Key 管理能力：生成、重命名、启停、删除全部通过 Cloud Functions 完成。
- 新增服务端 Marketplace 订阅购买能力：订阅扣费、订阅记录、购买记录、积分账本、卖家收入一次事务写入。
- 修改 `invokeMerchantModel`：改为校验 `users/{uid}/api_keys` 子集合哈希 key，并写 usage/refund ledger 与 seller earnings。
- 修改前端 `apiKeyService` 与 `purchaseService`，不再直接写会影响交易状态的 Firestore 字段。
- 更新平台 API 与 Firebase commerce 文档，明确当前服务端账本和鉴权模型。

## Capabilities

### New Capabilities

- `platform-api-key-auth`: BloomX 平台 API Key 的服务端生成、哈希校验和生命周期管理。
- `server-subscription-ledger`: Marketplace 订阅购买的服务端扣费、账本和卖家收入写入。

### Modified Capabilities

- `invokeMerchantModel`: 改为依赖服务端哈希 key + usage/refund ledger，不再依赖 `users.platformApiKey`。

## Impact

- 影响 `functions/src` 下的平台 key、订阅、平台代理调用逻辑及导出。
- 影响前端 `src/services/apiKeyService.ts`、`src/services/purchaseService.ts`。
- 影响 OpenSpec、平台 API 文档和 commerce 说明。
- 需要新增最小纯函数测试，覆盖 key 哈希与订阅账本核心规则。
