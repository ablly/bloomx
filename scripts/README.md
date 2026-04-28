# 🔥 Firebase Admin 操作脚本使用指南

## 📋 概述

由于 Firebase MCP 需要 CLI 认证，我们创建了直接使用 Firebase Admin SDK 的脚本来操作数据库。

## 🚀 快速开始

### Step 1: 获取 Service Account Key

1. 访问 Firebase Console:
   ```
   https://console.firebase.google.com/project/bloomx-core-infra-26/settings/serviceaccounts/adminsdk
   ```

2. 点击 **"Generate new private key"**

3. 下载 JSON 文件

4. 重命名为 `serviceAccountKey.json`

5. 放在项目根目录（与 package.json 同级）

6. **重要**: 添加到 `.gitignore`（已自动添加）

### Step 2: 安装依赖

```bash
npm install firebase-admin
```

### Step 3: 运行脚本

```bash
node scripts/firebase-admin-operations.js
```

## 📚 可用操作

### 用户操作

#### 创建用户
```javascript
import { createUser } from './scripts/firebase-admin-operations.js';

await createUser('user123', 'user@example.com', 'buyer');
```

#### 获取用户信息
```javascript
import { getUser } from './scripts/firebase-admin-operations.js';

await getUser('user123');
```

#### 更新 Credits
```javascript
import { updateUserCredits } from './scripts/firebase-admin-operations.js';

// 增加 100 credits
await updateUserCredits('user123', 100);

// 减少 50 credits
await updateUserCredits('user123', -50);
```

#### 列出所有用户
```javascript
import { listUsers } from './scripts/firebase-admin-operations.js';

await listUsers(10); // 列出前 10 个用户
```

### API Key 操作

#### 创建 API Key
```javascript
import { createApiKey } from './scripts/firebase-admin-operations.js';

await createApiKey('user123', 'bx_live_abc123', 'hash_value');
```

#### 列出用户的 API Keys
```javascript
import { listApiKeys } from './scripts/firebase-admin-operations.js';

await listApiKeys('user123');
```

### Seller Application 操作

#### 列出所有申请
```javascript
import { listSellerApplications } from './scripts/firebase-admin-operations.js';

// 列出所有申请
await listSellerApplications();

// 只列出待审核的
await listSellerApplications('pending');
```

#### 审核申请
```javascript
import { reviewSellerApplication } from './scripts/firebase-admin-operations.js';

// 通过申请
await reviewSellerApplication('app123', true, 'admin_uid');

// 拒绝申请
await reviewSellerApplication('app123', false, 'admin_uid');
```

### 统计操作

#### 获取数据库统计
```javascript
import { getStats } from './scripts/firebase-admin-operations.js';

await getStats();
```

## 🎯 常用场景

### 场景 1: 查看所有用户和申请

```bash
node scripts/firebase-admin-operations.js
```

这会自动显示：
- 数据库统计
- 前 5 个用户
- 所有 Seller 申请

### 场景 2: 给用户充值

创建文件 `scripts/add-credits.js`:

```javascript
import { updateUserCredits } from './firebase-admin-operations.js';

const uid = process.argv[2];
const amount = parseInt(process.argv[3]);

if (!uid || !amount) {
  console.log('用法: node scripts/add-credits.js <uid> <amount>');
  process.exit(1);
}

await updateUserCredits(uid, amount);
```

运行:
```bash
node scripts/add-credits.js user123 1000
```

### 场景 3: 批量审核申请

创建文件 `scripts/approve-sellers.js`:

```javascript
import { listSellerApplications, reviewSellerApplication } from './firebase-admin-operations.js';

const pending = await listSellerApplications('pending');

for (const app of pending) {
  console.log(`\n审核申请: ${app.name}`);
  // 这里可以添加自动审核逻辑
  // 或者手动确认
}
```

## 🔒 安全注意事项

### Service Account Key 安全

1. **永远不要提交到 Git**
   - 已添加到 `.gitignore`
   - 定期检查

2. **限制权限**
   - 只给必要的权限
   - 定期轮换 key

3. **环境隔离**
   - 开发环境使用单独的 key
   - 生产环境使用单独的 key

### 操作审计

所有操作都会记录到 Firestore，包括：
- 谁执行的操作
- 什么时间
- 操作了什么数据

## 🐛 故障排除

### 问题 1: "Cannot find module 'firebase-admin'"

**解决**:
```bash
npm install firebase-admin
```

### 问题 2: "serviceAccountKey.json not found"

**解决**:
1. 确认文件在项目根目录
2. 确认文件名正确
3. 确认文件是有效的 JSON

### 问题 3: "Permission denied"

**解决**:
1. 检查 Service Account 权限
2. 确认 Firestore 规则允许 Admin 访问
3. 重新生成 Service Account Key

## 📝 示例：完整的管理脚本

创建 `scripts/admin-cli.js`:

```javascript
import { program } from 'commander';
import * as ops from './firebase-admin-operations.js';

program
  .name('firebase-admin')
  .description('Firebase 数据库管理工具')
  .version('1.0.0');

program
  .command('users')
  .description('列出所有用户')
  .option('-l, --limit <number>', '限制数量', '10')
  .action(async (options) => {
    await ops.listUsers(parseInt(options.limit));
  });

program
  .command('credits <uid> <amount>')
  .description('更新用户 Credits')
  .action(async (uid, amount) => {
    await ops.updateUserCredits(uid, parseInt(amount));
  });

program
  .command('sellers')
  .description('列出 Seller 申请')
  .option('-s, --status <status>', '筛选状态')
  .action(async (options) => {
    await ops.listSellerApplications(options.status);
  });

program
  .command('approve <appId> <adminUid>')
  .description('通过 Seller 申请')
  .action(async (appId, adminUid) => {
    await ops.reviewSellerApplication(appId, true, adminUid);
  });

program
  .command('stats')
  .description('显示数据库统计')
  .action(async () => {
    await ops.getStats();
  });

program.parse();
```

安装 commander:
```bash
npm install commander
```

使用:
```bash
# 列出用户
node scripts/admin-cli.js users

# 充值
node scripts/admin-cli.js credits user123 1000

# 列出申请
node scripts/admin-cli.js sellers

# 通过申请
node scripts/admin-cli.js approve app123 admin_uid

# 统计
node scripts/admin-cli.js stats
```

## 🎉 总结

这个脚本提供了完整的 Firebase 数据库操作能力，不需要依赖 Firebase MCP 或 CLI 认证。

### 优势
- ✅ 不需要 CLI 认证
- ✅ 直接使用 Admin SDK
- ✅ 完全的数据库访问权限
- ✅ 可以编写自定义脚本
- ✅ 适合自动化任务

### 下一步
1. 获取 Service Account Key
2. 运行示例脚本
3. 根据需要编写自定义操作

