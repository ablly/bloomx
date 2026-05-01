## ADDED Requirements

### Requirement: 管理员后台必须登录后访问
系统 SHALL 在访问 `/admin` 或 `/admin/*` 时要求用户先完成管理员登录，未登录用户不得看到后台数据面板或敏感操作入口。

#### Scenario: 未登录访问管理员后台
- **WHEN** 未登录用户访问 `/admin`
- **THEN** 系统显示管理员登录表单
- **AND** 系统不展示运营总览、支付交易、账本、Webhook、审计或系统配置数据

#### Scenario: 已登录 Owner 访问管理员后台
- **WHEN** `zqhablly@gmail.com` 完成登录并访问 `/admin`
- **THEN** 系统显示商业后台控制台
- **AND** 系统允许进入 `/admin/payments`、`/admin/webhooks`、`/admin/audit`、`/admin/settings` 等子路由

### Requirement: 管理员入口必须限制 Owner 邮箱
系统 SHALL 默认只允许 `zqhablly@gmail.com` 进入管理员后台，并允许后续通过 `VITE_ADMIN_ALLOWED_EMAILS` 扩展白名单。

#### Scenario: 非 Owner 账号访问后台
- **WHEN** 已登录用户的邮箱不在管理员白名单中并访问 `/admin`
- **THEN** 系统显示权限不足
- **AND** 系统提供退出当前账号的入口
- **AND** 系统不得展示后台数据表或敏感动作按钮

#### Scenario: 管理员白名单扩展
- **WHEN** 生产环境配置 `VITE_ADMIN_ALLOWED_EMAILS`
- **THEN** 系统按照逗号分隔邮箱列表判断管理员入口权限
- **AND** 邮箱比较 MUST 忽略首尾空格和大小写

### Requirement: 管理员密码不得写入仓库
系统 MUST 不在源码、文档、配置示例、构建产物说明或提交信息中保存管理员密码。

#### Scenario: 管理员提交登录
- **WHEN** 管理员在登录表单输入密码
- **THEN** 前端只将密码提交给认证服务
- **AND** 登录完成后清空本地密码输入状态
- **AND** 代码仓库中不得出现明文密码

### Requirement: Firestore 后台集合必须由管理员规则保护
系统 SHALL 使用 Firestore rules 限制后台运营集合的读取和写入边界。

#### Scenario: Owner 邮箱读取后台集合
- **WHEN** 登录用户 token.email 为 `zqhablly@gmail.com`
- **THEN** Firestore rules 允许读取后台运营集合

#### Scenario: 前端尝试写入支付账本
- **WHEN** 前端尝试创建、更新或删除 `payment_transactions`、`credit_ledger`、`refunds`、`webhook_events`、`seller_settlements`、`automationWorkflowEvents` 或 `audit_logs`
- **THEN** Firestore rules MUST 拒绝写入
- **AND** 这些集合只能由后续服务端动作 API 写入
