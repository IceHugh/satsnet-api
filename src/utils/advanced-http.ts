import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { createGunzip, createInflate } from 'node:zlib';
import { type CacheStorage, type Dispatcher, Pool, request } from 'undici';
import type { ApiConfig } from '@/types';
import { SatsnetApiError } from '@/types';
import { tryitWithRetry } from './tryit';

const _streamPipeline = promisify(pipeline);

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  totalLatency: number;
  cacheHits: number;
  cacheMisses: number;
  activeConnections: number;
  maxConnections: number;
}

/**
 * 高级 HTTP 客户端配置
 */
export interface AdvancedHttpConfig extends ApiConfig {
  // 连接池配置
  connections?: number;
  keepAlive?: true | false;
  keepAliveTimeout?: number;

  // 压缩配置
  compression?: true | false;
  acceptEncoding?: string[];

  // 缓存配置
  cache?: true | false;
  cacheStorage?: CacheStorage;
  cacheMaxAge?: number;

  // 性能监控
  metrics?: true | false;
  onMetrics?: (metrics: PerformanceMetrics) => void;

  // 重试策略
  retryCondition?: (error: unknown) => boolean;
  retryBackoff?: (attempt: number) => number;

  // 请求拦截器
  requestInterceptor?: (request: Request) => Request | Promise<Request>;
  responseInterceptor?: (response: Response) => Response | Promise<Response>;
}

/**
 * 高级 HTTP 客户端，充分利用 undici 特性
 */
export class AdvancedHttpClient {
  private config: AdvancedHttpConfig;
  private dispatcher!: Dispatcher;
  private metrics: PerformanceMetrics;
  private cache = new Map<string, { data: unknown; timestamp: number }>();

  constructor(config: AdvancedHttpConfig) {
    // 使用用户传入的配置，不自动检测环境
    this.config = {
      connections: 50,
      keepAlive: false, // 默认禁用以避免 undici 兼容性问题
      keepAliveTimeout: 60000,
      compression: config.compression ?? false, // 默认禁用压缩，用户可手动启用
      acceptEncoding: config.acceptEncoding ?? [],
      cache: true,
      cacheMaxAge: 300000, // 5 minutes
      metrics: true,
      retryCondition: (error) => {
        // 默认重试条件：网络错误、超时、5xx 错误
        if (error && typeof error === 'object' && 'code' in error) {
          const code = (error as { code: string | number }).code;
          return (
            code === 'ETIMEDOUT' ||
            code === 'ENOTFOUND' ||
            (typeof code === 'number' && code >= 500 && code < 600)
          );
        }
        return false;
      },
      retryBackoff: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // 指数退避，最大10秒
      ...config,
    } as AdvancedHttpConfig;

    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageLatency: 0,
      totalLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
      activeConnections: 0,
      maxConnections: this.config.connections || 50,
    };

    this.setupDispatcher();
  }

  private setupDispatcher(): void {
    // HTTP/1.1 连接池
    const poolOptions: Record<string, unknown> = {
      connections: this.config.connections,
      keepAliveTimeout: this.config.keepAliveTimeout,
      // 修复 keepAlive 错误：对于 HTTP/1.1，需要禁用 pipelining 或调整 keepAlive 配置
      pipelining: 0, // 禁用 pipelining 以支持 keepAlive
    };

    // 只在明确启用时才设置 keepAlive，并且确保兼容性
    if (this.config.keepAlive === true) {
      poolOptions.keepAlive = true;
    }

    // 使用基础 URL 创建连接池
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    const pool = new Pool(baseUrl, poolOptions);
    this.dispatcher = pool;
  }

  /**
   * 构建 URL 并添加缓存键
   */
  private buildUrlWithCacheKey(
    path: string,
    params: Record<string, unknown> = {}
  ): { url: string; cacheKey: string } {
    const targetNetwork = this.config.network;
    const chain = this.config.chain || 'btc';

    // 构建完整的 URL: baseUrl + "/" + chain + "/" + network + "/" + path
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    const fullPath = `${baseUrl}/${chain}/${targetNetwork}/${path}`;

    const url = new URL(fullPath);

    // Add query parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    // Create cache key
    const cacheKey = `${url.pathname}${url.search}`;

    return { url: url.toString(), cacheKey };
  }

  /**
   * 缓存检查
   */
  private checkCache(cacheKey: string): unknown | null {
    if (!this.config.cache) return null;

    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const cacheMaxAge = this.config.cacheMaxAge ?? 300000; // 默认5分钟
    if (now - cached.timestamp > cacheMaxAge) {
      this.cache.delete(cacheKey);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return cached.data;
  }

  /**
   * 存储到缓存
   */
  private storeInCache(cacheKey: string, data: unknown): void {
    if (!this.config.cache) return;

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // 定期清理过期缓存 - 使用更高效的阈值
    if (this.cache.size > 500) {
      // 使用 setTimeout 异步清理，避免阻塞主线程
      setTimeout(() => this.cleanupCache(), 0);
    }
  }

  /**
   * 清理过期缓存 - 优化版本，批量删除以提高性能
   */
  private cleanupCache(): void {
    const now = Date.now();
    const cacheMaxAge = this.config.cacheMaxAge ?? 300000; // 默认5分钟
    const keysToDelete: string[] = [];

    // 先收集要删除的键，避免在遍历过程中修改 Map
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > cacheMaxAge) {
        keysToDelete.push(key);
      }
    }

    // 批量删除
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * 记录性能指标
   */
  private recordMetrics(start: number, error?: unknown): void {
    const latency = Date.now() - start;

    this.metrics.requestCount++;
    this.metrics.totalLatency += latency;
    this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.requestCount;

    if (error) {
      this.metrics.errorCount++;
    }

    if (this.config.onMetrics) {
      this.config.onMetrics({ ...this.metrics });
    }
  }

  /**
   * 高级 GET 请求
   */
  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const startTime = Date.now();
    const { url, cacheKey } = this.buildUrlWithCacheKey(path, params);

    // 检查缓存
    const cachedData = this.checkCache(cacheKey);
    if (cachedData) {
      return cachedData as T;
    }

    const [error, result] = await tryitWithRetry(
      () => this.executeRequest<T>(url, cacheKey),
      this.config.retries ?? 3
    )();

    this.recordMetrics(startTime, error);

    if (error) {
      throw error;
    }

    return result as T;
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest<T>(url: string, cacheKey: string): Promise<T> {
    const headers = this.buildHeaders();
    const response = await this.makeRequest(url, headers);
    this.validateResponse(response, url);

    // 安全的 JSON 解析，处理编码和格式问题
    const data = await this.safeParseJson(response);

    // 缓存成功响应
    if (response.statusCode === 200) {
      this.storeInCache(cacheKey, data);
    }

    return this.processResponse<T>(data);
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.config.headers,
      'user-agent': 'satsnet-api/1.0.0',
    };

    // 添加压缩支持
    if (this.config.compression && this.config.acceptEncoding) {
      headers['accept-encoding'] = this.config.acceptEncoding.join(', ');
    }

    // 防止 Header 冲突 - 删除 content-encoding
    delete headers['content-encoding'];

    return headers;
  }

  /**
   * 安全解析 JSON 响应 - 优先使用 undici 原生解析
   */
  private async safeParseJson(response: {
    body: any;
    headers?: Record<string, string | string[] | undefined>;
  }) {
    try {
      const encoding = response.headers?.['content-encoding'];
      console.log(`[AdvancedHttpClient] Response encoding: ${encoding}`);

      // 优先使用原生解析
      const result = await this.tryNativeJsonParse(response);
      if (result.success) {
        return result.data;
      }

      // 原生解析失败，尝试手动解压
      if (encoding && this.shouldTryManualDecompression(encoding)) {
        const manualResult = await this.tryManualDecompression(response, encoding);
        if (manualResult.success) {
          return manualResult.data;
        }
      }

      // 所有方法都失败，抛出原生错误
      throw result.error;
    } catch (error) {
      console.warn('JSON parse failed:', error);

      // 错误处理，包含详细信息
      throw new SatsnetApiError(
        `Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        {
          originalError: error,
          contentType: response.headers?.['content-type'],
          contentLength: response.headers?.['content-length'],
          contentEncoding: response.headers?.['content-encoding'],
        }
      );
    }
  }

  /**
   * 尝试使用 undici 原生 JSON 解析
   */
  private async tryNativeJsonParse(response: {
    body: any;
  }): Promise<{ success: true; data: any } | { success: false; error: Error }> {
    try {
      console.log('[AdvancedHttpClient] Using undici native JSON parsing');
      const data = await response.body.json();
      return { success: true, data };
    } catch (error) {
      console.warn('[AdvancedHttpClient] Native parsing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Native parsing failed'),
      };
    }
  }

  /**
   * 检查是否应该尝试手动解压
   */
  private shouldTryManualDecompression(encoding?: string | string[]): boolean {
    const encodingValue = Array.isArray(encoding) ? encoding[0] : encoding;
    return encodingValue === 'gzip' || encodingValue === 'deflate';
  }

  /**
   * 检测响应编码并返回处理策略
   */
  private detectEncodingStrategy(encoding?: string | string[]): {
    useNative: boolean;
    tryManual: boolean;
    encodingValue?: string;
  } {
    const encodingValue = Array.isArray(encoding) ? encoding[0] : encoding;

    // 对于压缩编码，优先尝试原生解析，失败后手动解压
    if (encodingValue && (encodingValue === 'gzip' || encodingValue === 'deflate')) {
      return {
        useNative: true,
        tryManual: true,
        encodingValue,
      };
    }

    // 无压缩或未知编码，仅使用原生解析
    return {
      useNative: true,
      tryManual: false,
      encodingValue: undefined,
    };
  }

  /**
   * 尝试手动解压响应
   */
  private async tryManualDecompression(
    response: {
      body: any;
    },
    encoding: string | string[]
  ): Promise<{ success: true; data: any } | { success: false; error: Error }> {
    try {
      const encodingValue = Array.isArray(encoding) ? encoding[0] : encoding;
      console.log(`[AdvancedHttpClient] Attempting manual decompression for ${encodingValue}`);

      const chunks: Buffer[] = [];
      const stream =
        encodingValue === 'gzip'
          ? response.body.pipe(createGunzip())
          : response.body.pipe(createInflate());

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const text = Buffer.concat(chunks).toString('utf8');
      console.log(
        `[AdvancedHttpClient] Manual decompression successful, text length: ${text.length}`
      );

      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      console.warn('[AdvancedHttpClient] Manual decompression failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Manual decompression failed'),
      };
    }
  }

  /**
   * 发起请求
   */
  private async makeRequest(url: string, headers: Record<string, string>) {
    return request(url, {
      method: 'GET',
      headers,
      dispatcher: this.dispatcher,
      bodyTimeout: this.config.timeout ?? 10000,
      headersTimeout: this.config.timeout ?? 5000,
    });
  }

  /**
   * 验证响应
   */
  private validateResponse(response: { statusCode: number }, url: string): void {
    if (response.statusCode >= 400) {
      throw new SatsnetApiError(
        `HTTP ${response.statusCode}: ${response.statusCode === 404 ? 'Not Found' : 'Request Failed'}`,
        response.statusCode,
        { url, status: response.statusCode }
      );
    }
  }

  /**
   * 处理响应数据
   */
  private processResponse<T>(data: unknown): T {
    // 处理 API 包装格式
    if (typeof data === 'object' && data !== null && 'code' in data) {
      const apiResponse = data as { code: number; msg: string; data?: unknown };

      if (apiResponse.code !== 0) {
        throw new SatsnetApiError(
          `API Error: ${apiResponse.msg}`,
          apiResponse.code,
          apiResponse.data
        );
      }

      // 如果有data字段，返回data；否则返回整个响应对象（用于UTXO API等）
      return (apiResponse.data ?? apiResponse) as T;
    }

    return data as T;
  }

  /**
   * 高级 POST 请求
   */
  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const startTime = Date.now();
    const { url } = this.buildUrlWithCacheKey(path, {});

    const [error, result] = await tryitWithRetry(
      () => this.executePostRequest<T>(url, body),
      this.config.retries ?? 3
    )();

    this.recordMetrics(startTime, error);

    if (error) {
      throw error;
    }

    return result as T;
  }

  /**
   * 执行POST请求
   */
  private async executePostRequest<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const headers = this.buildPostHeaders();
    const response = await this.makePostRequest(url, headers, body);
    this.validateResponse(response, url);

    // 安全的 JSON 解析，处理编码和格式问题
    const data = await this.safeParseJson(response);
    return this.processResponse<T>(data);
  }

  /**
   * 构建POST请求头
   */
  private buildPostHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.config.headers,
      'user-agent': 'satsnet-api/1.0.0',
      'content-type': 'application/json',
    };

    // 只添加接受编码头，让 undici 自动处理压缩
    if (this.config.compression && this.config.acceptEncoding) {
      headers['accept-encoding'] = this.config.acceptEncoding.join(', ');
    }

    return headers;
  }

  /**
   * 发起POST请求
   */
  private async makePostRequest(
    url: string,
    headers: Record<string, string>,
    body: Record<string, unknown>
  ) {
    // 移除 content-encoding 头部，让 undici 自动处理压缩
    const postHeaders = { ...headers };
    delete postHeaders['content-encoding'];

    return request(url, {
      method: 'POST',
      headers: postHeaders,
      body: JSON.stringify(body),
      dispatcher: this.dispatcher,
      bodyTimeout: this.config.timeout ?? 15000,
      headersTimeout: this.config.timeout ?? 5000,
    });
  }

  /**
   * 批量并行请求 - 优化错误处理
   */
  async batchRequest<T>(
    requests: Array<{ path: string; params?: Record<string, unknown> }>
  ): Promise<Array<T>> {
    const startTime = Date.now();

    const promises = requests.map(({ path, params = {} }) => this.get<T>(path, params));

    const results = await Promise.allSettled(promises);

    this.recordMetrics(startTime);

    // 收集所有失败的请求，一次性输出警告
    const failedRequests: Array<{ index: number; error: unknown }> = [];

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      failedRequests.push({ index, error: result.reason });
      throw result.reason;
    });

    // 批量输出错误信息，减少 console.warn 调用次数
    if (failedRequests.length > 0) {
      console.warn(
        `${failedRequests.length} batch requests failed:`,
        failedRequests.map(({ index, error }) => `[${index}]: ${error}`).join(', ')
      );
    }

    return processedResults;
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    if (this.dispatcher && typeof this.dispatcher.close === 'function') {
      await this.dispatcher.close();
    }
    this.cache.clear();
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig: Partial<AdvancedHttpConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // 如果关键配置改变，重新设置 dispatcher
    if (newConfig.connections || newConfig.keepAlive) {
      await this.close();
      this.setupDispatcher();
    }
  }
}
