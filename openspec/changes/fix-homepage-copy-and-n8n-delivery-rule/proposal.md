## Why

昨天首页动效升级后，部分新增中文文案出现乱码，影响中文用户对首页价值主张、角色身份和交易故事线的理解。同时，用户明确要求后续所有流程自动化统一使用 n8n，需要把这条规则沉淀进项目交付规格，避免 Make 与 n8n 并行造成执行混乱。

## What Changes

- 修复首页 hero、用户菜单、背景故事阶段中的中文乱码。
- 清理 `App.tsx` 中已乱码的中文注释，避免后续维护继续复制坏文本。
- 保留昨天完成的货币、积分、交易流动视觉方向和背景视频机制。
- 将“所有流程自动化默认使用 n8n”写入项目协作协议、交付流程文档和 OpenSpec 交付规格。
- 明确 Make 只作为历史资料或兼容参考，不再作为新流程的默认方案。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `ui-design`：强化中文语言环境不得出现乱码的要求，并覆盖首页 hero 与交易故事文案。
- `delivery`：新增 n8n 作为默认流程自动化工作流的交付要求。

## Impact

- 影响文件：
  - `src/components/HeroLanding.tsx`
  - `src/components/BackgroundVideo.tsx`
  - `src/App.tsx`
  - `AGENTS.md`
  - `docs/SPEC_DELIVERY_WORKFLOW.md`
  - `openspec/specs/delivery/spec.md`
  - `openspec/specs/ui-design/spec.md`
- 验证方式：
  - `npx openspec validate fix-homepage-copy-and-n8n-delivery-rule --strict --no-interactive`
  - `npm run spec:validate:strict`
  - `npm run build`
