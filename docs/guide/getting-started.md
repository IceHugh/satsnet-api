# 快速开始指南

## 安装

### 基本安装

```bash
# 使用 bun (推荐)
bun add @btclib/satsnet-api

# 使用 npm
npm install @btclib/satsnet-api

# 使用 yarn
yarn add @btclib/satsnet-api
```

### 依赖要求

- **Node.js**: >= 16.0.0 或 Bun >= 1.0.0
- **运行环境**: 支持 ESM 格式

### 为什么选择 ofetch？

项目使用 ofetch 作为 HTTP 客户端，提供以下优势：

1. **更小的包体积**: 构建包仅 28.13KB（压缩后更小）
2. **通用兼容性**: 支持 Node.js、Bun、Deno、Edge Runtime 和浏览器
3. **更好的性能**: 使用 ofetch 减少依赖层级，提升加载速度
4. **零配置**: 开箱即用，无需额外配置 HTTP 客户端

## 第一个示例

### 基本使用

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

async function firstExample() {
  const client = new SatsNetClient();
  try {
    // 获取 Bitcoin Core 捐赠地址的 UTXO
    const utxos = await client.getUtxos('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'); // Bitcoin Core 捐赠地址

    console.log('找到 UTXO 数量:', utxos.plainutxos.length);
    console.log('总金额:', utxos.total);


  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

firstExample();
```

### 自定义配置

```typescript
import { SatsNetClient } from 'satsnet-api';

// 创建高性能客户端
const client = new SatsNetClient({
  baseUrl: 'https://apiprd.ordx.market',  // API 基础地址
  network: 'mainnet',                     // 主网
  timeout: 15000,                          // 15秒超时
  retries: 5,                              // 重试5次
  connections: 100,                        // 连接池大小
  keepAlive: true,                         // 启用 HTTP keep-alive
  cache: true,                             // 启用缓存
  compression: false                       // 默认禁用压缩以确保兼容性
});

async function customClientExample() {
  const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

  try {
    // 获取地址数据
    const utxos = await client.getUtxos(address);
    const summary = await client.getAddressSummary(address);

    console.log('UTXO:', utxos);
    console.log('地址摘要:', summary);

    // 获取性能指标
    const metrics = client.getMetrics();
    console.log('平均延迟:', metrics.averageLatency, 'ms');
    console.log('缓存命中率:', (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(2), '%');

  } catch (error) {
    console.error('请求失败:', error.message);
  }
}
```

### 批量请求示例

```typescript
import { SatsNetClient } from 'satsnet-api';

const client = new SatsNetClient();

async function batchExample() {
  const address = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

  // 定义批量请求
  const batchRequests = [
    { method: 'getUtxos', params: [address] },
    { method: 'getAddressSummary', params: [address] },
    { method: 'getBestHeight', params: [] }
  ];

  try {
    // 并行执行批量请求
    const results = await client.batchRequest(batchRequests);

    const [utxos, summary, height] = results;

    console.log('批量请求结果:');
    console.log('- UTXO 数量:', utxos.plainutxos.length);
    console.log('- 地址余额:', summary.balance);
    console.log('- BTC 价格:', price);
    console.log('- 区块高度:', height.height);

  } catch (error) {
    console.error('批量请求失败:', error.message);
  }
}
```

## 常见使用场景

### 1. 查询地址余额

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

async function getAddressBalance(address: string) {
  try {
    const utxos = await satsnet.getUtxos(address);
    const totalSats = utxos.total;
    const totalBtc = totalSats / 100000000; // 转换为 BTC

    console.log(`地址 ${address}`);
    console.log(`余额: ${totalSats} sats (${totalBtc} BTC)`);
    console.log(`UTXO 数量: ${utxos.plainutxos.length}`);

    return { totalSats, totalBtc, utxoCount: utxos.plainutxos.length };
  } catch (error) {
    console.error('查询余额失败:', error.message);
    throw error;
  }
}

// 使用示例
getAddressBalance('bc1q...'); // 替换为实际地址
```

### 2. 资产信息查询

```typescript
import { SatsNetClient } from 'satsnet-api';

async function getAssetInfo(ticker: string) {
  const client = new SatsNetClient();

  try {
    // 获取资产信息
    const info = await client.getTickerInfo(ticker);
    console.log(`资产 ${ticker}:`, info.displayname);
    console.log(`总供应量:`, info.maxSupply);
    console.log(`持有人数:`, info.holdersCount);

    // 获取前10名持有人
    const holders = await client.getTickerHolders(ticker, 0, 10);
    console.log('前10名持有人:');
    holders.holders.forEach((holder, index) => {
      console.log(`${index + 1}. ${holder.address}: ${holder.balance}`);
    });

    return { info, holders };
  } catch (error) {
    console.error('获取资产信息失败:', error.message);
    throw error;
  }
}

// 使用示例
getAssetInfo('ordi');

### 3. 名称服务查询

```typescript
import { SatsNetClient } from 'satsnet-api';

async function queryNameService(name: string) {
  const client = new SatsNetClient();

  try {
    // 查询名称信息
    const nameInfo = await client.getNameInfo(name);
    console.log(`名称 ${name}:`, nameInfo);
    console.log(`所有者地址:`, nameInfo.address);
    console.log(`状态:`, nameInfo.status);

    // 如果有所有者，查询其所有名称
    if (nameInfo.address) {
      const nameList = await client.getNameListByAddress(nameInfo.address);
      console.log(`该地址拥有的名称列表:`, nameList.names);
    }

    return nameInfo;
  } catch (error) {
    console.error('查询名称服务失败:', error.message);
    throw error;
  }
}

// 使用示例
queryNameService('sats');
```

### 4. 错误处理最佳实践

```typescript
import { SatsNetClient, tryit, isError } from 'satsnet-api';

async function robustApiCall(address: string) {
  const client = new SatsNetClient();

  // 使用 tryit 包装方法调用
  const safeGetUtxos = tryit(() => client.getUtxos(address));
  const [error, utxos] = await safeGetUtxos();

  if (isError([error, utxos])) {
    console.error('API调用失败:', error.message);
    console.error('错误码:', error.code);

    // 根据错误类型处理
    if (error.code === -1001) {
      console.error('地址格式错误，请检查地址是否正确');
    } else if (error.code >= 400 && error.code < 500) {
      console.error('客户端错误，请检查请求参数');
    } else if (error.code >= 500) {
      console.error('服务器错误，请稍后重试');
    }

    return null;
  }

  return utxos;
}
```

### 5. 性能优化建议

```typescript
import { SatsNetClient } from 'satsnet-api';

// 高性能配置
const optimizedClient = new SatsNetClient({
  network: 'mainnet',
  connections: 100,        // 大连接池
  http2: true,             // HTTP/2
  cache: true,             // 启用缓存
  cacheMaxAge: 300000,     // 5分钟缓存
  compression: true,       // 压缩
  timeout: 10000,          // 10秒超时
  retries: 3               // 3次重试
});

async function optimizedUsage() {
  // 批量请求而不是单独请求
  const batchRequests = [
    { method: 'getUtxos', params: ['address1'] },
    { method: 'getUtxos', params: ['address2'] },
    { method: 'getUtxos', params: ['address3'] }
  ];

  try {
    const results = await optimizedClient.batchRequest(batchRequests);
    return results;
  } catch (error) {
    console.error('批量请求失败:', error.message);
    throw error;
  } finally {
    // 应用结束时清理资源
    await optimizedClient.close();
  }
}
```

## 下一步

恭喜！你已经成功设置了 SatsNet API 并学会了基本用法。接下来可以：

1. 🔧 **查看 [API 文档](../api/README.md)** 了解所有可用方法
2. 📚 **阅读 [高级用法指南](advanced-usage.md)** 学习高级功能
3. 🚀 **查看 [示例代码](../examples/)** 获取更多灵感
4. 🛠️ **探索 [配置选项](../README.md#配置选项)** 优化性能

## 获取帮助

如果遇到问题，可以：

- 📖 查看 [API 文档](../api/README.md)
- 🐛 搜索 [GitHub Issues](https://github.com/icehugh/satsnet-api/issues)
- 💬 提交 [新的 Issue](https://github.com/icehugh/satsnet-api/issues/new)

## 贡献

欢迎贡献代码！请查看 [贡献指南](../CONTRIBUTING.md) 了解如何参与项目开发。
```

## 常见问题

### Q: 支持哪些网络？

A: 支持 mainnet、testnet 和 livenet 网络。

### Q: 如何获取代币信息？

A: 使用 `getTickerInfo()` 方法查询资产信息，使用 `getAddressSummary()` 查询地址持有的资产。

### Q: 如何检查安全漏洞？

A: 使用 `bun audit` 检查依赖的安全漏洞，使用 `bun audit --fix` 自动修复。

### Q: 如何提高性能？

A:
- 启用 HTTP/2 和连接池
- 使用批量请求
- 启用缓存机制
- 合理设置超时和重试次数

### Q: 如何处理错误？

A: 库提供了多种错误处理方式：
- 使用 try-catch 块
- 使用 tryit 函数包装
- 使用 SafeSatsNetClient 自动处理错误

### Q: 支持哪些环境？

A: 支持 Node.js >= 20.0.0 和 Bun >= 1.0.0，同时支持浏览器环境。
