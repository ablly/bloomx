## Why

首页目前把 Hero、功能、流程、模型、定价、评价、商家申请和收尾 CTA 拆成多个纵向区块，用户在浏览时会感到重复，并且评论要求把这些内容融合进上方滚动显示页面左侧。现有 Hero 的眉标也被要求删除，并增加粒子缓慢浮现的视觉感受。

同时，用户要求检查项目是否达到商业生产上线要求，尤其是支付功能和个人中心页面，需要把本次检查纳入交付边界，避免只做视觉美化而忽略上线风险。

## What Changes

- 将首页改为统一的 sticky 滚动叙事：原有功能、流程、模型、定价、评价、商家申请和 CTA 内容被整合到同一组滚动场景中。
- 删除 Hero 左侧眉标“模型 API 能力交易市场 / Model API capacity exchange”。
- 新增慢速粒子浮现和场景级文字/图形过渡，遵循 Taste 原则的克制排版、层级、动效和真实业务内容。
- 移除首页重复渲染的下方旧版区块，保留页脚和登录弹窗。
- 保持积分套餐 Stripe Checkout 与商家申请表单在新叙事页中可操作。
- 运行并记录构建、规格、工作流、支付与个人中心商业上线检查结果。

## Capabilities

### New Capabilities

- `taste-home-scroll-narrative`: 首页滚动叙事、粒子浮现、内容融合和上线检查边界。

### Modified Capabilities

无。

## Impact

- 影响 `src/App.tsx` 首页组合方式。
- 影响 `src/components/HeroLanding.tsx` 和 `src/components/HeroScrollNarrative.tsx`。
- 影响全局样式中与叙事粒子和动效相关的 CSS。
- 不改变支付服务端接口、账本数据结构或管理员退款逻辑。
