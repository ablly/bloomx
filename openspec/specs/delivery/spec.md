# BloomX 交付规格

## Purpose

定义项目交付闭环：从需求进入规格、实现任务、验证，再沉淀为可归档知识，确保后续开发从“写代码”稳定升级为“按规格交付”。

## Requirements

### Requirement: 非平凡改动先写规格
项目 SHALL 对非平凡功能、架构、自动化或 UI 工作使用 OpenSpec change。

#### Scenario: 新功能请求
- GIVEN 请求会影响用户行为、业务规则、数据流、部署、自动化或 UI 结构
- WHEN 开始实现
- THEN 存在包含 proposal、delta specs、design 和 tasks 的 OpenSpec change

### Requirement: 实现跟随任务清单
实现 SHALL 从当前 change 的 tasks 出发，并保持相关 artifact 最新。

#### Scenario: 实现中发现偏差
- GIVEN 实现过程中发现设计或规格与实际不一致
- WHEN 该偏差影响行为或范围
- THEN 先更新相关 OpenSpec artifact，再继续实现

### Requirement: 交付前验证
项目 SHALL 在每个 change 完成后进行验证，再声明完成。

#### Scenario: change 完成
- GIVEN 实现任务已经完成
- WHEN 准备交付
- THEN 已运行 OpenSpec 校验，或记录未运行原因
- AND 已运行相关构建或测试，或记录未运行原因
- AND 已总结剩余风险

### Requirement: UI 交付审查
前端改动 SHALL 在完成前通过 taste 和 Open Design 审查。

#### Scenario: UI 完成
- GIVEN 改动影响可见 UI
- WHEN 准备交付
- THEN 实现已检查交互状态、响应式布局、文案质量、视觉一致性和动效性能风险

### Requirement: 免费自托管作为默认流程自动化路线
项目 SHALL 将免费、开源、自托管平台作为所有新流程自动化、业务事件编排和跨系统通知的默认路线，生产默认平台为 Activepieces 自托管社区版。

#### Scenario: 新增自动化流程
- GIVEN 一个新需求需要业务流程编排、Webhook 投递、跨系统通知或运营自动化
- WHEN 编写 OpenSpec design
- THEN 方案优先使用 Activepieces 自托管社区版
- AND 记录 workflow 名称、触发源、输入输出、失败记录和验收方式
- AND 记录幂等键、重试策略、超时策略、死信记录、审计日志、密钥管理和回滚方式

#### Scenario: 特定场景需要补位工具
- GIVEN 自动化需求更适合轻量事件流、基础设施编排或脚本型任务
- WHEN 编写 OpenSpec design
- THEN 可以选择 Node-RED 作为轻量事件流补位
- OR 可以选择 Windmill 作为脚本型后台任务补位
- AND 说明为什么不使用 Activepieces

#### Scenario: 历史 n8n 或 Make 资料存在
- GIVEN 项目中存在 n8n、Make.com 文档、脚本或历史记录
- WHEN 新增流程自动化方案
- THEN 不得把 n8n 或 Make 作为默认生产平台
- AND 历史资料只能作为迁移参考或兼容跳转

#### Scenario: 工作流 Secret 命名
- GIVEN 后端需要投递自动化事件
- WHEN 配置生产 Secret
- THEN 使用 `WORKFLOW_*` 命名
- AND 不新增 `N8N_*` 或 `MAKE_*` 默认生产工作流 Secret

### Requirement: Stripe 首发并预留 Dodo Payments
项目 SHALL 将 Stripe 作为首发支付通道，并为 Dodo Payments 预留 Merchant of Record 和全球税务合规备选通道。

#### Scenario: 新增支付能力
- GIVEN 一个需求涉及付款、订阅、积分、退款、争议或结算
- WHEN 编写 OpenSpec design
- THEN 方案说明 Stripe 与 Dodo Payments 的 provider 选择、支付对象、Webhook 事件和测试/生产环境
- AND 说明服务端密钥管理、Webhook 验签、幂等键、本地账本和管理员对账入口

### Requirement: 管理员后台为生产必需能力
项目 SHALL 提供管理员后台来支撑审核、支付对账、退款、工作流运行、商家结算、风控和审计。

#### Scenario: 生产运营
- GIVEN BloomX 进入真实商家和用户运营
- WHEN 管理员需要处理审核、支付、退款、结算或异常工作流
- THEN 管理员后台提供可检索、可复核、可审计的操作入口
- AND 敏感操作记录 actor、时间、原因、前后状态和 requestId

### Requirement: 免费工作流访问入口
项目 SHALL 为免费自托管工作流提供用户可访问的查看入口。

#### Scenario: 用户查看工作流
- GIVEN BloomX 已迁移到免费工作流路线
- WHEN 用户需要查看自动化流程
- THEN 项目提供 `/workflows.html`
- AND 页面包含平台职责、工作流名称、Secret 名称、触发源和验证提示
- AND 页面不暴露真实 Webhook URL 或密钥

### Requirement: 审核通过后推送 GitHub
项目 SHALL 在当前范围验证和自审通过后，默认将本次工作提交并推送到 GitHub。

#### Scenario: 当前范围审核通过
- GIVEN 本次工作相关验证已经通过
- WHEN 准备结束交付
- THEN 只 stage 本次工作相关文件
- AND 创建清晰提交
- AND 推送到当前 GitHub 分支

#### Scenario: 工作区存在无关改动
- GIVEN 工作区存在不属于本次范围的未提交改动
- WHEN 准备提交
- THEN 不得回滚这些改动
- AND 不得把这些无关改动混入本次提交
