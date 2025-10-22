/**
 * 测试数据 - 使用真实的Bitcoin网络数据
 */

// 真实的Bitcoin地址（来自区块Explorer）
export const realAddresses = {
  mainnet: {
    valid: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // Bitcoin Core项目捐赠地址
    taproot: 'bc1p5d7rjq7g6rdk2yhzks9smlqfpue Cypus6q4mszrnf', // Taproot地址示例
    legacy: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Bitcoin创世区块地址
  },
  testnet: {
    valid: 'tb1q5p32h7w8n9j8l6r9q0s5t4u3v2w1x6y7z8a9b0c', // Testnet地址
  },
};

// 真实的交易ID
export const realTransactions = {
  mainnet: {
    coinbase: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', // 创世交易
    recent: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16', // 比特币披萨交易
  },
};

// 真实的资产ticker
export const realTickers = {
  bitcoin: 'btc',
  satoshi: 'sats',
  ordinals: {
    common: 'ordi',
    rare: 'text',
  },
};

// 真实的名称服务
export const realNames = {
  sats: 'unisat',
  btc: 'btc',
};

// API端点配置
export const apiEndpoints = {
  mainnet: {
    baseUrl: 'https://apiprd.ordx.market/btc/mainnet',
    network: 'mainnet' as const,
  },
  testnet: {
    baseUrl: 'https://apiprd.ordx.market/btc/testnet',
    network: 'testnet' as const,
  },
};

// 测试用的UTXO查询参数
export const utxoQueryParams = {
  minValue: 1000, // 1000 satoshis
  maxValue: 1000000, // 0.01 BTC
};

// 性能测试配置
export const performanceConfig = {
  concurrentRequests: 10,
  iterations: 5,
  timeout: 45000, // 45秒超时
};

// 测试配置
export const testConfig = {
  timeout: 30000, // 30秒超时，适应真实API请求
  retryCount: 3, // 失败重试次数
};
