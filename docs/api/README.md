# API 参考文档

## 概述

SatsNet API 提供了一组完整的方法来与 Bitcoin 和 SatsNet 网络进行交互。所有方法都是异步的，并返回 Promise。库内置了输入验证、智能缓存和批量请求功能，提供高性能和类型安全的开发体验。

## 主要特性

- 🚀 **高性能**: HTTP/2、连接池、智能缓存
- 🛡️ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **输入验证**: 自动验证地址、交易ID和UTXO格式
- 📦 **批量请求**: 支持并行批量API调用
- 🔧 **动态配置**: 支持运行时配置更新

## 主要类

### SatsNetClient

主要的 API 客户端类，提供所有网络交互方法。

```typescript
import { SatsNetClient } from 'satsnet-api';

const client = new SatsNetClient(config);
```

#### 构造函数

```typescript
constructor(config?: Partial<ApiConfig>)
```

**参数:**
- `config` - 可选的 API 配置对象

**示例:**
```typescript
const client = new SatsNetClient({
  network: 'mainnet',
  timeout: 10000
});
```

### SafeSatsNetClient

提供内置错误处理的安全客户端，所有方法返回 `[error, result]` 元组。

```typescript
import { SafeSatsNetClient } from 'satsnet-api';

const safeClient = new SafeSatsNetClient(config);
const [error, result] = await safeClient.getUtxos(address);
```

## 配置类型

### ApiConfig

API 配置接口。

```typescript
interface ApiConfig {
  baseUrl: string;                    // API 基础 URL (例如: https://apiprd.ordx.market)
  network: Network;                   // 网络类型: 'mainnet' | 'testnet' | 'livenet'
  chain?: Chain;                      // 链类型: 'btc' | 'satsnet' (默认: 'btc')
  timeout?: number;                   // 超时时间 (毫秒，默认: 10000)
  retries?: number;                   // 重试次数 (默认: 3)
  headers?: Record<string, string>;  // 自定义请求头

  // 高性能配置选项
  connections?: number;               // 连接池大小 (默认: 50)
  http2?: boolean;                    // 启用 HTTP/2 (默认: true)
  keepAlive?: boolean;                // 启用 keep-alive (默认: true)
  maxConcurrentStreams?: number;      // HTTP/2 最大并发流 (默认: 100)
  compression?: boolean;              // 启用压缩 (默认: true)
  cache?: boolean;                    // 启用缓存 (默认: true)
  cacheMaxAge?: number;               // 缓存最大存活时间 (毫秒，默认: 300000)
  metrics?: boolean;                  // 启用性能指标收集 (默认: true)
}
```

#### 默认配置

```typescript
const defaultConfig: ApiConfig = {
  baseUrl: 'https://apiprd.ordx.market',
  network: 'mainnet',
  chain: 'btc',
  timeout: 10000,
  retries: 3,
  connections: 50,
  http2: true,
  keepAlive: true,
  maxConcurrentStreams: 100,
  compression: true,
  cache: true,
  cacheMaxAge: 300000,
  metrics: true
};
```

### Network

支持的区块链网络。

```typescript
type Network = 'mainnet' | 'testnet' | 'livenet';
```

### Chain

支持的链类型。

```typescript
type Chain = 'btc' | 'satsnet';
```

## UTXO 方法

### getUtxos

获取指定地址的所有 UTXO。

```typescript
async getUtxos(address: string, network?: Network): Promise<UtxoResponse>
```

**参数:**
- `address` - Bitcoin 地址
- `network` - 可选，网络类型，默认使用客户端配置

**返回值:**
```typescript
Promise<UtxoResponse>  // 包含普通 UTXO 和稀有 UTXO
```

**示例:**
```typescript
const utxos = await client.getUtxos('bc1q...');
console.log(utxos.plainutxos);  // 普通UTXO
console.log(utxos.total);       // 总金额
```

### getPlainUtxos

获取普通 UTXO。

```typescript
async getPlainUtxos(address: string, network?: Network): Promise<Utxo[]>
```

### getRareUtxos

获取稀有 UTXO。

```typescript
async getRareUtxos(address: string, network?: Network): Promise<Utxo[]>
```

### getUtxo

获取指定 UTXO。

```typescript
async getUtxo(utxo: string, network?: Network): Promise<Utxo>
```

**参数:**
- `utxo` - UTXO 标识符，格式为 `txid:vout`

### getUtxosByValue

按价值获取 UTXO。

```typescript
async getUtxosByValue(address: string, value: number, network?: Network): Promise<Utxo[]>
```

## 交易方法

### getTransactionRaw

获取原始交易数据。

```typescript
async getTransactionRaw(txid: string, network?: Network): Promise<TransactionRaw>
```

### getTransactionHex

获取交易十六进制数据。

```typescript
async getTransactionHex(txid: string, network?: Network): Promise<string>
```

### pushTransaction

推送已签名的交易。

```typescript
async pushTransaction(hex: string, network?: Network): Promise<{ txid: string }>
```

## 地址方法

### getAddressSummary

获取地址摘要信息。

```typescript
async getAddressSummary(address: string, network?: Network): Promise<AddressSummary>
```

**返回值:**
包含地址拥有的所有资产信息，包括 BRC-20 代币等。

## 费率和网络方法

### getRecommendedFees

获取推荐费率。

```typescript
async getRecommendedFees(network?: Network): Promise<FeeRates>
```

**返回值:**
```typescript
interface FeeRates {
  fastestFee: number;    // 最快确认费率
  halfHourFee: number;   // 30分钟确认费率
  hourFee: number;       // 1小时确认费率
  economyFee: number;    // 经济费率
  minimumFee: number;    // 最小费率
}
```

### getBestHeight

获取最佳区块高度。

```typescript
async getBestHeight(network?: Network): Promise<BestHeightResponse>
```

## 代币/资产方法

### getTickerInfo

获取代币信息。

```typescript
async getTickerInfo(ticker: string, network?: Network): Promise<TickerInfo>
```

**参数:**
- `ticker` - 代币符号，如 'ORDI'

**返回值:**
```typescript
interface TickerInfo {
  name: TickerName;
  displayname: string;
  id: number;
  startBlock: number;
  endBlock: number;
  limit: string;
  maxSupply: string;
  totalMinted: string;
  holdersCount: number;
  // ... 更多字段
}
```

### getTickerHolders

获取代币持有者列表。

```typescript
async getTickerHolders(
  ticker: string,
  start: number,
  limit: number,
  network?: Network
): Promise<AssetHolder[]>
```

### getAddressAssetHolders

获取地址持有的特定资产。

```typescript
async getAddressAssetHolders(
  address: string,
  ticker: string,
  start: number,
  limit: number,
  network?: Network
): Promise<AssetHolder[]>
```

## 名称服务方法

### getNameInfo

获取名称信息。

```typescript
async getNameInfo(name: string, network?: Network): Promise<NameService>
```

### getNameListByAddress

获取地址拥有的名称列表。

```typescript
async getNameListByAddress(
  address: string,
  start: number,
  limit: number,
  network?: Network
): Promise<NameServiceListResponse>
```

### getNameSubUtxos

获取名称子 UTXO。

```typescript
async getNameSubUtxos(
  address: string,
  name: string,
  start: number,
  limit: number,
  network?: Network
): Promise<Utxo[]>
```

## 健康检查

### healthCheck

API 健康状态检查。

```typescript
async healthCheck(network?: Network): Promise<HealthCheckResponse>
```

**返回值:**
```typescript
interface HealthCheckResponse {
  status: string;
  version: string;
  basedbver: string;
  ordxdbver: string;
}
```

## 批量请求

### executeBatch

执行批量请求。

```typescript
async executeBatch(requests: BatchRequestParams[]): Promise<unknown[]>
```

**参数:**
```typescript
interface BatchRequestParams {
  method: BatchRequestMethod;
  params: unknown[];
  network?: Network;
}
```

**示例:**
```typescript
const requests = [
  {
    method: 'getUtxos',
    params: ['bc1q...'],
    network: 'mainnet'
  },
  {
    method: 'getTickerInfo',
    params: ['ORDI']
  }
];

const results = await client.executeBatch(requests);
```

## 错误处理

### SatsnetApiError

API 错误类型。

```typescript
class SatsnetApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown
  );
}
```

## 工具函数

### tryit 系列函数

提供函数式错误处理。

```typescript
import { tryit, isError, isSuccess } from 'satsnet-api';

// 基础用法
const [error, result] = await tryit(() => client.getUtxos(address))();

if (isError([error, result])) {
  console.error('错误:', error.message);
} else {
  console.log('结果:', result);
}

// 带重试
const [error, result] = await tryitWithRetry(
  () => client.getUtxos(address),
  3  // 重试3次
)();

// 带默认值
const result = await tryitOrDefault(
  () => client.getUtxos(address),
  []  // 默认值
)();
```

## 类型定义

### Utxo

UTXO 数据结构。

```typescript
interface Utxo {
  txid: string;
  vout: number;
  value: number;
  address?: string;
  script?: string;
  status?: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}
```

### TransactionRaw

交易原始数据。

```typescript
interface TransactionRaw {
  hex: string;
  txid: string;
  version: number;
  locktime: number;
  vin: TransactionInput[];
  vout: TransactionOutput[];
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}
```

### AddressSummary

地址摘要数据。

```typescript
interface AddressSummary extends AddressAssetItem[] {
  address?: string;
  balance?: number;
}
```

---

## 使用示例

### 完整工作流示例

```typescript
import { SatsNetClient } from 'satsnet-api';

// 创建客户端
const client = new SatsNetClient({
  network: 'mainnet',
  timeout: 15000
});

async function exampleWorkflow() {
  try {
    // 1. 获取地址 UTXO
    const utxos = await client.getUtxos('bc1q...');

    // 2. 获取费率
    const fees = await client.getRecommendedFees();

    // 3. 检查健康状态
    const health = await client.healthCheck();

    // 4. 获取代币信息
    const tickerInfo = await client.getTickerInfo('ORDI');

    return {
      utxos,
      fees,
      health,
      tickerInfo
    };
  } catch (error) {
    console.error('工作流失败:', error);
    throw error;
  }
}
```

### 错误处理示例

```typescript
import { safeSatsnet, isError } from 'satsnet-api';

async function safeExample() {
  const [error, utxos] = await safeSatsnet.getUtxos('bc1q...');

  if (isError([error, utxos])) {
    console.error('获取 UTXO 失败:', error.message);
    return [];
  }

  return utxos;
}
```

## 高级功能

### 批量请求

使用 `batchRequest` 方法可以并行执行多个API调用：

```typescript
interface BatchRequestParams {
  method: BatchRequestMethod;
  params: unknown[];
  network?: Network;
}

const batchRequests: BatchRequestParams[] = [
  { method: 'getUtxos', params: ['bc1q...address'] },
  { method: 'getTickerInfo', params: ['ordi'] },
  { method: 'getBestHeight', params: [] }
];

const results = await client.batchRequest(batchRequests);
```

#### 支持的批量方法

```typescript
type BatchRequestMethod =
  | 'getUtxos' | 'getPlainUtxos' | 'getRareUtxos' | 'getUtxo' | 'getUtxosByValue'
  | 'getTransactionHex' | 'pushTransaction' | 'getAddressSummary'
  | 'getBestHeight' | 'getTickerInfo' | 'getTickerHolders' | 'getAddressAssetHolders'
  | 'getNameInfo' | 'getNameListByAddress' | 'getNameSubUtxos' | 'healthCheck';
```

### 缓存管理

库内置了智能缓存机制：

```typescript
// 获取性能指标
interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  totalLatency: number;
  cacheHits: number;
  cacheMisses: number;
  activeConnections: number;
  maxConnections: number;
}

const metrics = client.getMetrics();
console.log(`缓存命中率: ${metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100}%`);

// 清除缓存
client.clearCache();
```

### 动态配置更新

支持运行时配置更新：

```typescript
// 更新基础URL
client.setBaseUrl('https://new-api.example.com');

// 更新网络
client.setNetwork('testnet');

// 获取当前配置
const config = client.getConfig();
```

### 资源清理

```typescript
// 关闭连接池和清理资源
await client.close();
```

## 错误类型

### SatsnetApiError

库定义了专门的错误类型：

```typescript
class SatsnetApiError extends Error {
  constructor(message: string, public code?: number, public data?: unknown);
}
```

#### 常见错误码

- `-1`: 通用错误
- `-1001`: 地址验证失败
- `-1002`: 交易ID验证失败
- `-1003`: UTXO验证失败
- `400-499`: 客户端错误
- `500-599`: 服务器错误

### 输入验证错误

库会自动验证输入参数：

```typescript
// 地址验证
await client.getUtxos(''); // Error: Invalid Bitcoin address: address cannot be empty

// 交易ID验证
await client.getTransactionHex('invalid-txid'); // Error: Invalid transaction ID: must be a 64-character hex string

// UTXO验证
await client.getUtxo('invalid-utxo'); // Error: Invalid UTXO format: must be "txid:vout"
```