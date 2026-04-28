# BloomX 项目进度审查

审查日期：2026-04-28  
Firebase 项目：`bloomx-core-infra-26`

## 当前结论

本轮 review 中指出的关键阻塞已经基本解决：Functions 构建通过并已部署，余额字段已统一到 `credits_balance`，Firestore rules 已收紧并上线，主入口未发现生产挂载 `AuthDebug`，邮件凭据已经迁移到 Firebase Secret Manager。

真实 Firebase 验证已完成：`sendVerificationEmail` 真实发送验证码成功，Firestore 写入 `email_logs` 的 `sent` 记录和 `verification_codes` 文档；`verifyEmailCode` 使用真实验证码验证成功，并在验证后删除验证码文档。旧的 `EMAIL_PASSWORD` secret version 1 和 2 已销毁，目前只有 version 3 启用。

当前还不能称为“完美生产环境”，主要剩余项是业务数据模型固化、最小真实业务数据初始化、App Check 强制执行、完整购买/扣费/调用记录端到端验证、前端 chunk 优化和测试覆盖。综合生产可用度评估：约 88%。

## 当前状态

| 维度 | 状态 | 说明 |
| --- | --- | --- |
| 前端构建 | 通过 | `npm run build` 通过；仍有大 chunk warning。 |
| Functions 构建 | 通过 | `npm --prefix functions run build` 通过。 |
| Firebase CLI 登录 | 通过 | 通过代理脚本完成登录；项目可部署。 |
| Firebase 当前项目 | 通过 | 当前项目为 `bloomx-core-infra-26`。 |
| Firestore rules | 已上线 | `firebase deploy --only firestore:rules` 成功。 |
| Functions 部署 | 已上线 | 6 个函数已部署到 `us-central1`。 |
| Functions runtime | 已升级 | 线上 runtime 为 `nodejs22`。 |
| 邮件密钥 | 已生产化 | 使用 Secret Manager；`EMAIL_PASSWORD` 当前启用 version 3。 |
| 验证码 | 真实闭环通过 | 真实发送成功、验证成功、验证码文档删除成功。 |
| callable 权限 | 已修复 | `sendVerificationEmail` 和 `verifyEmailCode` 已允许 Web 客户端调用。 |
| App Check | 已注册 | 控制台已注册，前端已预留 site key；尚未开启强制执行。 |
| Firebase 数据连接 | 已验证 | 服务账号真实 CRUD 已通过。 |
| 真实业务数据 | 不足 | 仍需初始化 seller、offer、credit package。 |
| 生产可用度 | 约 88% | 基础设施和验证码闭环已通过，业务闭环仍需补齐。 |

## 已完成

- 修复 Firebase CLI 代理登录问题。
- 登录 Firebase CLI 并选中 `bloomx-core-infra-26`。
- 成功部署 Firestore rules。
- 将 Cloud Functions runtime 升级到 Node.js 22。
- 成功部署 6 个 Functions。
- 将 `sendVerificationEmail` 的邮件凭据迁移到 Firebase Secret Manager。
- 补齐 callable 函数公开调用权限。
- 将验证码存储改为邮箱哈希文档 ID，避免发送验证码依赖复合索引。
- 真实发送验证码邮件成功。
- 真实验证验证码成功。
- 验证码文档验证后删除成功。
- 销毁旧的 `EMAIL_PASSWORD` secret version 1 和 2。
- 统一余额写入字段为 `credits_balance`。
- 前端和 Functions 构建均通过。
- 将最新进度写入真实 Firestore。

## 剩余 P0/P1

- 初始化最小真实业务数据。
- 选择并固化 Marketplace 主数据模型。
- 补齐并验证业务查询需要的 Firestore indexes。
- 在 Cloudflare Pages 中配置 `VITE_APPCHECK_RECAPTCHA_SITE_KEY`。
- 线上验证 App Check token 正常后，再开启 App Check 强制执行。
- 验证购买、扣费、调用记录等业务闭环。

## 下一步建议

1. 先初始化最小业务数据：1 个测试商家、2 到 3 个 API 商品、1 套 credits 套餐。
2. 跑通 Marketplace 浏览、购买、余额扣减、调用记录、商家收益。
3. 在 Cloudflare Pages 配置 App Check site key 并重新部署前端。
4. 线上验证 App Check 后开启强制执行。
5. 处理 `firebase-functions` SDK 升级、前端 chunk 拆分和测试覆盖。
