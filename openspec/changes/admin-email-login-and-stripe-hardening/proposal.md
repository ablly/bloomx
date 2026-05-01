## Why

当前 `/admin` 已经具备商业后台的信息架构，但入口还必须从“可访问页面”升级为“生产后台门禁”。这次变更把管理员登录、Owner 邮箱白名单、Firestore 只读保护和 Stripe-first 支付边界一起固化，避免后续运营阶段出现未授权访问、前端改账、支付状态不可信的问题。

## What Changes

- `/admin`、`/admin/*` 未登录时必须显示管理员登录页，不再展示未登录预览后台。
- 管理员前端门禁默认只允许 `zqhablly@gmail.com`，也支持后续通过 `VITE_ADMIN_ALLOWED_EMAILS` 扩展白名单。
- 管理员密码只通过登录表单提交给认证服务，不写入源码、文档、配置示例或仓库。
- Firestore 管理后台集合只允许管理员读取；支付交易、积分账本、退款、Webhook、结算、工作流事件和审计日志禁止由前端直接写入。
- Stripe 作为首发支付平台：Checkout Sessions、Billing、Customer Portal、Connect Accounts v2；Dodo Payments 继续作为 MoR/global tax 备选抽象。
- 支付状态必须来自服务端账本和已验签 Webhook，前端成功页不得直接发放积分或改变订阅状态。

## Capabilities

### New Capabilities

- `admin-auth`: 管理员后台登录门禁、Owner 邮箱白名单、未授权拦截、Firestore 后台集合访问边界。

### Modified Capabilities

- `payment`: 明确 Stripe-first 的生产集成边界、Webhook 验签、幂等账本和前端不可写支付状态。

## Impact

- 影响前端后台入口：`src/components/admin/AdminOperations.tsx`
- 影响 Firestore 规则：`firestore.rules`
- 影响项目简报和访问入口说明：`scripts/project-brief.ts`、`public/project-hub.html`
- 影响后续服务端任务：Stripe Checkout/Billing/Portal/Connect、Webhook raw body 验签、幂等事件表、审计日志、退款和结算动作 API
