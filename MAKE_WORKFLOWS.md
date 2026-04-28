# BloomX Make.com 自动化工作流规划

> 当前项目里还没有可直接操作 Make.com 的已授权连接器，所以我先给出可以照着点击配置的生产工作流。你把 Make 场景的 Webhook URL 或 Make API Token 给我后，我可以继续把前端/后端对接到这些真实场景。

## 场景 1：商家入驻审核

目标：商家提交资料后，自动通知审核人，并把审核结果写回 Firebase。

操作步骤：
1. 打开 [Make.com 场景页](https://www.make.com/en/scenarios)，点击右上角 `Create a new scenario`。
2. 添加模块 `Webhooks` -> `Custom webhook` -> `Add`，命名为 `bloomx_seller_application`。
3. 复制生成的 Webhook URL。
4. 后续把这个 URL 配到 BloomX 后端或 Cloudflare 环境变量 `MAKE_SELLER_APPLICATION_WEBHOOK`。
5. 添加模块 `Google Sheets` 或 `Notion`，保存商家名称、邮箱、供应商、预计容量、UID。
6. 添加模块 `Gmail`，发邮件给审核人，标题建议：`BloomX 商家入驻待审核 - {{sellerName}}`。
7. 审核通过后，由管理员在 Firebase 中把 `sellerProfiles/{uid}.status` 更新为 `verified`。

## 场景 2：商家 API 健康度巡检

目标：定时检查已上架 API，如果失败率过高，通知平台并下架。

操作步骤：
1. 新建场景，首个模块选择 `Scheduler`。
2. 频率建议：每 30 分钟一次。
3. 添加 `HTTP` -> `Make a request`，请求 BloomX 后端巡检接口。
4. 后端读取 `apiOffers`，对 `status=listed` 的商品调用测试函数。
5. 如果失败，Make 分支发送 Gmail/Slack 通知，并调用后端接口把 `apiOffers/{offerId}.healthStatus` 写为 `failed`。
6. 连续失败超过阈值时，将 `status` 改为 `draft`，避免用户继续订阅不可用 API。

## 场景 3：用户充值与发票

目标：真实支付成功后，给用户加积分，并发送账单凭证。

操作步骤：
1. 支付平台先建议从 Stripe 开始。
2. Make 场景首个模块选择 `Webhooks` -> `Custom webhook`，命名为 `bloomx_payment_success`。
3. Stripe 支付成功后把金额、用户 UID、订单号推送到该 Webhook。
4. Make 调用 BloomX 后端接口：增加 `users/{uid}.credits_balance`。
5. 写入 `transactions`：金额、积分、支付渠道、状态、时间。
6. 使用 Gmail 给用户发送充值成功邮件。

## 场景 4：商家月结报表

目标：每月生成商家收入报表，支持月结或手动结账。

操作步骤：
1. 新建场景，首个模块选择 `Scheduler`。
2. 运行时间建议：每月 1 日 09:00。
3. 添加 `HTTP` 模块，请求 BloomX 后端结算汇总接口。
4. 后端聚合 `apiOfferStats` 和 `apiCallRecords`，生成商家收入、成功调用、失败调用、退款金额。
5. Make 把结果写入 Google Sheets 或 Notion。
6. Make 用 Gmail 发给商家和平台财务。
7. 平台确认后写入 `settlements`，状态从 `pending` 到 `paid`。

## 场景 5：售后工单

目标：用户遇到 API 跑不通、重复扣费、输出质量异常时，自动生成售后工单。

操作步骤：
1. 新建 `Custom webhook`，命名为 `bloomx_support_ticket`。
2. 前端售后按钮提交：用户 UID、订阅 ID、调用记录 ID、问题类型、说明。
3. Make 写入 Notion/Google Sheets 工单库。
4. Make 发送邮件给平台运营。
5. 后端同步写入 Firebase `supportTickets`，状态为 `open`。

## 我下一步需要你给我的内容
- Make 场景生成的 Webhook URL。
- 你希望售后工单进入哪里：Notion、Google Sheets、Gmail 还是 Slack。
- 如果要我直接通过 Make API 创建场景，需要你提供 Make API Token，并确认组织区域是 `eu1.make.com`。
