## ADDED Requirements

### Requirement: Seller API products MUST pass provider model discovery before review

商家 API 商品 MUST 先由服务端抓取真实模型列表，选择模型后才能进入连通性测试。

#### Scenario: Fetching models from a supported Provider

- **Given** 已审核通过的商家提交 Provider 类型、Base URL、认证方式和 API 密钥
- **When** 商家点击获取模型列表
- **Then** 服务端 MUST 通过对应 Provider Adapter 请求真实模型接口
- **And** 服务端 MUST 归一化返回 `NormalizedModel[]`
- **And** 服务端 MUST 写入 `merchantApiTestLogs`
- **And** 服务端 MUST 不记录明文 API 密钥

#### Scenario: Blocking unsafe model fetch URLs

- **Given** 商家提交 localhost、内网 IP、metadata 地址或非 HTTPS URL
- **When** 服务端准备请求 Provider API
- **Then** 服务端 MUST 拒绝请求
- **And** 服务端 MUST 写入失败测试日志

### Requirement: Seller API products MUST pass smoke tests before admin review

商品进入管理员审核前，选择模型 MUST 逐个通过真实 smoke test。

#### Scenario: Passing smoke tests

- **Given** 商家选择至少一个模型
- **When** 服务端执行 smoke test
- **Then** 每个模型 MUST 有成功响应、延迟、状态码和响应摘要
- **And** 商品状态 MUST 变为 `pending_review`
- **And** 管理员 MUST 能在后台看到测试报告

#### Scenario: Failing smoke tests

- **Given** 任一模型认证失败、超时、不可调用或响应结构不合法
- **When** 服务端执行 smoke test
- **Then** 商品状态 MUST 变为 `test_failed`
- **And** 商家 MUST 收到修复通知任务
- **And** 商品不得进入管理员审核队列

### Requirement: Seller API secrets MUST be server-side only

商家 API 密钥 MUST 只在服务端加密保存，前端不得直接写入可读业务集合。

#### Scenario: Submitting a product

- **Given** 商家填写 API 认证信息
- **When** 前端提交商品
- **Then** 前端 MUST 调用 Cloud Function
- **And** Cloud Function MUST 加密密钥并写入私有字段
- **And** 返回给前端的数据 MUST 不包含明文密钥

### Requirement: Notifications MUST use production email outbox

商家入驻、商品测试、管理员审核相关通知 MUST 写入邮件 outbox 并可追踪。

#### Scenario: Seller application created

- **Given** 商家提交入驻申请
- **When** 申请记录创建
- **Then** 系统 MUST 创建管理员通知邮件任务
- **And** 系统 SHOULD 创建商家确认邮件任务

#### Scenario: Product ready for review

- **Given** API 商品测试通过并进入 `pending_review`
- **When** 状态变更完成
- **Then** 系统 MUST 创建管理员待审核邮件任务

#### Scenario: Product test failed

- **Given** API 商品测试失败
- **When** 测试报告生成
- **Then** 系统 MUST 创建商家失败通知邮件任务
