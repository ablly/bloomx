# BloomX 项目进度审查

审查日期：2026-04-28  
Firebase 项目：`bloomx-core-infra-26`

## 当前结论

本轮已经把产品方向重新收束为“商家上架可用模型 API，用户用积分订阅并调用，平台记录扣费、退款、商家收入与结算”的交易平台逻辑。

关键更新已经落地：

- 新增并部署 `testMerchantApi` Cloud Function，商家 API 上架前必须真实测试。
- 更新 `invokeMerchantModel`，改为 OpenAI 兼容的 `/chat/completions` 调用格式。
- 用户调用商家 API 失败时，Functions 会退还积分并写入失败调用记录。
- 注册/登录弹窗已清理乱码，验证码提示改为真实邮箱收件逻辑。
- 全局输入框改为深色高对比，包含浏览器自动填充状态，输入文字可读。
- 主页模型清单已替换为更主流的模型方向，不再展示 GPT-4 Turbo、Claude 3 Opus、Gemini 1.5 等旧模型。
- `/dashboard` 已重写为更贴近商业化的个人中心：概览、API 密钥、订阅、使用情况、账单、设置。
- 中英文主文案已重写，语言切换时核心页面不再混杂乱码。
- 最新进度已写入真实 Firestore：`projectProgress/current` 和 `projectProgressReviews/review-20260428-045346`。

## 验证结果

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 前端构建 | 通过 | `npm run build` 成功 |
| Functions 构建 | 通过 | `npm --prefix functions run build` 成功 |
| Functions 部署 | 通过 | `testMerchantApi` 已创建，`invokeMerchantModel` 已更新 |
| 邮箱验证码 | 已验证 | 真实发送、真实验证、验证码文档验证后删除 |
| Firestore 写入 | 通过 | 进度文档已真实写入 Firebase |
| 商家 API 上架前测试 | 已部署 | 前端上架会调用 `testMerchantApi`，失败不允许上架 |
| 用户调用失败退款 | 已部署 | `invokeMerchantModel` 失败会退还 `credits_balance` |

## 必须手动补齐

Cloudflare Pages 需要新增环境变量：

`VITE_INVOKE_MERCHANT_MODEL_URL=https://us-central1-bloomx-core-infra-26.cloudfunctions.net/invokeMerchantModel`

添加后重新部署 Cloudflare Pages，否则用户调用测试会被前端阻止，避免没有真实 Function URL 时产生假扣费。

## 下一步

1. 推送 GitHub，触发 Cloudflare Pages 重新部署。
2. 在 Cloudflare Pages 添加 `VITE_INVOKE_MERCHANT_MODEL_URL` 并再次部署。
3. 用真实商家 API 完成一次“测试通过并上架”。
4. 注册新账号，确认 BloomX 验证码邮件能收到并能完成注册。
5. 用户订阅模型后，分别测试成功调用和失败调用的扣费/退款记录。
6. 下一轮补齐真实支付、商家提现、售后工单和后台审核。
