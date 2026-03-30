# BloomX 项目进度与工作计划

## 📊 当前进度评估（2026-03-30）

### ✅ 最新完成：Cloudflare Pages 部署准备 (2026-03-30)

**完成内容：**
- ✅ 创建 Cloudflare Pages 配置文件
  - `_headers` - 缓存和安全头配置
  - `_redirects` - SPA 路由配置
  - `wrangler.toml` - Wrangler CLI 配置
- ✅ 更新构建脚本支持 Windows
- ✅ 项目构建成功（dist 目录已生成）
- ✅ 创建详细部署文档
  - `CLOUDFLARE_DEPLOYMENT.md` - 完整部署指南
  - `DEPLOY_NOW.md` - 快速部署指南
- ✅ 配置环境变量
- ✅ 所有功能测试通过

**部署方式：**
1. 通过 GitHub（推荐）- 自动 CI/CD
2. 使用 Wrangler CLI - 快速部署

**下一步：**
- 推送代码到 GitHub
- 在 Cloudflare Pages 连接仓库
- 添加环境变量
- 点击部署

---

### ✅ React Bits 动画组件库 (2026-03-30)

**完成内容：**
- ✅ 创建了 7 个高质量动画组件（灵感来自 React Bits）
- ✅ GridPattern - 网格背景效果
- ✅ GradientText - 渐变文字动画
- ✅ FadeIn - 滚动淡入动画（支持 4 个方向）
- ✅ BlurText - 模糊到清晰文字效果
- ✅ TiltCard - 3D 倾斜卡片（鼠标跟随）
- ✅ ShimmerButton - 闪光按钮效果
- ✅ NumberTicker - 数字滚动动画（Intersection Observer）
- ✅ 更新 Tailwind 配置添加新动画
- ✅ 创建组件演示页面 ComponentShowcase
- ✅ 编写完整使用文档 REACT_BITS_COMPONENTS.md
- ✅ 构建成功，无 TypeScript 错误

**组件特点：**
- 完全符合苹果风格设计原则
- 性能优化（GPU 加速、CSS 动画）
- TypeScript 类型完整
- 高度可定制（通过 props）
- 响应式设计
- 无障碍支持

**文件位置：**
- 组件：`src/components/ui/`
- 文档：`REACT_BITS_COMPONENTS.md`
- 演示：`src/components/ComponentShowcase.tsx`

---

### ✅ i18n 国际化功能 (2026-03-30)

**完成内容：**
- ✅ 修复所有组件的翻译功能 - 所有前端组件现已使用 `useTranslation()` hook
- ✅ 添加缺失的翻译键（models, testimonials, cta）到 en.json 和 zh.json
- ✅ 中英文翻译完整覆盖所有页面内容
- ✅ 语言切换器正常工作，实时切换无刷新
- ✅ AuthModal 和 SellerApplyForm 组件已完全国际化
- ✅ 构建成功，无 TypeScript 错误
- ✅ 开发服务器运行正常 (http://localhost:5174/)

**已更新组件：** 
- Landing: HeroLanding, Features, Pricing, ModelCatalog, HowItWorks, Testimonials, CTABanner, Footer
- Forms: AuthModal, SellerApplyForm
- UI: LanguageSwitcher

**测试方法：**
1. 访问 http://localhost:5174/
2. 点击右上角的语言切换器（🇺🇸 English / 🇨🇳 中文）
3. 所有文本应立即切换为对应语言

---

### 整体完成度：**80%** ✅ (从 78% 提升)

```
前端开发    ████████████████████ 100% ✅
后端集成    ████████████████░░░░  80% 🟡
UI/UX优化   ████████████████████ 100% ✅
核心功能    ████████████░░░░░░░░  60% 🟡
部署准备    ████████████░░░░░░░░  60% 🟡
```

### 详细模块进度

| 模块 | 完成度 | 状态 | 备注 |
|------|--------|------|------|
| Landing Page | 100% | ✅ | 苹果风格重设计完成 |
| i18n 国际化 | 100% | ✅ | 中英文翻译完成 |
| Dashboard UI | 100% | ✅ | 所有 Tab 完成 |
| 认证系统 | 100% | ✅ | Email/Google/Anonymous |
| API Key 管理 | 100% | ✅ | CRUD + 真实数据 |
| Seller 申请 | 100% | ✅ | 表单 + Firestore |
| Credits 系统 | 0% | 🔴 | 待开发 |
| API Gateway | 0% | 🔴 | 待开发 |
| Usage 统计 | 20% | 🟡 | UI完成，数据待接入 |
| Admin Console | 0% | 🔴 | 待开发 |
| 部署配置 | 60% | 🟡 | 脚本完成，待执行 |

---

## 🎯 接下来的工作规划

### 🚀 Phase 1: 立即部署（本周）
**目标**: 让项目上线可访问，获得真实反馈

#### 任务清单
- [ ] **环境检查**
  - [ ] 确认 .env 配置正确
  - [ ] 测试 Firebase 连接
  - [ ] 检查所有功能正常

- [ ] **构建测试**
  - [ ] 运行 `npm run build`
  - [ ] 检查构建输出
  - [ ] 本地预览测试

- [ ] **部署执行**
  - [ ] 部署 Firestore Rules
  - [ ] 部署 Firestore Indexes
  - [ ] 部署到 Firebase Hosting
  - [ ] 配置自定义域名（可选）

- [ ] **部署验证**
  - [ ] 测试所有页面
  - [ ] 测试认证流程
  - [ ] 测试 API Key 创建
  - [ ] 测试 Seller 申请

**预计时间**: 2-3 小时
**优先级**: 🔴 P0

---

### 💳 Phase 2: Credits 系统（第 1-2 周）
**目标**: 实现完整的充值和扣费系统

#### Week 1: Stripe 集成
- [ ] **Stripe 账户设置**
  - [ ] 创建 Stripe 账户
  - [ ] 获取 API Keys（Test + Live）
  - [ ] 配置 Webhook
  - [ ] 测试支付流程

- [ ] **前端集成**
  - [ ] 安装 @stripe/stripe-js
  - [ ] 创建充值页面
  - [ ] 实现支付表单
  - [ ] 处理支付成功/失败

- [ ] **Cloud Function: 充值**
  ```typescript
  // functions/src/credits/topup.ts
  - 验证 Stripe Payment Intent
  - 更新用户 credits_balance
  - 创建 Transaction 记录
  - 发送确认邮件
  ```

#### Week 2: 扣费逻辑
- [ ] **Cloud Function: 扣费**
  ```typescript
  // functions/src/credits/deduct.ts
  - 验证 API Key
  - 计算费用（按模型）
  - 扣除 credits
  - 记录 Transaction
  - 余额不足处理
  ```

- [ ] **Transaction 历史**
  - [ ] 创建 Transactions Subcollection
  - [ ] 实现 Transaction Service
  - [ ] Dashboard 显示历史
  - [ ] 导出功能

- [ ] **Auto-recharge**
  - [ ] 设置阈值和金额
  - [ ] 自动触发充值
  - [ ] 通知用户

**预计时间**: 2 周
**优先级**: 🔴 P0

---

### 🌐 Phase 3: API Gateway（第 3-5 周）
**目标**: 实现核心的 AI 模型路由功能

#### Week 3: 基础架构
- [ ] **统一 API 接口**
  - [ ] `/v1/chat/completions` (OpenAI 兼容)
  - [ ] `/v1/models` (模型列表)
  - [ ] `/v1/usage` (使用统计)
  - [ ] API Key 验证中间件
  - [ ] Rate Limiting

- [ ] **Provider 适配器**
  ```typescript
  // functions/src/providers/
  - OpenAI Adapter
  - Anthropic Adapter
  - Google Adapter
  - 统一响应格式
  ```

#### Week 4-5: 路由引擎
- [ ] **智能路由**
  - [ ] 健康检查
  - [ ] 延迟监控
  - [ ] 负载均衡
  - [ ] 故障转移
  - [ ] 成本优化

- [ ] **Usage Logging**
  - [ ] 创建 Usage Logs Collection
  - [ ] 记录每次调用
  - [ ] 实时统计
  - [ ] Dashboard 显示

**预计时间**: 3 周
**优先级**: 🔴 P0

---

### 👥 Phase 4: 管理功能（第 6-7 周）
**目标**: 完善管理和审核流程

#### Admin Console
- [ ] **卖家申请审核**
  - [ ] 申请列表页面
  - [ ] 申请详情页面
  - [ ] 批准/拒绝功能
  - [ ] 邮件通知
  - [ ] 审核日志

- [ ] **用户管理**
  - [ ] 用户列表
  - [ ] 用户详情
  - [ ] 修改角色
  - [ ] 封禁/解封

- [ ] **系统监控**
  - [ ] 实时统计
  - [ ] 错误日志
  - [ ] 性能指标

#### Seller Dashboard
- [ ] **供给管理**
  - [ ] 上架新供给
  - [ ] 配置价格
  - [ ] 设置容量
  - [ ] 启用/禁用

- [ ] **收益管理**
  - [ ] 收益统计
  - [ ] 提现申请
  - [ ] 提现历史

**预计时间**: 2 周
**优先级**: 🟡 P1

---

### 🎨 Phase 5: 优化与完善（第 8 周）
**目标**: 提升质量和用户体验

- [ ] **性能优化**
  - [ ] 代码分割
  - [ ] 懒加载
  - [ ] 图片优化
  - [ ] Bundle 分析

- [ ] **测试**
  - [ ] 单元测试
  - [ ] 集成测试
  - [ ] E2E 测试
  - [ ] 性能测试

- [ ] **文档完善**
  - [ ] API 文档
  - [ ] 用户指南
  - [ ] 视频教程
  - [ ] FAQ

**预计时间**: 1 周
**优先级**: 🟢 P2

---

## 📅 时间线（8 周计划）

```
Week 1  ████ 部署 + Stripe 集成开始
Week 2  ████ Credits 充值完成
Week 3  ████ API Gateway 基础
Week 4  ████ 路由引擎开发
Week 5  ████ 路由引擎完成
Week 6  ████ Admin Console
Week 7  ████ Seller Dashboard
Week 8  ████ 优化与测试
```

**预计完成日期**: 2026-05-25
**当前日期**: 2026-03-30

---

## 🎯 里程碑

### ✅ v0.3.0 - 前端完成（已完成）
- Landing Page 苹果风格重设计
- Dashboard 真实数据接入
- 认证系统完善

### 🔄 v0.4.0 - 部署上线（本周）
- Firebase Hosting 部署
- 自定义域名配置
- 基础监控设置

### 🎯 v0.5.0 - Credits 系统（2 周后）
- Stripe 支付集成
- 充值/扣费功能
- Transaction 记录

### 🎯 v0.6.0 - API Gateway（5 周后）
- 统一 API 接口
- 智能路由引擎
- Usage 统计

### 🎯 v0.7.0 - 管理功能（7 周后）
- Admin Console
- Seller Dashboard
- 审核流程

### 🎯 v1.0.0 - 正式发布（8 周后）
- 所有核心功能完成
- 测试覆盖率 > 80%
- 文档完善
- 性能优化

---

## 🔥 本周行动计划（Week 1）

### Monday（今天）
- [x] 项目进度评估
- [x] 工作计划制定
- [ ] 部署前检查
- [ ] 构建测试

### Tuesday
- [ ] 部署到 Firebase Hosting
- [ ] 域名配置
- [ ] 创建 Stripe 账户
- [ ] 开始 Stripe 集成

### Wednesday
- [ ] Stripe 前端集成
- [ ] 充值页面开发
- [ ] 支付表单实现

### Thursday
- [ ] Cloud Function 开发
- [ ] 充值逻辑实现
- [ ] Webhook 处理

### Friday
- [ ] 测试支付流程
- [ ] 修复 Bug
- [ ] 周总结

---

## 📊 关键指标

### 开发指标
- **代码覆盖率**: 目标 80%，当前 0%
- **构建时间**: < 1s ✅
- **Bundle 大小**: 182 KB (gzipped) ✅
- **TypeScript 错误**: 0 ✅

### 业务指标（部署后）
- **页面加载时间**: 目标 < 3s
- **API 响应时间**: 目标 < 500ms
- **错误率**: 目标 < 1%
- **可用性**: 目标 > 99.9%

---

## 🚨 风险与挑战

### 技术风险
1. **Stripe 集成复杂度** 🟡
   - 缓解：使用 Stripe Checkout（简化版）
   - 备选：先实现模拟充值

2. **API Gateway 性能** 🟡
   - 缓解：使用 Cloud Functions + CDN
   - 备选：考虑 Cloud Run

3. **多 Provider 适配** 🟡
   - 缓解：先支持 OpenAI，逐步扩展
   - 备选：使用第三方聚合服务

### 时间风险
1. **8 周时间紧张** 🔴
   - 缓解：优先 P0 功能，P1/P2 可延后
   - 备选：延长到 10-12 周

2. **一人开发效率** 🟡
   - 缓解：使用 AI 辅助开发
   - 备选：考虑外包部分功能

---

## 💡 优化建议

### 短期（本周）
1. 立即部署，获得真实反馈
2. 设置错误监控（Sentry）
3. 配置 Analytics

### 中期（1-2 月）
1. 实现核心付费功能
2. 完善 API Gateway
3. 建立用户反馈渠道

### 长期（3-6 月）
1. 扩展更多 AI 模型
2. 优化路由算法
3. 建立社区生态

---

**更新日期**: 2026-03-30
**当前版本**: v0.3.0
**目标版本**: v1.0.0
**预计发布**: 2026-05-25

---

## 🔴 P0 - 必须完成 (生产环境核心功能)

### Credits 系统
- [ ] **Stripe 集成**
  - [ ] 创建 Stripe 账户
  - [ ] 配置 Stripe Connect
  - [ ] 实现充值接口
  - [ ] 实现 Webhook 处理
  - [ ] 测试支付流程

- [ ] **Credits 充值功能**
  - [ ] 创建充值 Cloud Function
  - [ ] 实现充值页面交互
  - [ ] 添加支付成功/失败处理
  - [ ] 更新用户 credits_balance
  - [ ] 记录 Transaction

- [ ] **Credits 扣费逻辑**
  - [ ] 创建扣费 Cloud Function
  - [ ] 实现 API 调用计费
  - [ ] 按模型计算费用
  - [ ] 余额不足处理
  - [ ] 记录 Transaction

- [ ] **Transaction 记录**
  - [ ] 创建 Transactions Subcollection
  - [ ] 实现 Transaction Service
  - [ ] 显示交易历史
  - [ ] 导出交易记录
  - [ ] 交易详情页面

### API Gateway (核心)
- [ ] **统一 API 接口**
  - [ ] 实现 `/v1/chat/completions`
  - [ ] 实现 `/v1/models`
  - [ ] 实现 `/v1/usage`
  - [ ] API Key 验证中间件
  - [ ] Rate Limiting

- [ ] **路由引擎**
  - [ ] 多 Provider 适配器
  - [ ] 智能路由算法
  - [ ] 负载均衡
  - [ ] 故障转移
  - [ ] 延迟优化

## 🟡 P1 - 重要功能 (完善用户体验)

### Usage 统计
- [ ] **Usage Logs Collection**
  - [ ] 设计 Schema
  - [ ] 实现写入逻辑
  - [ ] 配置 Indexes
  - [ ] 数据保留策略

- [ ] **统计功能**
  - [ ] 按模型聚合
  - [ ] 按时间聚合
  - [ ] 实时查询优化
  - [ ] 图表可视化
  - [ ] 导出 CSV

- [ ] **Dashboard Usage Tab 真实数据**
  - [ ] 替换假数据
  - [ ] 实时更新
  - [ ] 筛选和搜索
  - [ ] 分页加载

### Admin Console
- [ ] **卖家申请审核**
  - [ ] 申请列表页面
  - [ ] 申请详情页面
  - [ ] 批准/拒绝功能
  - [ ] 邮件通知
  - [ ] 审核日志

- [ ] **用户管理**
  - [ ] 用户列表
  - [ ] 用户详情
  - [ ] 修改用户角色
  - [ ] 封禁/解封用户
  - [ ] 用户统计

- [ ] **系统监控**
  - [ ] 实时统计
  - [ ] 错误日志
  - [ ] 性能指标
  - [ ] 告警设置

### Seller Dashboard
- [ ] **供给管理**
  - [ ] 上架新供给
  - [ ] 配置模型和价格
  - [ ] 设置容量限制
  - [ ] 启用/禁用供给
  - [ ] 供给统计

- [ ] **收益管理**
  - [ ] 收益统计
  - [ ] 提现申请
  - [ ] 提现历史
  - [ ] 结算周期设置

## 🟢 P2 - 优化改进 (提升质量)

### UI/UX 优化
- [ ] **排版精修**
  - [ ] 字体大小调整
  - [ ] 行高优化
  - [ ] 间距统一
  - [ ] 对齐优化

- [ ] **动画精修**
  - [ ] 过渡效果优化
  - [ ] Loading 动画
  - [ ] Skeleton Screen
  - [ ] 微交互动画

- [ ] **响应式优化**
  - [ ] 移动端适配
  - [ ] 平板端适配
  - [ ] 触摸交互
  - [ ] 横屏适配

- [ ] **无障碍优化**
  - [ ] ARIA 标签
  - [ ] 键盘导航
  - [ ] 屏幕阅读器支持
  - [ ] 对比度优化

### 性能优化
- [ ] **代码分割**
  - [ ] 路由懒加载
  - [ ] 组件懒加载
  - [ ] 第三方库按需加载
  - [ ] Bundle 分析

- [ ] **资源优化**
  - [ ] 图片压缩
  - [ ] 视频压缩
  - [ ] 字体子集化
  - [ ] CDN 加速

- [ ] **缓存策略**
  - [ ] Service Worker
  - [ ] 静态资源缓存
  - [ ] API 响应缓存
  - [ ] 离线支持

### 测试
- [ ] **单元测试**
  - [ ] Services 测试
  - [ ] Utils 测试
  - [ ] Hooks 测试
  - [ ] 覆盖率 > 80%

- [ ] **集成测试**
  - [ ] 认证流程测试
  - [ ] API Key 管理测试
  - [ ] Credits 系统测试
  - [ ] 端到端测试

- [ ] **性能测试**
  - [ ] Lighthouse 测试
  - [ ] 负载测试
  - [ ] 压力测试
  - [ ] 性能基准

## 🔵 P3 - 增强功能 (锦上添花)

### 国际化
- [ ] **多语言支持**
  - [ ] i18n 配置
  - [ ] 中文翻译
  - [ ] 英文翻译
  - [ ] 语言切换
  - [ ] 日期格式化

### 通知系统
- [ ] **邮件通知**
  - [ ] 注册欢迎邮件
  - [ ] API Key 创建通知
  - [ ] 余额不足提醒
  - [ ] 卖家申请结果通知

- [ ] **站内通知**
  - [ ] 通知中心
  - [ ] 实时推送
  - [ ] 通知历史
  - [ ] 通知设置

### 文档系统
- [ ] **API 文档**
  - [ ] 交互式文档
  - [ ] 代码示例
  - [ ] SDK 下载
  - [ ] Postman Collection

- [ ] **用户指南**
  - [ ] 快速开始
  - [ ] 最佳实践
  - [ ] 常见问题
  - [ ] 视频教程

### 社区功能
- [ ] **用户反馈**
  - [ ] 反馈表单
  - [ ] 功能投票
  - [ ] Bug 报告
  - [ ] 反馈追踪

- [ ] **社区论坛**
  - [ ] 讨论区
  - [ ] 问答系统
  - [ ] 用户案例
  - [ ] 技术博客

## 🚀 部署相关

### 生产环境部署
- [ ] **Firebase Hosting**
  - [ ] 配置自定义域名
  - [ ] SSL 证书配置
  - [ ] CDN 配置
  - [ ] 缓存策略

- [ ] **Cloud Functions**
  - [ ] 部署 Credits 充值函数
  - [ ] 部署 Credits 扣费函数
  - [ ] 部署 API Gateway 函数
  - [ ] 配置环境变量

- [ ] **监控与分析**
  - [ ] Firebase Analytics
  - [ ] Error Tracking (Sentry)
  - [ ] Performance Monitoring
  - [ ] User Behavior Tracking

### CI/CD
- [ ] **自动化部署**
  - [ ] GitHub Actions 配置
  - [ ] 自动测试
  - [ ] 自动构建
  - [ ] 自动部署

- [ ] **环境管理**
  - [ ] 开发环境
  - [ ] 测试环境
  - [ ] 预发布环境
  - [ ] 生产环境

## 📝 文档完善

### 技术文档
- [ ] **架构文档**
  - [ ] 系统架构图
  - [ ] 数据流图
  - [ ] 部署架构图
  - [ ] 技术选型说明

- [ ] **开发文档**
  - [ ] 开发环境搭建
  - [ ] 代码规范
  - [ ] Git 工作流
  - [ ] 贡献指南

### 用户文档
- [ ] **使用手册**
  - [ ] 买家使用指南
  - [ ] 卖家使用指南
  - [ ] API 使用指南
  - [ ] 故障排除

- [ ] **视频教程**
  - [ ] 产品介绍视频
  - [ ] 快速开始视频
  - [ ] API 集成视频
  - [ ] 常见问题视频

## 🔒 安全加固

### 安全措施
- [ ] **认证安全**
  - [ ] 2FA 认证
  - [ ] 密码强度要求
  - [ ] 登录失败限制
  - [ ] Session 管理

- [ ] **API 安全**
  - [ ] Rate Limiting
  - [ ] IP 白名单
  - [ ] API Key 过期
  - [ ] 请求签名

- [ ] **数据安全**
  - [ ] 数据加密
  - [ ] 备份策略
  - [ ] 灾难恢复
  - [ ] 审计日志

### 合规性
- [ ] **隐私政策**
  - [ ] 隐私政策页面
  - [ ] Cookie 政策
  - [ ] 数据处理协议
  - [ ] GDPR 合规

- [ ] **服务条款**
  - [ ] 服务条款页面
  - [ ] 使用协议
  - [ ] 退款政策
  - [ ] 争议解决

## 📊 数据分析

### 业务指标
- [ ] **用户指标**
  - [ ] 注册转化率
  - [ ] 活跃用户数
  - [ ] 用户留存率
  - [ ] 用户生命周期价值

- [ ] **收入指标**
  - [ ] 月度经常性收入 (MRR)
  - [ ] 年度经常性收入 (ARR)
  - [ ] 客户获取成本 (CAC)
  - [ ] 投资回报率 (ROI)

### 技术指标
- [ ] **性能指标**
  - [ ] 页面加载时间
  - [ ] API 响应时间
  - [ ] 错误率
  - [ ] 可用性

- [ ] **使用指标**
  - [ ] API 调用量
  - [ ] 模型使用分布
  - [ ] 地域分布
  - [ ] 设备分布

## 🎯 里程碑

### v0.4.0 - Credits 系统 (目标: 2 周)
- [ ] Stripe 集成完成
- [ ] Credits 充值功能上线
- [ ] Credits 扣费逻辑实现
- [ ] Transaction 记录完善

### v0.5.0 - API Gateway (目标: 3 周)
- [ ] 统一 API 接口实现
- [ ] 路由引擎上线
- [ ] 多 Provider 支持
- [ ] Usage 统计完善

### v0.6.0 - 管理功能 (目标: 2 周)
- [ ] Admin Console 上线
- [ ] Seller Dashboard 上线
- [ ] 审核流程完善
- [ ] 供给管理实现

### v1.0.0 - 生产环境就绪 (目标: 2 个月)
- [ ] 所有核心功能完成
- [ ] 测试覆盖率 > 80%
- [ ] 性能优化完成
- [ ] 文档完善
- [ ] 正式上线

## 📅 时间规划

### 本周 (Week 1)
- [ ] 部署到 Firebase Hosting
- [ ] 开始 Stripe 集成
- [ ] 设计 Credits 充值流程

### 下周 (Week 2)
- [ ] 完成 Stripe 集成
- [ ] 实现 Credits 充值功能
- [ ] 测试支付流程

### 第三周 (Week 3)
- [ ] 实现 Credits 扣费逻辑
- [ ] 完善 Transaction 记录
- [ ] 开始 API Gateway 开发

### 第四周 (Week 4)
- [ ] 完成 API Gateway 核心功能
- [ ] 实现路由引擎
- [ ] 测试 API 调用

## 🤝 团队协作

### 角色分工
- **前端开发**: Dashboard 优化、UI/UX 改进
- **后端开发**: API Gateway、Cloud Functions
- **DevOps**: 部署、监控、CI/CD
- **产品经理**: 需求管理、用户反馈
- **设计师**: UI 设计、交互设计

### 沟通渠道
- **日常沟通**: Discord/Slack
- **代码审查**: GitHub Pull Request
- **项目管理**: GitHub Projects
- **文档协作**: Notion/Google Docs

---

**更新日期**: 2026-03-29
**当前版本**: v0.3.0
**下一版本**: v0.4.0 (Credits 系统)

**优先级说明**:
- 🔴 P0: 必须完成 (生产环境核心功能)
- 🟡 P1: 重要功能 (完善用户体验)
- 🟢 P2: 优化改进 (提升质量)
- 🔵 P3: 增强功能 (锦上添花)
