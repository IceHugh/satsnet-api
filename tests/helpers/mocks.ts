/**
 * Mock 数据和工具函数
 */

import { SatsnetApiError } from '@/types';

// Mock API 响应数据
export const mockUtxoResponse = [
  {
    txid: 'test-txid-123',
    vout: 0,
    value: 1000,
    script: 'test-script',
    address: 'test-address',
    blockHeight: 800000,
    confirmations: 100,
  },
];

export const mockAddressSummary = {
  address: 'test-address',
  balance: 1000,
  totalReceived: 2000,
  totalSent: 1000,
  txCount: 10,
  unconfirmedBalance: 0,
};

export const mockTickerInfo = {
  ticker: 'SATS',
  name: 'Sats',
  max: 2100000000000000,
  supply: 1000000000000,
  holders: 1000,
  marketCap: 50000,
};

export const mockHealthCheck = {
  status: 'ok',
  version: '1.0.0',
  basedbver: '1.0.0',
  ordxdbver: '1.0.0',
};

// 错误生成器
export const createMockError = (message: string, code = -1) => {
  return new SatsnetApiError(message, code, { originalError: message });
};

// 网络错误模拟
export const mockNetworkError = new Error('Network error');
mockNetworkError.name = 'ConnectTimeoutError';

// API 错误模拟
export const mockApiError = {
  code: 1,
  msg: 'Invalid address',
  data: null,
};

// 测试用例数据
export const testCases = {
  validAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  invalidAddress: 'invalid-address',
  validTxid: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
  validTicker: 'SAT',
  invalidTicker: '',
};
