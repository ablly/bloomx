# Production Realtime Admin System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 BloomX 后台升级为实时、可审计、可扩展的生产运营控制台。

**Architecture:** 前端后台使用 Firestore 实时订阅读取真实运营集合；敏感动作通过 Cloud Functions、审批状态机和审计日志执行；Activepieces 作为默认生产工作流平台，Node-RED 和 Windmill 作为免费/开源补位。

**Tech Stack:** React、Firebase Auth、Firestore、Cloud Functions、Stripe Checkout/Webhook、Activepieces、Node-RED、Windmill、OpenSpec、Node test runner。

---

### Task 1: 实时后台快照基础

**Files:**
- Modify: `src/services/adminOperationsService.ts`
- Modify: `src/components/admin/AdminOperations.tsx`
- Modify: `src/lib/firebase.ts`
- Create: `scripts/admin-snapshot-core.test.ts`
- Modify: `package.json`

- [x] **Step 1: 写失败测试**

Run: `npm run test:admin-snapshot-core`

Expected before implementation: FAIL because `buildAdminSnapshotFromDatasets` is not exported.

- [x] **Step 2: 实现可测试快照合成**

Export `buildAdminSnapshotFromDatasets(resolved, loadedAt)` from `src/services/adminOperationsService.ts`.

- [x] **Step 3: 实现 Firestore 实时订阅**

Add `subscribeAdminConsoleSnapshot(onNext, maxRows)` and use `onSnapshot` per dataset.

- [x] **Step 4: 接入后台页面**

Only start listeners after `authLoading === false`, `currentUser` exists, and admin email is allowed.

- [x] **Step 5: 验证**

Run:

```bash
npm run test:admin-snapshot-core
npm run build
```

Expected: both pass.

### Task 2: 管理员权限生产化

**Files:**
- Modify: `firestore.rules`
- Modify: `functions/src/adminActions.ts` or create a focused admin claims function if needed
- Test: add a rules or callable validation script

- [ ] **Step 1: 设计 custom claims 字段**

Use `admin: true` and `adminRole: "admin" | "operator" | "finance" | "reviewer" | "support"`.

- [ ] **Step 2: 增加 claims 设置入口**

Create a server-only function or script that sets claims for a known UID. Never expose this to normal frontend users.

- [ ] **Step 3: 更新 Firestore rules**

Allow protected admin collections when `request.auth.token.admin == true`.

- [ ] **Step 4: 保留邮箱白名单过渡**

During migration, keep the existing owner email as fallback, then remove it after claims are confirmed.

### Task 3: 支付对账生产快照

**Files:**
- Modify: `functions/src/payments.ts`
- Modify: `src/services/paymentReconciliation.ts`
- Add tests for reconciliation snapshots

- [ ] **Step 1: 定义 `payment_reconciliation_snapshots` 文档结构**

Fields: provider, environment, collectedAmount, creditedAmount, failedWebhooks, pendingRefunds, openDisputes, requiresReview, updatedAt.

- [ ] **Step 2: 在 Webhook 成功后刷新快照**

Only after verified Stripe events. Do not trust success URL.

- [ ] **Step 3: 后台优先读快照，缺失时回退客户端聚合**

Keep current client aggregation as fallback during migration.

### Task 4: Activepieces 工作流接入

**Files:**
- Modify: `scripts/workflow-doctor.ts`
- Modify: project documentation if workflow IDs are added
- Firebase Secrets: `WORKFLOW_*`

- [ ] **Step 1: 重启 Codex 让 Activepieces MCP 生效**

The server is installed at `C:\Users\lenovo\.codex\config.toml`.

- [ ] **Step 2: 通过 Activepieces MCP 创建工作流**

Create these flows: seller application review, payment success receipt, support ticket triage, settlement draft, API health snapshot, event bus router.

- [ ] **Step 3: 写入 Firebase Secrets**

Use `firebase functions:secrets:set WORKFLOW_*` for each webhook URL.

- [ ] **Step 4: 验证**

Run `npm run workflow:doctor` and confirm every required workflow secret exists.

### Task 5: 完整验证与发布

**Files:**
- Stage only touched files.

- [ ] **Step 1: 运行验证**

```bash
npm run test:admin-snapshot-core
npm run build
npm --prefix functions run build
npm run spec:validate:strict
npm run workflow:doctor
npm run brief
```

- [ ] **Step 2: 部署规则和前端**

```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

- [ ] **Step 3: 提交**

```bash
git add src/services/adminOperationsService.ts src/components/admin/AdminOperations.tsx src/lib/firebase.ts scripts/admin-snapshot-core.test.ts package.json openspec/changes/production-realtime-admin-system docs/superpowers/plans/2026-05-07-production-realtime-admin-system.md
git commit -m "Add realtime production admin system plan"
git push
```

