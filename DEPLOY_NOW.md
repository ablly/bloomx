# 🚀 立即部署到 Cloudflare Pages

## ✅ 准备完成

- ✅ 项目已构建成功
- ✅ dist 目录已生成
- ✅ Cloudflare 配置文件已创建
- ✅ 所有功能已测试

---

## 🎯 现在就部署！（2 种方法）

### 方法 1：通过 GitHub（推荐，自动部署）⭐⭐⭐⭐⭐

#### 步骤 1：推送到 GitHub
```bash
git add .
git commit -m "Ready for Cloudflare Pages deployment"
git push
```

#### 步骤 2：连接 Cloudflare Pages
1. 访问：https://dash.cloudflare.com
2. 登录你的账号
3. 点击 **Workers & Pages**
4. 点击 **Create application**
5. 选择 **Pages** → **Connect to Git**
6. 选择 **GitHub** 并授权
7. 选择你的仓库

#### 步骤 3：配置构建
```
Project name: bloomx
Branch: main

Build settings:
  Framework: Vite
  Build command: npm run build
  Build output: dist
```

#### 步骤 4：添加环境变量
点击 **Environment variables** → **Add variable**

添加以下变量：
```
VITE_FIREBASE_API_KEY=AIzaSyDmotVREfchr8pOjB0d5qIU3U48pni_Jps
VITE_FIREBASE_AUTH_DOMAIN=bloomx-core-infra-26.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bloomx-core-infra-26
VITE_FIREBASE_STORAGE_BUCKET=bloomx-core-infra-26.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=762192455176
VITE_FIREBASE_APP_ID=1:762192455176:web:20da9da5a0f1729c41d3bd
```

#### 步骤 5：部署
点击 **Save and Deploy**

等待 2-3 分钟 → 完成！🎉

---

### 方法 2：使用 Wrangler CLI（快速）⭐⭐⭐⭐

#### 步骤 1：安装 Wrangler
```bash
npm install -g wrangler
```

#### 步骤 2：登录
```bash
wrangler login
```

#### 步骤 3：部署
```bash
npm run deploy:cloudflare
```

或者：
```bash
wrangler pages deploy dist --project-name=bloomx
```

完成！🎉

---

## 📋 部署后检查清单

访问你的网站并测试：

- [ ] 首页加载正常
- [ ] 语言切换（中英文）正常
- [ ] 所有动画效果正常
- [ ] 粒子和点阵背景显示
- [ ] 登录/注册功能正常
- [ ] API Key 创建功能正常
- [ ] Seller 申请表单正常
- [ ] 移动端显示正常

---

## 🌐 你的网站地址

部署完成后，你会得到：

**主域名：**
```
https://bloomx.pages.dev
```

**预览域名：**
每次部署都会生成唯一的预览 URL

---

## 🔄 后续更新

### 自动部署（推荐）
每次推送到 GitHub，自动重新部署：
```bash
git add .
git commit -m "Update feature"
git push
```

### 手动部署
```bash
npm run deploy:cloudflare
```

---

## 💡 提示

1. **第一次部署**：使用方法 1（GitHub），设置自动部署
2. **快速更新**：使用方法 2（Wrangler CLI）
3. **环境变量**：记得在 Cloudflare Dashboard 添加
4. **自定义域名**：部署后可在设置中添加

---

## 🎉 准备好了吗？

选择一个方法，现在就部署吧！

**推荐：方法 1（GitHub）** - 一次设置，永久自动部署

---

**需要帮助？** 查看 `CLOUDFLARE_DEPLOYMENT.md` 获取详细说明
