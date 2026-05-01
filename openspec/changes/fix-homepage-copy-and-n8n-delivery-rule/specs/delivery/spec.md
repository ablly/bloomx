## ADDED Requirements

### Requirement: n8n 作为默认流程自动化工作流
项目 SHALL 将 n8n 作为所有新流程自动化、业务事件编排和跨系统通知的默认工作流平台。

#### Scenario: 新增自动化流程
- **WHEN** 一个新需求需要业务流程编排、Webhook 投递、跨系统通知或运营自动化
- **THEN** 方案必须优先使用 n8n 工作流
- **AND** 如果不使用 n8n，必须在 design.md 中记录原因和替代方案

#### Scenario: 历史 Make 资料存在
- **WHEN** 项目中存在 Make.com 文档、脚本或历史记录
- **THEN** 新交付不得把 Make 作为默认流程平台
- **AND** Make 只能作为历史参考或迁移兼容资料

### Requirement: 完成后运行与自审
项目 SHALL 在每次完成工作后运行相关验证并自审问题，直到当前范围内没有阻塞问题。

#### Scenario: 前端或规格工作完成
- **WHEN** 一段前端、规格、自动化或交付文档工作准备交付
- **THEN** 已运行相关验证命令
- **AND** 已自审 bug、构建警告、乱码、规格遗漏和剩余风险
- **AND** 如果发现阻塞问题，已修复后重新验证

### Requirement: n8n 工作流访问入口
项目 SHALL 为 n8n 工作流提供用户可访问的查看入口。

#### Scenario: 用户查看工作流
- **WHEN** 用户需要查看 BloomX 自动化流程
- **THEN** 项目提供工作流访问页面
- **AND** 页面包含工作流名称、编辑页入口、Production Webhook、触发源和验证提示

### Requirement: 审核通过后推送 GitHub
项目 SHALL 在当前范围验证和自审通过后，默认将本次工作提交并推送到 GitHub。

#### Scenario: 当前范围审核通过
- **WHEN** 本次工作相关验证已经通过并准备结束交付
- **THEN** 只 stage 本次工作相关文件
- **AND** 创建清晰提交
- **AND** 推送到当前 GitHub 分支

#### Scenario: 工作区存在无关改动
- **WHEN** 工作区存在不属于本次范围的未提交改动
- **THEN** 不得回滚这些改动
- **AND** 不得把这些无关改动混入本次提交
