## 架构

### Provider Adapter

新增服务端 `providerAdapters` 模块。所有 Provider 都实现统一接口：

- `fetchModels(input)`：从真实 Provider API 拉取模型列表。
- `smokeTest(input)`：对指定模型执行最小可用请求。
- `normalizeError(error)`：把 Provider 错误归一为平台错误。

第一版支持 HTTP 型 Provider：OpenAI Compatible、OpenAI、Anthropic、Gemini、Azure OpenAI、Mistral、Cohere、Groq、Together、OpenRouter、Ollama Gateway、Custom HTTP。Bedrock 需要 AWS SigV4 和区域/IAM 策略，本次只登记类型并返回明确阻断。

### 安全边界

- 所有 Provider 请求只在 Cloud Functions 服务端执行。
- URL 必须是 HTTPS，禁止 localhost、内网 IP、metadata 地址和私有网段，防 SSRF。
- API 密钥用服务端 Secret 派生密钥 AES-GCM 加密，禁止使用前端 `VITE_ENCRYPTION_KEY`。
- 测试日志只保存认证摘要和错误摘要，不保存明文密钥。

### 商家商品状态机

`pending_test -> test_failed | pending_review -> rejected | active`

商家不能直接创建 active 商品。管理员审核通过前，Marketplace 不应展示该商品。

### 邮件通知

新增 outbox 设计：

- `email_outbox`：待发送邮件任务，包含 template、recipient、locale、status、dedupeKey。
- `email_logs`：发送结果，包含 providerMessageId、delivered/bounced/complained 等状态。

管理员和商家的所有关键状态变更都写入 outbox。真正邮件发送适配 Postmark/SES/Resend，要求域名完成 SPF、DKIM、DMARC、自定义 Return-Path。

## 生产约束

- 不允许 mock 数据。
- 不允许“方便测试”的 active 状态。
- 不允许前端直接创建支付、结算、退款或可上架商品状态。
- 所有失败都必须可追踪到 `requestId` 或 `testLogId`。
