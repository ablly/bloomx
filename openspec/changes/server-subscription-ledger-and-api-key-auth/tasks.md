## 1. Platform API Key 服务端化

- [x] 1.1 新增 `functions/src/platformApiKeys.ts`，实现 key 生成、哈希、启停、删除 callable。
- [x] 1.2 修改 `functions/src/index.ts`，导出新的平台 key functions。
- [x] 1.3 修改 `src/services/apiKeyService.ts`，将 create/update/toggle/delete 改成 callable 调用。

## 2. Marketplace 订阅服务端账本

- [x] 2.1 新增 `functions/src/subscriptions.ts`，实现 Marketplace 订阅购买 callable。
- [x] 2.2 修改 `src/services/purchaseService.ts`，将 `createPurchase` 改为调用服务端订阅函数。
- [x] 2.3 保持 `users/{uid}/purchases` 读路径兼容，同时写全局 `subscriptions`、`purchases`、`credit_ledger`、`seller_earnings`。

## 3. 平台调用鉴权与 usage/refund ledger

- [x] 3.1 修改 `functions/src/platformProxy.ts`，使用哈希 key 子集合鉴权替代 `users.platformApiKey`。
- [x] 3.2 在调用成功/失败路径分别写 usage/refund ledger，并在成功时写 seller earnings。
- [x] 3.3 更新 `docs/platform-api.md` 与 `docs/firebase-commerce-setup.md`，说明新的 key 与账本模型。

## 4. 验证

- [x] 4.1 新增最小测试文件，覆盖 key 哈希和订阅主键/分账规则。
- [x] 4.2 运行 `npm --prefix functions run build`。
- [x] 4.3 运行相关测试。
- [x] 4.4 运行 `npm run build`。
- [x] 4.5 运行 `npm run spec:validate:strict`。
- [x] 4.6 运行 `npm run workflow:doctor`。
- [x] 4.7 运行 `npm run brief`。
