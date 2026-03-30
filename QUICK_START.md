# BloomX 快速启动指南

## 🚀 5 分钟快速启动

### 前置要求

确保你已安装：
- Node.js (v18+)
- npm 或 yarn
- Git
- Firebase CLI (可选，用于部署)

### Step 1: 克隆项目

```bash
git clone <your-repo-url>
cd bloomx
```

### Step 2: 安装依赖

```bash
npm install
```

### Step 3: 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Firebase 配置：

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> 💡 **提示**: 如果你还没有 Firebase 项目，请访问 [Firebase Console](https://console.firebase.google.com) 创建一个。

### Step 4: 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用！

## 🎯 核心功能测试

### 1. 测试认证功能

1. 点击首页的 "Start with BloomX API" 按钮
2. 在弹出的模态框中选择 "Sign Up"
3. 使用 Email/Password 或 Google 登录
4. 成功后会自动跳转到 Dashboard

### 2. 测试 API Key 管理

1. 在 Dashboard 中点击 "API Keys" 标签
2. 点击 "Create new secret key" 按钮
3. 复制生成的 API Key（仅显示一次）
4. 测试删除功能

### 3. 测试 Seller Application

1. 返回首页（点击 Logo）
2. 滚动到 "Join the Network" 部分
3. 填写卖家申请表单
4. 提交申请
5. 查看成功提示

### 4. 测试 Credits 显示

1. 在 Dashboard 中查看右上角的 Credits 余额
2. 点击 "Billing" 标签查看详细余额
3. 查看 "Settings" 标签的用户信息

## 📁 项目结构速览

```
bloomx/
├── src/
│   ├── components/          # React 组件
│   │   ├── Dashboard.tsx    # 用户仪表板 ✅
│   │   ├── SellerApplyForm.tsx  # 卖家申请 ✅
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx  # 认证上下文 ✅
│   ├── services/
│   │   ├── apiKeyService.ts # API Key 管理 ✅
│   │   └── sellerApplicationService.ts # 卖家申请 ✅
│   ├── lib/
│   │   └── firebase.ts      # Firebase 配置 ✅
│   └── App.tsx              # 主应用
├── .env                     # 环境变量 (不提交)
├── .env.example             # 环境变量示例
├── firebase.json            # Firebase 配置
├── firestore.rules          # Firestore 安全规则
└── package.json             # 依赖配置
```

## 🔧 常用命令

### 开发

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 部署

```bash
# 完整部署（Hosting + Rules + Indexes）
npm run deploy

# 仅部署 Hosting
npm run deploy:hosting

# 仅部署 Firestore Rules
npm run deploy:rules

# 仅部署 Firestore Indexes
npm run deploy:indexes
```

### Firebase CLI

```bash
# 安装 Firebase CLI
npm install -g firebase-tools

# 登录 Firebase
firebase login

# 初始化项目（如果需要）
firebase init

# 查看项目信息
firebase projects:list

# 查看部署历史
firebase hosting:channel:list
```

## 🐛 常见问题

### Q1: 启动失败，提示 Firebase 错误

**A**: 检查 `.env` 文件是否存在且配置正确。确保所有环境变量都以 `VITE_` 开头。

### Q2: 登录后无法创建 API Key

**A**: 检查 Firestore Rules 是否已部署：

```bash
npm run deploy:rules
```

### Q3: 页面白屏

**A**: 打开浏览器控制台查看错误信息。常见原因：
- Firebase 配置错误
- 网络问题
- 浏览器缓存问题（尝试清除缓存）

### Q4: 构建失败

**A**: 确保所有依赖已安装：

```bash
rm -rf node_modules
npm install
npm run build
```

### Q5: 部署后 404 错误

**A**: 检查 `firebase.json` 的 rewrites 配置是否正确。

## 📚 下一步

### 学习资源

- **项目文档**: 阅读 `README.md` 了解完整功能
- **API 文档**: 阅读 `API_DOCS.md` 了解 API 使用
- **实施计划**: 阅读 `IMPLEMENTATION_PLAN.md` 了解开发计划
- **TODO 列表**: 阅读 `TODO.md` 了解待完成功能

### 开发建议

1. **先熟悉现有功能**: 测试所有已实现的功能
2. **阅读代码**: 了解项目架构和代码风格
3. **查看 TODO**: 选择一个任务开始开发
4. **提交代码**: 遵循 Git 工作流提交代码

### 推荐开发顺序

1. **熟悉项目** (1 天)
   - 运行项目
   - 测试所有功能
   - 阅读文档

2. **Stripe 集成** (3-5 天)
   - 创建 Stripe 账户
   - 实现充值功能
   - 测试支付流程

3. **API Gateway** (1-2 周)
   - 实现统一 API
   - 实现路由引擎
   - 测试 API 调用

4. **Admin Console** (1 周)
   - 实现审核功能
   - 实现用户管理
   - 实现系统监控

## 🎨 开发技巧

### 1. 使用 React DevTools

安装 React DevTools 浏览器扩展，方便调试组件状态。

### 2. 使用 Firebase Emulator

本地开发时可以使用 Firebase Emulator：

```bash
firebase emulators:start
```

### 3. 代码格式化

使用 Prettier 格式化代码：

```bash
npm install -D prettier
npx prettier --write "src/**/*.{ts,tsx}"
```

### 4. 类型检查

运行 TypeScript 类型检查：

```bash
npx tsc --noEmit
```

### 5. 热重载

Vite 支持热重载，修改代码后会自动刷新页面。

## 🔐 安全提示

### 1. 保护 API Keys

- ❌ 不要将 `.env` 文件提交到 Git
- ❌ 不要在客户端代码中硬编码 API Keys
- ✅ 使用环境变量
- ✅ 定期轮换 API Keys

### 2. Firestore Rules

- ✅ 始终使用 Security Rules 保护数据
- ✅ 测试 Rules 是否正确
- ✅ 最小权限原则

### 3. 认证安全

- ✅ 使用 Firebase Auth
- ✅ 启用 Email 验证
- ✅ 实现密码强度要求

## 📞 获取帮助

### 文档

- [React 文档](https://react.dev)
- [Firebase 文档](https://firebase.google.com/docs)
- [Vite 文档](https://vitejs.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)

### 社区

- **Discord**: [BloomX Community]
- **GitHub Issues**: [bloomx/issues]
- **Stack Overflow**: 搜索 `bloomx` 标签

### 联系方式

- **Email**: zqhablly@gmail.com
- **GitHub**: [@bloomx]

## ✅ 检查清单

在开始开发前，确保：

- [ ] Node.js 已安装
- [ ] 项目已克隆
- [ ] 依赖已安装
- [ ] 环境变量已配置
- [ ] 开发服务器可以启动
- [ ] 所有功能可以正常使用
- [ ] 已阅读项目文档
- [ ] 已了解项目架构

## 🎉 开始开发

一切准备就绪！现在你可以：

1. 选择一个 TODO 任务
2. 创建新分支
3. 开始编码
4. 提交代码
5. 创建 Pull Request

**祝你开发愉快！🚀**

---

**需要帮助？** 随时联系我们：zqhablly@gmail.com
