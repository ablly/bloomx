# BloomX TODO

更新时间：2026-05-02

## 已完成

- [x] 邮箱验证码真实发送与验证。
- [x] 积分主字段统一为 `credits_balance`。
- [x] Firestore rules 关闭敏感集合前端写入，开放必要的个人读写边界。
- [x] 商家 API 上架前测试、OpenAI 兼容调用、失败退款和调用记录链路。
- [x] `/dashboard` 个人中心、Marketplace、Product Detail、Seller Dashboard 重构为更接近真实业务的状态。
- [x] API Key 支持命名、创建、一次性展示、启停、删除。
- [x] 商家申请写入 `user_id`，并兼容旧 `uid`。
- [x] 管理员后台要求登录和白名单，后台只读真实 Firestore 数据。
- [x] 管理员动作 API 升级为审批状态机。
- [x] 售后工单入口和 `supportTickets` 安全规则。
- [x] 自动化事件统一写入 `automationWorkflowEvents`。
- [x] n8n / Make 默认路线已移除，改为免费自托管工作流栈。
- [x] 新增 `WORKFLOW_*` Secret 契约、`npm run workflow:doctor`、`/workflows.html` 和 `WORKFLOWS.md`。

## P0：当前必须补齐

- [ ] 在 Firebase Secret Manager 写入 `WORKFLOW_*` Webhook URL。
- [ ] 部署 Activepieces 自托管社区版，并建立商家审核、售后、支付回执、事件总线 4 条工作流。
- [ ] 部署 Node-RED API 健康巡检流。
- [ ] 部署 Windmill 月结快照脚本。
- [ ] 重新部署 Firebase Functions，使通用免费工作流触发器上线。
- [ ] 在 Cloudflare Pages 添加 `VITE_INVOKE_MERCHANT_MODEL_URL`。
- [ ] 重新部署 Cloudflare Pages。
- [ ] 用真实商家 API 完成一次测试通过、管理员审核并上架。
- [ ] 用真实用户完成注册、收邮箱验证码、填回验证码、继续流程。
- [ ] 测试用户订阅、成功调用、失败退款、调用记录。

## P1：生产化补齐

- [ ] 实装 Stripe Checkout / Billing / Customer Portal / Webhook。
- [ ] 设计并实现订单、积分、订阅、退款和争议账本。
- [ ] 设计并实现商家提现/月结流程。
- [ ] 增加售后工单和争议处理后台。
- [ ] 增加商家 KYC 资料采集。
- [ ] 接入 Postmark / SES / Resend 事务邮件服务，并完成 SPF、DKIM、DMARC。
- [ ] 完成 App Check 线上验证后再开启强制执行。
- [ ] 清理 Marketplace / Seller 页面剩余硬编码英文与旧业务逻辑。
- [ ] 拆分前端大 chunk。
- [ ] 增加 Firebase services 最小测试覆盖。

## P2：体验与运营

- [ ] 设计用户套餐和积分包。
- [ ] 设计商家评分、成功率、延迟、退款率指标。
- [ ] 增加模型筛选：供应商、价格、延迟、上下文长度、成功率。
- [ ] 增加商家收入报表和导出。
- [ ] 增加平台手续费配置。
