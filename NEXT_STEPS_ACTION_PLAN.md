# BloomX 下一步行动计划

制定日期：2026-04-27  
目标：所有关键业务数据以真实 Firebase 为准，不再依赖假数据或过时文档。

## Phase 1：发布 Firebase 后端能力

优先级：P0

- 登录 Firebase CLI 或配置 CI 发布凭据。
- 部署 Cloud Functions：`sendVerificationEmail`、`verifyEmailCode`、`cleanupExpiredCodes`、`invokeMerchantModel`。
- 部署 Firestore rules，确保线上 `verification_codes` 不再允许客户端公开读写。
- 部署后用真实注册流程验证邮箱验证码闭环。

验收标准：
- `npm --prefix functions run build` 通过。
- 生产注册验证码不经过客户端写入/读取 `verification_codes`。
- Firestore 线上 release 指向新的安全 ruleset。

## Phase 2：统一商品与商家主模型

优先级：P0

- 在 `sellers/products` 与 `sellerProfiles/apiOffers` 中选择一个主模型。
- 推荐短期保留 `sellerProfiles/apiOffers` 作为 API marketplace 主模型，因为 runtime/gateway 已围绕它工作。
- 将 Marketplace、Seller Dashboard、Product Detail 的读取路径统一到同一套集合。
- 为 `apiOffers/status`、`apiOffers/ownerId`、`subscriptions/userId`、`apiCallRecords/userId`、`apiOfferStats/ownerId` 补齐索引。

验收标准：
- Marketplace 能显示真实 Firebase 数据。
- Seller 创建、上架、订阅、调用记录都落到同一套集合。

## Phase 3：初始化最小真实业务数据

优先级：P0

- 创建至少 1 个 seller profile。
- 创建至少 1 个 listed API offer。
- 创建至少 1 个 credit package。
- 写入 `projectProgress/current` 的数据快照。

验收标准：
- 真实 Firestore 不再只有 `users`。
- 首页/Marketplace/Dashboard 能读到真实业务数据。

## Phase 4：生产质量线

优先级：P1

- 修复 high/critical 依赖风险。
- 收敛生产 console 日志。
- 增加 Firebase services 最小测试覆盖。
- 清理乱码文档，仅保留可信当前状态。

验收标准：
- `npm run build` 通过。
- `npm --prefix functions run build` 通过。
- `npm audit` 不再有 high/critical。
