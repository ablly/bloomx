## 1. Stripe-only 方向收敛

- [x] 1.1 将支付 provider 类型、前端 provider registry、管理员文案和项目简报收敛为 Stripe-only。
- [x] 1.2 更新环境变量示例，记录 Stripe secret、webhook secret 和现有 Stripe Price ID 配置方式。

## 2. 服务端支付闭环

- [x] 2.1 在 Functions 安装 Stripe SDK。
- [x] 2.2 新增服务端 Stripe 套餐白名单、checkout callable 和本地交易记录写入。
- [x] 2.3 新增 Stripe webhook HTTP endpoint，完成验签、事件记录、交易状态更新和积分账本幂等入账。
- [x] 2.4 导出支付函数并保留测试/生产环境隔离。

## 3. 前端结账入口

- [x] 3.1 新增前端 checkout service，只调用 Cloud Functions，不接触 Stripe secret。
- [x] 3.2 将定价按钮接入 Stripe checkout，并提供中文错误、登录和处理中状态。
- [x] 3.3 将套餐文案与 Stripe 账户已有 STARTER、CREATOR、PRO 价格保持一致。

## 4. 验证和交付

- [x] 4.1 运行 `npm run build`。
- [x] 4.2 运行 `cd functions; npm run build`。
- [x] 4.3 运行 `npm run spec:validate:strict`。
- [x] 4.4 运行 `npm run workflow:doctor`。
- [x] 4.5 运行 `npm run brief`。
- [x] 4.6 自审密钥、幂等、账本、退款/争议剩余风险，并只提交本次相关文件。
