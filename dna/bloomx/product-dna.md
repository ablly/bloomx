# BloomX 产品 DNA

## 一句话
BloomX 是让商家把闲置大模型 API 能力上架出售、让用户用积分订阅并调用的模型 API 交易市场。

## 双边角色
- 商家：提交主体资料、模型名称、Base URL、API Key、价格、容量、结算方式和售后规则。
- 用户：注册登录、通过邮箱验证、购买或订阅积分套餐、选择商家模型、发起调用、查看账单和调用记录。
- 平台：测试商家 API、托管公开商品数据、保护商家密钥、记录调用、完成扣费退款、生成结算证据。

## 核心闭环
1. 商家提交资料到 `sellerProfiles`。
2. 商家提交 API 商品，平台调用 `testMerchantApi` 真实测试。
3. 测试通过后商品写入 `apiOffers`，密钥写入 `merchantApiSecrets`。
4. 用户订阅商品，数据写入 `subscriptions`。
5. 用户通过平台 Key 调用 `invokeMerchantModel`。
6. 成功调用扣除用户 `credits_balance`，写入 `apiCallRecords`，累计 `apiOfferStats.earnedCredits`。
7. 失败调用不计收入，提示用户更换模型，并保留售后证据。

## 生产环境原则
- 客户端永远不保存商家 API Key。
- 公开市场只读 `apiOffers` 中可展示字段。
- 余额字段统一为 `credits_balance`。
- 验证码集合只能由后端函数管理。
- 所有可收费动作必须有调用记录、状态、成本和退款路径。

## 下一阶段能力
- 接入真实支付：Stripe、微信、支付宝任选其一先闭环。
- 商家结算单：月结与手动提现都写入 `settlements`。
- 售后工单：失败调用、重复扣费、质量争议写入 `supportTickets`。
- 风控：按失败率自动暂停问题商家 API。
