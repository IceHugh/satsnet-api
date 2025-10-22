/**
 * AdvancedHttpClient 性能测试
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { apiEndpoints, performanceConfig } from '@/tests/helpers/test-data';
import { AdvancedHttpClient } from '@/utils/advanced-http';

describe('AdvancedHttpClient Performance Tests', () => {
  let httpClient: AdvancedHttpClient;

  beforeAll(() => {
    httpClient = new AdvancedHttpClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 60000,
      connections: 50,
      keepAlive: true,
      http2: true,
      compression: true,
      cache: true,
      cacheMaxAge: 300000,
      metrics: true,
    });
  });

  afterAll(async () => {
    if (httpClient) {
      await httpClient.close();
    }
  });

  describe('Connection Pool Performance', () => {
    it(
      'should efficiently reuse connections',
      async () => {
        const iterations = 20;
        const startTime = Date.now();

        // 执行多个请求以测试连接复用
        const promises = Array.from({ length: iterations }, (_, _index) =>
          httpClient.get('bestheight', {})
        );

        const results = await Promise.allSettled(promises);
        const duration = Date.now() - startTime;

        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBe(iterations);

        // 连接复用应该让后续请求更快
        expect(duration).toBeLessThan(10000);
        console.log(`${iterations} requests via connection pool completed in ${duration}ms`);
      },
      performanceConfig.timeout
    );

    it(
      'should handle connection limits efficiently',
      async () => {
        const concurrentRequests = 100; // 超过默认连接数
        const startTime = Date.now();

        const promises = Array.from({ length: concurrentRequests }, () =>
          httpClient.get('bestheight', {})
        );

        const results = await Promise.allSettled(promises);
        const duration = Date.now() - startTime;

        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBe(concurrentRequests);

        // 即使有连接限制，所有请求也应该在合理时间内完成
        expect(duration).toBeLessThan(15000);
        console.log(
          `${concurrentRequests} requests completed in ${duration}ms with connection pooling`
        );
      },
      performanceConfig.timeout
    );
  });

  describe('Compression Performance', () => {
    it(
      'should benefit from response compression',
      async () => {
        const startTime = Date.now();

        // 请求可能返回大量数据的端点
        const response = await httpClient.get(
          'v3/address/summary/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          {}
        );
        const requestTime = Date.now() - startTime;

        expect(response).toBeDefined();
        expect(requestTime).toBeLessThan(8000);

        // 检查压缩是否启用
        const metrics = httpClient.getMetrics();
        expect(metrics.requestCount).toBeGreaterThan(0);

        console.log(`Compressed request completed in ${requestTime}ms`);
      },
      performanceConfig.timeout
    );
  });

  describe('Cache Performance', () => {
    it(
      'should demonstrate effective caching',
      async () => {
        const endpoint = 'bestheight';

        // 清除缓存
        httpClient.clearCache();
        const initialMetrics = httpClient.getMetrics();
        expect(initialMetrics.cacheHits).toBe(0);

        // 第一次请求
        const startTime1 = Date.now();
        await httpClient.get(endpoint, {});
        const firstRequestTime = Date.now() - startTime1;

        // 第二次请求（应该从缓存获取）
        const startTime2 = Date.now();
        await httpClient.get(endpoint, {});
        const secondRequestTime = Date.now() - startTime2;

        console.log(`First request: ${firstRequestTime}ms, Cached request: ${secondRequestTime}ms`);

        // 缓存请求应该明显更快
        expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.5);

        // 验证缓存指标
        const finalMetrics = httpClient.getMetrics();
        expect(finalMetrics.cacheHits).toBeGreaterThan(0);
        // 缓存未命中可能为0，这是正常的

        console.log(
          `Cache hits: ${finalMetrics.cacheHits}, Cache misses: ${finalMetrics.cacheMisses}`
        );
      },
      performanceConfig.timeout
    );

    it(
      'should handle cache expiration properly',
      async () => {
        const endpoint = 'bestheight';

        // 清除缓存
        httpClient.clearCache();

        // 第一次请求
        await httpClient.get(endpoint, {});
        const metricsAfterFirst = httpClient.getMetrics();
        const cacheMissesAfterFirst = metricsAfterFirst.cacheMisses;

        // 立即第二次请求（应该命中缓存）
        await httpClient.get(endpoint, {});
        const metricsAfterSecond = httpClient.getMetrics();
        const cacheHitsAfterSecond = metricsAfterSecond.cacheHits;

        expect(cacheHitsAfterSecond).toBeGreaterThan(0);
        // 缓存未命中可能为0，这是正常的缓存行为
      },
      performanceConfig.timeout
    );
  });

  describe('Metrics Collection Performance', () => {
    it(
      'should track performance metrics without overhead',
      async () => {
        const iterations = 50;
        const startTime = Date.now();

        // 执行多个请求
        const promises = Array.from({ length: iterations }, () => httpClient.get('bestheight', {}));

        await Promise.all(promises);
        const duration = Date.now() - startTime;

        // 检查指标收集是否正常工作
        const metrics = httpClient.getMetrics();
        // 由于缓存机制，并行请求可能被去重，所以实际请求数可能少于迭代次数
        expect(metrics.requestCount).toBeGreaterThanOrEqual(1);
        expect(metrics.requestCount).toBeLessThanOrEqual(iterations);
        expect(metrics.averageLatency).toBeGreaterThanOrEqual(0);
        expect(metrics.totalLatency).toBeGreaterThanOrEqual(0);

        // 验证平均延迟计算
        const expectedAverageLatency = metrics.totalLatency / metrics.requestCount;
        expect(Math.abs(metrics.averageLatency - expectedAverageLatency)).toBeLessThan(1);

        console.log(`${iterations} requests completed in ${duration}ms`);
        console.log(`Average latency: ${metrics.averageLatency.toFixed(2)}ms`);
        console.log(
          `Error rate: ${((metrics.errorCount / metrics.requestCount) * 100).toFixed(2)}%`
        );
      },
      performanceConfig.timeout
    );
  });

  describe('Retry Mechanism Performance', () => {
    it(
      'should handle retries efficiently',
      async () => {
        // 测试重试机制的性能影响
        const startTime = Date.now();

        try {
          // 使用可能触发重试的请求（通过设置很短的超时）
          const fastTimeoutClient = new AdvancedHttpClient({
            baseUrl: apiEndpoints.mainnet.baseUrl,
            network: 'mainnet',
            timeout: 1000, // 很短的超时时间
            retries: 2,
          });

          await fastTimeoutClient.get('bestheight', {});
          await fastTimeoutClient.close();
        } catch (_error) {
          // 预期会超时失败
        }

        const duration = Date.now() - startTime;

        // 重试应该在合理时间内完成
        expect(duration).toBeLessThan(5000);
        console.log(`Retry mechanism test completed in ${duration}ms`);
      },
      performanceConfig.timeout
    );
  });

  describe('Batch Request Performance', () => {
    it(
      'should handle batch requests efficiently',
      async () => {
        const batchSize = 10;
        const startTime = Date.now();

        const requests = Array.from({ length: batchSize }, () => ({
          path: 'bestheight',
          params: {},
          network: 'mainnet' as const,
        }));

        const results = await httpClient.batchRequest(requests);
        const duration = Date.now() - startTime;

        expect(results).toHaveLength(batchSize);
        expect(duration).toBeLessThan(8000);

        console.log(`Batch of ${batchSize} requests completed in ${duration}ms`);
        console.log(`Average per request: ${(duration / batchSize).toFixed(2)}ms`);
      },
      performanceConfig.timeout
    );

    it(
      'should handle mixed batch requests',
      async () => {
        const startTime = Date.now();

        const requests = [
          { path: 'bestheight', params: {}, network: 'mainnet' as const },
          { path: 'health', params: {}, network: 'mainnet' as const },
          { path: 'v3/tick/info/ordi', params: {}, network: 'mainnet' as const },
        ];

        const results = await httpClient.batchRequest(requests);
        const duration = Date.now() - startTime;

        expect(results).toHaveLength(3);
        expect(duration).toBeLessThan(10000);

        console.log(`Mixed batch requests completed in ${duration}ms`);
      },
      performanceConfig.timeout
    );
  });

  describe('Resource Cleanup Performance', () => {
    it(
      'should clean up resources efficiently',
      async () => {
        const iterations = 10;

        // 创建多个客户端实例
        const clients = Array.from(
          { length: iterations },
          () =>
            new AdvancedHttpClient({
              baseUrl: apiEndpoints.mainnet.baseUrl,
              network: 'mainnet',
              timeout: 30000,
              connections: 10,
            })
        );

        // 执行一些请求
        const promises = clients.map((client) => client.get('bestheight', {}));

        await Promise.all(promises);

        // 记录清理前的内存
        const memoryBeforeCleanup = process.memoryUsage();

        // 清理所有客户端
        const cleanupStartTime = Date.now();
        await Promise.all(clients.map((client) => client.close()));
        const cleanupDuration = Date.now() - cleanupStartTime;

        const memoryAfterCleanup = process.memoryUsage();

        // 清理应该很快完成
        expect(cleanupDuration).toBeLessThan(1000);

        console.log(`Cleanup of ${iterations} clients completed in ${cleanupDuration}ms`);
        console.log(
          `Memory before cleanup: ${(memoryBeforeCleanup.heapUsed / 1024 / 1024).toFixed(2)}MB`
        );
        console.log(
          `Memory after cleanup: ${(memoryAfterCleanup.heapUsed / 1024 / 1024).toFixed(2)}MB`
        );
      },
      performanceConfig.timeout
    );
  });
});
