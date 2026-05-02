# BloomX 协作指令

## 默认语言

- 面向用户的总结、规划、进度、规格、设计说明、交付说明默认使用中文。
- 代码、命令、文件名、接口名、字段名、第三方工具要求的固定英文结构可以保留英文。

## 交付方法

- 非平凡功能、架构、自动化、前端或 UI 改动默认使用 OpenSpec + Superpowers 的规格闭环。
- 小文案、小修复、单点 bug 可以直接改，但仍要说明验证结果。
- 前端与 UI 设计默认使用 Taste + Open Design 原则：真实状态、清晰层级、克制装饰、可检查、可迭代。
- 流程自动化默认使用免费/开源自托管路线，生产默认平台为 Activepieces 自托管社区版；Node-RED 用于轻量事件流和基础设施编排，Windmill 用于脚本型后台任务。n8n 和 Make.com 不再作为默认生产方案，除非用户明确要求迁移历史流程。
- 支付平台默认按“Stripe 首发 + Dodo Payments 备选”的方向规划：Stripe 优先覆盖 Visa、Mastercard、支付宝和微信支付；Dodo Payments 作为 Merchant of Record、全球税务和合规备选。所有支付、订阅、积分充值、退款、Webhook 对账和商家结算相关设计都必须通过服务端完成密钥、签名和幂等校验。

## 每次完成后的固定动作

- 运行当前范围相关命令。前端改动至少运行 `npm run build`，规格改动至少运行 `npm run spec:validate:strict`，工作流改动至少运行 `npm run workflow:doctor`。
- 自审本次范围内的 bug、乱码、构建警告、UI 状态、工作流入口、遗漏规格和剩余风险。
- 如果自审发现阻塞问题，继续修复并重新验证，直到当前范围没有阻塞问题。
- 审核无误后默认提交并推送 GitHub；如果用户已经手动提交，则只同步说明状态。
- 只 stage 本次工作相关文件，不混入历史未整理改动。

## 每次最终回复必须包含

- 本次做了什么。
- 运行了哪些验证命令，以及结果。
- 项目预览页和免费工作流访问页的启动命令与访问地址。
- 简便查看入口：`npm run brief`。
- 使用到的 skill、MCP 和工具调用清单；如果没有使用某类能力，也要写“未使用”。
- 剩余风险或下一步。
- 如果任务涉及工作流，必须说明当前选择的是 Activepieces、Node-RED、Windmill，还是其它免费/开源替代方案。
- 如果任务涉及支付，必须说明 Stripe 与 Dodo Payments 的 provider 选择、支付对象、Webhook、幂等键、订单/积分账本、退款/争议、管理员审核入口和测试/生产环境隔离。

## 固定访问入口

- 启动本地预览：

```bash
npm run dev -- --host 127.0.0.1
```

- 项目预览页：

```text
http://127.0.0.1:5173/
```

- 免费工作流访问页：

```text
http://127.0.0.1:5173/workflows.html
```

- 旧 n8n 入口兼容跳转：

```text
http://127.0.0.1:5173/n8n-workflows.html
```

- 免费工作流与支付总览：

```bash
npm run workflow-options
npm run payment-plan
npm run admin-plan
```

- 项目总览页：

```text
http://127.0.0.1:5173/project-hub.html
```

- 一键简报：

```bash
npm run brief
```

## BloomX 产品边界

BloomX 是大模型 API 能力交易市场：商家提交模型 API，平台先测试再上架；用户购买或订阅积分后调用；成功调用计入商家收入，失败调用退款并留下售后记录。

后续功能必须服务交易、订阅、调用、审核、结算、售后、监控或自动化闭环，避免添加无关填充内容。
