## Context

BloomX 管理后台已经具备登录门禁、真实集合读取、记录检查器和禁用的敏感动作入口。为了达到生产商业后台要求，必须把敏感动作统一收束到服务端，而不是让前端直接更新 Firestore 文档。

## Goals / Non-Goals

**Goals:**

- 建立 `runAdminAction` callable function，作为后台敏感动作统一入口。
- 校验调用者身份：Owner 邮箱或用户文档 role 为 admin。
- 第一版只做 dry-run 审计，写入 `audit_logs` 并返回 requestId。
- 前端按钮能提交动作请求、显示成功/失败状态和 requestId。

**Non-Goals:**

- 本次不真正调整用户角色、不冻结账号、不修正积分。
- 本次不执行退款、Webhook 重放、结算批准或配置保存。
- 本次不存储任何管理员密码或支付密钥。

## Decisions

1. **使用 Firebase callable function。**
   项目已有 Firebase Functions 和 Auth，上手成本最低，并能直接读取 `context.auth` 做身份校验。

2. **第一版强制 dry-run。**
   这样前端按钮可以从“摆设”变成“可审计请求”，但不会在没有完整回滚、审批和测试前修改生产数据。

3. **审计日志先写 `audit_logs` 顶层集合。**
   管理后台已经读取该集合，后续可以直接在 `/admin/audit` 观察动作请求。

4. **targetCollection 使用白名单。**
   避免前端传任意集合路径，限制动作入口只能针对明确运营域。

## Risks / Trade-offs

- **按钮可点击但不改数据** → 运营上仍需下一步真实动作实现。缓解：返回 requestId，让流程可追踪。
- **Owner 邮箱写死默认值** → 符合当前单管理员要求。缓解：服务端支持 `ADMIN_ALLOWED_EMAILS` 环境变量扩展。
- **用户角色来自 Firestore 文档** → 如果用户文档缺失，只能通过 Owner 邮箱进入。缓解：Owner 邮箱直接放行。
