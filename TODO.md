# BloomX TODO

更新时间：2026-04-28

## P0：当前必须完成

- [x] Functions 构建通过。
- [x] Functions 部署到 Node.js 22。
- [x] 邮箱验证码真实发送和真实验证通过。
- [x] 余额主字段统一为 `credits_balance`。
- [x] Firestore rules 已部署并关闭 `verification_codes` 客户端访问。
- [x] 邮件密钥迁移到 Firebase Secret Manager。
- [x] 新增 `testMerchantApi`，商家 API 上架前必须测试。
- [x] 更新 `invokeMerchantModel`，支持 OpenAI 兼容调用并失败退款。
- [x] 修复输入框可读性。
- [x] 修复注册/登录弹窗中文乱码和邮箱验证码提示。
- [x] 重写 `/dashboard` 个人中心结构。
- [x] 重写核心中英文文案。
- [x] 将最新进度写入真实 Firestore。
- [x] 新增 Make.com 工作流网关，支持商家审核、售后、支付成功、月结和 API 健康快照事件。
- [x] 在交易运行台新增售后工单提交入口，并开放 `supportTickets` 安全规则。
- [x] 修复商家申请 `user_id` 契约，并新增管理员审核台。
- [x] 新增 Make MCP 工具流清单和 `npm run make:mcp:doctor` 自检命令。
- [x] 新增 n8n 优先的自动化网关、5 个 n8n 工作流模板和 `npm run n8n:doctor` 自检命令。
- [ ] 在 Cloudflare Pages 添加 `VITE_INVOKE_MERCHANT_MODEL_URL`。
- [ ] 重新部署 Cloudflare Pages。
- [x] 通过 n8n MCP 创建并激活 5 个 BloomX n8n 工作流。
- [x] 通过 n8n MCP 创建并激活 BloomX 全项目事件总线工作流。
- [x] 把 6 个 n8n Production Webhook URL 写入 Firebase Secret Manager。
- [x] 部署 Firebase Functions，使 n8n 自动化触发器上线。
- [x] 完成 Firestore 到 n8n event bus 的线上闭环 smoke test。
- [ ] 用真实商家 API 完成一次测试通过并上架。
- [ ] 用真实用户完成注册、收邮箱验证码、填回验证码、继续流程。
- [ ] 测试用户订阅、成功调用、失败退款、调用记录。

## P1：生产化补齐

- [ ] 接入真实支付：Stripe / 微信 / 支付宝至少选择一个主路径。
- [ ] 设计并实现商家提现/月结流程。
- [x] 增加售后工单的 Make 自动化出口。
- [x] 增加售后工单的 n8n 自动化出口。
- [ ] 增加售后工单和争议处理后台。
- [x] 增加商家基础审核状态和管理员通过/拒绝操作。
- [ ] 增加商家 KYC 资料采集。
- [ ] 完成 App Check 线上验证后再开启强制执行。
- [ ] 清理旧 Marketplace / Seller 页面中的硬编码英文与旧业务逻辑。
- [ ] 拆分前端大 chunk。
- [ ] 增加 Firebase services 最小测试覆盖。

## P2：体验与运营

- [ ] 设计用户套餐和积分包。
- [ ] 设计商家评分、成功率、延迟、退款率指标。
- [ ] 增加模型筛选：供应商、价格、延迟、上下文长度、成功率。
- [ ] 增加商家收入报表和导出。
- [ ] 增加平台手续费配置。
