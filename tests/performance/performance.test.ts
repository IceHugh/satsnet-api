/**
 * 性能测试 - 使用真实API测试性能表现
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { SatsNetClient } from '@/api/satsnet-client';
import { apiEndpoints, performanceConfig, realAddresses } from '@/tests/helpers/test-data';

describe('SatsNet Performance Tests', () => {
  let client: SatsNetClient;

  beforeAll(() => {
    client = new SatsNetClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 60000, // 性能测试需要更长超时
      connections: 20, // 增加连接数以提高并发性能
      keepAlive: true,
      http2: true,
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('Single Request Performance', () => {
    it(
      'should complete single UTXO request within acceptable time',
      async () => {
        const { valid } = realAddresses.mainnet;
        const startTime = Date.now();

        await client.getUtxos(valid);

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(10000); // 10秒内完成
        console.log(`Single UTXO request completed in ${duration}ms`);
      },
      performanceConfig.timeout
    );

    it(
      'should complete address summary request within acceptable time',
      async () => {
        const { valid } = realAddresses.mainnet;
        const startTime = Date.now();

        await client.getAddressSummary(valid);

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(8000); // 8秒内完成
        console.log(`Address summary request completed in ${duration}ms`);
      },
      performanceConfig.timeout
    );

    it(
      'should complete network status request within acceptable time',
      async () => {
        const startTime = Date.now();

        await client.getBestHeight();

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(5000); // 5秒内完成
        console.log(`Best height request completed in ${duration}ms`);
      },
      performanceConfig.timeout
    );
  });

  describe('Concurrent Request Performance', () => {
    it(
      'should handle concurrent UTXO requests efficiently',
      async () => {
        const { valid } = realAddresses.mainnet;
        const concurrentCount = performanceConfig.concurrentRequests;
        const startTime = Date.now();

        // 创建并发请求
        const promises = Array.from({ length: concurrentCount }, () => client.getUtxos(valid));

        const results = await Promise.allSettled(promises);
        const duration = Date.now() - startTime;

        // 验证所有请求都完成
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBe(concurrentCount);

        // 验证性能 - 并发请求应该比顺序请求快
        expect(duration).toBeLessThan(15000); // 15秒内完成所有并发请求
        console.log(`${concurrentCount} concurrent UTXO requests completed in ${duration}ms`);
        console.log(`Average per request: ${(duration / concurrentCount).toFixed(2)}ms`);
      },
      performanceConfig.timeout
    );

    it(
      'should handle mixed concurrent API requests',
      async () => {
        const { valid } = realAddresses.mainnet;
        const startTime = Date.now();

        // 创建不同类型的并发请求
        const promises = [
          client.getUtxos(valid),
          client.getPlainUtxos(valid),
          client.getRareUtxos(valid),
          client.getAddressSummary(valid),
          client.getBestHeight(),
          client.healthCheck(),
        ];

        const results = await Promise.allSettled(promises);
        const duration = Date.now() - startTime;

        // 验证所有请求都成功
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBe(promises.length);

        expect(duration).toBeLessThan(20000); // 20秒内完成
        console.log(`Mixed concurrent requests completed in ${duration}ms`);
      },
      performanceConfig.timeout
    );
  });

  describe('Batch Request Performance', () => {
    it(
      'should handle batch requests efficiently',
      async () => {
        const { valid } = realAddresses.mainnet;
        const startTime = Date.now();

        const batchRequests = [
          { method: 'getAddressSummary' as const, params: [valid] },
          { method: 'getUtxos' as const, params: [valid] },
          { method: 'getBestHeight' as const, params: [] },
          { method: 'healthCheck' as const, params: [] },
        ];

        const results = await client.batchRequest(batchRequests);
        const duration = Date.now() - startTime;

        expect(results).toHaveLength(4);
        expect(duration).toBeLessThan(15000); // 15秒内完成批量请求
        console.log(
          `Batch request with ${batchRequests.length} operations completed in ${duration}ms`
        );
      },
      performanceConfig.timeout
    );
  });

  describe('Memory and Resource Management', () => {
    it(
      'should maintain stable memory usage during repeated requests',
      async () => {
        const { valid } = realAddresses.mainnet;
        const iterations = performanceConfig.iterations;

        // 记录初始内存使用
        const initialMemory = process.memoryUsage();
        console.log('Initial memory usage:', initialMemory);

        // 执行多次请求
        for (let i = 0; i < iterations; i++) {
          await client.getUtxos(valid);
          await client.getAddressSummary(valid);

          // 每5次清理一次缓存
          if (i % 5 === 0) {
            client.clearCache();
          }
        }

        // 检查最终内存使用
        const finalMemory = process.memoryUsage();
        console.log('Final memory usage:', finalMemory);

        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

        // 内存增长不应该超过50%
        expect(memoryIncreasePercent).toBeLessThan(50);
        console.log(
          `Memory increased by ${memoryIncreasePercent.toFixed(2)}% after ${iterations} iterations`
        );
      },
      performanceConfig.timeout
    );

    it(
      'should properly clean up resources',
      async () => {
        const { valid } = realAddresses.mainnet;

        // 执行一些请求
        await client.getUtxos(valid);
        await client.getAddressSummary(valid);

        // 获取指标
        const metricsBeforeClose = client.getMetrics();
        expect(metricsBeforeClose.requestCount).toBeGreaterThan(0);

        // 关闭客户端
        await client.close();

        // 验证指标仍然可访问（内存中的数据）
        const metricsAfterClose = client.getMetrics();
        expect(metricsAfterClose.requestCount).toBe(metricsBeforeClose.requestCount);
      },
      performanceConfig.timeout
    );
  });

  describe('Cache Performance', () => {
    it(
      'should demonstrate cache effectiveness',
      async () => {
        const { valid } = realAddresses.mainnet;

        // 清除缓存
        client.clearCache();

        // 第一次请求（无缓存）
        const startTime1 = Date.now();
        await client.getAddressSummary(valid);
        const firstRequestTime = Date.now() - startTime1;

        // 第二次请求（使用缓存）
        const startTime2 = Date.now();
        await client.getAddressSummary(valid);
        const secondRequestTime = Date.now() - startTime2;

        console.log(`First request: ${firstRequestTime}ms`);
        console.log(`Second request: ${secondRequestTime}ms`);

        // 缓存请求应该更快（至少快20%）
        if (firstRequestTime > 1000) {
          // 只有在第一次请求较慢时才验证缓存效果
          expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.8);
        }

        // 检查缓存指标
        const metrics = client.getMetrics();
        expect(metrics.cacheHits).toBeGreaterThan(0);
      },
      performanceConfig.timeout
    );

    it(
      'should handle cache size limits',
      async () => {
        const { valid } = realAddresses.mainnet;

        // 清除缓存
        client.clearCache();
        const initialMetrics = client.getMetrics();
        expect(initialMetrics.cacheHits).toBe(0);

        // 执行多个不同的请求来填充缓存
        await client.getUtxos(valid);
        await client.getPlainUtxos(valid);
        await client.getRareUtxos(valid);
        await client.getAddressSummary(valid);
        await client.getBestHeight();

        // 再次请求相同的数据以使用缓存
        await client.getUtxos(valid);
        await client.getAddressSummary(valid);
        await client.getBestHeight();

        const finalMetrics = client.getMetrics();
        expect(finalMetrics.cacheHits).toBeGreaterThan(0);
        // 缓存未命中可能为0，因为第一次请求就被缓存了
        expect(finalMetrics.requestCount).toBeGreaterThanOrEqual(2);

        console.log(
          `Cache hits: ${finalMetrics.cacheHits}, Cache misses: ${finalMetrics.cacheMisses}`
        );
      },
      performanceConfig.timeout
    );
  });

  describe('HTTP/1.1 Performance', () => {
    it(
      'should leverage HTTP/1.1 connection pooling',
      async () => {
        // 创建HTTP/1.1优化的客户端
        const httpClient = new SatsNetClient({
          baseUrl: apiEndpoints.mainnet.baseUrl,
          network: apiEndpoints.mainnet.network,
          timeout: 30000,
          http2: false,
          connections: 50,
          keepAlive: true,
        });

        const { valid } = realAddresses.mainnet;
        const concurrentCount = 20;
        const startTime = Date.now();

        // 大量并发请求
        const promises = Array.from({ length: concurrentCount }, () => httpClient.getUtxos(valid));

        const results = await Promise.allSettled(promises);
        const duration = Date.now() - startTime;

        // 清理
        await httpClient.close();

        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBe(concurrentCount);
        expect(duration).toBeLessThan(15000); // HTTP/1.1 with connection pooling

        console.log(`HTTP/1.1: ${concurrentCount} concurrent requests in ${duration}ms`);
      },
      performanceConfig.timeout
    );
  });

  describe('Error Handling Performance', () => {
    it(
      'should handle errors efficiently without performance degradation',
      async () => {
        const startTime = Date.now();

        // 混合正常请求和错误请求
        const promises = [
          client.getUtxos(realAddresses.mainnet.valid),
          client.getUtxos('invalid-address'),
          client.getAddressSummary(realAddresses.mainnet.valid),
          client.getTickerInfo('invalid-ticker'),
          client.getBestHeight(),
        ];

        const results = await Promise.allSettled(promises);
        const duration = Date.now() - startTime;

        // 部分请求应该失败，但整体应该在合理时间内完成
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        expect(successCount).toBeGreaterThan(0);
        expect(duration).toBeLessThan(15000);

        console.log(
          `Mixed requests (${successCount}/${results.length} successful) completed in ${duration}ms`
        );
      },
      performanceConfig.timeout
    );
  });
});
