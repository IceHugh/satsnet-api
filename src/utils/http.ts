import type { ApiConfig, Network } from '@/types';
import type { AdvancedHttpConfig } from './advanced-http';
import { AdvancedHttpClient } from './advanced-http';

/**
 * HTTP client using undici with advanced optimization
 */
export class HttpClient {
  private config: ApiConfig;
  private advancedClient: AdvancedHttpClient;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'satsnet-api/1.0.0',
      },
      // Advanced undici optimization
      connections: 50,
      keepAlive: true,
      keepAliveTimeout: 60000,
      http2: true,
      maxConcurrentStreams: 100,
      compression: true,
      acceptEncoding: ['gzip', 'deflate', 'br'],
      cache: true,
      cacheMaxAge: 300000,
      metrics: true,
      ...config,
    } as AdvancedHttpConfig;

    this.advancedClient = new AdvancedHttpClient(this.config);
  }

  /**
   * Make HTTP GET request using advanced undici client
   * @param path - API endpoint path
   * @param params - Query parameters
   * @returns Promise with response data
   */
  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    return this.advancedClient.get<T>(path, params);
  }

  /**
   * Make HTTP POST request using advanced undici client
   * @param path - API endpoint path
   * @param body - Request body
   * @returns Promise with response data
   */
  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.advancedClient.post<T>(path, body);
  }

  /**
   * Update configuration
   * @param newConfig - New configuration to merge
   */
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get performance metrics
   * @returns Performance metrics
   */
  getMetrics() {
    return this.advancedClient.getMetrics();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.advancedClient.clearCache();
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.advancedClient.close();
  }

  /**
   * Batch parallel requests
   * @param requests - Array of request configurations
   * @returns Promise with array of results
   */
  async batchRequest<T>(
    requests: Array<{ path: string; params?: Record<string, unknown>; network?: Network }>
  ): Promise<T[]> {
    return this.advancedClient.batchRequest<T>(requests);
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): ApiConfig {
    return { ...this.config };
  }

  /**
   * Update advanced configuration
   * @param newConfig - New configuration
   */
  async updateAdvancedConfig(newConfig: Partial<AdvancedHttpConfig>): Promise<void> {
    await this.advancedClient.updateConfig(newConfig);
  }
}
