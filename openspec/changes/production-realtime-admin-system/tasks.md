# 任务清单

## 第一阶段：实时后台基础

- [x] 为后台快照合成逻辑增加 Node 测试。
- [x] 抽出 `buildAdminSnapshotFromDatasets`，让聚合逻辑脱离 Firebase 网络可测。
- [x] 新增 `subscribeAdminConsoleSnapshot`，使用 Firestore `onSnapshot` 实时订阅后台集合。
- [x] 后台页面只在登录恢复完成且管理员邮箱确认后启动订阅。
- [x] 单集合读取失败时保留其它集合数据，并在对应模块显示错误。
- [x] 让 Firebase 初始化兼容 Vite 浏览器环境和 Node 测试环境。

## 第二阶段：权限与审计

- [ ] 增加管理员 custom claims 设置脚本或 Cloud Function。
- [ ] Firestore rules 从邮箱白名单逐步升级为 custom claims + 用户角色校验。
- [ ] 管理员动作必须统一写入 `admin_action_requests` 和 `audit_logs`。
- [ ] 审计页增加 actor、目标集合、状态、时间筛选。

## 第三阶段：支付与对账

- [ ] 将支付对账摘要从客户端聚合升级为可选服务端快照。
- [ ] 增加 Stripe Webhook 重放队列和后台按钮，但执行仍走服务端。
- [ ] 增加退款/争议复核详情页，显示 Stripe ID、交易 ID、账本影响和审计链路。
- [ ] 增加生产/测试环境隔离标识，避免测试数据误判为生产数据。

## 第四阶段：Activepieces 工作流

- [ ] 连接 Activepieces MCP 后创建 `seller_application_review` 工作流。
- [ ] 创建 `payment_success_receipt` 工作流。
- [ ] 创建 `support_ticket_triage` 工作流。
- [ ] 创建 `settlement_report_draft` 工作流。
- [ ] 创建 `api_health_snapshot` 工作流。
- [ ] 将每条工作流的 Webhook URL 写入 Firebase Secret Manager 的 `WORKFLOW_*`。
- [ ] 后台工作流页实时显示 `automationWorkflowEvents` 和失败死信。

## 验证

- [ ] `npm run test:admin-snapshot-core`
- [ ] `npm run build`
- [ ] `npm --prefix functions run build`
- [ ] `npm run spec:validate:strict`
- [ ] `npm run workflow:doctor`
- [ ] `npm run brief`

