# BloomX - AI 基础设施交易平台

> 让闲置 AI 供给流动起来

[English](./README.md) | 简体中文

## 📖 项目简介

BloomX 是一个 AI 基础设施交易平台，连接 AI API 供给方和需求方，提供：

- 🔄 **统一 API 接入** - OpenAI 兼容的 API 格式
- 🎯 **智能路由** - 自动选择最优 Provider
- 💰 **Credits 结算** - 统一的平台积分系统
- ✅ **实名卖家** - 经过验证的供给池
- 🌍 **全球服务** - 支持中英文

## ✨ 核心特性

### 对买家
- ✅ 更低的试错成本
- ✅ 多模型统一入口
- ✅ 平台 Credits 统一结算
- ✅ 中英文产品与文档
- ✅ 7x24 技术支持

### 对卖家
- ✅ 闲置能力变现
- ✅ 无需自建平台
- ✅ 统一结算和提现
- ✅ 风控和客服支持
- ✅ 邀请制上架

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 Firebase 配置
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

### 5. 部署到 Firebase

```bash
npm run deploy
```

## 📊 项目状态

### ✅ 已完成功能

#### Phase 1: 前端 MVP (100%)
- ✅ Landing Page (Hero + Features + How It Works + Model Catalog + Pricing + Testimonials)
- ✅ Dashboard UI (Overview + API Keys + Usage + Billing + Settings)
- ✅ 响应式设计
- ✅ 液态玻璃视觉效果
- ✅ 背景视频循环

#### Phase 2: Firebase 后端接入 (100%)
- ✅ Firebase Auth (Email/Password + Google + Anonymous)
- ✅ Firestore 数据库
- ✅ Security Rules
- ✅ 环境变量安全化

#### Phase 3: 真实数据接入 (80%)
- ✅ Dashboard API Keys Tab - 真实数据
  - ✅ 列表显示
  - ✅ 创建新 Key
  - ✅ 显示完整 Key (仅一次)
  - ✅ 复制 Key
  - ✅ 删除 Key
- ✅ Dashboard Overview/Billing/Settings - 真实数据
- ✅ SellerApplyForm - 写入 Firestore

### ⏳ 待完成功能

#### Phase 4: Credits 系统 (P0)
- ⏳ Stripe 支付集成
- ⏳ Credits 充值功能
- ⏳ Credits 扣费逻辑
- ⏳ Transaction 记录
- ⏳ Auto-recharge 功能

#### Phase 5: API Gateway (P0)
- ⏳ 统一 API 接口
- ⏳ 路由引擎
- ⏳ 多 Provider 支持
- ⏳ Usage 统计

#### Phase 6: 管理功能 (P1)
- ⏳ Admin Console
- ⏳ Seller Dashboard
- ⏳ 审核流程
- ⏳ 供给管理

## 🏗️ 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide Icons

### 后端
- **认证**: Firebase Auth
- **数据库**: Firestore
- **托管**: Firebase Hosting
- **函数**: Cloud Functions (计划中)

### 支付
- **支付网关**: Stripe Connect (计划中)

## 📁 项目结构

```
bloomx/
├── src/
│   ├── components/          # React 组件
│   │   ├── Dashboard.tsx    # 用户仪表板 ✅
│   │   ├── SellerApplyForm.tsx  # 卖家申请表单 ✅
│   │   ├── HeroLanding.tsx  # 首页 Hero
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx  # 认证上下文 ✅
│   ├── services/
│   │   ├── apiKeyService.ts # API Key 管理 ✅
│   │   └── sellerApplicationService.ts # 卖家申请管理 ✅
│   ├── lib/
│   │   └── firebase.ts      # Firebase 配置 ✅
│   └── App.tsx              # 主应用
├── .env                     # 环境变量 (不提交到 Git)
├── .env.example             # 环境变量示例
├── firebase.json            # Firebase 配置
├── firestore.rules          # Firestore 安全规则
└── package.json             # 依赖配置
```

## 🎯 使用指南

### 买家流程

1. **注册/登录**
   - 访问首页
   - 点击 "Start with BloomX API"
   - 使用 Email/Password 或 Google 登录

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

## 📚 文档

- [快速开始](./QUICK_START.md) - 5 分钟快速启动指南
- [API 文档](./API_DOCS.md) - API 使用文档
- [实施计划](./IMPLEMENTATION_PLAN.md) - 开发计划
- [更新日志](./CHANGELOG.md) - 版本更新记录
- [TODO 列表](./TODO.md) - 待完成任务
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 部署前检查
- [项目总结](./PROJECT_SUMMARY.md) - 项目完成状态

## 🔐 安全措施

### 已实现
- ✅ 环境变量隔离
- ✅ Firestore Security Rules
- ✅ API Key 哈希存储 (SHA-256)
- ✅ 用户数据隔离
- ✅ 权限控制

### 计划中
- ⏳ Rate Limiting
- ⏳ API Key 过期机制
- ⏳ 2FA 认证
- ⏳ IP 白名单

## 🎨 设计系统

### 颜色方案
- **主色调**: Grayscale (黑白灰)
- **强调色**: Violet/Purple (#8b5cf6)
- **成功**: Green (#22c55e)
- **警告**: Amber (#f59e0b)
- **错误**: Red (#ef4444)

### 视觉效果
- **Liquid Glass**: 液态玻璃效果
- **Backdrop Blur**: 背景模糊
- **Smooth Transitions**: 平滑过渡
- **Hover Effects**: 悬停效果

## 📊 数据模型

### Users Collection
```typescript
{
  uid: string;
  email: string | null;
  role: 'buyer' | 'seller' | 'admin';
  credits_balance: number;
  createdAt: Timestamp;
}
```

### API Keys Subcollection
```typescript
{
  id: string;
  key_prefix: string;
  key_hash: string;
  uid: string;
  is_active: boolean;
  last_used: Timestamp | null;
  createdAt: Timestamp;
}
```

### Seller Applications Collection
```typescript
{
  id: string;
  uid: string;
  name: string;
  email: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mixed';
  capacity: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}
```

## 🛠️ 开发指南

### 添加新组件

```bash
# 创建组件文件
touch src/components/NewComponent.tsx
```

```typescript
// src/components/NewComponent.tsx
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

## 📈 性能指标

### 构建性能
- ✅ 构建时间: < 1s
- ✅ Bundle 大小: 182 KB (gzipped)
- ⚠️ 建议优化: 代码分割

### 运行时性能
- ✅ 首屏加载: 快速
- ✅ 路由切换: 流畅
- ✅ 动画性能: 60fps

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写清晰的注释

## 📄 许可证

MIT License

## 📞 联系方式

- **Email**: zqhablly@gmail.com
- **Website**: https://bloomx.io (计划中)
- **Discord**: [BloomX Community]
- **GitHub**: [@bloomx]

## 🙏 致谢

感谢所有贡献者和支持者！

特别感谢：
- React 团队
- Firebase 团队
- Tailwind CSS 团队
- Vite 团队

## 🎯 路线图

### v0.4.0 - Credits 系统 (2 周)
- [ ] Stripe 集成
- [ ] Credits 充值
- [ ] Credits 扣费
- [ ] Transaction 记录

### v0.5.0 - API Gateway (3 周)
- [ ] 统一 API 接口
- [ ] 路由引擎
- [ ] 多 Provider 支持
- [ ] Usage 统计

### v0.6.0 - 管理功能 (2 周)
- [ ] Admin Console
- [ ] Seller Dashboard
- [ ] 审核流程
- [ ] 供给管理

### v1.0.0 - 生产环境就绪 (2 个月)
- [ ] 所有核心功能完成
- [ ] 测试覆盖率 > 80%
- [ ] 性能优化完成
- [ ] 文档完善
- [ ] 正式上线

## 📊 项目统计

- **总代码行数**: ~3500+
- **组件数**: 12
- **Services**: 2
- **文档页数**: 8
- **功能完成度**: 75%

---

**Built with ❤️ by BloomX Team**

**最后更新**: 2026-03-29
**当前版本**: v0.3.0
