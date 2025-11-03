/**
 * SatsNet API Library
 * High-performance Bitcoin/Ordinals API client with TypeScript support
 * Built with Bun, ofetch, and radash for optimal performance
 */

// Export main client
export { SatsNetClient } from '@/api/satsnet-client';
// Export types
export type {
  AddressAssetItem,
  AddressSummary,
  ApiConfig,
  ApiResponse,
  AssetHolder,
  BestHeightResponse,
  Chain,
  EnhancedUtxo,
  EnhancedUtxoResponse,
  EnvironmentConfig,
  FeeRates,
  HealthCheckResponse,
  IHttpClient,
  NameInfoResponse,
  NameService,
  NameServiceListResponse,
  Network,
  NetworkConfig,
  PaginationParams,
  RequestParams,
  SatsnetApiError,
  TickerInfo,
  TickerName,
  TransactionHexResponse,
  TransactionRaw,
  Utxo,
  UtxoResponse,
} from '@/types';
// Export safe client with built-in error handling
export { createSafeClient, SafeSatsNetClient, safeSatsnet } from '@/utils/api-wrapper';

// Export utilities
export { ErrorHandler } from '@/utils/errors';
export type { HttpConfig, PerformanceMetrics } from '@/utils/http';
export { HttpClient } from '@/utils/http';
export { createHttpClient } from '@/utils/http-factory';
export {
  isError,
  isSuccess,
  tryit,
  tryitAll,
  tryitOrDefault,
  tryitWithRetry,
} from '@/utils/tryit';

import { SatsNetClient } from '@/api/satsnet-client';
import type { ApiConfig } from '@/types';

/**
 * Default client instance for quick usage
 */
export const satsnet = new SatsNetClient();

/**
 * Create a new client instance with custom configuration
 * @param config - Custom API configuration
 * @returns New SatsNetClient instance
 */
export const createClient = (config: Partial<ApiConfig> = {}) => new SatsNetClient(config);

// Version information
export const VERSION = '1.0.0';

/**
 * Library metadata
 */
export const metadata = {
  name: 'satsnet-api',
  version: VERSION,
  description: 'High-performance satsnet protocol API library',
  author: 'icehugh',
  license: 'MIT',
  repository: 'https://github.com/icehugh/satsnet-api.git',
  engines: {
    bun: '>=1.0.0',
    node: '>=20.0.0',
  },
} as const;

// Re-export for convenience
export default satsnet;
