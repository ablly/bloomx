# BloomX 生产环境实施计划

## 📊 当前状态分析

### ✅ 已完成
- Phase 1: 前端 MVP（Landing Page + Dashboard UI）
- Phase 2: Firebase 后端接入（Auth + Firestore + Security Rules）
- 基础认证流程（Email/Password + Google + Anonymous）
- Firestore 数据结构设计
- API Key Service 基础架构
- 安全规则配置

### 🔴 待完成（生产环境标准）

#### P0 - 核心功能（必须立即完成）
1. **Dashboard 接入真实 Firebase 数据**
   - 替换硬编码的假数据
   - 实现真实的 API Key CRUD
   - 实现真实的 Credits 余额显示
   - 实现真实的 Usage 统计

2. **SellerApplyForm 写入 Firestore**
   - 替换 setTimeout 模拟
   - 实现真实的 Firestore 写入
   - 添加表单验证和错误处理

3. **环境变量安全化**
   - 将 Firebase API Key 移到 .env
   - 配置 Vite 环境变量
   - 更新 .gitignore

#### P1 - 数据模型完善（生产环境标准）
4. **完整的 Firestore 数据模型**
   - Users Collection 扩展
   - API Keys Subcollection 完善
   - Transactions Collection 实现
   - Seller Applications Collection 实现
   - Usage Logs Collection 实现

5. **Credits 系统实现**
   - Credits 充值功能
   - Credits 扣费逻辑
   - Transaction 记录
   - Auto-recharge 功能

#### P2 - 业务逻辑完善
6. **API Key 管理完整功能**
   - 创建新 Key
   - 显示完整 Key（仅一次）
   - 复制 Key
   - 禁用/启用 Key
   - 删除 Key
   - Last Used 更新

7. **Usage 统计实现**
   - 按模型统计
   - 按时间统计
   - 实时日志
   - 导出功能

8. **Seller Application 工作流**
   - 表单提交
   - 状态跟踪
   - 管理员审核界面（后期）

#### P3 - UI/UX 优化
9. **排版动画精修**
   - Typography 优化
   - Animations 优化
   - Transitions 优化
   - Loading States
   - Error States

10. **响应式设计完善**
    - 移动端适配
    - 平板端适配
    - 触摸交互优化

#### P4 - 部署与监控
11. **Firebase Hosting 部署**
    - 配置部署脚本
    - 设置自定义域名
    - SSL 证书配置

12. **监控与分析**
    - Firebase Analytics
    - Error Tracking
    - Performance Monitoring

## 🎯 实施顺序

### Sprint 1: 核心数据接入（P0）
**目标**: 让 Dashboard 和 SellerForm 使用真实数据

1. 环境变量配置
2. Dashboard - API Keys Tab 真实数据
3. Dashboard - Overview Tab 真实数据
4. Dashboard - Billing Tab 真实数据
5. SellerApplyForm 真实提交

### Sprint 2: 数据模型完善（P1）
**目标**: 完整的生产环境数据结构

1. Firestore Collections 完整实现
2. Security Rules 完善
3. Indexes 配置
4. Credits 系统实现

### Sprint 3: 业务逻辑（P2）
**目标**: 完整的业务流程

1. API Key 完整生命周期
2. Usage 统计与日志
3. Transaction 记录
4. Seller Application 工作流

### Sprint 4: 优化与部署（P3 + P4）
**目标**: 生产环境就绪

1. UI/UX 精修
2. 性能优化
3. 部署配置
4. 监控设置

## 📋 详细任务清单

### Task 1: 环境变量安全化
- [ ] 创建 .env 文件
- [ ] 创建 .env.example 文件
- [ ] 更新 firebase.ts 使用环境变量
- [ ] 更新 .gitignore
- [ ] 配置 Vite 环境变量

### Task 2: Dashboard API Keys Tab - 真实数据
- [ ] 使用 useAuth 获取当前用户
- [ ] 使用 apiKeyService.listApiKeys 获取 keys
- [ ] 实现 Create New Key 功能
- [ ] 实现 Copy Key 功能
- [ ] 实现 Delete Key 功能
- [ ] 显示真实的 Created 和 Last Used 时间

### Task 3: Dashboard Overview Tab - 真实数据
- [ ] 从 Firestore 获取 Usage 统计
- [ ] 计算真实的 Total Requests
- [ ] 计算真实的 Avg Latency
- [ ] 计算真实的 Error Rate

### Task 4: Dashboard Billing Tab - 真实数据
- [ ] 显示真实的 Credits Balance
- [ ] 实现 Add Funds 功能（Stripe 集成或模拟）
- [ ] 显示真实的 Transaction History
- [ ] 实现 Auto-recharge 设置

### Task 5: SellerApplyForm - Firestore 集成
- [ ] 创建 sellerApplicationService
- [ ] 实现表单提交到 Firestore
- [ ] 添加服务端验证
- [ ] 实现状态跟踪
- [ ] 添加错误处理

### Task 6: Firestore Collections 完善
- [ ] Users Collection Schema
- [ ] API Keys Subcollection Schema
- [ ] Transactions Subcollection Schema
- [ ] Seller Applications Collection Schema
- [ ] Usage Logs Collection Schema

### Task 7: Security Rules 完善
- [ ] Users 读写规则
- [ ] API Keys 读写规则
- [ ] Transactions 读写规则
- [ ] Seller Applications 读写规则
- [ ] Usage Logs 读写规则

### Task 8: Credits 系统实现
- [ ] Credits 充值 Cloud Function
- [ ] Credits 扣费 Cloud Function
- [ ] Transaction 记录 Cloud Function
- [ ] Auto-recharge Cloud Function

### Task 9: Usage 统计实现
- [ ] Usage Logs 写入
- [ ] 按模型聚合
- [ ] 按时间聚合
- [ ] 实时查询优化

### Task 10: UI/UX 优化
- [ ] Typography 精修
- [ ] Animations 精修
- [ ] Loading States
- [ ] Error States
- [ ] Empty States

### Task 11: 部署配置
- [ ] Firebase Hosting 配置
- [ ] 构建脚本优化
- [ ] 环境变量配置
- [ ] 域名配置

### Task 12: 监控设置
- [ ] Firebase Analytics
- [ ] Error Tracking
- [ ] Performance Monitoring
- [ ] User Behavior Tracking

## 🔧 技术栈确认

### 前端
- ✅ React 19 + TypeScript
- ✅ Vite
- ✅ Tailwind CSS
- ✅ Framer Motion
- ✅ Lucide Icons

### 后端
- ✅ Firebase Auth
- ✅ Firestore
- ⏳ Cloud Functions (待实现)
- ⏳ Firebase Hosting (待部署)

### 支付
- ⏳ Stripe (待集成)

### 监控
- ⏳ Firebase Analytics (待配置)
- ⏳ Sentry (可选)

## 📝 数据模型设计

### Users Collection
```typescript
{
  uid: string;
  email: string | null;
  role: 'buyer' | 'seller' | 'admin';
  credits_balance: number;
  auto_recharge: {
    enabled: boolean;
    threshold: number;
    amount: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### API Keys Subcollection (users/{uid}/api_keys/{keyId})
```typescript
{
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  uid: string;
  is_active: boolean;
  last_used: Timestamp | null;
  usage_count: number;
  createdAt: Timestamp;
}
```

### Transactions Subcollection (users/{uid}/transactions/{txId})
```typescript
{
  id: string;
  uid: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  balance_after: number;
  description: string;
  metadata: {
    model?: string;
    tokens?: number;
    api_key_id?: string;
  };
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
  reviewed_by: string | null;
  reviewed_at: Timestamp | null;
  createdAt: Timestamp;
}
```

### Usage Logs Collection
```typescript
{
  id: string;
  uid: string;
  api_key_id: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost: number;
  status: 'success' | 'error';
  error_message?: string;
  createdAt: Timestamp;
}
```

## 🚀 开始实施

准备好了吗？我将按照以下顺序开始实施：

1. **环境变量安全化** (5 分钟)
2. **Dashboard API Keys Tab 真实数据** (20 分钟)
3. **Dashboard Overview/Billing Tab 真实数据** (15 分钟)
4. **SellerApplyForm Firestore 集成** (10 分钟)
5. **UI/UX 优化** (15 分钟)
6. **部署准备** (10 分钟)

总计约 75 分钟完成核心功能。

---

**下一步**: 开始 Task 1 - 环境变量安全化
