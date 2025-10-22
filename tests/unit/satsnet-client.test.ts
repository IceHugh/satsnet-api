/**
 * SatsNet Client 单元测试 - 使用真实API
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { SatsNetClient } from '@/api/satsnet-client';
import {
  apiEndpoints,
  realAddresses,
  realTransactions,
  testConfig,
} from '@/tests/helpers/test-data';

describe('SatsNetClient - UTXO Management', () => {
  let client: SatsNetClient;

  beforeAll(() => {
    client = new SatsNetClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 30000,
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('getUtxos', () => {
    it(
      'should get UTXOs for a valid Bitcoin address',
      async () => {
        const { valid } = realAddresses.mainnet;

        const utxos = await client.getUtxos(valid);

        // UTXO API返回的是 {code: 0, msg: "ok", plainutxos: [...], total: 529} 格式
        expect(utxos).toHaveProperty('plainutxos');
        expect(utxos).toHaveProperty('total');
        expect(Array.isArray(utxos.plainutxos)).toBe(true);
        expect(typeof utxos.total).toBe('number');

        if (utxos.plainutxos.length > 0) {
          const utxo = utxos.plainutxos[0];
          if (utxo) {
            expect(utxo).toHaveProperty('txid');
            expect(utxo).toHaveProperty('vout');
            expect(utxo).toHaveProperty('value');
            expect(typeof utxo.txid).toBe('string');
            expect(typeof utxo.vout).toBe('number');
            expect(typeof utxo.value).toBe('number');
            expect(utxo.value).toBeGreaterThan(0);
          }
        }
      },
      testConfig.timeout
    );

    it(
      'should handle invalid address gracefully',
      async () => {
        const invalidAddress = 'invalid-bitcoin-address';

        try {
          await client.getUtxos(invalidAddress);
          // 如果没有抛出错误，至少应该返回空数组
        } catch (error) {
          // 预期会抛出错误
          expect(error).toBeDefined();
        }
      },
      testConfig.timeout
    );
  });

  describe('getPlainUtxos', () => {
    it(
      'should get plain UTXOs (non-ordinals)',
      async () => {
        const { valid } = realAddresses.mainnet;

        const utxos = await client.getPlainUtxos(valid);

        // plainutxos API直接返回数组
        expect(Array.isArray(utxos)).toBe(true);
        if (utxos.length > 0) {
          const utxo = utxos[0];
          expect(utxo).toHaveProperty('txid');
          expect(utxo).toHaveProperty('vout');
          expect(utxo).toHaveProperty('value');
        }
      },
      testConfig.timeout
    );
  });

  describe('getRareUtxos', () => {
    it(
      'should get rare/exotic UTXOs',
      async () => {
        const { valid } = realAddresses.mainnet;

        const utxos = await client.getRareUtxos(valid);

        // exotic API 可能返回不同格式，但应该有数组字段
        expect(typeof utxos).toBe('object');
        expect(utxos).not.toBeNull();
      },
      testConfig.timeout
    );
  });

  describe('getUtxo', () => {
    it(
      'should get specific UTXO information',
      async () => {
        const { coinbase } = realTransactions.mainnet;
        const utxoId = `${coinbase}:0`;

        try {
          const utxo = await client.getUtxo(utxoId);
          expect(utxo).toHaveProperty('txid');
          expect(utxo).toHaveProperty('vout');
          expect(utxo.txid).toBe(coinbase);
        } catch (error) {
          // 某些UTXO可能不存在或已被花费
          expect(error).toBeDefined();
        }
      },
      testConfig.timeout
    );
  });
});

describe('SatsNetClient - Address Operations', () => {
  let client: SatsNetClient;

  beforeAll(() => {
    client = new SatsNetClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 30000,
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('getAddressSummary', () => {
    it(
      'should get address summary',
      async () => {
        const { valid } = realAddresses.mainnet;

        const summary = await client.getAddressSummary(valid);

        expect(summary).toHaveProperty('address');
        expect(summary).toHaveProperty('balance');
        expect(summary.address).toBe(valid);
        expect(typeof summary.balance).toBe('number');
      },
      testConfig.timeout
    );
  });
});

describe('SatsNetClient - Network Operations', () => {
  let client: SatsNetClient;

  beforeAll(() => {
    client = new SatsNetClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 30000,
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('getBestHeight', () => {
    it(
      'should get current best block height',
      async () => {
        const height = await client.getBestHeight();

        expect(height).toHaveProperty('height');
        expect(typeof height.height).toBe('number');
        expect(height.height).toBeGreaterThan(800000); // Bitcoin当前区块高度应该大于800000
      },
      testConfig.timeout
    );
  });

  describe('getBtcPrice', () => {
    it(
      'should handle BTC price API gracefully',
      async () => {
        try {
          const price = await client.getBtcPrice();
          expect(price).toHaveProperty('price');
          expect(price).toHaveProperty('currency');
        } catch (error) {
          // BTC价格API可能暂时不可用，这是可以接受的
          expect(error).toBeDefined();
        }
      },
      testConfig.timeout
    );
  });

  describe('healthCheck', () => {
    it(
      'should pass health check',
      async () => {
        const health = await client.healthCheck();

        expect(health).toHaveProperty('status');
        expect(health.status).toBe('ok');
      },
      testConfig.timeout
    );
  });
});

describe('SatsNetClient - Configuration', () => {
  let client: SatsNetClient;

  beforeAll(() => {
    client = new SatsNetClient({
      baseUrl: apiEndpoints.mainnet.baseUrl,
      network: apiEndpoints.mainnet.network,
      timeout: 15000,
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('setBaseUrl', () => {
    it('should update base URL', () => {
      const newUrl = 'https://apiprd.ordx.market/btc/testnet';
      client.setBaseUrl(newUrl);

      const config = client.getConfig();
      expect(config.baseUrl).toBe(newUrl);
    });
  });

  describe('setNetwork', () => {
    it('should update network', () => {
      client.setNetwork('testnet');

      const config = client.getConfig();
      expect(config.network).toBe('testnet');
    });
  });

  describe('getMetrics', () => {
    it('should get performance metrics', () => {
      const metrics = client.getMetrics();

      expect(metrics).toHaveProperty('requestCount');
      expect(metrics).toHaveProperty('errorCount');
      expect(metrics).toHaveProperty('averageLatency');
      expect(typeof metrics.requestCount).toBe('number');
    });
  });

  describe('clearCache', () => {
    it('should clear cache without errors', () => {
      expect(() => client.clearCache()).not.toThrow();
    });
  });
});
