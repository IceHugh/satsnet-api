/**
 * HTTP Client Factory - Universal implementation using ofetch
 * ofetch works everywhere, no environment detection needed
 */

import type { ApiConfig } from '@/types';
import { HttpClient } from './http';

// Re-export for type access
export { HttpClient };

/**
 * Create HTTP client with given configuration
 * ofetch is universal, works in all environments
 */
export function createHttpClient(config: ApiConfig): HttpClient {
  console.log('[HttpClientFactory] Creating universal HTTP client using ofetch');
  return new HttpClient(config);
}