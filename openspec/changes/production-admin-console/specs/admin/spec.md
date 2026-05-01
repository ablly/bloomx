## ADDED Requirements

### Requirement: 商业级管理员后台覆盖核心运营域

系统 SHALL 提供覆盖 BloomX 商业运营核心域的管理员后台，而不是单一支付骨架页面。

#### Scenario: 管理员查看后台

- GIVEN 管理员打开 `/admin`
- WHEN 后台加载完成
- THEN 系统显示运营总览、用户与权限、商家审核、API 商品、订单授权、支付交易、积分账本、退款复核、免费工作流、Webhook、商家结算、审计日志和系统配置入口
- AND 管理员可以在各模块之间导航

### Requirement: 后台使用真实运营集合

系统 SHALL 从真实运营集合读取数据，并在读取失败时暴露问题。

#### Scenario: 集合读取

- GIVEN Firestore 已配置运营集合
- WHEN 管理员后台加载
- THEN 系统尝试读取相关集合
- AND 显示真实记录、空状态或读取失败原因
- AND 不使用虚假交易、虚假账本或虚假 Webhook 记录掩盖未接入状态

### Requirement: 敏感动作需要管理员权限和服务端审计

系统 SHALL 将敏感动作限制在管理员角色和服务端审计 API 之后执行。

#### Scenario: 未授权用户查看后台

- GIVEN 用户未登录
- WHEN 用户访问 `/admin`
- THEN 系统可以展示后台预览和生产缺口
- AND 系统不得允许执行退款、结算、权限变更、Webhook 重放或配置保存

#### Scenario: 非管理员登录用户访问后台

- GIVEN 用户已登录但不具备管理员角色
- WHEN 用户访问 `/admin`
- THEN 系统显示权限不足
- AND 不展示可执行的敏感操作

### Requirement: 后台暴露生产风险和上线闸门

系统 SHALL 在后台中展示生产风险、上线闸门和自动化工作流路线。

#### Scenario: 管理员查看生产状态

- GIVEN 管理员打开后台总览或系统配置
- WHEN 系统完成数据读取
- THEN 系统显示待办队列、生产风险、集合覆盖状态、支付 Provider、Webhook/账本约束、审计日志要求和免费自托管工作流路线

