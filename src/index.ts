/**
 * SatsNet API Library
 * High-performance Bitcoin/Ordinals API client with TypeScript support
 * Built with Bun, undici, and radash for optimal performance
 */

// Export main client
export { SatsNetClient } from '@/api/satsnet-client';

// Export safe client with built-in error handling
export { SafeSatsNetClient, createSafeClient, safeSatsnet } from '@/utils/api-wrapper';

// Export types
export type {
  Network,
  Chain,
  ApiResponse,
  Utxo,
  EnhancedUtxo,
  UtxoResponse,
  TransactionRaw,
  AddressSummary,
  AddressAssetItem,
  FeeRates,
  TickerInfo,
  TickerName,
  AssetHolder,
  NameService,
  NameServiceListResponse,
  HealthCheckResponse,
  BestHeightResponse,
  EnhancedUtxoResponse,
  TransactionHexResponse,
  NameInfoResponse,
  PaginationParams,
  RequestParams,
  ApiConfig,
  SatsnetApiError,
  NetworkConfig,
  EnvironmentConfig,
} from '@/types';

// Export utilities
export { ErrorHandler } from '@/utils/errors';
export { HttpClient } from '@/utils/http';
export {
  tryit,
  tryitWithRetry,
  tryitOrDefault,
  tryitAll,
  isError,
  isSuccess,
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
