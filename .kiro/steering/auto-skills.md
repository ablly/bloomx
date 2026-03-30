---
inclusion: always
---

# 🎯 自动 Skill 判别系统

你已经安装了以下 skills，请根据用户请求的内容自动判断并应用相应的 skill 原则：

## 🚀 Superpowers Skills（日常开发必备）⭐⭐⭐

**始终启用！** 这些 skills 应该在所有日常开发工作中自动应用：

### 🌟 using-superpowers（使用超能力）
**优先级：** ⭐⭐⭐⭐⭐ 最高 - 始终启用
**原则：**
- 主动使用所有可用的 skills
- 组合多个 skills 解决复杂问题
- 充分发挥 AI 辅助开发的能力

### writing-plans（编写计划）
**触发词：** 计划、规划、设计、架构、方案
**原则：**
- 先规划后执行
- 清晰的步骤分解
- 可追踪的里程碑

### executing-plans（执行计划）
**触发词：** 实现、开发、编码、构建
**原则：**
- 按计划逐步执行
- 验证每个步骤
- 及时调整方向

### verification-before-completion（完成前验证）
**触发词：** 完成、提交、部署、发布
**原则：**
- 完成前必须验证
- 检查所有功能
- 确保代码质量

### systematic-debugging（系统化调试）
**触发词：** 调试、bug、错误、问题
**原则：**
- 系统化排查问题
- 记录调试过程
- 找到根本原因

### test-driven-development（测试驱动开发）
**触发词：** 测试、TDD、单元测试
**原则：**
- 先写测试后写代码
- 保持高测试覆盖率
- 持续集成

### subagent-driven-development（子代理驱动开发）
**触发词：** 复杂任务、并行开发、模块化
**原则：**
- 将复杂任务分解
- 使用子代理并行处理
- 提高开发效率

### dispatching-parallel-agents（调度并行代理）
**触发词：** 并行、同时、多任务
**原则：**
- 识别可并行的任务
- 合理分配资源
- 协调多个代理

### brainstorming（头脑风暴）
**触发词：** 创意、想法、方案、讨论
**原则：**
- 开放式思考
- 多角度分析
- 创新解决方案

### requesting-code-review（请求代码审查）
**触发词：** 审查、review、检查代码
**原则：**
- 主动请求审查
- 提供上下文信息
- 接受反馈

### receiving-code-review（接收代码审查）
**触发词：** 修改、改进、优化反馈
**原则：**
- 认真对待反馈
- 及时修复问题
- 持续改进

### finishing-a-development-branch（完成开发分支）
**触发词：** 合并、完成、分支、PR
**原则：**
- 清理代码
- 更新文档
- 准备合并

### using-git-worktrees（使用 Git 工作树）
**触发词：** git、分支、工作树、worktree
**原则：**
- 使用 worktree 管理多分支
- 提高开发效率
- 避免频繁切换

### writing-skills（编写技能）
**触发词：** 创建 skill、新技能、自定义
**原则：**
- 创建可复用的 skills
- 文档化最佳实践
- 分享知识

## 🎨 Taste Skills（前端 UI 优化首选）⭐

**优先级最高！** 当用户提到任何前端 UI 优化相关的需求时，首先使用 Taste skills：

### 🌟 design-taste-frontend（设计品味前端）
**触发词：** 前端、UI、界面、优化、改进、重构、React、Vue、Next.js、组件
**优先级：** ⭐⭐⭐⭐⭐ 最高
**原则：**
- 生产级 React/Next.js UI 脚手架
- 严格的架构和设计基线
- 强制执行设计规范
- 高端视觉设计标准

### high-end-visual-design（高端视觉设计）
**触发词：** 高级、奢华、精致、质感、贵、苹果风格、premium、luxury
**优先级：** ⭐⭐⭐⭐
**原则：**
- 大面积留白，呼吸感
- 极简配色，黑白灰为主
- 高级字体（SF Pro Display, Inter）
- 细腻的阴影和层次
- 去 AI 味，避免过度渐变

### minimalist-ui（极简 UI）
**触发词：** 简洁、极简、minimal、clean、简单
**优先级：** ⭐⭐⭐⭐
**原则：**
- 只保留必要元素
- 单一焦点
- 充足的负空间
- 简单的配色方案

### stitch-design-taste（缝合设计品味）
**触发词：** 整合、统一、一致性、设计系统
**优先级：** ⭐⭐⭐
**原则：**
- 统一设计语言
- 组件一致性
- 设计系统整合

### redesign-existing-projects（重新设计现有项目）
**触发词：** 重新设计、改版、升级、modernize
**优先级：** ⭐⭐⭐
**原则：**
- 保留核心功能
- 现代化视觉设计
- 提升用户体验

### industrial-brutalist-ui（工业野兽派 UI）
**触发词：** 粗犷、工业、brutalist、原始、硬朗
**优先级：** ⭐⭐
**原则：**
- 粗体字
- 高对比度
- 几何形状
- 原始材质感

### full-output-enforcement（完整输出强制）
**触发词：** 完整代码、全部实现、不要省略
**优先级：** ⭐⭐⭐
**原则：**
- 输出完整代码
- 不省略任何部分
- 生产就绪的代码

## ✨ Impeccable Skills

### animate（动画）
**触发词：** 动画、animation、过渡、transition、弹簧、spring
**原则：**
- 使用物理动画曲线
- 弹簧效果：cubic-bezier(0.34, 1.56, 0.64, 1)
- 苹果曲线：cubic-bezier(0.16, 1, 0.3, 1)
- 时长 400-800ms

### polish（打磨）
**触发词：** 优化、打磨、完善、polish、refine
**原则：**
- 细节完善
- 边缘情况处理
- 性能优化
- 用户体验提升

### clarify（清晰化）
**触发词：** 清晰、明确、clarify、简化说明
**原则：**
- 简化复杂概念
- 清晰的层次结构
- 易于理解的语言

### colorize（配色）
**触发词：** 颜色、配色、color、palette、主题
**原则：**
- 和谐的配色方案
- 适当的对比度
- 品牌色应用

### typeset（排版）
**触发词：** 字体、排版、typography、文字
**原则：**
- 字体层级
- 行高和字间距
- 可读性优化

### optimize（优化）
**触发词：** 性能、优化、加速、performance
**原则：**
- 代码优化
- 性能提升
- 加载速度

### delight（愉悦感）
**触发词：** 有趣、愉悦、delight、惊喜
**原则：**
- 微交互
- 惊喜元素
- 情感化设计

## 🔧 Better Icons

### better-icons
**触发词：** 图标、icon、SVG
**使用方法：**
```bash
# 搜索图标
better-icons search "关键词"

# 获取图标 SVG
better-icons get "icon-id"
```

## 🎯 自动判别规则（优先级顺序）

### 🚀 始终启用（Superpowers）
**在所有开发工作中自动应用：**
- ✅ using-superpowers - 主动使用所有 skills
- ✅ verification-before-completion - 完成前验证
- ✅ systematic-debugging - 遇到问题时系统化调试

### ⭐ 最高优先级
1. **前端 UI 优化** → 🌟 **首选 design-taste-frontend**（Taste Skill）
   - 触发词：前端、UI、界面、优化、改进、重构、组件
   - 自动组合：design-taste-frontend + high-end-visual-design + minimalist-ui

2. **规划任务** → 使用 writing-plans（Superpowers）
   - 触发词：计划、规划、设计、架构

3. **执行开发** → 使用 executing-plans（Superpowers）
   - 触发词：实现、开发、编码、构建

### 高优先级
4. **调试问题** → 使用 systematic-debugging（Superpowers）
5. **测试开发** → 使用 test-driven-development（Superpowers）
6. **动画效果** → 使用 animate（Impeccable）
7. **配色方案** → 使用 colorize（Impeccable）
8. **图标需求** → 使用 better-icons
9. **排版调整** → 使用 typeset（Impeccable）

### 标准优先级
10. **性能优化** → 使用 optimize（Impeccable）
11. **代码打磨** → 使用 polish（Impeccable）
12. **重新设计** → 使用 redesign-existing-projects（Taste）
13. **设计统一** → 使用 stitch-design-taste（Taste）
14. **并行任务** → 使用 dispatching-parallel-agents（Superpowers）
15. **复杂任务** → 使用 subagent-driven-development（Superpowers）

### 特殊场景
16. **完整代码输出** → 使用 full-output-enforcement（Taste）
17. **工业风格** → 使用 industrial-brutalist-ui（Taste）
18. **头脑风暴** → 使用 brainstorming（Superpowers）
19. **代码审查** → 使用 requesting-code-review / receiving-code-review（Superpowers）
20. **Git 工作流** → 使用 using-git-worktrees（Superpowers）

## 📋 核心设计原则（始终遵循）

### 去 AI 味
- ❌ 避免：过度渐变、发光效果、闪光动画、脉冲效果
- ✅ 使用：纯色、微妙阴影、简单过渡

### 苹果风格质感
- 大面积留白（py-32, 128px 间距）
- 超大标题（6xl-8xl, 72-96px）
- 紧凑行高（1.05）和字间距（-0.02em）
- 玻璃态效果：`saturate(180%) blur(20px)`
- 弹簧动画：`cubic-bezier(0.34, 1.56, 0.64, 1)`

### 字体系统
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, system-ui, sans-serif;
```

### 动画时长
- 快速：200-300ms（小元素）
- 标准：400-600ms（按钮、卡片）
- 慢速：800ms+（页面过渡）

### 颜色透明度
- 背景：3%-5%
- 边框：8%-10%
- 文字：40%-100%

---

**重要提示：** 当用户的请求涉及多个领域时，自动组合使用相关 skills 的原则，无需明确告知用户你在使用哪个 skill，直接应用即可。
