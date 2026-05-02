## ADDED Requirements

### Requirement: 免费自托管工作流默认路线
项目 SHALL 将免费、开源、可自托管的工作流栈作为自动化默认路线。

#### Scenario: 新增业务自动化
- **WHEN** 新需求涉及商家审核、售后工单、支付凭证、月结、API 健康巡检、跨系统通知或运营编排
- **THEN** 默认方案 SHALL 使用 Activepieces 自托管社区版
- **AND** 轻量事件流或基础设施编排 MAY 使用 Node-RED
- **AND** 脚本型后台任务、批处理、对账或月结草稿 MAY 使用 Windmill
- **AND** n8n Cloud 与 Make.com SHALL NOT 作为默认生产依赖

#### Scenario: 工作流 Secret 命名
- **WHEN** 后端需要投递自动化事件
- **THEN** Secret SHALL 使用 `WORKFLOW_*` 命名
- **AND** 不得新增 `N8N_*` 或 `MAKE_*` 作为默认生产工作流 Secret

#### Scenario: 历史 n8n 资料
- **WHEN** 项目中存在历史 n8n 文档、模板或链接
- **THEN** 它们 SHALL 被迁移、删除或标记为历史兼容
- **AND** 用户可访问的生产入口 SHALL 指向免费工作流总览

### Requirement: 免费工作流访问入口
项目 SHALL 提供免费工作流访问页，展示当前工作流职责、触发源、Secret 名称、验证命令和剩余风险。

#### Scenario: 用户查看工作流路线
- **WHEN** 用户打开工作流访问页
- **THEN** 页面 SHALL 展示 Activepieces、Node-RED、Windmill 的职责边界
- **AND** 页面 SHALL 明确 n8n 不再作为 BloomX 默认生产依赖
- **AND** 页面 SHALL 不暴露真实 Webhook URL 或密钥
