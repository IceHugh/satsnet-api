# 高级使用指南

## 概述

本指南介绍 SatsNet API 的高级功能，包括错误处理、性能优化、批量操作、网络配置、缓存管理等。

## 错误处理进阶

### 1. 错误类型和状态码

```typescript
import { SatsNetApiError } from 'satsnet-api';

async function advancedErrorHandling() {
  try {
    const result = await satsnet.getUtxos('invalid-address');
  } catch (error) {
    if (error instanceof SatsnetApiError) {
      switch (error.code) {
        case -1001:
          console.error('地址验证失败:', error.message);
          break;
        case -1002:
          console.error('交易ID验证失败:', error.message);
          break;
        case -1003:
          console.error('UTXO验证失败:', error.message);
          break;
        case 400:
          console.error('请求参数错误:', error.message);
          break;
        case 404:
          console.error('资源不存在:', error.message);
          break;
        case 429:
          console.error('请求频率限制:', error.message);
          // 实现退避重试
          await exponentialBackoff(() => satsnet.getUtxos(address));
          break;
        case 500:
          console.error('服务器内部错误:', error.message);
          break;
        default:
          console.error('未知错误:', error.message);
      }
    }
  }
}

// 指数退避重试
async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.log(`第 ${i + 1} 次重试，等待 ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('重试失败');
}
```

### 2. tryit 高级用法

```typescript
import {
  tryit,
  tryitWithRetry,
  tryitOrDefault,
  tryitAll,
  isError,
  isSuccess
} from 'satsnet-api';

// 带自定义重试策略
async function customRetryExample() {
  const [error, result] = await tryitWithRetry(
    () => satsnet.getUtxos(address),
    5, // 重试5次
    1000, // 基础延迟1秒
    (attempt, error) => {
      // 自定义重试条件
      return error.code === 429 || error.code >= 500;
    }
  )();

  if (isSuccess([error, result])) {
    console.log('重试成功:', result);
  }
}

// 并行处理多个地址
async function parallelAddressAnalysis(addresses: string[]) {
  const requests = addresses.map(addr =>
    () => satsnet.getUtxos(addr)
  );

  const [errors, results] = await tryitAll(requests);

  // 分析结果
  const successfulResults = results.filter((_, index) => !errors[index]);
  const failedRequests = errors.filter(error => error);

  console.log(`成功: ${successfulResults.length}, 失败: ${failedRequests.length}`);

  return {
    successful: successfulResults,
    failed: failedRequests,
    successRate: successfulResults.length / addresses.length
  };
}

// 条件默认值
async function conditionalDefault(address: string, defaultValue: any[] = []) {
  return tryitOrDefault(
    () => satsnet.getUtxos(address),
    defaultValue,
    (error) => {
      // 根据错误类型决定是否使用默认值
      return error.code === 404;
    }
  )();
}
```

## 性能优化

### 1. 高性能客户端配置

```typescript
import { SatsNetClient } from 'satsnet-api';

// 高性能客户端配置
const highPerformanceClient = new SatsNetClient({
  network: 'mainnet',
  timeout: 30000,
  retries: 3,

  // HTTP/2 配置
  http2: true,
  keepAlive: true,
  maxConcurrentStreams: 100,

  // 连接池配置
  connections: 100,
  compression: true,

  // 缓存配置
  cache: true,
  cacheMaxAge: 300000,

  // 性能监控
  metrics: true
});
```

### 2. 缓存管理和性能监控

```typescript
import { SatsNetClient } from 'satsnet-api';

const client = new SatsNetClient({
  network: 'mainnet',
  cache: true,
  cacheMaxAge: 300000, // 5分钟缓存
  metrics: true
});

// 监控性能指标
async function monitorPerformance() {
  const metrics = client.getMetrics();

  console.log('=== 性能指标 ===');
  console.log(`总请求数: ${metrics.requestCount}`);
  console.log(`错误率: ${(metrics.errorCount / metrics.requestCount * 100).toFixed(2)}%`);
  console.log(`平均延迟: ${metrics.averageLatency.toFixed(2)}ms`);
  console.log(`缓存命中率: ${(metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(2)}%`);
  console.log(`活跃连接数: ${metrics.activeConnections}/${metrics.maxConnections}`);

  // 清除过期的缓存
  if (metrics.cacheHits < metrics.cacheMisses) {
    console.log('缓存命中率较低，考虑调整缓存策略');
    client.clearCache();
  }
}

// 智能缓存策略
class SmartCacheManager {
  constructor(private client: SatsNetClient) {}

  // 预热缓存
  async warmupCache(addresses: string[]) {
    console.log('开始预热缓存...');

    const batchRequests = addresses.map(address => ({
      method: 'getUtxos' as const,
      params: [address]
    }));

    await this.client.batchRequest(batchRequests);
    console.log('缓存预热完成');
  }

  // 智能缓存清理
  async intelligentCleanup() {
    const metrics = this.client.getMetrics();

    // 如果缓存命中率低于50%，清理缓存
    if (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) < 0.5) {
      console.log('缓存命中率过低，清理缓存...');
      this.client.clearCache();
    }
  }
}
```

### 3. 高级批量请求策略

```typescript
import { SatsNetClient } from 'satsnet-api';

class AdvancedBatchManager {
  constructor(private client: SatsNetClient) {}

  // 分批处理大量请求
  async processLargeBatch(requests: any[], batchSize = 50) {
    const results = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      try {
        const batchResults = await this.client.batchRequest(batch);
        results.push(...batchResults);

        // 批次间延迟，避免限流
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`批次 ${Math.floor(i / batchSize)} 失败:`, error.message);
        throw error;
      }
    }

    return results;
  }

  // 智能重试批次
  async batchWithRetry(requests: any[], maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.batchRequest(requests);
      } catch (error) {
        console.warn(`批次请求失败，第 ${attempt} 次重试:`, error.message);

        if (attempt === maxRetries) {
          throw error;
        }

        // 指数退避
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
}
```

### 4. 动态配置管理

```typescript
import { SatsNetClient } from 'satsnet-api';

class DynamicConfigManager {
  constructor(private client: SatsNetClient) {}

  // 根据网络状况自动调整配置
  async adaptToNetworkConditions() {
    const metrics = this.client.getMetrics();

    // 如果延迟过高，减少并发连接
    if (metrics.averageLatency > 5000) {
      await this.client.updateAdvancedConfig({
        connections: 20,
        http2: false  // 在高延迟情况下禁用 HTTP/2
      });
    }

    // 如果错误率高，增加重试次数
    const errorRate = metrics.errorCount / metrics.requestCount;
    if (errorRate > 0.1) {
      console.log('错误率过高，增加重试次数');
      // 注意：这里需要重新创建客户端或使用其他方法
    }
  }

  // 定期优化配置
  startAutoOptimization(interval = 60000) {
    setInterval(async () => {
      await this.adaptToNetworkConditions();
      await this.optimizeCacheSettings();
    }, interval);
  }

  private async optimizeCacheSettings() {
    const metrics = this.client.getMetrics();
    const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);

    if (hitRate > 0.8) {
      // 命中率高，增加缓存时间
      console.log('缓存命中率高，增加缓存时间');
    } else if (hitRate < 0.3) {
      // 命中率低，减少缓存时间
      console.log('缓存命中率低，减少缓存时间');
    }
  }
}
```
  headers: {
    'User-Agent': 'MyApp/1.0 (High-Performance)',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br'
  }
});

// 性能监控
async function performanceMonitor<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const startTime = Date.now();
  const memoryBefore = process.memoryUsage();

  try {
    const result = await fn();

    const duration = Date.now() - startTime;
    const memoryAfter = process.memoryUsage();

    console.log(`[${label}] 性能指标:`);
    console.log(`  执行时间: ${duration}ms`);
    console.log(`  内存使用: +${(memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024}MB`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[${label}] 失败 (耗时: ${duration}ms):`, error.message);
    throw error;
  }
}

// 使用示例
async function optimizedBatchRequest(addresses: string[]) {
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const batchResults = await performanceMonitor(
      () => Promise.all(
        batch.map(addr => highPerformanceClient.getUtxos(addr))
      ),
      `批次 ${Math.floor(i / batchSize) + 1}`
    );

    results.push(...batchResults);
  }

  return results;
}
```

### 2. 缓存策略

```typescript
// 简单内存缓存
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new MemoryCache();

// 带缓存的客户端
class CachedSatsNetClient {
  constructor(private client: SatsNetClient) {}

  async getCachedUtxos(address: string, ttl = 60000): Promise<any> {
    const cacheKey = `utxos:${address}`;

    let result = cache.get(cacheKey);
    if (!result) {
      result = await this.client.getUtxos(address);
      cache.set(cacheKey, result, ttl);
    }

    return result;
  }

  async getCachedFees(ttl = 30000): Promise<any> {
    const cacheKey = 'fees';

    let result = cache.get(cacheKey);
    if (!result) {
      result = await this.client.getRecommendedFees();
      cache.set(cacheKey, result, ttl);
    }

    return result;
  }
}

// 使用缓存客户端
const cachedClient = new CachedSatsNetClient(satsnet);

async function cachedExample(address: string) {
  // 第一次请求会调用 API
  const utxos1 = await cachedClient.getCachedUtxos(address);

  // 第二次请求会使用缓存
  const utxos2 = await cachedClient.getCachedUtxos(address);

  console.log('缓存结果:', utxos1 === utxos2);
}
```

### 3. 请求限流

```typescript
class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private lastReset = Date.now();
  private requestCount = 0;

  constructor(
    private maxConcurrent: number = 10,
    private maxRequestsPerSecond: number = 20
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    // 重置计数器
    const now = Date.now();
    if (now - this.lastReset >= 1000) {
      this.lastReset = now;
      this.requestCount = 0;
    }

    // 检查并发限制
    while (
      this.running < this.maxConcurrent &&
      this.queue.length > 0 &&
      this.requestCount < this.maxRequestsPerSecond
    ) {
      this.running++;
      this.requestCount++;
      const task = this.queue.shift()!;
      task();
    }

    // 如果达到速率限制，延迟处理
    if (this.queue.length > 0 && this.requestCount >= this.maxRequestsPerSecond) {
      const delay = 1000 - (now - this.lastReset);
      setTimeout(() => this.processQueue(), delay);
    }
  }
}

const rateLimiter = new RateLimiter(5, 10); // 最多5个并发，每秒10个请求

// 使用限流器
async function rateLimitedExample(addresses: string[]) {
  const results = await Promise.all(
    addresses.map(address =>
      rateLimiter.execute(() => satsnet.getUtxos(address))
    )
  );

  return results;
}
```

## 批量操作

### 1. 批量UTXO分析

```typescript
interface UtxoAnalysis {
  address: string;
  totalValue: number;
  utxoCount: number;
  averageUtxoValue: number;
  hasRareUtxos: boolean;
}

async function batchUtxoAnalysis(addresses: string[]): Promise<UtxoAnalysis[]> {
  const batchSize = 20; // 每批处理20个地址
  const analyses: UtxoAnalysis[] = [];

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);

    // 使用批量请求
    const requests = batch.map(address => ({
      method: 'getUtxos' as const,
      params: [address]
    }));

    try {
      const results = await satsnet.executeBatch(requests);

      const batchAnalyses = results.map((utxos: any, index) => {
        const address = batch[index];
        const plainUtxos = utxos.plainutxos || [];
        const totalValue = plainUtxos.reduce((sum: number, utxo: any) => sum + utxo.value, 0);

        return {
          address,
          totalValue,
          utxoCount: plainUtxos.length,
          averageUtxoValue: plainUtxos.length > 0 ? totalValue / plainUtxos.length : 0,
          hasRareUtxos: utxos.rareutxos && utxos.rareutxos.length > 0
        };
      });

      analyses.push(...batchAnalyses);

      // 添加延迟避免API限制
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 失败:`, error.message);
      // 为失败的批次添加空结果
      analyses.push(...batch.map(address => ({
        address,
        totalValue: 0,
        utxoCount: 0,
        averageUtxoValue: 0,
        hasRareUtxos: false
      })));
    }
  }

  return analyses;
}
```

### 2. 代币持有者分析

```typescript
interface TokenHolderAnalysis {
  ticker: string;
  totalHolders: number;
  topHolders: Array<{
    address: string;
    balance: string;
    percentage: number;
  }>;
  distribution: {
    top1Percent: number;
    top10Percent: number;
    top100Holders: number;
  };
}

async function analyzeTokenHolders(ticker: string): Promise<TokenHolderAnalysis> {
  try {
    // 获取基本信息
    const [tickerInfo, holders] = await Promise.all([
      satsnet.getTickerInfo(ticker),
      satsnet.getTickerHolders(ticker, 0, 1000) // 获取前1000个持有者
    ]);

    // 计算分布
    const totalSupply = parseFloat(tickerInfo.maxSupply);
    const totalHolders = holders.length;

    // 计算百分比
    const holdersWithPercentage = holders.map(holder => ({
      ...holder,
      percentage: (parseFloat(holder.balance) / totalSupply) * 100
    }));

    // 排序并分析分布
    const sortedHolders = holdersWithPercentage.sort((a, b) => b.percentage - a.percentage);

    const top10Holders = sortedHolders.slice(0, 10);
    const top100Holders = sortedHolders.slice(0, 100);

    const top1Percent = sortedHolders
      .slice(0, Math.ceil(totalHolders * 0.01))
      .reduce((sum, holder) => sum + holder.percentage, 0);

    const top10Percent = sortedHolders
      .slice(0, Math.ceil(totalHolders * 0.1))
      .reduce((sum, holder) => sum + holder.percentage, 0);

    return {
      ticker,
      totalHolders,
      topHolders: top10Holders,
      distribution: {
        top1Percent,
        top10Percent,
        top100Holders: top100Holders.length
      }
    };
  } catch (error) {
    console.error(`分析代币 ${ticker} 失败:`, error.message);
    throw error;
  }
}
```

## 网络配置

### 1. 多网络客户端

```typescript
class MultiNetworkClient {
  private clients: Map<Network, SatsNetClient> = new Map();

  constructor(baseConfig: Partial<ApiConfig> = {}) {
    // 为每个网络创建客户端
    const networks: Network[] = ['mainnet', 'testnet', 'livenet'];

    networks.forEach(network => {
      this.clients.set(network, new SatsNetClient({
        ...baseConfig,
        network
      }));
    });
  }

  async getUtxosOnAllNetworks(address: string): Promise<Record<Network, any>> {
    const results = {} as Record<Network, any>;

    await Promise.all(
      Array.from(this.clients.entries()).map(async ([network, client]) => {
        try {
          results[network] = await client.getUtxos(address);
        } catch (error) {
          console.error(`${network} 网络请求失败:`, error.message);
          results[network] = { plainutxos: [], total: 0 };
        }
      })
    );

    return results;
  }

  async findBestNetworkForAddress(address: string): Promise<Network> {
    const results = await this.getUtxosOnAllNetworks(address);

    // 找到有最多UTXO的网络
    let bestNetwork: Network = 'mainnet';
    let maxUtxos = 0;

    Object.entries(results).forEach(([network, utxos]) => {
      if (utxos.plainutxos.length > maxUtxos) {
        maxUtxos = utxos.plainutxos.length;
        bestNetwork = network as Network;
      }
    });

    return bestNetwork;
  }
}

// 使用多网络客户端
const multiNetworkClient = new MultiNetworkClient({
  timeout: 15000,
  retries: 3
});

async function multiNetworkExample(address: string) {
  const allNetworkResults = await multiNetworkClient.getUtxosOnAllNetworks(address);
  const bestNetwork = await multiNetworkClient.findBestNetworkForAddress(address);

  console.log('所有网络结果:', allNetworkResults);
  console.log('最佳网络:', bestNetwork);
}
```

### 2. 自定义端点配置

```typescript
interface CustomEndpoint {
  name: string;
  baseUrl: string;
  priority: number;
  healthCheck?: string;
}

class FailoverClient {
  private endpoints: CustomEndpoint[] = [];
  private currentEndpoint = 0;
  private healthyEndpoints = new Set<string>();

  constructor(endpoints: CustomEndpoint[]) {
    this.endpoints = endpoints.sort((a, b) => b.priority - a.priority);
  }

  private async createClientForEndpoint(endpoint: CustomEndpoint): Promise<SatsNetClient> {
    return new SatsNetClient({
      baseUrl: endpoint.baseUrl,
      network: 'mainnet',
      timeout: 10000
    });
  }

  async executeWithFailover<T>(operation: (client: SatsNetClient) => Promise<T>): Promise<T> {
    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.endpoints[i];

      try {
        const client = await this.createClientForEndpoint(endpoint);

        // 如果有健康检查端点，先检查健康状态
        if (endpoint.healthCheck && !this.healthyEndpoints.has(endpoint.name)) {
          await client.healthCheck();
          this.healthyEndpoints.add(endpoint.name);
        }

        const result = await operation(client);
        return result;

      } catch (error) {
        console.error(`端点 ${endpoint.name} 失败:`, error.message);
        this.healthyEndpoints.delete(endpoint.name);

        // 如果不是最后一个端点，继续尝试下一个
        if (i < this.endpoints.length - 1) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('所有端点都不可用');
  }
}

// 配置多个端点
const failoverClient = new FailoverClient([
  {
    name: 'primary',
    baseUrl: 'https://api.satsnet.io/{network}',
    priority: 10,
    healthCheck: '/health'
  },
  {
    name: 'backup',
    baseUrl: 'https://backup.satsnet.io/{network}',
    priority: 5
  },
  {
    name: 'fallback',
    baseUrl: 'https://api.fallback.io/{network}',
    priority: 1
  }
]);

async function failoverExample(address: string) {
  try {
    const utxos = await failoverClient.executeWithFailover(
      client => client.getUtxos(address)
    );

    console.log('成功获取UTXO:', utxos);
    return utxos;
  } catch (error) {
    console.error('所有端点都失败:', error.message);
    throw error;
  }
}
```

## 监控和日志

### 1. 请求监控

```typescript
interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

class RequestMonitor {
  private metrics: RequestMetrics[] = [];
  private maxMetrics = 1000;

  record(metric: RequestMetrics): void {
    this.metrics.push(metric);

    // 保持最近的1000条记录
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getStats(timeWindow = 300000): { // 默认5分钟窗口
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow);

    const recentMetrics = this.metrics.filter(m => m.timestamp >= windowStart);

    const totalRequests = recentMetrics.length;
    const successRequests = recentMetrics.filter(m => m.success).length;
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);

    return {
      totalRequests,
      successRequests,
      errorRequests: totalRequests - successRequests,
      successRate: totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0,
      averageDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
      requestsPerMinute: (totalRequests / timeWindow) * 60000
    };
  }

  getErrors(timeWindow = 300000): string[] {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindow);

    return this.metrics
      .filter(m => !m.success && m.timestamp >= windowStart && m.error)
      .map(m => m.error!);
  }
}

const monitor = new RequestMonitor();

// 包装客户端以添加监控
class MonitoredSatsNetClient {
  constructor(private client: SatsNetClient) {}

  private async monitorRequest<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      const result = await fn();

      monitor.record({
        url: operation,
        method: 'GET',
        duration: Date.now() - startTime,
        success: true,
        timestamp
      });

      return result;
    } catch (error) {
      monitor.record({
        url: operation,
        method: 'GET',
        duration: Date.now() - startTime,
        success: false,
        error: error.message,
        timestamp
      });

      throw error;
    }
  }

  async getUtxos(address: string, network?: Network) {
    return this.monitorRequest(`getUtxos(${address})`,
      () => this.client.getUtxos(address, network));
  }

  async getRecommendedFees(network?: Network) {
    return this.monitorRequest('getRecommendedFees',
      () => this.client.getRecommendedFees(network));
  }

  // ... 其他方法的包装
}

// 使用监控客户端
const monitoredClient = new MonitoredSatsNetClient(satsnet);

// 定期输出统计信息
setInterval(() => {
  const stats = monitor.getStats();
  const errors = monitor.getErrors();

  console.log('API 统计信息 (最近5分钟):');
  console.log(`  总请求数: ${stats.totalRequests}`);
  console.log(`  成功率: ${stats.successRate.toFixed(2)}%`);
  console.log(`  平均响应时间: ${stats.averageDuration.toFixed(2)}ms`);
  console.log(`  每分钟请求数: ${stats.requestsPerMinute.toFixed(2)}`);

  if (errors.length > 0) {
    console.log('最近的错误:');
    errors.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }
}, 60000); // 每分钟输出一次
```

## 下一步

- 查看 [示例代码库](../../examples/) 了解更多实际应用
- 阅读 [贡献指南](../../CONTRIBUTING.md) 了解如何参与开发
- 查看 [性能测试](../../tests/performance/) 了解性能基准

## 最佳实践总结

1. **错误处理**: 使用 tryit 函数或安全客户端进行错误处理
2. **性能优化**: 启用 HTTP/2、配置连接池、使用批量请求
3. **限流控制**: 实现请求限流避免达到API限制
4. **缓存策略**: 对频繁请求的数据使用缓存
5. **监控告警**: 实现请求监控和统计
6. **故障转移**: 配置多个API端点实现高可用性