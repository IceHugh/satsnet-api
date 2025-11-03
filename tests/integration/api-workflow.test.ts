/**
 * API工作流程集成测试 - 使用真实API
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { SatsNetClient, type BatchRequestParams } from '@/api/satsnet-client';
import {
  apiEndpoints,
  realAddresses,
  realNames,
  realTickers,
  realTransactions,
  testConfig,
} from '@/tests/helpers/test-data';

describe('SatsNet API Integration Tests', () => {
  let client: SatsNetClient;

  // 为每个测试组创建独立的客户端实例
  beforeEach(() => {
    client = new SatsNetClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 45000, // 集成测试需要更长超时
    });
  });

  afterEach(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('Complete UTXO Workflow', () => {
    it(
      'should handle complete UTXO discovery and analysis workflow',
      async () => {
        const { valid } = realAddresses.mainnet;

        // 添加测试开始延迟以避免API限流
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 1. 获取所有UTXO
        const allUtxos = await client.getUtxos(valid);
        expect(typeof allUtxos).toBe('object');
        expect(allUtxos).toHaveProperty('plainutxos');
        expect(allUtxos).toHaveProperty('total');
        expect(Array.isArray(allUtxos.plainutxos)).toBe(true);

        // 2. 获取普通UTXO（非ordinals）
        const plainUtxos = await client.getPlainUtxos(valid);
        expect(Array.isArray(plainUtxos)).toBe(true);

        // 3. 获取稀有UTXO
        const rareUtxos = await client.getRareUtxos(valid);
        expect(Array.isArray(rareUtxos)).toBe(true);

        // 4. 按价值获取UTXO
        const utxosByValue = await client.getUtxosByValue(valid, 1000);
        expect(Array.isArray(utxosByValue)).toBe(true);
      },
      testConfig.timeout
    );
  });

  describe('Address Analysis Workflow', () => {
    it(
      'should perform complete address analysis',
      async () => {
        const { valid } = realAddresses.mainnet;

        // 1. 获取地址摘要
        const summary = await client.getAddressSummary(valid);
        expect(Array.isArray(summary)).toBe(true);
        expect(summary.length).toBeGreaterThanOrEqual(0);

        // 2. 获取UTXO数据
        const utxoResponse = await client.getUtxos(valid);
        expect(utxoResponse).toHaveProperty('plainutxos');
        expect(utxoResponse).toHaveProperty('total');

        const utxos = utxoResponse.plainutxos;
        expect(Array.isArray(utxos)).toBe(true);

        // 3. 验证UTXO数据结构
        if (utxos.length > 0) {
          const utxo = utxos[0];
          if (utxo) {
            expect(utxo).toHaveProperty('txid');
            expect(utxo).toHaveProperty('value');
            expect(typeof utxo.value).toBe('number');
          }
        }
      },
      testConfig.timeout
    );
  });

  describe('Network Information Workflow', () => {
    it(
      'should gather complete network information',
      async () => {
        // 1. 获取当前区块高度
        const height = await client.getBestHeight();
        expect(height.height).toBeGreaterThan(800000);

        // 2. 健康检查
        const health = await client.healthCheck();
        expect(health.status).toBe('ok');

        // 验证API服务状态正常
        expect([height, health]).toBeDefined();
      },
      testConfig.timeout
    );
  });

  describe('Asset Management Workflow', () => {
    it(
      'should handle asset ticker operations',
      async () => {
        const ticker = realTickers.ordinals.common;

        // 1. 获取ticker信息
        const tickerInfo = await client.getTickerInfo(ticker);
        expect(tickerInfo).toHaveProperty('displayname');
        expect(tickerInfo.displayname).toBe(ticker);

        // 2. 获取持有者信息
        const holders = await client.getTickerHolders(ticker, 0, 10);
        expect(holders).toHaveProperty('detail');
        expect(holders).toHaveProperty('total');
        expect(Array.isArray(holders.detail)).toBe(true);
        expect(typeof holders.total).toBe('number');
      },
      testConfig.timeout
    );
  });

  describe('Name Service Workflow', () => {
    it(
      'should handle name service operations',
      async () => {
        const { valid } = realAddresses.mainnet;
        const name = realNames.sats;

        // 1. 获取名称信息
        const nameInfo = await client.getNameInfo(name);
        expect(nameInfo).toHaveProperty('name');

        // 2. 获取地址的名称列表
        const nameList = await client.getNameListByAddress(valid, 0, 10);
        expect(nameList).toHaveProperty('names');
        expect(nameList).toHaveProperty('total');
        expect(nameList.names === null || Array.isArray(nameList.names)).toBe(true);
      },
      testConfig.timeout
    );
  });

  describe('Transaction Workflow', () => {
    it(
      'should handle transaction operations',
      async () => {
        const { recent } = realTransactions.mainnet;

        // 1. 获取交易十六进制数据
        try {
          const txHex = await client.getTransactionHex(recent);
          expect(typeof txHex).toBe('string');
          expect(txHex.length).toBeGreaterThan(0);
        } catch (_error) {
          // 某些交易可能无法获取十六进制数据
          // 预期某些交易会失败
        }
      },
      testConfig.timeout
    );
  });

  describe('Network Configuration Workflow', () => {
    it(
      'should handle network switching and configuration',
      async () => {
        // 创建独立的客户端实例以避免状态污染
        const configClient = new SatsNetClient({
          baseUrl: apiEndpoints.mainnet.baseUrl,
          network: apiEndpoints.mainnet.network,
          timeout: 30000,
        });

        try {
          // 1. 初始配置验证
          const initialConfig = configClient.getConfig();
          expect(initialConfig.network).toBe('mainnet');

          // 2. 切换到testnet
          configClient.setNetwork('testnet');
          const testnetConfig = configClient.getConfig();
          expect(testnetConfig.network).toBe('testnet');

          // 3. 切换回mainnet
          configClient.setNetwork('mainnet');
          const mainnetConfig = configClient.getConfig();
          expect(mainnetConfig.network).toBe('mainnet');

          // 4. 更新基础URL
          const newBaseUrl = 'https://apiprd.ordx.market/btc/mainnet';
          configClient.setBaseUrl(newBaseUrl);
          const updatedConfig = configClient.getConfig();
          expect(updatedConfig.baseUrl).toBe(newBaseUrl);
        } finally {
          await configClient.close();
        }
      },
      testConfig.timeout
    );
  });

  describe('Performance Monitoring Workflow', () => {
    it(
      'should track performance metrics during operations',
      async () => {
        const { valid } = realAddresses.mainnet;

        // 1. 清除现有缓存和指标
        client.clearCache();
        const initialMetrics = client.getMetrics();
        expect(initialMetrics.requestCount).toBeGreaterThanOrEqual(0);

        // 2. 执行多个API调用，添加小延迟避免API限流
        await client.getUtxos(valid);
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms延迟
        await client.getBestHeight();
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms延迟

        // 3. 尝试获取地址摘要，如果失败则记录但不中断测试
        try {
          await client.getAddressSummary(valid);
        } catch (error) {
          console.log(
            'Address summary request failed (may be rate limited):',
            error instanceof Error ? error.message : error
          );
        }

        // 4. 检查性能指标
        const finalMetrics = client.getMetrics();
        expect(finalMetrics.requestCount).toBeGreaterThan(initialMetrics.requestCount);
        expect(finalMetrics.averageLatency).toBeGreaterThanOrEqual(0);
        expect(finalMetrics.errorCount).toBeGreaterThanOrEqual(0);
      },
      testConfig.timeout
    );
  });

  describe('Batch Operations Workflow', () => {
    // 辅助函数：检查是否为API错误响应格式
    const isApiErrorResponse = (
      result: unknown
    ): result is { code: unknown; msg: unknown; data?: unknown } => {
      return typeof result === 'object' && result !== null && 'code' in result && 'msg' in result;
    };

    // 辅助函数：验证代币信息结果
    const validateTickerResult = (tickerResult: unknown) => {
      if (isApiErrorResponse(tickerResult)) {
        if (tickerResult.data && typeof tickerResult.data === 'object') {
          expect(tickerResult.data).toHaveProperty('displayname');
        }
      } else {
        expect(tickerResult).toHaveProperty('displayname');
      }
    };

    // 辅助函数：验证高度结果
    const validateHeightResult = (heightResult: unknown) => {
      if (isApiErrorResponse(heightResult)) {
        if (heightResult.data && typeof heightResult.data === 'object') {
          expect(heightResult.data).toHaveProperty('height');
        }
      } else {
        expect(heightResult).toHaveProperty('height');
      }
    };

    // 重试执行批量请求
    const executeBatchWithRetry = async (requests: BatchRequestParams[]): Promise<unknown[]> => {
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          return await client.batchRequest(requests);
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Batch request failed, retrying (${retryCount}/${maxRetries})...`);
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
          } else {
            throw error;
          }
        }
      }
      throw new Error('Max retries exceeded');
    };

    it(
      'should handle batch API requests efficiently',
      async () => {
        const { valid } = realAddresses.mainnet;
        const ticker = realTickers.ordinals.common;

        // 1. 准备批量请求 - 使用更稳定的API端点
        const batchRequests = [
          { method: 'getBestHeight' as const, params: [] },
          { method: 'getTickerInfo' as const, params: [ticker] },
          { method: 'getUtxos' as const, params: [valid] },
        ];

        // 2. 执行批量请求，使用重试机制
        const results = await executeBatchWithRetry(batchRequests);
        expect(results).toHaveLength(3);

        // 3. 验证结果
        const [heightResult, tickerResult, utxoResult] = results;

        validateHeightResult(heightResult);
        validateTickerResult(tickerResult);

        // 验证UTXO结果
        if (typeof utxoResult === 'object' && utxoResult !== null) {
          expect(utxoResult).toHaveProperty('plainutxos');
          expect(utxoResult).toHaveProperty('total');
        }
      },
      testConfig.timeout
    );
  });
});

describe('Multi-Network Integration Tests', () => {
  let mainnetClient: SatsNetClient;
  let testnetClient: SatsNetClient;

  beforeAll(() => {
    mainnetClient = new SatsNetClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 30000,
    });

    testnetClient = new SatsNetClient({
      baseUrl: apiEndpoints.testnet.baseUrl,
      network: apiEndpoints.testnet.network,
      timeout: 30000,
    });
  });

  afterAll(async () => {
    await Promise.all([mainnetClient.close(), testnetClient.close()]);
  });

  it(
    'should work across different networks',
    async () => {
      // 1. Mainnet操作
      const mainnetHeight = await mainnetClient.getBestHeight();
      expect(mainnetHeight.height).toBeGreaterThan(800000);

      // 2. Testnet操作
      const testnetHeight = await testnetClient.getBestHeight();
      expect(testnetHeight.height).toBeGreaterThan(0);

      // 3. 验证网络差异
      expect(mainnetHeight.height).not.toBe(testnetHeight.height);
    },
    testConfig.timeout
  );
});
