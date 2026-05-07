# 设计说明

## 总体架构

生产后台采用“实时读 + 服务端动作 + 审计记录 + 工作流编排”的边界：

- 前端后台只负责展示、筛选、提交管理员意图，不直接改受保护集合。
- Firestore 实时订阅用于低吞吐运营集合，例如 `users`、`payment_transactions`、`credit_ledger`、`webhook_events`、`refunds`、`automationWorkflowEvents`。
- 敏感动作通过 Cloud Functions 执行，写入 `admin_action_requests` 和 `audit_logs`，并使用幂等键避免重复执行。
- Activepieces 承接跨系统工作流，所有工作流事件回写 `automationWorkflowEvents`，后台只显示真实状态。
- 支付数据以 Stripe Checkout、已验签 Webhook、`payment_transactions` 和 `credit_ledger` 为准，不依赖 `success_url`。

## 第一阶段实现

第一阶段把后台数据服务从一次性 `getDocs` 升级为 `onSnapshot` 实时订阅：

- 每个集合独立订阅。
- 任一集合读取失败时，只标记该集合 `error`，不拖垮整个后台。
- 快照聚合逻辑抽成 `buildAdminSnapshotFromDatasets`，可在 Node 测试中验证。
- 页面在 Firebase Auth 恢复完成、且当前用户是管理员邮箱后才启动订阅。
- 订阅卸载时统一取消，避免路由切换或退出登录后继续监听。

## 后续生产化方向

### 权限

- 管理员身份应从邮箱白名单过渡到 custom claims + 用户角色双校验。
- 前端白名单只作为体验层提示，真正授权由 Firestore rules 和 Cloud Functions 决定。
- 角色建议拆分为 `admin`、`operator`、`finance`、`reviewer`、`support`。

### 实时与性能

- 当前低量阶段可以直接监听集合前 N 条。
- 数据增长后应引入服务端聚合集合，例如 `admin_realtime_snapshots`、`admin_queue_items`、`payment_reconciliation_snapshots`。
- 大集合必须按状态、时间和 owner 建索引，避免客户端全表扫描。

### 审计

- 所有敏感动作必须写 `audit_logs`。
- 审计记录必须包含 actor、role、actionType、target、reason、requestId、idempotencyKey、before/after 摘要和执行结果。
- 审计列表应支持按 actor、目标集合、状态和时间筛选。

### Activepieces

Activepieces 是默认生产工作流平台。推荐第一批工作流：

- `seller_application_review`: 商家提交后通知审核人员，审核结果回写后台。
- `payment_success_receipt`: Stripe 入账成功后发送通知、记录工作流事件。
- `support_ticket_triage`: 售后工单进入分类、通知、超时升级。
- `settlement_report_draft`: 月结草稿生成，等待财务复核。
- `api_health_snapshot`: 定时健康巡检，失败写入故障队列。
- `event_bus_router`: 统一事件路由和失败死信。

### 支付

- 当前 provider 为 Stripe-only。
- 支付对象为 Checkout Session、Price、Customer Portal、Webhook Event、Refund/Dispute。
- 幂等键贯穿 Checkout、Webhook、积分账本、退款请求和管理员动作。
- 退款/争议 Webhook 更新状态，不自动扣减积分；扣减或冻结必须走管理员审批。

