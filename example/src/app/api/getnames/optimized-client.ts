// 优化的 SatsNet API 客户端实现
// 保留缓存、连接池等性能功能，去掉流处理兼容性问题
// 参考 @src/utils/advanced-http.ts 的核心功能

import { Agent, Pool, request } from 'undici';

// 基础配置接口
interface ApiConfig {
  baseUrl: string;
  network: 'mainnet' | 'testnet' | 'livenet';
  chain: string;
  timeout: number;
  retries: number;
}

// 性能监控指标
interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  totalLatency: number;
  cacheHits: number;
  cacheMisses: number;
  activeConnections: number;
  maxConnections: number;
}

// 高级 HTTP 客户端配置
interface AdvancedHttpConfig extends ApiConfig {
  // 连接池配置
  connections?: number;
  keepAlive?: boolean;
  keepAliveTimeout?: number;

  // HTTP/2 配置
  http2?: boolean;
  maxConcurrentStreams?: number;

  // 缓存配置
  cache?: boolean;
  cacheMaxAge?: number;

  // 性能监控
  metrics?: boolean;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

// NameService 接口
interface NameService {
  id?: number;
  name: string;
  address?: string;
  block?: number;
  txid?: string;
  vout?: number;
  data?: string;
  timestamp?: string;
}

// 自定义错误类
class SatsnetApiError extends Error {
  constructor(
    message: string,
    public code = -1,
    public data?: any
  ) {
    super(message);
    this.name = 'SatsnetApiError';
  }
}

// 重试工具函数
async function tryitWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<() => Promise<T>> {
  return async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === retries) {
          throw error;
        }

        // 简单的指数退避
        const delay = Math.min(1000 * 2 ** attempt, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
}

// 优化的 HTTP 客户端 - 去掉流处理问题，保留性能功能
class OptimizedHttpClient {
  private config: AdvancedHttpConfig;
  private dispatcher: any; // Pool or Agent
  private metrics: PerformanceMetrics;
  private cache = new Map<string, { data: unknown; timestamp: number }>();

  constructor(config: AdvancedHttpConfig) {
    console.log('[OptimizedHttpClient] 初始化配置:', {
      baseUrl: config.baseUrl,
      network: config.network,
      chain: config.chain,
      timeout: config.timeout,
      cache: config.cache,
      connections: config.connections,
    });

    // 检测 Next.js 环境并优化配置
    const isNextJS =
      typeof window === 'undefined' &&
      (process.env.NEXT_RUNTIME || process.env.NODE_ENV === 'production' || process.env.VERCEL);

    this.config = {
      connections: 50,
      keepAlive: false, // Next.js 环境下默认禁用 keepAlive
      keepAliveTimeout: 60000,
      http2: !isNextJS, // Next.js 环境下禁用 HTTP/2
      maxConcurrentStreams: 100,
      cache: true,
      cacheMaxAge: 300000, // 5 minutes
      metrics: true,
      retries: 3,
      ...config,
    };

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
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    console.log(`[OptimizedHttpClient] 设置连接池，baseUrl: ${baseUrl}`);

    if (this.config.http2) {
      // HTTP/2 Agent
      const agentOptions: Record<string, unknown> = {
        connections: this.config.connections,
        keepAliveTimeout: this.config.keepAliveTimeout,
        maxConcurrentStreams: this.config.maxConcurrentStreams,
      };

      if (this.config.keepAlive) {
        agentOptions.keepAlive = true;
      }

      this.dispatcher = new Agent(agentOptions);
    } else {
      // HTTP/1.1 连接池 - Next.js 环境优化配置
      const poolOptions = {
        connections: this.config.connections,
        keepAliveTimeout: this.config.keepAliveTimeout,
        pipelining: 0, // 禁用 pipelining 避免 Next.js 兼容性问题
      };

      // 只在明确启用时设置 keepAlive
      if (this.config.keepAlive === true) {
        poolOptions.keepAlive = true;
      }

      this.dispatcher = new Pool(baseUrl, poolOptions);
    }
  }

  /**
   * 构建 URL 和缓存键
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

    // 添加查询参数
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }

    // 创建缓存键
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
    console.log(`[OptimizedHttpClient] 缓存命中: ${cacheKey}`);
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

    // 定期清理过期缓存
    if (this.cache.size > 500) {
      setTimeout(() => this.cleanupCache(), 0);
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    const cacheMaxAge = this.config.cacheMaxAge ?? 300000; // 默认5分钟
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > cacheMaxAge) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    console.log(`[OptimizedHttpClient] 清理缓存，删除 ${keysToDelete.length} 个过期条目`);
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
   * 优化的 GET 请求 - 去掉流处理，保留性能功能
   */
  async get<T = any>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const startTime = Date.now();
    const { url, cacheKey } = this.buildUrlWithCacheKey(path, params);

    console.log(`[OptimizedHttpClient] 开始 GET 请求: ${url}`);

    // 检查缓存
    const cachedData = this.checkCache(cacheKey);
    if (cachedData) {
      console.log('[OptimizedHttpClient] 从缓存返回数据');
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
   * 执行HTTP请求 - 优化的无流处理版本
   */
  private async executeRequest<T>(url: string, cacheKey: string): Promise<T> {
    console.log(`[OptimizedHttpClient] 执行请求: ${url}`);

    // 构建 headers
    const headers = {
      'user-agent': 'satsnet-api/1.0.0',
      accept: 'application/json',
      'content-type': 'application/json',
    };

    console.log('[OptimizedHttpClient] 请求头:', headers);

    try {
      // 使用 undici 发起请求 - 优化的配置
      const response = await request(url, {
        method: 'GET',
        headers,
        dispatcher: this.dispatcher,
        bodyTimeout: this.config.timeout ?? 10000,
        headersTimeout: this.config.timeout ?? 5000,
      });

      console.log(`[OptimizedHttpClient] 响应状态: ${response.statusCode}`);

      // 验证响应状态
      if (response.statusCode >= 400) {
        throw new SatsnetApiError(
          `HTTP ${response.statusCode}: ${response.statusMessage || 'Request Failed'}`,
          response.statusCode,
          { url, status: response.statusCode }
        );
      }

      // 优化的响应处理 - 直接使用 body.json() 避免流处理问题
      let data: any;
      try {
        console.log('[OptimizedHttpClient] 开始解析 JSON');
        data = await response.body.json();
        console.log('[OptimizedHttpClient] JSON 解析成功');
      } catch (jsonError) {
        console.warn('[OptimizedHttpClient] JSON 解析失败:', jsonError);

        // 如果 JSON 解析失败，尝试获取原始响应进行调试
        console.error('[OptimizedHttpClient] 响应 headers:', response.headers);
        throw new SatsnetApiError(
          `Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`,
          500,
          {
            originalError: jsonError,
            contentType: response.headers['content-type'],
            contentLength: response.headers['content-length'],
            statusCode: response.statusCode,
          }
        );
      }

      // 处理 API 响应格式
      console.log('[OptimizedHttpClient] 处理响应数据，数据类型:', typeof data);

      if (typeof data === 'object' && data !== null && 'code' in data) {
        const apiResponse = data as { code: number; msg: string; data?: unknown };

        console.log('[OptimizedHttpClient] API包装格式响应:', {
          code: apiResponse.code,
          msg: apiResponse.msg,
          hasData: !!apiResponse.data,
        });

        if (apiResponse.code !== 0) {
          throw new SatsnetApiError(
            `API Error: ${apiResponse.msg}`,
            apiResponse.code,
            apiResponse.data
          );
        }

        const result = (apiResponse.data ?? apiResponse) as T;

        // 缓存成功响应
        if (response.statusCode === 200) {
          this.storeInCache(cacheKey, result);
        }

        console.log('[OptimizedHttpClient] 处理后的结果:', result);
        return result;
      }

      // 缓存直接响应
      if (response.statusCode === 200) {
        this.storeInCache(cacheKey, data);
      }

      console.log('[OptimizedHttpClient] 直接返回数据:', data);
      return data as T;
    } catch (error) {
      if (error instanceof SatsnetApiError) {
        console.error('[OptimizedHttpClient] SatsnetApiError:', {
          message: error.message,
          code: error.code,
          data: error.data,
        });
        throw error;
      }

      console.error('[OptimizedHttpClient] 请求失败:', {
        error: error,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'No message',
      });

      if (error instanceof Error && error.name === 'AbortError') {
        throw new SatsnetApiError(`请求超时 (${this.config.timeout}ms)`, -1, {
          timeout: this.config.timeout,
        });
      }

      throw new SatsnetApiError(
        `网络请求失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
        -1,
        { originalError: error }
      );
    }
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
    console.log('[OptimizedHttpClient] 缓存已清理');
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    console.log('[OptimizedHttpClient] 关闭连接池');
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
    if (newConfig.connections || newConfig.http2 || newConfig.keepAlive) {
      await this.close();
      this.setupDispatcher();
    }
  }
}

// 优化的 SatsNetClient
export class SatsNetClient {
  private config: AdvancedHttpConfig;
  private httpClient: OptimizedHttpClient;

  constructor(config: Partial<AdvancedHttpConfig> = {}) {
    // 默认配置
    const defaultConfig: AdvancedHttpConfig = {
      baseUrl: 'https://apiprd.ordx.market',
      network: 'testnet',
      chain: 'btc',
      timeout: 10000,
      retries: 3,
      connections: 50,
      cache: true,
      metrics: true,
    };

    this.config = { ...defaultConfig, ...config };
    console.log('[SatsNetClient] 创建优化客户端，配置:', this.config);

    this.httpClient = new OptimizedHttpClient(this.config);
  }

  /**
   * 获取当前配置
   */
  get config() {
    return this.config;
  }

  /**
   * Get name info by name
   * @param name - Name to query
   * @returns Promise with name service information
   */
  async getNameInfo(name: string): Promise<NameService> {
    console.log('[SatsNetClient] getNameInfo 调用开始（优化版本）');
    console.log(`[SatsNetClient] 参数 name: "${name}"`);
    console.log(`[SatsNetClient] 当前网络: ${this.config.network}`);

    // 输入验证
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new SatsnetApiError('Invalid name: name cannot be empty', -1001);
    }

    if (name.length < 1 || name.length > 100) {
      throw new SatsnetApiError('Invalid name: length must be between 1-100 characters', -1001);
    }

    console.log('[SatsNetClient] 输入验证通过');

    try {
      // 调用优化的 HTTP 客户端
      const result = await this.httpClient.get<NameService>(`ns/name/${encodeURIComponent(name)}`);

      console.log('[SatsNetClient] getNameInfo 调用成功（优化版本）');
      console.log('[SatsNetClient] 返回结果:', result);

      return result;
    } catch (error) {
      console.error('[SatsNetClient] getNameInfo 调用失败（优化版本）:', error);
      throw error;
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return this.httpClient.getMetrics();
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.httpClient.clearCache();
  }

  /**
   * Update base URL for different environments
   * @param baseUrl - New base URL
   */
  setBaseUrl(baseUrl: string): void {
    console.log(`[SatsNetClient] 更新 baseUrl: ${baseUrl}`);
    this.config.baseUrl = baseUrl;
    this.httpClient = new OptimizedHttpClient(this.config);
  }

  /**
   * Update network configuration
   * @param network - New network
   */
  setNetwork(network: 'mainnet' | 'testnet' | 'livenet'): void {
    console.log(`[SatsNetClient] 更新网络: ${network}`);
    this.config.network = network;
    this.httpClient = new OptimizedHttpClient(this.config);
  }

  /**
   * 关闭客户端
   */
  async close(): Promise<void> {
    console.log('[SatsNetClient] 关闭优化客户端');
    await this.httpClient.close();
  }
}

// 导出类型以供外部使用
export type { NameService, AdvancedHttpConfig, PerformanceMetrics };
