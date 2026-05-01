# OpenSpec + Superpowers 交付流程

本文档定义 BloomX 后续从「写代码」升级到「按规格交付」的完整闭环。

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

当前 OpenSpec core profile 提供：

- `/opsx:explore`：需求不清楚、需要调查。
- `/opsx:propose`：创建 change，并生成 proposal、spec、design、tasks。
- `/opsx:apply`：按 tasks 实现。
- `/opsx:archive`：合并规格并归档。

项目补充交付门禁：

- `openspec validate <change-name>`
- `npm run build`
- UI 任务需要 taste + Open Design checklist
- 涉及流程自动化时，必须补充 n8n 工作流专项验证
- 必要时补充 Firebase Functions、Firestore rules、Cloudflare 的专项验证

## 1.1 n8n 流程自动化标准

后续所有新的自动化流程默认使用 n8n：

- Firestore 业务事件投递
- Webhook 接收与转发
- 商家审核流程
- 售后工单流程
- 支付成功通知
- 月结快照
- API 健康监控
- 全局事件总线

Make.com 只作为历史资料或迁移参考。除非用户明确要求，不再新增 Make 默认流程。

涉及自动化的 `design.md` 必须写清楚：

- n8n workflow 名称
- 触发源
- 输入 payload
- 输出或副作用
- 失败记录位置
- smoke test 或验收方式

项目提供一个本地工作流访问页：

```text
/n8n-workflows.html
```

本地开发或预览服务启动后，可以通过该页面查看 n8n 工作流编辑入口、Production Webhook 和项目侧触发源。

## 1.2 完成后的运行与自审

每次完成工作后必须执行：

1. 运行相关验证：
   - 规格或流程改动：`npm run spec:validate:strict`
   - 前端改动：`npm run build`
   - n8n 改动：`npm run n8n:doctor` 或对应 smoke test
2. 自审当前范围：
   - 是否有乱码、坏链接、明显 UI 错位。
   - 是否有构建错误或新警告。
   - 是否有 OpenSpec 任务未勾选。
   - 是否有 n8n 工作流入口、触发源、失败记录。
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
- `redesign-marketplace-filters`

避免：`update`、`wip`、`test1`、`new-feature`。

## 3. 规格写法

每个 delta spec 必须使用可验证语言。OpenSpec 的标题结构保留英文，正文可以写中文：

```markdown
## ADDED Requirements

### Requirement: 商家 API 上架前测试
系统 SHALL 要求商家 API 通过预检后才允许提交上架。

#### Scenario: 预检通过
- GIVEN 商家提交了有效的 OpenAI 兼容端点
- WHEN 商家运行上架前测试
- THEN 系统记录测试通过
- AND 商品可以进入审核流程
```

优先写用户可感知结果、系统状态变化、错误边界和权限边界。

## 4. UI 设计门禁

任何 UI change 的 `design.md` 必须包含：

- 目标用户和场景。
- 现有界面、组件、设计系统观察。
- taste 决策：字体、密度、颜色、动效、状态。
- Open Design 决策：选择的 artifact 类型、是否需要设计变体、是否需要 tweaks。
- 交互状态：loading、empty、error、disabled、success。
- 移动端与窄屏布局。
- 验证方式：构建、本地预览、截图或手动路径。

## 5. Superpowers 执行纪律

- 复杂任务先计划，不在主分支上做大跨度盲改。
- 调试先收集事实，再形成假设。
- 实现中不悄悄扩大范围；范围变化要反映到 OpenSpec。
- 收尾时必须报告验证结果和剩余风险。

## 6. 当前项目推荐下一条 change

昨天留下的首页动效工作建议拆成一个独立 change：

```text
/opsx:propose fix-homepage-chinese-copy-and-hero-verification
```

目标：

- 修复首页新增中文乱码。
- 保留货币、积分、交易流动的视觉方向。
- 验证首页、登录入口、Dashboard 跳转和生产构建。
- 将首页视觉升级作为可归档的 OpenSpec 交付。
