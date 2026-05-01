# BloomX 交付规格

## Purpose

定义项目交付闭环：从需求进入规格、实现任务、验证，再沉淀为可归档知识，确保后续开发从「写代码」稳定升级为「按规格交付」。

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

### Requirement: n8n 作为默认流程自动化工作流
项目 SHALL 将 n8n 作为所有新流程自动化、业务事件编排和跨系统通知的默认工作流平台。

#### Scenario: 新增自动化流程
- GIVEN 一个新需求需要业务流程编排、Webhook 投递、跨系统通知或运营自动化
- WHEN 编写 OpenSpec design
- THEN 方案优先使用 n8n 工作流
- AND 记录 workflow 名称、触发源、输入输出、失败记录和验收方式

#### Scenario: 历史 Make 资料存在
- GIVEN 项目中存在 Make.com 文档、脚本或历史记录
- WHEN 新增流程自动化方案
- THEN 不得把 Make 作为默认流程平台
- AND Make 只能作为历史参考或迁移兼容资料

### Requirement: 完成后运行与自审
项目 SHALL 在每次完成工作后运行相关验证并自审问题，直到当前范围内没有阻塞问题。

#### Scenario: 前端或规格工作完成
- GIVEN 一段前端、规格、自动化或交付文档工作已经完成
- WHEN 准备向用户交付
- THEN 已运行相关验证命令
- AND 已自审 bug、构建警告、乱码、规格遗漏和剩余风险
- AND 如果发现阻塞问题，已修复后重新验证

### Requirement: n8n 工作流访问入口
项目 SHALL 为 n8n 工作流提供用户可访问的查看入口。

#### Scenario: 用户查看工作流
- GIVEN BloomX 已配置 n8n 工作流
- WHEN 用户需要查看自动化流程
- THEN 项目提供工作流访问页面
- AND 页面包含工作流名称、编辑页入口、Production Webhook、触发源和验证提示

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
