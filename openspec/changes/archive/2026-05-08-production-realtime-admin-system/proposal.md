# 生产级实时后台管理系统

## 背景

BloomX 后台已经能读取真实 Firestore 集合，并能展示用户、支付、账本、Webhook、工作流等运营数据。但当前能力仍偏“运营看板原型”：数据读取以客户端集合查询为主，实时性、权限边界、审计闭环、自动化工作流联动、故障可见性和生产发布流程还没有形成统一标准。

BloomX 是大模型 API 能力交易市场，生产后台必须服务交易、审核、调用、支付、退款、结算、售后、监控和自动化闭环。后台不能依赖假数据，不能只靠前端成功页判断状态，不能让敏感动作绕过服务端审计。

## 目标

- 将 `/admin` 升级为实时更新的生产运营控制台。
- 所有后台模块读取真实集合，并支持 Firestore 实时订阅或服务端聚合快照。
- 支付、积分、Webhook、退款、争议和结算必须以服务端账本和已验签事件为准。
- 管理员敏感动作必须走服务端 API、审批状态机、幂等键和 `audit_logs`。
- Activepieces 作为默认生产工作流平台，承接商家审核、支付成功通知、售后工单、月结草稿、健康巡检和失败重试。
- Node-RED 用于轻量事件桥接，Windmill 用于脚本型后台任务；n8n/Make 不作为默认生产依赖。
- 明确 Stripe-only 支付边界，Dodo Payments 不作为当前实现 provider。

## 不做范围

- 本变更不引入新的支付 provider。
- 本变更不把 Stripe secret、Firebase service account、Activepieces token 或 Webhook secret 写入前端。
- 本变更不把所有后台聚合一次性迁移到 BigQuery/数据仓库；先以 Firestore 实时流和可测试聚合逻辑为主。
- 本变更不自动替管理员执行高风险退款、结算、角色提升或商家资金动作；这些必须保留审批和审计。

## 影响范围

- 前端后台：`src/components/admin/AdminOperations.tsx`
- 后台数据服务：`src/services/adminOperationsService.ts`
- Firebase 初始化兼容：`src/lib/firebase.ts`
- 测试脚本：`scripts/admin-snapshot-core.test.ts`
- 项目规划：`docs/superpowers/plans/2026-05-07-production-realtime-admin-system.md`
- OpenSpec：`openspec/changes/production-realtime-admin-system/**`

