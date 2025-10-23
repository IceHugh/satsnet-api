# 变更日志

本文档记录了 SatsNet API 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 更多错误处理策略
- WebSocket 支持
- 更多网络支持

## [1.0.5] - 2025-10-23

### 修复
- 🔧 **undici keepAlive兼容性**: 修复 "unsupported keepAlive, use pipelining=0 instead" 错误
- 🌐 **HTTP/1.1连接池优化**: 添加 pipelining: 0 配置以支持 keepAlive 功能
- 📦 **默认配置调整**: 将 keepAlive 默认值改为 false 以确保最大兼容性

### 改进
- ⚡ **网络请求稳定性**: 提升第三方环境下的网络请求兼容性
- 🛠️ **配置灵活性**: 用户可选择启用 keepAlive 以获得更好性能
- 🧪 **功能验证**: 验证 getNameListByAddress (getNames) 功能正常工作

### 技术细节
- 修复 AdvancedHttpClient 中的 dispatcher 设置逻辑
- 优化 HTTP/1.1 连接池的 pipelining 配置
- 保持 HTTP/2 的完整 keepAlive 支持
- 增强错误处理和配置管理

## [1.0.4] - 2025-10-22

### 修复
- 🔧 **NPM发布修复**: 解决NPM包发布时缺少dist目录的关键问题
- 📦 **构建产物验证**: 增强CI/CD中构建产物的验证和重组逻辑
- 🚀 **发布流程优化**: 添加详细的发布前验证步骤和调试信息

### 改进
- 🔍 **文件结构检查**: 确保所有dist文件被正确包含在NPM包中
- 📊 **目录验证**: 验证dist目录存在性和内容完整性
- 📝 **调试信息**: 提供清晰的错误诊断和发布过程日志
- 🛠️ **CI/CD增强**: 改进GitHub Actions中的构建和发布流程

### 技术细节
- 修复artifact下载后的文件组织问题
- 确保NPM包包含完整的dist目录结构
- 增加发布前的文件完整性验证
- 优化CI/CD错误处理和日志输出

## [1.0.3] - 2025-10-22

### 新增
- ✅ **完整测试套件**: 添加全面的单元测试、集成测试和性能测试
- 🧪 **测试覆盖率**: 达到 98.4% 的测试通过率
- 📦 **构建优化**: 优化构建流程和包大小
- 🔧 **开发体验**: 改进开发工具和调试支持

### 修复
- 🐛 **类型匹配**: 修复所有 API 类型不匹配问题
- 🔍 **Lint 错误**: 修复所有 Biome lint 错误和格式问题
- 📝 **TypeScript**: 修复所有 TypeScript 类型错误
- ⚡ **性能**: 优化 HTTP 请求处理和错误恢复机制

### 改进
- 🚀 **API 工作流**: 优化 API 集成工作流测试
- 📊 **性能测试**: 增强高级 HTTP 测试场景
- 🔗 **集成测试**: 完善端到端 API 测试覆盖
- 🛠️ **开发工具**: 更新 CI/CD 配置和自动化流程

### 技术细节
- 使用 Bun 测试框架提升测试性能
- 集成 Biome 2.0.6 进行代码质量检查
- 优化 TypeScript 严格模式配置
- 增强错误处理和类型安全性

## [1.0.2] - 2025-10-21

### 新增
- ✅ **Biome 升级**: 从 v1.9.4 升级到 v2.0.6
- 🔧 **配置迁移**: 自动迁移到新的 Biome v2 格式
- 📦 **导入优化**: 使用新的导入组织器
- 🎯 **规则扩展**: 新增多个样式和复杂度规则

### 改进
- 📚 **文档更新**: 更新所有 API 示例和使用指南
- 🔍 **代码质量**: 清理重复字段，优化依赖配置
- ⚡ **性能**: 获得更好的性能和功能特性

## [1.0.1] - 2025-10-21

### 新增
- 🌐 **网络参数优化**: 简化 API 参数结构
- 🎯 **架构统一**: 统一客户端实现模式
- 📊 **批量请求**: 优化批量 API 调用接口
- 🔄 **配置管理**: 简化网络配置和切换机制

### 改进
- 📝 **类型系统**: 更新 BatchRequestParams 接口
- 🧹 **代码清理**: 移除冗余方法和复杂度
- 📚 **文档同步**: 更新所有文档和示例代码

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

- **网络**
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