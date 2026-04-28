# BloomX TODO

更新时间：2026-04-28

## P0：当前阻塞

- [x] 修复 Functions 构建：`npm --prefix functions run build` 已通过。
- [x] 统一余额写入字段为 `credits_balance`，旧字段 `credits` 仅作为读取兼容。
- [x] 将生产环境验证码生成、验证、清理迁移到 Cloud Functions/Admin SDK。
- [x] 本地清理 Firestore rules：只保留一套 `users` 规则，并关闭 `verification_codes` 的客户端公开访问。
- [x] Firebase CLI 登录问题已解决：通过 `scripts/firebase-cli-proxy.ps1` 让 CLI 使用本机代理。
- [x] Firestore rules 已成功部署到线上 `cloud.firestore`。
- [x] 清除 root 和 functions 依赖审计中的 high/critical 风险。
- [x] 将项目进度和修复记录写入真实 Firestore。
- [x] 升级 Firebase 项目到 Blaze 计费计划。
- [x] 将 Functions runtime 从已停用的 Node.js 18 升级到 Node.js 22。
- [x] 部署 Functions：`sendVerificationEmail`、`verifyEmailCode`、`cleanupExpiredCodes`、`onUserCreate`、`onUserDelete`、`invokeMerchantModel`。
- [x] 将邮件凭据读取方式从旧 `functions.config()` 改为 Firebase Secret Manager。
- [x] 通过 `functions:secrets:set EMAIL_USER` 和 `functions:secrets:set EMAIL_PASSWORD` 配置生产邮件密钥。
- [x] 重新部署 `sendVerificationEmail` 和 `verifyEmailCode`，线上函数已绑定 Secret Manager。
- [x] 修复 callable 函数 403：补齐 `allUsers -> roles/cloudfunctions.invoker`。
- [x] 修复验证码查询对 Firestore 复合索引的硬依赖：改为每个邮箱一个哈希文档 ID。
- [x] 重新生成正确的 Gmail 应用专用密码并覆盖 `EMAIL_PASSWORD`。
- [x] 跑通真实验证码邮件闭环：发送成功、验证成功、验证码文档删除成功。
- [x] 销毁旧的 `EMAIL_PASSWORD` secret version 1 和 2；当前仅 version 3 启用。
- [ ] 统一商家/商品数据模型：在 `sellers/products` 和 `sellerProfiles/apiOffers` 中选择一套主模型。
- [ ] 向真实 Firestore 初始化最小业务数据。
- [ ] 为当前业务查询补齐并验证 Firestore indexes。

## P1：生产前准备

- [x] 确认主应用入口没有挂载 `AuthDebug`。
- [x] 依赖升级后重新验证前端和 Functions 构建。
- [x] 通过 Firebase CLI 代理脚本完成真实部署。
- [x] 将 `functions.config()` 迁移到现代参数/密钥方案。
- [x] App Check 已在 Firebase 控制台注册，前端已增加 `VITE_APPCHECK_RECAPTCHA_SITE_KEY` 接入口。
- [ ] 在 Cloudflare Pages 中配置生产环境变量 `VITE_APPCHECK_RECAPTCHA_SITE_KEY`。
- [ ] 线上验证 App Check token 正常后，再开启 Firebase App Check 强制执行。
- [ ] 重新拆分前端 vendor chunk；当前 Vite 7 构建仍有大 chunk warning。
- [ ] 收敛生产环境 console 日志。
- [ ] 清理过时和乱码文档。
- [ ] 增加 Firebase services 最小测试覆盖。

## P2：功能闭环

- [ ] Marketplace 显示真实 Firebase 数据。
- [ ] 完成商家入驻、审核、上架闭环。
- [ ] 完成订阅和 API 调用记录闭环。
- [ ] 完成 credits 充值和扣费流水。
- [ ] 完成 Admin 管理台。
- [ ] 完成部署和监控文档。
