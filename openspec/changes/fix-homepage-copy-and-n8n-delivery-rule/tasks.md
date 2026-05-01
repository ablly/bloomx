# Tasks

## 1. OpenSpec 文档

- [x] 1.1 创建 change：`fix-homepage-copy-and-n8n-delivery-rule`
- [x] 1.2 编写 proposal
- [x] 1.3 编写 delivery 和 ui-design delta specs
- [x] 1.4 编写 design

## 2. n8n 交付规则

- [x] 2.1 更新 `AGENTS.md`，写入 n8n 为默认流程自动化平台
- [x] 2.2 更新 `docs/SPEC_DELIVERY_WORKFLOW.md`，说明 Make 仅作为历史参考
- [x] 2.3 更新基线 OpenSpec delivery spec，加入 n8n 默认工作流要求
- [x] 2.4 新增 n8n 工作流访问页面
- [x] 2.5 写入完成后运行与自审规则
- [x] 2.6 写入审核无误后推送 GitHub 规则

## 3. 首页中文修复

- [x] 3.1 修复 `BackgroundVideo.tsx` 的中文故事阶段文案
- [x] 3.2 修复 `HeroLanding.tsx` 的中文 hero、角色和账户文案
- [x] 3.3 清理 `App.tsx` 中的乱码注释

## 4. 验证

- [x] 4.1 运行当前 change 严格校验
- [x] 4.2 运行全量 OpenSpec 严格校验
- [x] 4.3 运行生产构建
- [x] 4.4 记录剩余风险和下一步

## 验证记录

- 当前 change 严格校验：通过。
- 全量 OpenSpec 严格校验：通过，4 项全部通过。
- 生产构建：通过。
- 本地运行检查：通过，首页 `http://127.0.0.1:5173/` 返回 200，工作流页 `http://127.0.0.1:5173/n8n-workflows.html` 返回 200。
- n8n 自检：未通过，原因是本机缺少 `N8N_BASE_URL` 和 `N8N_API_KEY`，不是代码错误；工作流入口页已提供现有编辑页与 Webhook。
- 残留警告：Vite 仍提示主 chunk 超过 500 kB；`captchaService` 同时被动态和静态导入，暂不影响构建。
- 下一步：提交并推送本次范围文件；后续补充 n8n API Key 后运行 `npm run n8n:doctor`。
