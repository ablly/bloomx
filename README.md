# BloomX - AI Infrastructure Marketplace

> Turn idle AI capacity into liquid infrastructure

BloomX 是一个 AI 基础设施交易平台，连接 AI API 供给方和需求方，提供统一的 API 接入、智能路由、Credits 结算和实名卖家供给池。

## 🎯 核心价值主张

### 对买家
- 更低试错成本
- 多模型统一入口
- 平台 Credits 统一结算
- 中英文产品与文档

### 对卖家
- 把闲置或低利用率的上游能力变成收益
- 不需要自己建站、售卖、风控、客服、计费
- 平台统一结算和提现

## 🏗️ 技术栈

### 前端
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide Icons

### 后端
- Firebase Auth (Email/Password + Google + Anonymous)
- Firestore (NoSQL Database)
- Firebase Hosting (部署)
- Cloud Functions (计划中)

### 支付
- Stripe Connect (计划中)

## 📦 项目结构

```
bloomx/
├── src/
│   ├── components/          # React 组件
│   │   ├── AuthModal.tsx    # 认证模态框
│   │   ├── Dashboard.tsx    # 用户仪表板 ✅ 真实数据
│   │   ├── SellerApplyForm.tsx  # 卖家申请表单 ✅ 真实数据
│   │   ├── HeroLanding.tsx  # 首页 Hero
│   │   ├── Features.tsx     # 功能展示
│   │   ├── HowItWorks.tsx   # 工作流程
│   │   ├── ModelCatalog.tsx # 模型目录
│   │   ├── Pricing.tsx      # 定价
│   │   ├── Testimonials.tsx # 用户评价
│   │   ├── CTABanner.tsx    # CTA 横幅
│   │   └── Footer.tsx       # 页脚
│   ├── contexts/
│   │   └── AuthContext.tsx  # 认证上下文
│   ├── services/
│   │   ├── apiKeyService.ts # API Key 管理 ✅
│   │   └── sellerApplicationService.ts # 卖家申请管理 ✅
│   ├── lib/
│   │   └── firebase.ts      # Firebase 配置 ✅ 环境变量
│   ├── App.tsx              # 主应用
│   └── main.tsx             # 入口文件
├── .env                     # 环境变量 (不提交到 Git)
├── .env.example             # 环境变量示例
├── firebase.json            # Firebase 配置
├── firestore.rules          # Firestore 安全规则
├── firestore.indexes.json   # Firestore 索引
└── package.json             # 依赖配置
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd bloomx
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并填入你的 Firebase 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 5. 构建生产版本

```bash
npm run build
```

### 6. 部署到 Firebase Hosting

```bash
firebase deploy
```

## 📊 数据模型

### Users Collection (`users/{uid}`)

```typescript
{
  uid: string;
  email: string | null;
  role: 'buyer' | 'seller' | 'admin';
  credits_balance: number;
  createdAt: Timestamp;
}
```

### API Keys Subcollection (`users/{uid}/api_keys/{keyId}`)

```typescript
{
  id: string;
  key_prefix: string;      // "bx_live_abc123..."
  key_hash: string;         // SHA-256 hash
  uid: string;
  is_active: boolean;
  last_used: Timestamp | null;
  createdAt: Timestamp;
}
```

### Seller Applications Collection (`seller_applications/{appId}`)

```typescript
{
  id: string;
  uid: string;
  name: string;
  email: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mixed';
  capacity: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: Timestamp | null;
  createdAt: Timestamp;
}
```

## 🔐 安全规则

Firestore 安全规则已配置在 `firestore.rules` 中：

- 用户只能读写自己的数据
- API Keys 只能由所有者管理
- Seller Applications 只能创建，不能修改（管理员除外）
- Credits 余额只能由服务端修改

## ✅ 已完成功能

### Phase 1: 前端 MVP
- ✅ Landing Page (Hero + Features + How It Works + Model Catalog + Pricing + Testimonials)
- ✅ Dashboard UI (Overview + API Keys + Usage + Billing + Settings)
- ✅ 响应式设计
- ✅ 液态玻璃视觉效果
- ✅ 背景视频循环

### Phase 2: Firebase 后端接入
- ✅ Firebase Auth (Email/Password + Google + Anonymous)
- ✅ Firestore 数据库
- ✅ Security Rules
- ✅ 环境变量安全化

### Phase 3: 真实数据接入
- ✅ Dashboard - API Keys Tab 真实数据
  - ✅ 列表显示
  - ✅ 创建新 Key
  - ✅ 显示完整 Key (仅一次)
  - ✅ 复制 Key
  - ✅ 删除 Key
  - ✅ 显示创建时间和最后使用时间
- ✅ Dashboard - Overview Tab 显示真实 Credits
- ✅ Dashboard - Billing Tab 显示真实余额
- ✅ Dashboard - Settings Tab 显示真实用户信息
- ✅ SellerApplyForm 写入 Firestore

## 🔄 待完成功能

### P1 - 核心业务逻辑
- ⏳ Credits 充值功能 (Stripe 集成)
- ⏳ Credits 扣费逻辑
- ⏳ Transaction 记录
- ⏳ Usage 统计 (真实数据)
- ⏳ Auto-recharge 功能

### P2 - 管理功能
- ⏳ Admin Console (审核卖家申请)
- ⏳ Seller Dashboard (卖家管理面板)
- ⏳ Usage Logs (详细日志)

### P3 - 优化
- ⏳ 排版动画精修
- ⏳ Loading States 优化
- ⏳ Error Handling 完善
- ⏳ 性能优化

### P4 - 部署与监控
- ⏳ Firebase Hosting 部署
- ⏳ 自定义域名
- ⏳ Firebase Analytics
- ⏳ Error Tracking

## 🎨 设计系统

### 颜色
- 主色调: Grayscale (黑白灰)
- 强调色: Violet/Purple
- 成功: Green
- 警告: Amber
- 错误: Red

### 视觉效果
- Liquid Glass (液态玻璃)
- Blurred Background Video
- Soft Shadows
- Smooth Transitions
- Hover Effects

### 字体
- Sans: 系统默认 (Inter/SF Pro)
- Serif: 用于强调和引用
- Mono: 用于代码和 API Keys

## 📝 使用指南

### 买家流程

1. **注册/登录**
   - Email/Password
   - Google 登录
   - 匿名登录 (临时体验)

2. **获取 API Key**
   - 进入 Dashboard
   - 点击 "API Keys" 标签
   - 点击 "Create new secret key"
   - 复制并保存 Key (仅显示一次)

3. **使用 API**
   ```javascript
   import OpenAI from 'openai';

   const client = new OpenAI({
     apiKey: 'bx_live_...',
     baseURL: 'https://api.bloomx.io/v1',
   });

   const response = await client.chat.completions.create({
     model: 'gpt-4o',
     messages: [{ role: 'user', content: 'Hello!' }]
   });
   ```

4. **充值 Credits**
   - 进入 "Billing" 标签
   - 选择充值金额
   - 通过 Stripe 支付 (计划中)

### 卖家流程

1. **提交申请**
   - 滚动到 "Join the Network" 部分
   - 填写申请表单
   - 提交申请

2. **等待审核**
   - 平台审核 KYC 和上游 Key
   - 48 小时内收到邮件通知

3. **上架供给** (计划中)
   - 配置模型和价格
   - 设置容量限制
   - 开始接收订单

## 🔧 开发指南

### 添加新组件

```bash
# 创建组件文件
touch src/components/NewComponent.tsx
```

```typescript
// src/components/NewComponent.tsx
import { useState } from 'react';

const NewComponent = () => {
  return (
    <div className="liquid-glass rounded-2xl p-6">
      {/* Your content */}
    </div>
  );
};

export default NewComponent;
```

### 添加新 Service

```bash
# 创建 service 文件
touch src/services/newService.ts
```

```typescript
// src/services/newService.ts
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function createSomething(data: any) {
  const colRef = collection(db, 'collection_name');
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}
```

### 更新 Firestore Rules

编辑 `firestore.rules` 后部署：

```bash
firebase deploy --only firestore:rules
```

### 更新 Firestore Indexes

编辑 `firestore.indexes.json` 后部署：

```bash
firebase deploy --only firestore:indexes
```

## 🐛 故障排除

### Firebase 初始化失败

检查 `.env` 文件是否正确配置，确保所有环境变量都已设置。

### API Key 创建失败

检查 Firestore Rules 是否允许用户创建 API Keys。

### 部署失败

确保已安装 Firebase CLI：

```bash
npm install -g firebase-tools
firebase login
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- Email: zqhablly@gmail.com
- Website: https://bloomx.io (计划中)

---

Built with ❤️ by BloomX Team
