# 项目进度日志

## 2026-04-28 设计系统、WebGL 与 Make 工作流更新

- 已新增 `DESIGN.md`，明确 BloomX 的设计方向：可信交易、清晰结算、深色非纯黑、输入高对比、按钮状态完整。
- 已新增 `dna/bloomx/product-dna.md`，把项目定义固定为“商家出售闲置大模型 API 能力，用户用积分订阅并调用”的双边交易市场。
- 已新增 `MAKE_WORKFLOWS.md`，规划商家审核、API 健康巡检、充值发票、商家月结、售后工单 5 条 Make.com 自动化场景。
- 已接入 `playcanvas`，新增 `WebGLMarketField`，用 PlayCanvas WebGL 做可交互的买家、平台路由、商家供给网络背景。
- 已修复登录/注册弹窗输入框颜色，避免浅色输入框导致用户看不清输入内容。
- 已重写 `/dashboard` 个人中心关键中文文案，修复乱码并统一商业化控制台语气。
- 已更新中文 i18n 资源，主站中文与英文切换更完整。
- 已提交并推送到 GitHub：`d66b042 Refine BloomX design system and WebGL background`。
- `npm run build` 通过；Cloudflare 直接部署被阻止，原因是本机缺少 `CLOUDFLARE_API_TOKEN`。

## 下一步

1. 在 Cloudflare 里重新部署 GitHub 最新提交，或提供 `CLOUDFLARE_API_TOKEN` 让我直接部署。
2. 用线上 `https://bloomx.pages.dev/` 再测注册、验证码、登录、商家 API 上架前测试、用户订阅和真实调用。
3. 补齐 Make.com Webhook URL，把商家审核、售后工单和月结报表接到真实自动化场景。
4. 继续清理 Marketplace、Seller Dashboard、Product Detail 里残留的旧页面结构和硬编码文案。

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
