# Tasks

## 1. OpenSpec

- [x] 1.1 新增 `replace-n8n-with-free-workflows` change
- [x] 1.2 编写 proposal、design、tasks
- [x] 1.3 修改 delivery 规格，禁止把 n8n 作为默认自动化平台

## 2. 后端工作流契约

- [x] 2.1 将 Functions Secret 从 `N8N_*` 改为 `WORKFLOW_*`
- [x] 2.2 将 provider 从 `n8n` 改为 `activepieces`、`node-red`、`windmill`
- [x] 2.3 将跳过原因从 `missing_n8n_webhook_url` 改为通用原因
- [x] 2.4 将定时函数命名从 Make/n8n 语义改为免费工作流语义

## 3. 脚本与文档

- [x] 3.1 移除 n8n doctor 脚本和 package scripts
- [x] 3.2 新增 `workflow:doctor`
- [x] 3.3 新增免费工作流 map / README
- [x] 3.4 更新 `npm run brief`、工作流访问页、项目总览页
- [x] 3.5 修复 `docs/SPEC_DELIVERY_WORKFLOW.md` 中的旧 n8n 默认规则

## 4. 验证

- [x] 4.1 `npm run build`
- [x] 4.2 `npm --prefix functions run build`
- [x] 4.3 `npm run spec:validate:strict`
- [x] 4.4 `npm run brief`
- [x] 4.5 `npm run workflow-options`
