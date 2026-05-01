# BloomX 产品规格

## Purpose

定义 BloomX 作为大模型 API 能力交易市场的核心行为：商家 API 测试、上架、购买、调用、结算和售后。

## Requirements

### Requirement: API 能力交易市场定位
系统 SHALL 作为商家供应的大模型 API 能力交易市场运行。

#### Scenario: 市场价值闭环
- GIVEN 商家拥有可售卖的 API 能力
- WHEN 商家提交端点、价格和售后信息
- THEN 平台在上架前评估该 API
- AND 买家只能发现和购买已通过审核的能力

### Requirement: 买家调用与账务记录
系统 SHALL 记录买家 API 调用，并处理积分扣减、退款和商家收入。

#### Scenario: 调用成功
- GIVEN 买家拥有有效购买或订阅权益，并且积分充足
- WHEN 买家成功调用已上架的商家 API
- THEN 系统扣减买家积分
- AND 系统记录商家收入
- AND 系统保留调用记录

#### Scenario: 调用失败
- GIVEN 买家调用已上架的商家 API
- WHEN 调用因为商家 API 可用性或质量问题失败
- THEN 系统不得对买家产生不公平扣费
- AND 失败记录可用于售后审核

### Requirement: 运营自动化事件
系统 SHALL 为商家审核、售后、支付、结算、API 健康和全局事件总线发出业务事件。

#### Scenario: 业务事件投递
- GIVEN Firestore 中发生相关业务事件
- WHEN 自动化触发器运行
- THEN 系统尝试把事件投递到已配置的自动化端点
- AND 系统记录投递状态用于审计
