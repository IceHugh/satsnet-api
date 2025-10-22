# SatsNet API

<div align="center">

![SatsNet API](https://img.shields.io/badge/SatsNet%20API-1.0.0-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.0-black)

</div>

高性能的 SatsNet 协议 API 客户端，使用 Bun、TypeScript 和 undici 构建。

## ✨ 特性

- 🚀 **高性能**: 使用 Bun 和 undici 实现最佳性能，支持 HTTP/2 和连接池
- 🔒 **TypeScript 支持**: 完整的类型定义和类型安全，基于实际API响应
- 🛡️ **智能错误处理**: 统一的错误处理机制，支持参数验证和详细错误信息
- ⚙️ **灵活配置**: 支持动态域名和网络配置，支持运行时切换
- ✅ **输入验证**: 内置地址、交易ID和UTXO格式验证
- 📦 **缓存机制**: 智能缓存减少重复请求，提升性能
- 📊 **批量请求**: 支持并行批量请求，优化API调用效率
- ⏱️ **异步优先**: 全面采用 async/await 模式
- 🔄 **重试机制**: 内置智能重试和超时处理
- 🌐 **浏览器兼容**: 支持 Node.js 和浏览器环境
- ✅ **实际验证**: 基于真实API响应优化类型定义和错误处理

## 🚀 快速开始

### 安装

```bash
# 安装主包
bun add satsnet-api

# 或者 npm
npm install satsnet-api
```

**注意**: 需要手动安装 undici（高性能HTTP客户端）
```bash
# Bun
bun add undici@^6.19.2

# 或者 npm
npm install undici@^6.19.2
```

### 依赖要求

- **Node.js**: >= 20.0.0 或 Bun >= 1.0.0
- **undici**: ^6.19.2 (高性能HTTP客户端)
- **运行时**: 支持 ESM 格式

### 为什么使用 peerDependencies

使用 `peerDependencies` 配置有以下优势：

1. **更小的包体积**: 构建包仅 22.2 kB（vs 730MB）
2. **避免版本冲突**: 用户可以选择适合的 undici 版本
3. **更好的性能**: 使用本地安装的 undici，减少依赖层级
4. **灵活的依赖管理**: 支持项目自定义 HTTP 客户端配置

### 快速安装

```bash
# 一键安装所有依赖（推荐）
npm install satsnet-api undici@^6.19.2

# 或者使用 Bun
bun add satsnet-api undici@^6.19.2

# 使用安装脚本自动检查依赖
npx satsnet-api install:deps
```

## 📚 使用示例

### 基础用法

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// 创建默认客户端实例
const client = new SatsNetClient();

// 获取地址的 UTXO
const utxos = await client.getUtxos('bc1q...');
console.log(utxos);

```

### 自定义配置

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// 创建自定义客户端
const client = new SatsNetClient({
  baseUrl: 'https://api.custom.com',
  network: 'testnet',
  timeout: 15000,
  retries: 5,
});

// 使用自定义客户端
const summary = await client.getAddressSummary('bc1q...');
```

## 📚 API 参考

### UTXO 管理

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';
const client = new SatsNetClient();

// 获取所有 UTXO (包含plainutxos和总计信息)
const utxos = await client.getUtxos(address);

// 获取普通 UTXO (非ordinals)
const plainUtxos = await client.getPlainUtxos(address);

// 获取稀有/特殊 UTXO
const rareUtxos = await client.getRareUtxos(address);

// 获取指定 UTXO 详细信息
const utxo = await client.getUtxo('txid:vout');

// 按价值获取 UTXO (默认最小600 satoshis)
const valueUtxos = await client.getUtxosByValue(address, 1000);
```

### 交易管理

```typescript
// 获取交易十六进制数据 (自动验证txid格式)
const hex = await client.getTransactionHex(txid);

// 推送签名交易到网络
const result = await client.pushTransaction(signedHex);
```

### 地址和网络服务

```typescript
// 获取地址摘要和统计信息
const summary = await client.getAddressSummary(address);

// 获取最佳区块高度
const height = await client.getBestHeight();

// API 健康检查
const health = await client.healthCheck();
```

### 代币/资产管理

```typescript
// 获取代币详细信息
const info = await client.getTickerInfo('ORDI');

// 获取代币持有者列表 (支持分页)
const holders = await client.getTickerHolders(
  'ORDI',
  0,   // start - 分页起始位置
  10    // limit - 每页数量
);

// 获取地址在特定代币的持有情况
const addressAssets = await client.getAddressAssetHolders(
  address,
  'ORDI',
  0,   // start - 分页起始位置
  10    // limit - 每页数量
);
```

### 名称服务

```typescript
// 获取名称服务信息
const nameInfo = await client.getNameInfo('satoshiname');

// 获取地址拥有的名称列表 (支持分页)
const names = await client.getNameListByAddress(
  address,
  0,   // start - 分页起始位置
  100   // limit - 每页数量
);

// 获取名称子 UTXO (支持分页)
const subUtxos = await client.getNameSubUtxos(
  address,
  'subname', // 子名称
  1,   // page - 页码 (从1开始)
  10    // pagesize - 每页大小
);
```

## ⚙️ 配置选项

```typescript
interface ApiConfig {
  baseUrl: string;      // API 基础 URL (默认: https://apiprd.ordx.market)
  network: Network;     // 默认网络: 'mainnet' | 'testnet' | 'livenet' (默认: mainnet)
  chain?: Chain;        // 默认链: 'btc' | 'satsnet' (默认: 'btc')
  timeout?: number;     // 请求超时时间 (毫秒，默认: 10000)
  retries?: number;     // 重试次数 (默认: 3)
  headers?: Record<string, string>; // 自定义请求头
  connections?: number; // 连接池大小 (默认: 50)
  http2?: boolean;      // 启用 HTTP/2 (默认: true)
  cache?: boolean;      // 启用缓存 (默认: true)
}
```

## 🛡️ 错误处理和输入验证

### 输入验证

库会自动验证输入参数，提供详细的错误信息：

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

const client = new SatsNetClient();

// 地址验证
try {
  await client.getUtxos(''); // 空地址
} catch (error) {
  console.error(error.message); // "Invalid Bitcoin address: address cannot be empty"
}

// 交易ID验证
try {
  await client.getTransactionHex('invalid-txid'); // 无效格式
} catch (error) {
  console.error(error.message); // "Invalid transaction ID: must be a 64-character hex string"
}

// UTXO验证
try {
  await client.getUtxo('invalid-utxo'); // 无效格式
} catch (error) {
  console.error(error.message); // "Invalid UTXO format: must be \"txid:vout\""
}
```

### 错误处理方式

该库提供了三种错误处理方式：

#### 1. 传统方式（推荐新手使用）

```typescript
import { satsnet } from '@btclib/satsnet-api';

try {
  const result = await satsnet.getUtxos(address);
  console.log('结果:', result);
} catch (error) {
  console.error('错误:', error.message);
}
```

#### 2. tryit 方式（推荐进阶用户使用）

使用内置的 tryit 函数，无需 try-catch：

```typescript
import { satsnet, tryit, isError, isSuccess } from '@btclib/satsnet-api';

// 直接使用 tryit
const [error, result] = await tryit(() => satsnet.getUtxos(address))();

if (isError([error, result])) {
  console.error('错误:', error.message);
  console.error('错误码:', error.code);
} else {
  console.log('结果:', result);
}
```

#### 3. 安全客户端（最简单的方式）

```typescript
import { safeSatsnet, isError } from '@btclib/satsnet-api';

// 所有方法都返回 [error, result] 元组
const [error, result] = await safeSatsnet.getUtxos(address);

if (isError([error, result])) {
  console.error('错误:', error.message);
} else {
  console.log('结果:', result);
}

// 带默认值的方法
const utxos = await safeSatsnet.getUtxosByValueOrDefault(address, 1000);
console.log('UTXOs:', utxos); // 永远不会为 undefined
```

## 🔧 tryit 工具函数

```typescript
import {
  tryit,           // 基础错误处理
  tryitWithRetry,  // 带重试的错误处理
  tryitOrDefault,  // 带默认值的错误处理
  tryitAll,        // 并行执行多个函数
  isError,         // 检查是否为错误
  isSuccess        // 检查是否成功
} from '@btclib/satsnet-api';

// 并行执行多个API调用
const [errors, results] = await tryitAll([
  () => satsnet.getBestHeight(),
  () => satsnet.getTickerInfo('ordi'),
  () => satsnet.healthCheck()
]);
```

## 🚀 高级功能

### 批量请求

使用批量请求功能可以并行执行多个API调用，提高效率：

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

const client = new SatsNetClient();

// 定义批量请求
const batchRequests = [
  { method: 'getUtxos', params: ['bc1q...address'] },
  { method: 'getTickerInfo', params: ['ordi'] },
  { method: 'getBestHeight', params: [] },
  { method: 'healthCheck', params: [] }
];

// 执行批量请求
try {
  const results = await client.batchRequest(batchRequests);
  console.log('批量请求结果:', results);
} catch (error) {
  console.error('批量请求失败:', error.message);
}
```

### 缓存管理

库内置了智能缓存机制，可以提升性能：

```typescript
// 获取性能指标
const metrics = client.getMetrics();
console.log('缓存命中:', metrics.cacheHits);
console.log('缓存未命中:', metrics.cacheMisses);
console.log('平均延迟:', metrics.averageLatency);

// 清除缓存
client.clearCache();
```

### 配置更新

支持运行时动态更新配置：

```typescript
// 更新基础URL
client.setBaseUrl('https://new-api-server.com');

// 更新网络
client.setNetwork('testnet');

// 获取当前配置
const currentConfig = client.getConfig();
console.log('当前配置:', currentConfig);

// 更新高级HTTP配置
await client.updateAdvancedConfig({
  connections: 100,
  timeout: 20000,
  keepAlive: true
});

// 关闭连接池和清理资源
await client.close();
```

## 🧪 开发

```bash
# 安装依赖
bun install

# 开发模式
bun run dev

# 类型检查
bun run type-check

# 构建
bun run build

# 测试
bun run test

# 代码检查
bun run lint
bun run lint:fix

# 安全漏洞检查
bun run audit

# 运行示例
bun run example
bun run example:tryit
```

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🤝 贡献

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

## 🔗 相关链接

- 📚 [API 文档](./docs/api/README.md)
- 🚀 [用户指南](./docs/guide/getting-started.md)
- 🔧 [高级用法](./docs/guide/advanced-usage.md)
- 🤝 [贡献指南](./CONTRIBUTING.md)
- 📋 [变更日志](./CHANGELOG.md)
- 🔒 [安全政策](./SECURITY.md)

## 📊 统计

![GitHub stars](https://img.shields.io/github/stars/icehugh/satsnet-api?style=social)
![GitHub forks](https://img.shields.io/github/forks/icehugh/satsnet-api?style=social)
![GitHub issues](https://img.shields.io/github/issues/icehugh/satsnet-api)
![GitHub pull requests](https://img.shields.io/github/issues-pr/icehugh/satsnet-api)

## 支持

如果这个项目对您有帮助，请考虑：

- ⭐ 给项目点个 Star
- 🐛 [报告 Bug](https://github.com/icehugh/satsnet-api/issues)
- 💡 [提出功能建议](https://github.com/icehugh/satsnet-api/discussions)
- 📖 [改进文档](./CONTRIBUTING.md#文档贡献)

---

<div align="center">
  <sub><strong>用 ❤️ 制作</strong></sub>
</div>