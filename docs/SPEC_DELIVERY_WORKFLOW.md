# OpenSpec + Superpowers 交付流程

本文档定义 BloomX 后续从“写代码”升级到“按规格交付”的闭环。

## 1. 默认闭环

```text
想法 / bug / UI 请求
  -> OpenSpec proposal
  -> delta specs
  -> 技术与设计方案
  -> tasks
  -> 实现
  -> 验证
  -> 归档 / 交付说明
```

项目补充交付门禁：

- `npm run spec:validate:strict`
- `npm run build`
- UI 任务需要 taste + Open Design checklist
- 流程自动化任务需要 `npm run workflow:doctor` 和对应 smoke test
- 必要时补充 Firebase Functions、Firestore rules、Cloudflare 的专项验证

## 1.1 免费自托管工作流标准

后续所有新的自动化流程默认使用免费自托管路线：

- Activepieces 自托管社区版：默认生产工作流平台，负责商家审核、售后工单、支付回执、事件总线、通知、失败重试和跨系统编排。
- Node-RED：轻量事件流、HTTP 转发、内部事件桥接和 API 健康巡检补位。
- Windmill：脚本型后台任务、批处理、对账、数据修复和定时月结草稿补位。

n8n 和 Make.com 不再作为默认生产依赖。除非用户明确要求迁移历史流程，否则不新增 n8n 或 Make 默认链路。

涉及自动化的 `design.md` 必须写清楚：

- workflow 名称
- 目标平台：Activepieces、Node-RED 或 Windmill
- 触发源
- 输入 payload
- 输出或副作用
- 失败记录位置
- 幂等键、重试策略、超时策略、死信记录、审计日志、密钥管理和回滚方式
- smoke test 或验收方式

项目提供本地工作流访问页：

```text
/workflows.html
```

旧 `/n8n-workflows.html` 仅作为兼容跳转，不再代表生产方案。

## 1.2 完成后的运行与自审

每次完成工作后必须执行：

1. 运行相关验证：
   - 规格或流程改动：`npm run spec:validate:strict`
   - 前端改动：`npm run build`
   - Functions 改动：`npm --prefix functions run build`
   - 工作流改动：`npm run workflow:doctor`
2. 自审当前范围：
   - 是否有乱码、坏链接、明显 UI 错位
   - 是否有构建错误或新警告
   - 是否有 OpenSpec 任务未勾选
   - 是否有工作流入口、触发源、失败记录和 Secret 命名遗漏
3. 如果发现问题，先修复，再重新运行验证。
4. 最终交付时说明验证结果和剩余风险。

## 1.3 GitHub 推送

当前范围审核无误后，默认执行 GitHub 推送：

1. 查看 `git status`，确认哪些是本次工作文件。
2. 只 stage 本次工作相关文件。
3. 提交前再次确认验证命令通过。
4. 创建提交并推送当前分支。
5. 最终回复中说明提交和推送结果。

如果工作区里有历史未提交内容，不自动混入本次提交。

## 2. Change 命名

使用短横线动宾结构：

- `fix-homepage-chinese-copy`
- `add-seller-kyc-review`
- `optimize-dashboard-chunking`
- `replace-n8n-with-free-workflows`

避免：`update`、`wip`、`test1`、`new-feature`。
