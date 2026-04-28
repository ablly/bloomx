# 项目进度日志

## 2026-04-28 商家 API 交易闭环更新

- 已明确产品赛道：BloomX 是类似“闲鱼式”的模型 API 能力交易平台。
- 商家可以提交模型名称、API URL、API Key、价格和说明。
- 新增 `testMerchantApi` Cloud Function，商家 API 必须测试通过才允许上架。
- `invokeMerchantModel` 已改为 OpenAI 兼容请求体，用户调用失败会自动退款。
- 商家控制台已重写为：商家入驻、API 上架、市场订阅、积分与密钥、调用测试、结算与售后。
- 注册/登录弹窗已重写，中文和英文都可读，验证码流程指向真实邮箱。
- 全局输入框改为深色高对比，解决输入内容看不清的问题。
- `/dashboard` 个人中心已重写为更成熟的商业化结构。
- 主页模型清单已替换为当前主流模型方向。
- `npm --prefix functions run build` 通过。
- `npm run build` 通过。
- Firebase Functions 已部署成功。
- 最新进度已写入真实 Firestore：
  - `projectProgress/current`
  - `projectProgressReviews/review-20260428-045346`

## 当前阻塞

- Cloudflare Pages 还需要添加 `VITE_INVOKE_MERCHANT_MODEL_URL`。
- 真实支付、商家提现、售后工单和平台后台审核还未完成。
- 旧 Marketplace / Seller 子页面仍有部分硬编码英文，下一轮继续统一。

## 下一步

1. 推送 GitHub 并等待 Cloudflare 自动部署。
2. 在 Cloudflare Pages 环境变量中添加：
   `VITE_INVOKE_MERCHANT_MODEL_URL=https://us-central1-bloomx-core-infra-26.cloudfunctions.net/invokeMerchantModel`
3. 重新部署 Cloudflare Pages。
4. 用一个真实 OpenAI 兼容商家 API 测试“上架前测试”。
5. 注册新用户并完成邮箱验证码闭环。
6. 订阅模型并测试成功调用、失败调用、扣费、退款、调用记录。
