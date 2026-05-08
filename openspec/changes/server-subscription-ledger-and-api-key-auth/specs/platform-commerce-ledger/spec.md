## ADDED Requirements

### Requirement: Platform API Key 服务端管理
系统 SHALL 只允许通过服务端生成和管理 BloomX 平台 API Key，且服务端必须以哈希形式存储 key。

#### Scenario: 登录用户创建平台 API Key
- **WHEN** 登录用户在 Dashboard 创建新的 API Key
- **THEN** 服务端 SHALL 生成完整 key 并只返回一次
- **AND** 服务端 SHALL 只在 `users/{uid}/api_keys/{keyId}` 中存储 `key_hash`、前后缀和状态
- **AND** 前端 SHALL 不直接写完整 key 或关键哈希字段到 Firestore

#### Scenario: 平台 API 调用校验 key
- **WHEN** 客户端携带 `Authorization: Bearer <platformApiKey>` 调用平台模型
- **THEN** 服务端 SHALL 对传入 key 做哈希并匹配 `api_keys` 子集合
- **AND** 只有激活中的 key 才能通过鉴权
- **AND** 系统不得再依赖 `users.platformApiKey`

### Requirement: Marketplace 订阅购买服务端账本
系统 SHALL 通过单个服务端入口完成 Marketplace 订阅购买、扣积分和账本写入。

#### Scenario: 用户订阅已上架商品
- **WHEN** 登录用户订阅一个已上架商品
- **THEN** 服务端 SHALL 校验用户积分余额
- **AND** 服务端 SHALL 在一个事务中更新 `users/{uid}` 余额
- **AND** 服务端 SHALL 写入 `subscriptions`、`purchases`、`users/{uid}/purchases`、`credit_ledger` 和 `seller_earnings`
- **AND** 服务端 SHALL 对同一 `uid + productId` 保持幂等，不得重复扣费

#### Scenario: 用户积分不足
- **WHEN** 登录用户尝试订阅但积分不足
- **THEN** 服务端 SHALL 拒绝本次订阅
- **AND** 系统不得写入订阅、购买、账本或卖家收入记录

### Requirement: 平台调用 usage/refund ledger
系统 SHALL 为每次平台调用写入可审计的 usage/refund ledger，并在成功时记录卖家收入。

#### Scenario: 调用成功
- **WHEN** 已订阅用户成功调用已上架模型
- **THEN** 服务端 SHALL 先校验有效订阅和有效平台 key
- **AND** 服务端 SHALL 扣除调用积分并写 `credit_ledger` 的 `usage` 记录
- **AND** 服务端 SHALL 写 `apiCallRecords`
- **AND** 服务端 SHALL 写卖家收入记录

#### Scenario: 调用失败并退款
- **WHEN** 平台已扣费但商家接口调用失败
- **THEN** 服务端 SHALL 回滚用户积分
- **AND** 服务端 SHALL 写 `credit_ledger` 的 `refund` 记录
- **AND** 对应 `apiCallRecords` SHALL 标记为 `failed`
- **AND** 系统不得为该失败调用保留卖家收入
