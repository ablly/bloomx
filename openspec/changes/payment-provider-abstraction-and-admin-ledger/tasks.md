# 任务清单

## 规格与架构

- [x] 明确 Stripe 首发、Dodo Payments 预留/MoR 备选的支付路线。
- [x] 定义支付 provider 抽象层和统一账本边界。
- [x] 定义管理员后台对支付、积分、退款、Webhook 和结算的最低入口。
- [x] 更新项目简报和总览页，避免继续把 Dodo 写成唯一默认支付平台。

## 实现准备

- [ ] 新增 `paymentProviderService` 抽象接口和 provider registry。
- [ ] 新增 Stripe adapter 骨架，不写入真实密钥。
- [ ] 新增 Dodo adapter 占位和配置校验，不写入真实密钥。
- [ ] 新增 Firestore 类型定义：交易、积分账本、订阅、退款、Webhook、结算、审计日志。
- [ ] 新增管理员后台 `/admin/payments`、`/admin/ledger`、`/admin/webhooks` 的路由骨架。
- [ ] 新增 webhook 幂等处理和失败记录服务骨架。

## 验证

- [ ] `npm run spec:validate:strict`
- [ ] `npm run build`
- [ ] 本地预览访问 `/project-hub.html`、`/` 和后续 `/admin`。
- [ ] 自审支付密钥没有进入前端和仓库。
- [ ] 自审所有支付状态变更都以服务端账本和 Webhook 为准。
