/**
 * 测试环境设置
 */

import { afterAll, beforeAll } from 'bun:test';

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 全局测试配置
beforeAll(() => {
  // 设置测试超时时间
  // 由于使用真实API，设置较长的超时时间
});

afterAll(() => {
  // 清理资源
});

// 测试配置
export const testConfig = {
  timeout: 30000, // 30秒超时，适应真实API请求
  retryCount: 3, // 失败重试次数
};
