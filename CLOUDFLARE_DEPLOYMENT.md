# 🚀 Cloudflare Pages 部署指南

## 📋 准备工作

### 1. 确保项目已构建
```bash
npm run build
```

构建成功后，`dist` 目录会包含所有静态文件。

---

## 🌐 方法 1：通过 Cloudflare Dashboard（推荐，最简单）⭐

### 步骤：

#### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "Ready for Cloudflare Pages deployment"
git push
```

#### 2. 访问 Cloudflare Pages
- 打开 [dash.cloudflare.com](https://dash.cloudflare.com)
- 登录你的 Cloudflare 账号
- 点击左侧菜单 **Workers & Pages**
- 点击 **Create application**
- 选择 **Pages** 标签
- 点击 **Connect to Git**

#### 3. 连接 GitHub 仓库
- 选择 **GitHub**
- 授权 Cloudflare 访问你的 GitHub
- 选择你的 **BloomX** 仓库

#### 4. 配置构建设置
```
Project name: bloomx
Production branch: main (或 master)

Build settings:
  Framework preset: Vite
  Build command: npm run build
  Build output directory: dist
  Root directory: /

Environment variables:
  VITE_FIREBASE_API_KEY: AIzaSyDmotVREfchr8pOjB0d5qIU3U48pni_Jps
  VITE_FIREBASE_AUTH_DOMAIN: bloomx-core-infra-26.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID: bloomx-core-infra-26
  VITE_FIREBASE_STORAGE_BUCKET: bloomx-core-infra-26.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID: 762192455176
  VITE_FIREBASE_APP_ID: 1:762192455176:web:20da9da5a0f1729c41d3bd
```

#### 5. 部署
- 点击 **Save and Deploy**
- 等待 2-3 分钟
- 完成！🎉

#### 6. 获取 URL
部署完成后，你会得到一个 URL：
```
https://bloomx.pages.dev
```

---

## 🛠️ 方法 2：使用 Wrangler CLI

### 步骤：

#### 1. 安装 Wrangler
```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare
```bash
wrangler login
```
这会打开浏览器，登录你的 Cloudflare 账号。

#### 3. 构建项目
```bash
npm run build
```

#### 4. 部署
```bash
wrangler pages deploy dist --project-name=bloomx
```

或者使用快捷命令：
```bash
npm run deploy:cloudflare
```

#### 5. 完成
部署成功后，会显示你的网站 URL。

---

## 🔄 自动部署（推荐）

使用方法 1（GitHub 连接）后，每次你推送代码到 GitHub，Cloudflare Pages 会自动：
1. 检测到代码变更
2. 自动构建
3. 自动部署
4. 生成预览 URL（每个 PR 都有独立预览）

---

## 🌍 自定义域名

### 1. 在 Cloudflare Pages 添加域名
- 进入你的项目
- 点击 **Custom domains**
- 点击 **Set up a custom domain**
- 输入你的域名（如：bloomx.com）

### 2. 配置 DNS
Cloudflare 会自动配置 DNS（如果域名在 Cloudflare）。

如果域名不在 Cloudflare：
- 添加 CNAME 记录：
  ```
  CNAME  @  bloomx.pages.dev
  ```

---

## ⚙️ 环境变量配置

### 在 Cloudflare Dashboard 添加环境变量：

1. 进入项目设置
2. 点击 **Settings** → **Environment variables**
3. 添加以下变量：

```
VITE_FIREBASE_API_KEY=AIzaSyDmotVREfchr8pOjB0d5qIU3U48pni_Jps
VITE_FIREBASE_AUTH_DOMAIN=bloomx-core-infra-26.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bloomx-core-infra-26
VITE_FIREBASE_STORAGE_BUCKET=bloomx-core-infra-26.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=762192455176
VITE_FIREBASE_APP_ID=1:762192455176:web:20da9da5a0f1729c41d3bd
```

4. 点击 **Save**
5. 重新部署项目

---

## 📊 部署后检查清单

- [ ] 网站可以访问
- [ ] 所有页面正常加载
- [ ] 语言切换功能正常
- [ ] Firebase 认证正常工作
- [ ] API Key 创建功能正常
- [ ] Seller 申请表单正常
- [ ] 所有动画效果正常
- [ ] 移动端显示正常

---

## 🐛 常见问题

### 1. 构建失败
**原因：** 环境变量未设置
**解决：** 在 Cloudflare Pages 设置中添加所有 VITE_ 开头的环境变量

### 2. 页面刷新 404
**原因：** SPA 路由配置问题
**解决：** 已通过 `_redirects` 文件解决，确保该文件在 dist 目录

### 3. Firebase 连接失败
**原因：** 环境变量未正确配置
**解决：** 检查 Cloudflare Pages 的环境变量设置

### 4. 静态资源加载慢
**原因：** 缓存未配置
**解决：** 已通过 `_headers` 文件配置缓存

---

## 🎯 性能优化

Cloudflare Pages 自动提供：
- ✅ 全球 CDN（200+ 数据中心）
- ✅ 自动 HTTPS
- ✅ HTTP/3 支持
- ✅ Brotli 压缩
- ✅ 无限带宽
- ✅ DDoS 防护

---

## 📈 监控和分析

### 查看部署历史
- 进入项目
- 点击 **Deployments**
- 查看所有部署记录

### 查看访问统计
- 进入项目
- 点击 **Analytics**
- 查看访问量、带宽使用等

---

## 🔐 安全配置

已通过 `_headers` 文件配置：
- X-Frame-Options: DENY（防止点击劫持）
- X-Content-Type-Options: nosniff（防止 MIME 类型嗅探）
- Referrer-Policy（控制 Referer 信息）
- Permissions-Policy（限制浏览器功能）

---

## 📝 更新部署

### 自动更新（推荐）
推送代码到 GitHub，自动部署：
```bash
git add .
git commit -m "Update feature"
git push
```

### 手动更新
```bash
npm run build
wrangler pages deploy dist --project-name=bloomx
```

---

## 🎉 部署完成！

你的 BloomX 项目现在已经部署到 Cloudflare Pages！

**访问地址：** https://bloomx.pages.dev

**下一步：**
1. 测试所有功能
2. 配置自定义域名（可选）
3. 设置 Analytics（可选）
4. 开始开发 Credits 系统

---

**创建日期：** 2026-03-30
**部署平台：** Cloudflare Pages
**项目名称：** BloomX
