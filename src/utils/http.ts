/**
 * HTTP Client - Universal implementation using ofetch
 * Works in Node.js, browsers, and edge environments including Cloudflare Pages
 */

import { ofetch, type $Fetch } from 'ofetch';
import type { ApiConfig, Network } from '@/types';
import { SatsnetApiError } from '@/types';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  totalLatency: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * HTTP Client configuration
 */
export interface HttpConfig extends ApiConfig {
  cache?: boolean;
  cacheMaxAge?: number;
  metrics?: boolean;
  retry?: boolean;
  retryDelay?: number;
  retryCount?: number;
}

/**
 * Universal HTTP Client
 * Works in all environments using ofetch
 */
export class HttpClient {
  private config: HttpConfig;
  private fetch: $Fetch;
  private metrics: PerformanceMetrics;
  private cache = new Map<string, { data: unknown; timestamp: number }>();

  constructor(config: HttpConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'satsnet-api/1.0.0',
      },
      cache: true,
      cacheMaxAge: 300000, // 5 minutes
      metrics: true,
      retry: true,
      retryDelay: 1000,
      retryCount: 3,
      ...config,
    };

    // Create ofetch instance with configuration
    const fetchOptions: any = {
      baseURL: this.config.baseUrl,
      headers: this.config.headers,
    };

    // Only include defined options
    if (this.config.timeout !== undefined) {
      fetchOptions.timeout = this.config.timeout;
    }
    if (this.config.retry && this.config.retryCount !== undefined) {
      fetchOptions.retry = this.config.retryCount;
    }
    if (this.config.retryDelay !== undefined) {
      fetchOptions.retryDelay = this.config.retryDelay;
    }

    this.fetch = ofetch.create(fetchOptions);

    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageLatency: 0,
      totalLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Build URL with query parameters and network path
   */
  private buildUrl(path: string, params: Record<string, unknown> = {}): string {
    const targetNetwork = this.config.network;
    const chain = this.config.chain || 'btc';

    // Build full path: /chain/network/path
    const fullPath = `/${chain}/${targetNetwork}/${path}`;

    // Create URL with query parameters
    const url = new URL(fullPath, this.config.baseUrl);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    return url.pathname + url.search;
  }

  /**
   * Create cache key from URL path and search
   */
  private createCacheKey(url: string): string {
    return url;
  }

  /**
   * Check cache for data
   */
  private checkCache(cacheKey: string): unknown | null {
    if (!this.config.cache) return null;

    const cached = this.cache.get(cacheKey);
    if (!cached) {
      this.metrics.cacheMisses++;
      return null;
    }

    const now = Date.now();
    const cacheMaxAge = this.config.cacheMaxAge ?? 300000;
    if (now - cached.timestamp > cacheMaxAge) {
      this.cache.delete(cacheKey);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return cached.data;
  }

  /**
   * Store data in cache
   */
  private storeInCache(cacheKey: string, data: unknown): void {
    if (!this.config.cache) return;

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Cleanup cache if too large
    if (this.cache.size > 500) {
      setTimeout(() => this.cleanupCache(), 0);
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const cacheMaxAge = this.config.cacheMaxAge ?? 300000;
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > cacheMaxAge) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Record success metrics
   */
  private recordSuccess(start: number): void {
    if (!this.config.metrics) return;

    const latency = Date.now() - start;
    this.metrics.requestCount++;
    this.metrics.totalLatency += latency;
    this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.requestCount;
  }

  /**
   * Record error metrics
   */
  private recordError(start: number, error: unknown): void {
    if (!this.config.metrics) return;

    this.recordSuccess(start);
    this.metrics.errorCount++;
  }

  /**
   * Process response data
   */
  private processResponse<T>(data: unknown): T {
    // Handle API wrapper format
    if (typeof data === 'object' && data !== null && 'code' in data) {
      const apiResponse = data as { code: number; msg: string; data?: unknown };

      if (apiResponse.code !== 0) {
        throw new SatsnetApiError(
          `API Error: ${apiResponse.msg}`,
          apiResponse.code,
          apiResponse.data
        );
      }

      return (apiResponse.data ?? apiResponse) as T;
    }

    return data as T;
  }

  /**
   * GET request
   */
  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const startTime = Date.now();
    const url = this.buildUrl(path, params);
    const cacheKey = this.createCacheKey(url);

    // Check cache
    const cachedData = this.checkCache(cacheKey);
    if (cachedData) {
      return cachedData as T;
    }

    try {
      const response = await this.fetch<T>(url, {
        method: 'GET',
      });

      this.recordSuccess(startTime);

      // Cache successful responses
      this.storeInCache(cacheKey, response);

      return this.processResponse<T>(response);
    } catch (error) {
      this.recordError(startTime, error);

      // Handle known error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new SatsnetApiError('Request timeout', 408, { url });
        }

        if ('status' in error && typeof error.status === 'number') {
          const statusCode = error.status;
          if (statusCode >= 400 && statusCode < 500) {
            throw new SatsnetApiError(
              `HTTP ${statusCode}: ${statusCode === 404 ? 'Not Found' : 'Request Failed'}`,
              statusCode,
              { url, status: statusCode }
            );
          }
        }
      }

      // Rethrow unknown errors
      throw error;
    }
  }

  /**
   * POST request
   */
  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const startTime = Date.now();
    const url = this.buildUrl(path);

    try {
      const response = await this.fetch<T>(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      this.recordSuccess(startTime);

      return this.processResponse<T>(response);
    } catch (error) {
      this.recordError(startTime, error);

      // Handle known error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new SatsnetApiError('Request timeout', 408, { url });
        }

        if ('status' in error && typeof error.status === 'number') {
          const statusCode = error.status;
          throw new SatsnetApiError(
            `HTTP ${statusCode}: ${statusCode === 404 ? 'Not Found' : 'Request Failed'}`,
            statusCode,
            { url, status: statusCode }
          );
        }
      }

      throw error;
    }
  }

  /**
   * Batch parallel requests
   */
  async batchRequest<T>(
    requests: Array<{ path: string; params?: Record<string, unknown> }>
  ): Promise<T[]> {
    const startTime = Date.now();

    const promises = requests.map(({ path, params = {} }) => this.get<T>(path, params));
    const results = await Promise.allSettled(promises);

    this.recordSuccess(startTime);

    const failedRequests: Array<{ index: number; error: unknown }> = [];
    const processedResults: T[] = [];

    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        processedResults.push(result.value);
      } else {
        failedRequests.push({ index, error: result.reason });
        throw result.reason;
      }
    }

    if (failedRequests.length > 0) {
      console.warn(
        `${failedRequests.length} batch requests failed:`,
        failedRequests.map(({ index, error }) => `[${index}]: ${error}`).join(', ')
      );
    }

    return processedResults;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HttpConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Recreate ofetch instance with new config
    const fetchOptions: any = {
      baseURL: this.config.baseUrl,
      headers: this.config.headers,
    };

    if (this.config.timeout !== undefined) {
      fetchOptions.timeout = this.config.timeout;
    }
    if (this.config.retry && this.config.retryCount !== undefined) {
      fetchOptions.retry = this.config.retryCount;
    }
    if (this.config.retryDelay !== undefined) {
      fetchOptions.retryDelay = this.config.retryDelay;
    }

    this.fetch = ofetch.create(fetchOptions);
  }

  /**
   * Get current configuration
   */
  getConfig(): HttpConfig {
    return { ...this.config };
  }

  /**
   * Close and cleanup (no-op for ofetch client)
   */
  async close(): Promise<void> {
    this.cache.clear();
  }
}