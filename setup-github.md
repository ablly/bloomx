# 🚀 GitHub 仓库创建和上传指南

## 📋 前提条件

- ✅ 已安装 Git
- ✅ 已有 GitHub 账号
- ✅ 项目已构建成功

---

## 🎯 方法 1：通过 GitHub 网页创建（推荐）⭐⭐⭐⭐⭐

### 步骤 1：在 GitHub 创建新仓库

1. 访问：https://github.com/new
2. 填写仓库信息：
   - Repository name: `bloomx` 或你喜欢的名字
   - Description: `BloomX - AI Model Marketplace Platform`
   - 选择 **Public** 或 **Private**
   - ❌ 不要勾选 "Add a README file"
   - ❌ 不要勾选 "Add .gitignore"
   - ❌ 不要勾选 "Choose a license"
3. 点击 **Create repository**

### 步骤 2：在本地初始化并推送

复制以下命令到终端执行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建第一次提交
git commit -m "Initial commit: BloomX AI Marketplace Platform"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/bloomx.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

**重要：** 记得替换 `YOUR_USERNAME` 为你的实际 GitHub 用户名！

---

## 🎯 方法 2：使用 GitHub CLI（快速）⭐⭐⭐⭐

### 步骤 1：安装 GitHub CLI

访问：https://cli.github.com/

或使用包管理器：
```bash
# Windows (使用 winget)
winget install --id GitHub.cli

# 或使用 Scoop
scoop install gh
```

### 步骤 2：登录 GitHub

```bash
gh auth login
```

按提示选择：
- GitHub.com
- HTTPS
- Yes (authenticate Git)
- Login with a web browser

### 步骤 3：创建仓库并推送

```bash
# 初始化 Git
git init
git add .
git commit -m "Initial commit: BloomX AI Marketplace Platform"

# 创建 GitHub 仓库并推送（一条命令完成！）
gh repo create bloomx --public --source=. --remote=origin --push
```

或者创建私有仓库：
```bash
gh repo create bloomx --private --source=. --remote=origin --push
```

完成！🎉

---

## 📝 提交后的步骤

### 1. 验证推送成功

访问你的仓库：
```
https://github.com/YOUR_USERNAME/bloomx
```

### 2. 添加仓库描述和主题

在 GitHub 仓库页面：
- 点击 ⚙️ 设置图标
- 添加描述：`AI Model Marketplace - Connect buyers and sellers of AI model APIs`
- 添加主题标签：`ai`, `marketplace`, `react`, `typescript`, `firebase`, `vite`

### 3. 设置仓库主页

在仓库设置中：
- Settings → Pages
- Source: Deploy from a branch
- Branch: main / (root)
- 或者等待 Cloudflare Pages 部署后使用自定义域名

---

## 🔄 后续更新代码

每次修改代码后：

```bash
# 查看修改
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "描述你的修改"

# 推送到 GitHub
git push
```

---

## 🌐 连接 Cloudflare Pages

推送到 GitHub 后，按照 `DEPLOY_NOW.md` 的步骤：

1. 访问：https://dash.cloudflare.com
2. Workers & Pages → Create application
3. Pages → Connect to Git
4. 选择你的 GitHub 仓库
5. 配置构建设置
6. 添加环境变量
7. 部署！

---

## 💡 常见问题

### Q: 推送时要求输入用户名和密码？

A: GitHub 已不支持密码认证，需要使用 Personal Access Token：

1. 访问：https://github.com/settings/tokens
2. Generate new token (classic)
3. 勾选 `repo` 权限
4. 生成并复制 token
5. 推送时使用 token 作为密码

或者使用 SSH：
```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 添加到 GitHub
# 复制公钥内容
cat ~/.ssh/id_ed25519.pub

# 在 GitHub Settings → SSH and GPG keys 中添加
```

### Q: 如何修改远程仓库地址？

```bash
# 查看当前远程仓库
git remote -v

# 修改远程仓库地址
git remote set-url origin https://github.com/NEW_USERNAME/NEW_REPO.git
```

### Q: 如何删除 Git 历史重新开始？

```bash
# 删除 .git 目录
rm -rf .git

# 重新初始化
git init
git add .
git commit -m "Initial commit"
```

---

## 🎉 准备好了吗？

选择一个方法，现在就创建 GitHub 仓库吧！

**推荐：方法 2（GitHub CLI）** - 最快速，一条命令完成

---

**下一步：** 查看 `DEPLOY_NOW.md` 部署到 Cloudflare Pages
