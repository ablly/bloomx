## 背景

BloomX 的商家端目前还没有达到商业上线标准：API 商品创建曾经存在直接 `active` 的测试逻辑，商家 API 密钥也不应该通过前端写入公开业务集合。平台必须支持市面主流模型 Provider，而不是只支持 OpenAI Compatible `/v1/models`。商家上传 API 信息后，平台必须先由服务端抓取模型列表、跑通选择模型的 smoke test、生成真实测试报告，再进入管理员审核。

同时，商家入驻和商品审核必须有可靠邮件提醒：管理员要收到新申请、待审核商品和失败告警；商家要收到申请提交、审核通过/拒绝、API 测试失败/通过、商品上架/拒绝等通知。邮件必须走生产事务邮件服务和域名认证，不能依赖个人 Gmail SMTP 当核心通道。

## 目标

- 建立 Provider Adapter 体系，支持 OpenAI Compatible、OpenAI、Anthropic、Gemini、Azure OpenAI、Mistral、Cohere、Groq、Together、OpenRouter、Ollama Gateway、Custom HTTP 的统一模型抓取与 smoke test 接口。
- 商家提交 API 商品后，状态从 `pending_test` 开始；测试通过才进入 `pending_review`；管理员审核通过后才允许 `active`。
- 服务端加密保存商家 API 密钥，前端不得直接写入可读业务集合。
- 服务端抓取模型列表并写入真实 `merchantApiTestLogs`，不使用 mock 数据。
- 服务端逐模型测试并记录成功/失败、延迟、错误码、响应摘要、Provider 类型、目标 URL。
- 邮件通知改造成 outbox/logs 模型，后续可接 Postmark/SES/Resend，并保留失败重试与管理员告警。
- 项目简报和总览页同步说明：商家 API 上架必须通过模型抓取、连通性测试和管理员审核。

## 非目标

- 本次不实现 AWS Bedrock SigV4 完整连接器；先把 Bedrock 作为需要专用 IAM/区域配置的 Provider 类型登记并阻断真实测试。
- 本次不创建真实邮件服务账号、不写入真实 API key、不配置真实 DNS。
- 本次不开放支付、退款、结算相关后台动作。
