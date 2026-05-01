# 设计说明

## 信息架构

后台模块包括：

- 运营总览
- 用户与权限
- 商家审核
- API 商品
- 订单授权
- 支付交易
- 积分账本
- 退款复核
- 免费工作流
- Webhook 事件
- 商家结算
- 审计日志
- 系统配置

## 数据边界

前端只做读取和运营可视化。敏感动作按钮保留入口状态，但在没有管理员授权和服务端 API 前禁用。数据来自 Firestore 集合：

- `users`
- `sellers`
- `products`
- `purchases`
- `payment_transactions`
- `credit_ledger`
- `refunds`
- `automationWorkflowEvents`
- `webhook_events`
- `seller_settlements`
- `audit_logs`

## UI 原则

- 使用 Taste/Open Design 的后台产品原则：高密度但不拥挤，模块清晰，状态明确。
- 不使用虚假交易或占位业务数据。
- 空状态展示真实缺口，读取失败直接展示错误。
- 运营动作必须显示权限与服务端审计限制，避免误导为已经具备生产动作能力。

## 生产约束

- 管理员权限必须由服务端 custom claims 或等价权限系统控制。
- 所有敏感动作必须写 `audit_logs`。
- 支付状态以服务端账本与已验签 Webhook 为准。
- 工作流默认走免费自托管路线：Activepieces 为主，Node-RED/Windmill 补位。

