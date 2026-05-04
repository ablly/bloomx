## 1. Functions 支付服务

- [x] 1.1 新增 Stripe Customer Portal callable，按当前用户查找 Stripe customer id 并返回 portal URL。
- [x] 1.2 新增管理员 Stripe 退款 callable，校验管理员权限、交易状态、退款金额和原因。
- [x] 1.3 退款请求写入 `refunds`、`audit_logs`，并更新 `payment_transactions` 为退款处理中状态。
- [x] 1.4 扩展 Stripe webhook 退款/争议处理，更新退款记录和交易状态但不自动扣减积分。
- [x] 1.5 导出新支付函数并保留测试/生产环境隔离。

## 2. 前端账单和后台入口

- [x] 2.1 扩展前端 checkout service，新增 `createStripePortalSession` 调用。
- [x] 2.2 在 Dashboard Billing 区域增加 Stripe 账单管理入口、登录/处理中/错误中文状态。
- [x] 2.3 更新管理员后台支付、退款、争议文案，说明专用服务端 API 与审计边界。

## 3. 文档和简报

- [x] 3.1 更新环境变量示例，记录 Stripe Portal 和退款/争议相关配置边界。
- [x] 3.2 更新 `npm run brief` 支付进度和剩余风险。

## 4. 验证和交付

- [x] 4.1 运行 `npm run build`。
- [x] 4.2 运行 `cd functions; npm run build`。
- [x] 4.3 运行 `npm run spec:validate:strict`。
- [x] 4.4 运行 `npm run workflow:doctor`。
- [x] 4.5 运行 `npm run brief`。
- [x] 4.6 自审密钥、权限、退款幂等、积分不扣减风险，并只提交本次相关文件。
