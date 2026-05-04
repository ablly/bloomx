## ADDED Requirements

### Requirement: 首页统一滚动叙事
系统 SHALL 将首页功能、流程、模型、定价、评价、商家申请和 CTA 内容融合进一个统一的滚动叙事区域，且不得在首页下方重复渲染相同内容区块。

#### Scenario: 用户从首页顶部向下滚动
- **WHEN** 用户在首页 Hero 区域滚动
- **THEN** 页面 SHALL 逐步显示交易机制、使用流程、模型供给、积分套餐、供需反馈、商家申请和最终 CTA 场景
- **AND** 每个场景 SHALL 在左侧提供对应业务文案或表单
- **AND** 下方 SHALL 不再重复显示旧版功能、流程、模型、定价、评价、申请和 CTA 区块

### Requirement: Hero 眉标删除和粒子浮现
系统 SHALL 删除 Hero 左侧眉标，并在滚动叙事中提供缓慢浮现的粒子视觉层。

#### Scenario: 用户查看首页首屏
- **WHEN** 首页首屏加载
- **THEN** Hero 左侧 SHALL 不显示“模型 API 能力交易市场”或英文等价眉标
- **AND** 页面 SHALL 显示不会遮挡正文的慢速粒子浮现效果
- **AND** 减少动态效果偏好的用户 SHALL 不被强制播放复杂动画

### Requirement: 首页交互保留
系统 SHALL 在新的滚动叙事中保留积分套餐购买和商家申请提交的交互入口。

#### Scenario: 已登录用户点击积分套餐
- **WHEN** 已登录用户在定价场景选择套餐
- **THEN** 前端 SHALL 通过现有服务请求 Stripe Checkout URL
- **AND** 前端 SHALL 导航到 Stripe Checkout

#### Scenario: 未登录用户点击积分套餐
- **WHEN** 未登录用户在定价场景选择套餐
- **THEN** 页面 SHALL 显示登录要求或错误提示
- **AND** 不得绕过服务端支付入口

#### Scenario: 已登录商家提交申请
- **WHEN** 已登录用户在商家申请场景填写并提交申请
- **THEN** 前端 SHALL 调用现有商家申请服务
- **AND** 成功后 SHALL 显示申请已收到状态

### Requirement: 商业上线检查
系统 SHALL 在交付时记录构建、规格、工作流、支付和个人中心生产上线检查结果，并列出阻塞项和下一步。

#### Scenario: 完成本次 UI 改动后
- **WHEN** 开发者完成首页重构
- **THEN** SHALL 运行前端构建、OpenSpec 严格校验、工作流检查和项目简报
- **AND** SHALL 检查支付功能、个人中心、管理员审核和生产环境配置风险
- **AND** SHALL 在最终交付中给出上线结论、风险和下一步计划
