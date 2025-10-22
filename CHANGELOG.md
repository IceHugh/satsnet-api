# 变更日志

本文档记录了 SatsNet API 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 更多错误处理策略
- WebSocket 支持
- 更多网络支持

## [1.0.0] - 2025-10-21

### 新增
- 🎉 初始版本发布
- ✨ 完整的 SatsNet API 客户端
- 🚀 高性能 HTTP 客户端 (基于 undici)
- 🔧 TypeScript 支持
- 🛡️ 错误处理机制 (tryit 系列)
- 📊 批量请求支持
- 🌐 多网络支持 (mainnet, testnet, livenet)
- 🔗 连接池和 HTTP/2 支持
- 📝 完整的文档体系
- 🧪 全面的测试覆盖

### 改进 (2025-10-21 更新)
- ✅ **输入验证**: 自动验证地址、交易ID和UTXO格式
- 🚀 **性能优化**: 优化缓存机制和批量请求性能
- 🔧 **配置同步**: 修复配置更新同步问题
- 📦 **统一HTTP客户端**: 所有API调用使用统一的基础设施
- 📈 **性能监控**: 增强的性能指标收集和缓存管理
- 🛠️ **代码质量**: 消除重复代码，改进类型安全性
- 📚 **文档更新**: 更新所有文档以反映最新功能和最佳实践

### API 方法
- **UTXO 管理**
  - `getUtxos()` - 获取所有 UTXO
  - `getPlainUtxos()` - 获取普通 UTXO
  - `getRareUtxos()` - 获取稀有 UTXO
  - `getUtxo()` - 获取指定 UTXO
  - `getUtxosByValue()` - 按价值获取 UTXO

- **交易管理**
  - `getTransactionRaw()` - 获取原始交易
  - `getTransactionHex()` - 获取交易十六进制
  - `pushTransaction()` - 推送交易

- **地址管理**
  - `getAddressSummary()` - 获取地址摘要

- **费率和网络**
  - `getRecommendedFees()` - 获取推荐费率
  - `getBtcPrice()` - 获取 BTC 价格
  - `getBestHeight()` - 获取最佳区块高度
  - `healthCheck()` - 健康检查

- **代币/资产**
  - `getTickerInfo()` - 获取代币信息
  - `getTickerHolders()` - 获取代币持有者
  - `getAddressAssetHolders()` - 获取地址资产

- **名称服务**
  - `getNameInfo()` - 获取名称信息
  - `getNameListByAddress()` - 获取地址名称列表
  - `getNameSubUtxos()` - 获取名称子 UTXO

### 错误处理
- `tryit()` - 基础错误处理
- `tryitWithRetry()` - 带重试的错误处理
- `tryitOrDefault()` - 带默认值的错误处理
- `tryitAll()` - 并行执行多个函数
- `isError()` / `isSuccess()` - 结果检查
- `SafeSatsNetClient` - 安全客户端

### 工具功能
- `HttpClient` - 高性能 HTTP 客户端
- `ErrorHandler` - 错误处理器
- `executeBatch()` - 批量请求执行

### 类型定义
- 完整的 TypeScript 类型支持
- API 响应类型
- 配置接口
- 错误类型

### 配置选项
- 网络配置 (mainnet/testnet/livenet)
- 超时和重试设置
- HTTP/2 和连接池配置
- 自定义请求头

### 开发工具
- TypeScript 严格模式
- Biome 代码格式化
- 完整的测试套件
- 性能基准测试

### 文档
- 📖 API 参考文档
- 📚 用户指南
- 🔧 高级使用指南
- 🤝 贡献指南

---

## 版本说明

### 语义化版本控制

本项目使用 `MAJOR.MINOR.PATCH` 格式：

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能性新增
- **PATCH**: 向后兼容的问题修正

### 变更类型

- `新增` - 新功能
- `变更` - 对现有功能的变更
- `弃用` - 即将移除的功能
- `移除` - 已移除的功能
- `修复` - Bug 修复
- `安全` - 安全相关的修复

### 发布周期

- **主版本**: 根据需要发布
- **次版本**: 每月发布
- **修订版本**: 根据需要发布

---

## 如何贡献

如果您想参与项目开发，请查看 [贡献指南](CONTRIBUTING.md)。

## 获取帮助

- 📖 [文档](docs/)
- 🐛 [问题反馈](https://github.com/icehugh/satsnet-api/issues)
- 💬 [讨论](https://github.com/icehugh/satsnet-api/discussions)