# BloomX UI 设计规格

## Purpose

定义 BloomX UI 工作的视觉、交互、文案和 artifact 审查要求，确保后续前端设计既符合交易市场定位，也能被 taste 与 Open Design 流程持续验证。

## Requirements

### Requirement: taste 驱动的界面质量
系统 SHALL 对所有前端设计和实现使用 taste 驱动的 UI 规则。

#### Scenario: 新 UI 工作开始
- GIVEN 用户请求新的 UI 功能或改版
- WHEN 编写设计方案
- THEN 方案包含字体、密度、颜色、动效、交互状态和响应式行为
- AND 避免泛 AI 视觉模式，例如紫蓝渐变、虚假指标、emoji 装饰和无意义卡片网格

### Requirement: Open Design artifact 工作流
系统 SHALL 在实现前和实现中，把视觉设计当作可检查的 artifact。

#### Scenario: 产出 UI artifact
- GIVEN UI 改动包含新页面、新流程或高影响组件
- WHEN 准备设计
- THEN 设计记录 artifact 或预览路径
- AND 记录选择的设计系统、视觉方向、组件假设和审查清单

### Requirement: BloomX 视觉身份
UI SHALL 表达 BloomX 作为可信 API 能力交易场所的定位。

#### Scenario: 首页体验
- GIVEN 访客打开首页
- WHEN hero 和主要区块渲染
- THEN 界面传达可信交易、技术流动、清晰结算以及商家、买家、平台之间的关系
- AND 设计避免不能支持这些概念的纯装饰元素

### Requirement: 国际化文案质量
UI SHALL 保持中文和英文业务文案可读且一致。

#### Scenario: 中文语言环境
- GIVEN 当前语言为中文
- WHEN 用户查看业务界面
- THEN 可见业务文案是有效中文
- AND 不显示乱码或混合编码文本
