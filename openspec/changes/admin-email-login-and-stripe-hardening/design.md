## Context

BloomX 正在从前端原型走向可运营交付。后台已经覆盖用户、商家、商品、订单、支付、账本、退款、Webhook、结算、审计和系统配置，但生产环境入口必须先做到“无登录不可见、非 Owner 不可进、前端不可改账”。支付侧�?Stripe 官方推荐采用 Checkout Sessions、Billing、Customer Portal �?Connect Accounts v2，Dodo Payments 保留为后�?Merchant of Record 备选�?
## Goals / Non-Goals

**Goals:**

- `/admin` 和所有子路由必须先进入管理员登录门禁�?- 默认只允�?`zqhablly@gmail.com` 进入后台，并保留环境变量扩展能力�?- 密码不落盘、不进仓库、不进入文档，只在登录时提交给认证服务�?- Firestore 后台集合只允许管理员读取，支�?账本/Webhook/审计等集合禁止前端写入�?- 固化 Stripe-first 的生产支付边界：服务端创�?Checkout/Portal/Connect 资源，Webhook 验签后驱动本地账本�?
**Non-Goals:**

- 本次不在仓库里创建真实管理员密码�?Firebase Auth 用户�?- 本次不直接发起真实支付、退款、结算或 Stripe 资源创建�?- 本次不把 Dodo Payments 设为默认收款通道；它仍是 MoR 备选适配层�?
## Decisions

1. **前端登录门禁采用 Firebase Auth 邮箱密码登录�?*
   原因：项目已经有 `useAuth()` 登录上下文，复用现有认证路径最少、风险最低。备选方案是自建后台登录 API，但当前阶段会增加会话存储和 CSRF 面�?
2. **Owner 邮箱白名单先在前端和 Firestore 规则双层执行�?*
   原因：前端负责用户体验和路由阻断，Firestore 规则负责数据边界。后续仍应补 Firebase custom claims 和服务端 RBAC，不能只依赖前端判断�?
3. **后台敏感集合前端只读或不可写�?*
   原因：支付、积分、退款、Webhook、结算和审计必须由服务端动作 API 写入，这样才能统一验签、幂等、审计和回滚。前端直接写账会破坏支付权威来源�?
4. **Stripe 首发使用托管/服务端优先能力�?*
   原因：Checkout Sessions 覆盖 Visa/Mastercard/Alipay/WeChat Pay 的首发需求，Billing �?Customer Portal 处理订阅生命周期，Connect Accounts v2 为后续平�?商家结算留空间。避�?Charges、Sources、前�?Card Element 这类不适合当前交付路线的老路径�?
5. **Webhook 作为支付状态权威入口�?*
   原因：success_url 只表示用户回到了站点，不等于资金和订阅状态完成。服务端必须使用 raw body + Stripe 签名 + endpoint secret 验证事件，并�?provider eventId/idempotencyKey 去重�?
## Risks / Trade-offs

- **Firebase Auth 中未创建该邮箱用�?* �?管理员仍无法登录。缓解：由控制台创建或重置账号密码，不把密码写进仓库�?- **前端白名单不是最终安全边�?* �?非授权用户可能尝试绕�?UI。缓解：Firestore 规则同步限制；后续补 custom claims、服务端动作 API 和审计�?- **Firestore 规则调用 `currentUser()` 依赖用户文档存在** �?早期账号如果没有用户文档可能导致角色判断失败。缓解：Owner 邮箱直接通过 token.email 放行后台读取�?- **WeChat Pay/Alipay 在不同国家、币种、订阅模式下支持度不�?* �?不能承诺所有地区所有场景即时可用。缓解：通过 Stripe Dashboard 开启动态支付方式，按国家、币种、业务模式做上线检查�?- **Dodo Payments MoR 能力仍需商务/合规确认** �?当前只保留适配位，不作为首发生产依赖�?
## Migration Plan

1. 部署前端后台登录门禁�?Firestore 规则�?2. �?Firebase Auth 中确�?Owner 邮箱账号存在，并完成密码设置或重置�?3. 设置生产环境变量 `VITE_ADMIN_ALLOWED_EMAILS`，默认至少包�?Owner 邮箱�?4. 部署 Firestore rules 后，用非 Owner 账号验证无法读取后台集合�?5. 下一步补服务�?Stripe Checkout/Portal/Webhook/API，并把后台按钮接到服务端审计动作�?
## Open Questions

- 是否要把第二管理员邮箱加入白名单，作为紧急备份账号？
- Stripe Connect 首发是做 destination charges，还是先只做平台自营收款和手动结算？
- Dodo Payments 作为 MoR 的启用国家、产品线和税务责任边界需要最终确认�?