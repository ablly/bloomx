# Firebase CLI 登录修复记录

日期：2026-04-27  
项目：`bloomx-core-infra-26`

## 结论

这次登录失败不是账号本身的问题，而是 Firebase CLI 的 Node 进程没有自动使用 Windows 系统代理。浏览器能打开 Google 登录页，但 CLI 在访问 `auth.firebase.tools/attest` 或交换 OAuth token 时失败。

已新增代理脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\firebase-cli-proxy.ps1 <firebase 参数>
```

该脚本会把本机代理注入到 Firebase CLI 进程中。当前检测到的代理是：

```text
http://127.0.0.1:7890
```

## 已验证可用命令

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\firebase-cli-proxy.ps1 projects:list
powershell -ExecutionPolicy Bypass -File .\scripts\firebase-cli-proxy.ps1 use bloomx-core-infra-26
powershell -ExecutionPolicy Bypass -File .\scripts\firebase-cli-proxy.ps1 deploy --only firestore:rules
powershell -ExecutionPolicy Bypass -File .\scripts\firebase-cli-proxy.ps1 deploy --only functions --force
powershell -ExecutionPolicy Bypass -File .\scripts\firebase-cli-proxy.ps1 functions:list --project bloomx-core-infra-26
```

## 关于 `login --reauth` 偶发失败

如果 `firebase login --reauth` 在粘贴授权码后提示：

```text
Authentication Error: Your credentials are no longer valid. Please run firebase login --reauth
```

优先按下面顺序处理：

1. 不要混用普通 `firebase login` 和代理脚本登录，统一使用代理脚本。
2. 确认每次都使用最新生成的登录 URL 和授权码，旧授权码不能复用。
3. 如果已经可以执行 `projects:list`、`use`、`deploy`，说明当前登录态可用，不需要反复 `reauth`。
4. 如果必须重新登录，先执行：

```powershell
firebase logout
powershell -ExecutionPolicy Bypass -File .\scripts\firebase-cli-proxy.ps1 login --no-localhost --reauth
```

## 当前真实状态

- Firebase CLI 已能通过代理脚本操作真实项目。
- Firestore rules 已成功部署到线上。
- Cloud Functions 已成功部署到线上。
- 当前项目没有发现 CLI 权限阻塞。

## 仍需注意

Cloud Functions 已上线，但 `functions:config:get` 当前返回 `{}`。这表示邮件发送所需的生产凭据还没有配置，验证码邮件函数虽然已经部署，但真实发信仍需要配置 SMTP/Gmail App Password 或等价的安全密钥。
