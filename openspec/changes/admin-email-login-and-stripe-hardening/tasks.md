## 1. 管理员入口门禁

- [x] 1.1 在 `/admin` 前端入口加入 Firebase 登录页，未登录时不展示后台数据面板。
- [x] 1.2 默认只允许 `zqhablly@gmail.com` 进入后台，并支持 `VITE_ADMIN_ALLOWED_EMAILS` 扩展白名单。
- [x] 1.3 登录表单只提交密码，不在源码、文档、配置示例或提交信息中保存密码。
- [x] 1.4 非白名单账号访问后台时显示权限不足和退出入口。

## 2. 数据访问边界

- [x] 2.1 在 Firestore rules 中允许 Owner 邮箱或 admin 角色读取后台运营集合。
- [x] 2.2 禁止前端写入支付交易、积分账本、退款、Webhook、结算、工作流事件和审计日志集合。
- [x] 2.3 保持后台敏感动作只作为后续服务端审计 API 的入口，不在前端直接改账。

## 3. Stripe-first 支付规范

- [x] 3.1 在规格中明确 Stripe Checkout Sessions、Billing、Customer Portal、Connect Accounts v2 为首发路线。
- [x] 3.2 在规格中明确 Webhook raw body 验签、幂等去重和服务端账本权威来源。
- [x] 3.3 在规格中禁止 Charges、Sources、前端保存 secret key 或仅凭 success_url 发放权益。

## 4. 验证与交付

- [x] 4.1 运行前端生产构建。
- [x] 4.2 运行 OpenSpec 严格校验。
- [x] 4.3 运行项目简报命令。
- [x] 4.4 检查本地预览关键页面和敏感信息扫描。
