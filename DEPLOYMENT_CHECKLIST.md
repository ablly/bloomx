# BloomX 部署检查清单

## 📋 部署前检查

### 1. 环境配置

- [ ] `.env` 文件已创建并配置
- [ ] 所有 Firebase 环境变量已设置
- [ ] `.env` 已添加到 `.gitignore`
- [ ] `.env.example` 已更新

### 2. Firebase 配置

- [ ] Firebase 项目已创建
- [ ] Firebase Auth 已启用
  - [ ] Email/Password 认证
  - [ ] Google 认证
  - [ ] Anonymous 认证
- [ ] Firestore 数据库已创建
- [ ] Firestore Rules 已部署
- [ ] Firestore Indexes 已配置

### 3. 代码质量

- [ ] 所有 TypeScript 错误已修复
- [ ] 所有 ESLint 警告已处理
- [ ] 代码已格式化
- [ ] 无 console.log 残留（生产环境）
- [ ] 无硬编码的敏感信息

### 4. 功能测试

- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] Google 登录功能正常
- [ ] API Key 创建功能正常
- [ ] API Key 删除功能正常
- [ ] Seller Application 提交功能正常
- [ ] Dashboard 数据显示正常
- [ ] Credits 余额显示正常

### 5. UI/UX 测试

- [ ] 桌面端显示正常
- [ ] 移动端显示正常
- [ ] 平板端显示正常
- [ ] 所有动画流畅
- [ ] 所有链接可点击
- [ ] 所有表单验证正常
- [ ] Loading 状态显示正常
- [ ] Error 状态显示正常

### 6. 性能优化

- [ ] 图片已优化
- [ ] 视频已压缩
- [ ] 代码已分割
- [ ] 懒加载已实现
- [ ] Bundle 大小合理

### 7. SEO 优化

- [ ] Meta 标签已设置
- [ ] Open Graph 标签已设置
- [ ] Twitter Card 标签已设置
- [ ] Sitemap 已生成
- [ ] Robots.txt 已配置

### 8. 安全检查

- [ ] API Keys 不在客户端暴露
- [ ] Firestore Rules 已测试
- [ ] CORS 配置正确
- [ ] HTTPS 已启用
- [ ] 敏感数据已加密

## 🚀 部署步骤

### Step 1: 构建项目

```bash
npm run build
```

检查构建输出：
- [ ] 构建成功无错误
- [ ] dist 目录已生成
- [ ] 文件大小合理

### Step 2: 测试构建

```bash
npm run preview
```

- [ ] 本地预览正常
- [ ] 所有功能可用
- [ ] 无控制台错误

### Step 3: 部署 Firestore Rules

```bash
npm run deploy:rules
```

- [ ] Rules 部署成功
- [ ] Rules 测试通过

### Step 4: 部署 Firestore Indexes

```bash
npm run deploy:indexes
```

- [ ] Indexes 部署成功
- [ ] 查询性能正常

### Step 5: 部署到 Firebase Hosting

```bash
npm run deploy:hosting
```

- [ ] Hosting 部署成功
- [ ] 获得部署 URL

### Step 6: 验证部署

访问部署 URL 并检查：
- [ ] 网站可访问
- [ ] 所有页面加载正常
- [ ] 认证功能正常
- [ ] API 调用正常
- [ ] 数据库读写正常

## 🔍 部署后检查

### 1. 功能验证

- [ ] 注册新用户
- [ ] 登录测试
- [ ] 创建 API Key
- [ ] 提交 Seller Application
- [ ] 查看 Dashboard
- [ ] 退出登录

### 2. 性能监控

- [ ] 页面加载时间 < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Lighthouse Score > 90

### 3. 错误监控

- [ ] Firebase Console 无错误
- [ ] Browser Console 无错误
- [ ] Network 请求正常
- [ ] 404 页面正常

### 4. 分析设置

- [ ] Firebase Analytics 已启用
- [ ] 事件追踪正常
- [ ] 用户行为可追踪

## 📊 监控指标

### 关键指标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 页面加载时间 | < 3s | - | ⏳ |
| API 响应时间 | < 500ms | - | ⏳ |
| 错误率 | < 1% | - | ⏳ |
| 可用性 | > 99.9% | - | ⏳ |

### 用户指标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 注册转化率 | > 10% | - | ⏳ |
| API Key 创建率 | > 80% | - | ⏳ |
| 日活用户 | - | - | ⏳ |
| 月活用户 | - | - | ⏳ |

## 🐛 常见问题

### 问题 1: Firebase 初始化失败

**症状**: 页面白屏，控制台显示 Firebase 错误

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 检查环境变量是否正确
3. 检查 Firebase 项目是否已创建
4. 重新构建项目

### 问题 2: Firestore 权限错误

**症状**: 数据读写失败，显示 permission-denied

**解决方案**:
1. 检查 Firestore Rules 是否已部署
2. 检查用户是否已登录
3. 检查 Rules 逻辑是否正确
4. 使用 Firebase Console 测试 Rules

### 问题 3: 部署后 404 错误

**症状**: 刷新页面显示 404

**解决方案**:
1. 检查 `firebase.json` 的 rewrites 配置
2. 确保 SPA 路由配置正确
3. 重新部署 Hosting

### 问题 4: 环境变量未生效

**症状**: 构建后环境变量为 undefined

**解决方案**:
1. 确保环境变量以 `VITE_` 开头
2. 重启开发服务器
3. 重新构建项目
4. 检查 `import.meta.env` 使用是否正确

## 📝 部署记录

### 部署历史

| 日期 | 版本 | 部署者 | 状态 | 备注 |
|------|------|--------|------|------|
| 2026-03-29 | v0.3.0 | - | ⏳ | 真实数据接入 |
| 2026-03-28 | v0.2.0 | - | ✅ | Firebase 后端接入 |
| 2026-03-27 | v0.1.0 | - | ✅ | 前端 MVP |

## 🔄 回滚计划

如果部署出现问题，按以下步骤回滚：

### 1. 回滚 Hosting

```bash
firebase hosting:rollback
```

### 2. 回滚 Firestore Rules

```bash
# 恢复之前的 rules 文件
git checkout HEAD~1 firestore.rules
npm run deploy:rules
```

### 3. 回滚代码

```bash
git revert HEAD
git push
npm run deploy
```

## 📞 紧急联系

### 技术支持
- Email: zqhablly@gmail.com
- Discord: [BloomX Community]
- GitHub Issues: [bloomx/issues]

### Firebase 支持
- Firebase Console: https://console.firebase.google.com
- Firebase Support: https://firebase.google.com/support

## ✅ 最终确认

部署前最后检查：

- [ ] 所有测试通过
- [ ] 所有检查项完成
- [ ] 团队成员已通知
- [ ] 备份已创建
- [ ] 回滚计划已准备
- [ ] 监控已设置
- [ ] 文档已更新

**部署负责人签名**: _______________

**部署日期**: _______________

**部署时间**: _______________

---

**祝部署顺利！🚀**
