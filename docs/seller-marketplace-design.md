# BloomX 卖家 API 市场平台 - 设计文档

**版本**: v1.0  
**日期**: 2026-03-31  
**作者**: Product Manager  
**状态**: ✅ 已审批

---

## 1. 项目概述

### 1.1 目标

构建一个连接 AI API 供给方（卖家）和需求方（买家）的市场平台，卖家可以自主上传并售卖自己的 API，平台提供统一的路由、计费和结算服务。

### 1.2 核心价值

- **对卖家**: 将闲置 API 能力转化为收益，无需自行搭建销售系统
- **对买家**: 统一入口访问多个卖家 API，使用平台 Credits 统一结算
- **对平台**: 通过抽成（10%）和交易服务获取收入

---

## 2. 设计决策汇总

| 类别 | 选择 |
|------|------|
| 收费模式 | 卖家自主定价 + 平台抽成 10% |
| API 托管方式 | 代理模式（卖家提供自己的 API URL） |
| 审核流程 | 分级审核（新卖家需 KYC+资产审核，优质卖家可免审） |
| 结算周期 | 月结，最小提现金额 $50 |
| 提现方式 | 仅银行卡（Stripe Connect） |
| 买家访问方式 | 统一平台 API Key，自动路由到对应卖家 API |
| 价格显示 | 价格区间（如 "$2.50 - $10.00 / 1K tokens"） |
| 推荐系统 | 智能推荐（基于使用历史 + 热门） |
| 卖家信息显示 | 完整资料（名称、评分、销量、注册时间） |
| 认证方式支持 | 全部支持（Bearer / API Key / Basic Auth） |

---

## 3. 数据模型设计

### 3.1 Firestore Collections

```typescript
// 3.1.1 卖家产品 (sellers/{sellerId}/products/{productId})
interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: 'bearer' | 'api_key' | 'basic';
  auth_value_encrypted: string;
  models: string[];
  pricing: {
    input_per_1k: number;
    output_per_1k: number;
  };
  status: 'active' | 'inactive' | 'pending_review' | 'rejected';
  rating: number;
  total_sales: number;
  review_count: number;
  is_verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 3.1.2 卖家收入 (sellers/{sellerId}/earnings/{earningId})
interface Earning {
  id: string;
  seller_id: string;
  product_id: string;
  buyer_id: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  gross_amount: number;
  platform_fee: number;
  seller_earnings: number;
  status: 'pending' | 'available' | 'withdrawn';
  createdAt: Timestamp;
}

// 3.1.3 提现记录 (sellers/{sellerId}/withdrawals/{withdrawalId})
interface Withdrawal {
  id: string;
  seller_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bank_account_last4: string;
  bank_name: string;
  transaction_id: string;
  failure_reason: string;
  processedAt: Timestamp;
  createdAt: Timestamp;
}

// 3.1.4 买家购买记录 (users/{uid}/purchases/{purchaseId})
interface Purchase {
  id: string;
  uid: string;
  product_id: string;
  seller_id: string;
  product_name: string;
  product_url: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// 3.1.5 产品评价 (products/{productId}/reviews/{reviewId})
interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  buyer_email: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

// 3.1.6 卖家信息 (sellers/{sellerId})
interface Seller {
  id: string;
  uid: string;
  name: string;
  description: string;
  logo_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  asset_verified: boolean;
  total_products: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  bank_account: {
    last4: string;
    bank_name: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 4. 页面/路由设计

| 页面 | 路由 | 描述 |
|------|------|------|
| SellerDashboard | `/seller` | 卖家中心首页 |
| SellerProducts | `/seller/products` | 产品列表管理 |
| SellerProductForm | `/seller/products/new` | 新增产品 |
| SellerProductEdit | `/seller/products/:id/edit` | 编辑产品 |
| SellerEarnings | `/seller/earnings` | 收入明细 |
| SellerWithdraw | `/seller/withdraw` | 提现申请 |
| SellerSettings | `/seller/settings` | 卖家设置 |
| Marketplace | `/marketplace` | 产品浏览列表 |
| ProductDetail | `/marketplace/:id` | 产品详情 |
| AdminApplications | `/admin/seller-applications` | 卖家申请审核 |
| AdminProducts | `/admin/products` | 产品审核 |
| AdminWithdrawals | `/admin/withdrawals` | 提现审核 |

---

## 5. 核心业务流程

### 5.1 卖家入驻流程

```
1. 用户注册/登录
2. 进入 Dashboard → 点击"成为卖家"
3. 填写卖家申请表单
4. 提交 KYC 审核 + 资产审核
5. Admin 审核（批准/拒绝）
6. 审核通过 → 进入 Seller Dashboard
```

### 5.2 产品上架流程

```
1. 进入 Seller Dashboard → 产品管理
2. 点击"新增产品"
3. 填写产品信息（URL、认证、模型、定价）
4. 提交产品审核
5. 产品上线 → 开始接收订单
```

### 5.3 买家购买流程

```
1. 浏览 Marketplace
2. 查看产品详情
3. 点击"购买"
4. 确认购买（检查 Credits 余额）
5. 购买成功 → 获得访问权限
6. 使用 API → 平台统一扣费 → 卖家获得 90% 收入
```

### 5.4 提现流程

```
1. 每月1日结算周期开始
2. 计算上月可提现余额
3. 卖家申请提现（最低$50）
4. Admin 审核
5. 通过 → Stripe 处理转账
6. 完成 → 记录提现历史
```

---

## 6. API Gateway 设计

### 6.1 统一请求流程

```
买家请求 (平台 API Key)
    ↓
验证 API Key + 检查 Credits
    ↓
路由到对应卖家 API
    ↓
调用卖家 API 并返回响应
    ↓
计算费用 → 扣除 Credits → 记录交易
```

### 6.2 计费逻辑

```typescript
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

function distributeEarnings(grossAmount: number) {
  return {
    platformFee: grossAmount * 0.10,
    sellerEarnings: grossAmount * 0.90
  };
}
```

---

## 7. 安全设计

### 7.1 凭证加密

- 卖家上传的 API 凭证使用 AES-256 加密存储
- 仅在调用卖家 API 时解密（Cloud Function）
- 不在任何前端响应中返回原始凭证

### 7.2 Firestore Security Rules

```javascript
match /sellers/{sellerId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == sellerId;
}

match /sellers/{sellerId}/products/{productId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == sellerId;
  allow update: if request.auth != null && request.auth.uid == sellerId;
  allow delete: if request.auth != null && request.auth.uid == sellerId;
}

match /users/{userId}/purchases/{purchaseId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false;
}
```

---

## 8. 实施计划

### Phase 1: 数据模型 + Seller Dashboard（产品管理）
- T1.1: 创建 Firestore 数据模型
- T1.2: 创建 Seller Service
- T1.3: 开发 Seller Dashboard 首页
- T1.4: 开发产品列表页
- T1.5: 开发产品上传表单
- T1.6: 开发产品编辑/删除功能

### Phase 2: Marketplace（产品列表 + 详情）
- T2.1: 开发 Marketplace 首页
- T2.2: 开发产品筛选和搜索
- T2.3: 开发产品详情页
- T2.4: 开发卖家信息展示

### Phase 3: 购买流程 + 访问权限管理
- T3.1: 开发购买确认流程
- T3.2: 创建购买记录
- T3.3: 实现访问权限验证
- T3.4: 开发购买记录页面

### Phase 4: Admin Console（审核功能）
- T4.1: 开发卖家申请审核页
- T4.2: 开发产品审核页
- T4.3: 开发提现审核页
- T4.4: 实现审核操作逻辑

### Phase 5: API Gateway（路由 + 计费）
- T5.1: 实现统一 API 端点
- T5.2: 实现 API Key 验证
- T5.3: 实现智能路由
- T5.4: 实现计费和扣费
- T5.5: 实现收入记录

---

## 9. 验收标准

### 9.1 功能验收

- [ ] 卖家可以成功提交申请并通过审核
- [ ] 卖家可以上传、编辑、删除产品
- [ ] 产品可以在 Marketplace 中展示
- [ ] 买家可以浏览、筛选、购买产品
- [ ] 购买后获得访问权限
- [ ] Admin 可以审核卖家申请和产品
- [ ] 卖家可以查看收入和申请提现

### 9.2 技术验收

- [ ] 所有 API 凭证加密存储
- [ ] Firestore Security Rules 正确配置
- [ ] API Gateway 正确路由和计费
- [ ] 平台抽成正确计算（10%）
- [ ] 提现流程正常工作

---

## 10. 风险与缓解

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 凭证泄露 | 高 | AES-256 加密，仅服务端解密 |
| 支付安全 | 高 | 使用 Stripe Connect |
| 恶意卖家 | 中 | KYC + 资产审核 + 分级管理 |
| 资金安全 | 高 | 月结 + 风险金 + 人工审核 |

---

**文档状态**: ✅ 已审批  
**审批日期**: 2026-03-31