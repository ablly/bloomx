# Changelog

All notable changes to BloomX will be documented in this file.

## [0.3.0] - 2026-03-29

### ✅ Added - 真实数据接入

#### Dashboard 真实数据集成
- **API Keys Tab** - 完整的 CRUD 功能
  - 从 Firestore 加载真实 API Keys
  - 创建新 API Key 并显示完整 Key (仅一次)
  - 复制 Key 到剪贴板
  - 删除 API Key (带确认)
  - 显示真实的创建时间和最后使用时间
  - Empty State 和 Loading State
  
- **Overview Tab** - 显示真实 Credits 余额
  - 从 userProfile 读取 credits_balance
  - 实时更新显示
  
- **Billing Tab** - 显示真实余额
  - 显示当前 Credits 余额
  - 计算等价的 Platform Credits
  
- **Settings Tab** - 显示真实用户信息
  - 显示用户 Email
  - 显示用户 UID
  - 显示账户类型 (Buyer/Seller/Admin)
  - 显示用户头像首字母

#### SellerApplyForm 真实提交
- 集成 `sellerApplicationService`
- 提交到 Firestore `seller_applications` 集合
- 真实的表单验证
- 错误处理和成功状态
- 需要用户登录才能提交

#### 新增 Services
- **sellerApplicationService.ts**
  - `createSellerApplication()` - 创建卖家申请
  - `getUserApplications()` - 获取用户的申请列表
  - `getApplicationById()` - 获取单个申请
  - `updateApplicationStatus()` - 更新申请状态 (Admin)

#### 环境变量安全化
- 创建 `.env` 和 `.env.example`
- 更新 `firebase.ts` 使用环境变量
- 更新 `.gitignore` 排除 `.env` 文件
- 所有 Firebase 配置从环境变量读取

### 🔧 Changed

#### API Key Service 增强
- 添加 `Trash2` 图标用于删除操作
- 添加 `Eye` 和 `EyeOff` 图标 (预留)
- 改进日期格式化函数
- 添加相对时间显示 (e.g., "2 mins ago")

#### Dashboard UI 改进
- 新增 Key 创建成功提示框
- 改进 Empty State 设计
- 添加 Loading Spinner
- 改进错误提示
- 优化表格布局

### 📝 Documentation
- 创建完整的 `README.md`
- 创建 `IMPLEMENTATION_PLAN.md` 实施计划
- 创建 `CHANGELOG.md` 更新日志

### 🚀 Deployment
- 添加部署脚本到 `package.json`
  - `npm run deploy` - 完整部署
  - `npm run deploy:hosting` - 仅部署 Hosting
  - `npm run deploy:rules` - 仅部署 Rules
  - `npm run deploy:indexes` - 仅部署 Indexes

---

## [0.2.0] - 2026-03-28

### ✅ Added - Firebase 后端接入

#### Authentication
- Firebase Auth 集成
- Email/Password 登录
- Google 登录
- Anonymous 登录
- AuthContext 和 useAuth Hook

#### Firestore Database
- Users Collection
- API Keys Subcollection
- Transactions Subcollection (结构定义)
- Seller Applications Collection

#### Security
- Firestore Security Rules
- 用户数据隔离
- API Keys 权限控制
- Seller Applications 权限控制

#### Services
- **apiKeyService.ts**
  - `createApiKey()` - 生成和存储 API Key
  - `listApiKeys()` - 列出用户的 Keys
  - `toggleApiKey()` - 启用/禁用 Key
  - `deleteApiKey()` - 删除 Key

---

## [0.1.0] - 2026-03-27

### ✅ Added - 前端 MVP

#### Landing Page
- **HeroLanding** - 双栏布局，液态玻璃效果
- **Features** - 核心功能展示
- **HowItWorks** - 工作流程说明
- **ModelCatalog** - 支持的模型目录
- **Pricing** - 定价方案
- **Testimonials** - 用户评价
- **SellerApplyForm** - 卖家申请表单 (UI only)
- **CTABanner** - 行动号召横幅
- **Footer** - 页脚信息

#### Dashboard UI
- **Overview Tab** - 概览统计 (假数据)
- **API Keys Tab** - API Key 管理 (假数据)
- **Usage Tab** - 使用统计 (假数据)
- **Billing Tab** - 账单和充值 (假数据)
- **Settings Tab** - 设置 (假数据)

#### Components
- **BackgroundVideo** - 背景视频循环
- **AuthModal** - 认证模态框

#### Design System
- Tailwind CSS 配置
- 液态玻璃效果 (liquid-glass)
- 响应式设计
- 动画和过渡效果
- Lucide Icons

#### Tech Stack
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Firebase (配置)

---

## 🎯 Roadmap

### v0.4.0 - Credits 系统 (计划中)
- [ ] Stripe 支付集成
- [ ] Credits 充值功能
- [ ] Credits 扣费逻辑
- [ ] Transaction 记录
- [ ] Auto-recharge 功能

### v0.5.0 - Usage 统计 (计划中)
- [ ] Usage Logs Collection
- [ ] 按模型统计
- [ ] 按时间统计
- [ ] 实时日志查询
- [ ] 导出功能

### v0.6.0 - 管理功能 (计划中)
- [ ] Admin Console
- [ ] 审核卖家申请
- [ ] Seller Dashboard
- [ ] 供给管理

### v0.7.0 - 优化与部署 (计划中)
- [ ] UI/UX 精修
- [ ] 性能优化
- [ ] Firebase Hosting 部署
- [ ] 自定义域名
- [ ] Firebase Analytics
- [ ] Error Tracking

### v1.0.0 - 生产环境就绪 (目标)
- [ ] 完整的买家流程
- [ ] 完整的卖家流程
- [ ] 支付和结算
- [ ] 监控和分析
- [ ] 文档完善
- [ ] 测试覆盖

---

## 📊 统计

### 代码量
- Components: 12 个
- Services: 2 个
- Contexts: 1 个
- Total Lines: ~3000+ 行

### 功能完成度
- Phase 1 (前端 MVP): ✅ 100%
- Phase 2 (Firebase 接入): ✅ 100%
- Phase 3 (真实数据): ✅ 80%
- Phase 4 (Credits 系统): ⏳ 0%
- Phase 5 (部署): ⏳ 0%

### 技术债务
- [ ] Usage Tab 需要真实数据
- [ ] Billing Tab 需要 Stripe 集成
- [ ] 需要添加单元测试
- [ ] 需要添加 E2E 测试
- [ ] 需要性能优化
- [ ] 需要 SEO 优化

---

**Legend:**
- ✅ Completed
- ⏳ In Progress
- 🔴 Blocked
- 📝 Planned
