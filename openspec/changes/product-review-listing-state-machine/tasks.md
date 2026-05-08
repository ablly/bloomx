## 1. 服务端商品审核状态机

- [x] 1.1 扩展管理员动作白名单，新增 `approve_product_listing`、`reject_product_listing`、`suspend_product_listing`。
- [x] 1.2 实现商品审核执行逻辑，同步 `products`、卖家子集合、`apiOffers` 和 `merchantApiSecrets`。
- [x] 1.3 增加 offer 构建与模型列表归一化 helper，并补最小测试。

## 2. 前端管理员入口

- [x] 2.1 扩展 `AdminActionType`。
- [x] 2.2 商品记录详情显示“批准上架 / 拒绝上架 / 暂停商品”动作。
- [x] 2.3 商品状态类型加入 `suspended`。

## 3. 平台调用兼容

- [x] 3.1 `invokeMerchantModel` 保留 `modelName` 查询。
- [x] 3.2 增加 `modelNames array-contains` 兜底查询。
- [x] 3.3 文档说明商品上架会生成运行时 `apiOffers`。

## 4. 验证

- [x] 4.1 运行 `npm --prefix functions run build`。
- [x] 4.2 运行商品审核核心测试。
- [x] 4.3 运行 `npm run build`。
- [x] 4.4 运行 `npm run spec:validate:strict`。
- [x] 4.5 运行 `npm run workflow:doctor`。
- [x] 4.6 运行 `npm run brief`。
- [ ] 4.7 启动本地预览，用 Chrome 检查 `/admin`、`/marketplace`、`/project-hub.html` 控制台和页面加载。
