# 项目进度日志：审查与 Firebase 同步

## 2026-04-27 初始审查

- 审查项目结构、Firebase 配置、Firestore rules、Functions、文档和依赖状态。
- 验证主应用构建通过。
- 初始发现 Functions 构建被子项目依赖缺失阻塞。
- 执行依赖审计，发现 high/critical 风险。
- 通过服务账号读取真实 Firestore：除 `users` 外，核心业务集合基本为空。
- 写入真实 Firestore：`projectProgress/current`。
- 写入真实 Firestore：`projectProgressReviews/review-20260427-054247`。
- 读回并确认 Firestore 进度文档写入成功。

## 2026-04-27 代码加固

- 安装 `functions` 子项目依赖。
- 验证 `npm --prefix functions run build` 通过。
- 将余额主写入字段统一为 `credits_balance`；旧 `credits` 仅作为读取兼容。
- 改造生产验证码流程，由 Cloud Functions 负责生成、验证和清理 `verification_codes`。
- 本地重写 Firestore rules：合并 `users` 规则，关闭 `verification_codes` 客户端访问，并补齐当前运行时集合规则。
- 确认 `src/App.tsx` 没有挂载 `AuthDebug`。
- 验证 `npm run build` 通过。
- 验证 `npm --prefix functions run build` 通过。
- 将加固结果写回真实 Firestore。

## 2026-04-27 Firebase 部署

- 使用 `scripts/firebase-cli-proxy.ps1` 成功登录 Firebase CLI。
- 当前登录账号为 `zqhablly@gmail.com`。
- 当前 Firebase 项目为 `bloomx-core-infra-26`。
- 成功部署 Firestore rules 到线上 `cloud.firestore`。
- 将 Functions runtime 升级到 `nodejs22`。
- 成功部署 `sendVerificationEmail`、`verifyEmailCode`、`cleanupExpiredCodes`、`onUserCreate`、`onUserDelete`、`invokeMerchantModel`。

## 2026-04-28 邮件与 App Check 生产化

- 将 `functions/src/index.ts` 中的邮件配置从旧 `functions.config()` 迁移到 `defineSecret`。
- `sendVerificationEmail` 已绑定 `EMAIL_USER` 和 `EMAIL_PASSWORD` 两个 Secret Manager 密钥。
- 邮件发送器改为运行时创建，避免在模块加载阶段读取缺失密钥。
- 给前端 Firebase 初始化增加 `VITE_APPCHECK_RECAPTCHA_SITE_KEY` 可选配置。
- 验证 `npm --prefix functions run build` 通过。
- 验证 `npm run build` 通过；仍保留前端大 chunk warning。

## 2026-04-28 验证码真实调用排查

- `sendVerificationEmail` 和 `verifyEmailCode` 已重新部署并绑定 Secret Manager。
- 真实调用最初返回 403，已通过 Cloud Functions IAM 补齐 `allUsers -> roles/cloudfunctions.invoker`。
- 真实调用随后暴露 Firestore 复合索引缺失，已部署 `verification_codes(email, createdAt)` 索引。
- 为降低生产复杂度，验证码存储改为邮箱哈希文档 ID，发送和验证均使用直接文档读写，不再依赖复合索引。
- Gmail SMTP 初次返回 535 认证失败，随后用户重新生成 Gmail 应用专用密码并写入 `EMAIL_PASSWORD` version 3。

## 2026-04-28 验证码邮件生产闭环通过

- 真实调用 `sendVerificationEmail` 返回 `success: true`。
- Firestore `email_logs` 写入 `sent` 记录。
- Firestore `verification_codes` 写入真实验证码文档。
- 真实调用 `verifyEmailCode` 返回 `success: true`。
- 验证码文档验证后已删除，读回确认剩余验证码文档数量为 0。
- 旧的 `EMAIL_PASSWORD` secret version 1 和 2 已销毁。
- 当前验证码邮件链路已经满足基础生产闭环要求。

## 当前下一步

- 初始化最小真实业务数据。
- 验证注册、登录、余额、购买、扣费、调用记录的真实端到端链路。
- 在 Cloudflare Pages 设置 `VITE_APPCHECK_RECAPTCHA_SITE_KEY` 并重新部署前端。
- App Check 线上验证通过后开启强制执行。
- 后续升级 `firebase-functions` SDK，并优化前端 chunk。
