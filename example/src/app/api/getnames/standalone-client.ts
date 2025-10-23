// 完全独立的 SatsNet API 客户端实现
// 专门为 Next.js 环境设计，不引用任何 src 目录文件
// 参考 @src/utils/advanced-http.ts 的 undici 使用模式

import { request, Pool } from 'undici';

// 基础配置接口
interface ApiConfig {
  baseUrl: string;
  network: 'mainnet' | 'testnet' | 'livenet';
  chain: string;
  timeout: number;
  retries: number;
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
    public code: number = -1,
    public data?: any
  ) {
    super(message);
    this.name = 'SatsnetApiError';
  }
}

// Next.js 专用的 HTTP 客户端
class NextJSHttpClient {
  private config: ApiConfig;
  private dispatcher: any; // Pool

  constructor(config: ApiConfig) {
    console.log(`[NextJSHttpClient] 初始化配置:`, {
      baseUrl: config.baseUrl,
      network: config.network,
      chain: config.chain,
      timeout: config.timeout
    });

    this.config = config;
    this.setupDispatcher();
  }

  private setupDispatcher(): void {
    // 检测 Next.js 环境
    const isNextJS =
      typeof window === 'undefined' &&
      (process.env.NEXT_RUNTIME || process.env.NODE_ENV === 'production' || process.env.VERCEL);

    console.log(`[NextJSHttpClient] 环境检测: isNextJS = ${isNextJS}`);
    console.log(`[NextJSHttpClient] 环境变量:`, {
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    });

    // HTTP/1.1 连接池 - Next.js 环境配置
    const poolOptions = {
      connections: 50,
      keepAliveTimeout: 60000,
      pipelining: 0, // 禁用 pipelining 支持 keepAlive
    };

    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    console.log(`[NextJSHttpClient] 创建连接池，baseUrl: ${baseUrl}`);

    this.dispatcher = new Pool(baseUrl, poolOptions);
  }

  /**
   * 构建 URL
   */
  private buildUrl(path: string): string {
    const baseUrl = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    // 构建完整 URL: baseUrl + "/" + chain + "/" + network + "/" + path
    const fullPath = `${baseUrl}/${this.config.chain}/${this.config.network}/${path}`;

    console.log(`[NextJSHttpClient] 构建完整URL: ${fullPath}`);
    return fullPath;
  }

  /**
   * GET 请求
   */
  async get<T = any>(path: string): Promise<T> {
    const url = this.buildUrl(path);

    console.log(`[NextJSHttpClient] 开始 GET 请求: ${url}`);
    console.log(`[NextJSHttpClient] 请求配置:`, {
      method: 'GET',
      headersTimeout: this.config.timeout,
      bodyTimeout: this.config.timeout,
    });

    try {
      // 构建 headers
      const headers = {
        'user-agent': 'satsnet-api/1.0.0',
        'accept': 'application/json',
        'content-type': 'application/json',
      };

      console.log(`[NextJSHttpClient] 请求头:`, headers);

      // 发起请求 - 使用 undici 的 request 函数
      const response = await request(url, {
        method: 'GET',
        headers,
        dispatcher: this.dispatcher,
        bodyTimeout: this.config.timeout,
        headersTimeout: this.config.timeout,
      });

      console.log(`[NextJSHttpClient] 响应状态: ${response.statusCode}`);
      console.log(`[NextJSHttpClient] 响应头:`, response.headers);

      // 验证响应状态
      if (response.statusCode >= 400) {
        const errorText = await response.body.text();
        console.error(`[NextJSHttpClient] HTTP错误:`, {
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          errorText: errorText.substring(0, 200)
        });

        throw new SatsnetApiError(
          `HTTP ${response.statusCode}: ${response.statusMessage || 'Request Failed'}`,
          response.statusCode,
          { url, status: response.statusCode, responseText: errorText }
        );
      }

      // 安全解析 JSON
      let data: any;
      try {
        console.log(`[NextJSHttpClient] 开始解析 JSON`);
        data = await response.body.json();
        console.log(`[NextJSHttpClient] JSON 解析成功`);
      } catch (jsonError) {
        console.warn(`[NextJSHttpClient] JSON 解析失败，尝试文本解析:`, jsonError);

        const text = await response.body.text();
        console.log(`[NextJSHttpClient] 响应文本 (前200字符):`, text.substring(0, 200));

        // 检查是否是 HTML 错误页面
        if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
          throw new SatsnetApiError(
            'Server returned HTML instead of JSON - this may be an error page or proxy issue',
            500,
            { responsePreview: text.slice(0, 200) }
          );
        }

        try {
          data = JSON.parse(text);
          console.log(`[NextJSHttpClient] 文本 JSON 解析成功`);
        } catch (textError) {
          throw new SatsnetApiError(
            `Invalid JSON response: ${textError instanceof Error ? textError.message : 'Unknown error'}`,
            500,
            {
              originalError: jsonError,
              textError,
              contentType: response.headers['content-type'],
              contentLength: response.headers['content-length'],
            }
          );
        }
      }

      // 处理 API 响应格式
      console.log(`[NextJSHttpClient] 处理响应数据，数据类型:`, typeof data);
      console.log(`[NextJSHttpClient] 响应数据结构:`, data);

      if (typeof data === 'object' && data !== null && 'code' in data) {
        const apiResponse = data as { code: number; msg: string; data?: unknown };

        console.log(`[NextJSHttpClient] API包装格式响应:`, {
          code: apiResponse.code,
          msg: apiResponse.msg,
          hasData: !!apiResponse.data
        });

        if (apiResponse.code !== 0) {
          throw new SatsnetApiError(
            `API Error: ${apiResponse.msg}`,
            apiResponse.code,
            apiResponse.data
          );
        }

        const result = (apiResponse.data ?? apiResponse) as T;
        console.log(`[NextJSHttpClient] 处理后的结果:`, result);
        return result;
      }

      console.log(`[NextJSHttpClient] 直接返回数据:`, data);
      return data as T;

    } catch (error) {
      if (error instanceof SatsnetApiError) {
        console.error(`[NextJSHttpClient] SatsnetApiError:`, {
          message: error.message,
          code: error.code,
          data: error.data
        });
        throw error;
      }

      console.error(`[NextJSHttpClient] 请求失败:`, {
        error: error,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'No message',
        stack: error instanceof Error ? error.stack : 'No stack'
      });

      if (error instanceof Error && error.name === 'AbortError') {
        throw new SatsnetApiError(`请求超时 (${this.config.timeout}ms)`, -1, {
          timeout: this.config.timeout
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
   * 关闭连接池
   */
  async close(): Promise<void> {
    console.log(`[NextJSHttpClient] 关闭连接池`);
    if (this.dispatcher && typeof this.dispatcher.close === 'function') {
      await this.dispatcher.close();
    }
  }
}

// SatsNetClient - 独立实现
export class SatsNetClient {
  private config: ApiConfig;
  private httpClient: NextJSHttpClient;

  constructor(config: Partial<ApiConfig> = {}) {
    // 默认配置
    const defaultConfig: ApiConfig = {
      baseUrl: 'https://apiprd.ordx.market',
      network: 'testnet',
      chain: 'btc',
      timeout: 10000,
      retries: 3,
    };

    this.config = { ...defaultConfig, ...config };
    console.log(`[SatsNetClient] 创建客户端，配置:`, this.config);

    this.httpClient = new NextJSHttpClient(this.config);
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
    console.log(`[SatsNetClient] getNameInfo 调用开始`);
    console.log(`[SatsNetClient] 参数 name: "${name}"`);
    console.log(`[SatsNetClient] 当前网络: ${this.config.network}`);
    console.log(`[SatsNetClient] 当前链: ${this.config.chain}`);

    // 输入验证
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new SatsnetApiError('Invalid name: name cannot be empty', -1001);
    }

    if (name.length < 1 || name.length > 100) {
      throw new SatsnetApiError('Invalid name: length must be between 1-100 characters', -1001);
    }

    console.log(`[SatsNetClient] 输入验证通过`);

    try {
      // 调用 HTTP 客户端 - 使用正确的 API 路径
      const result = await this.httpClient.get<NameService>(`ns/name/${encodeURIComponent(name)}`);

      console.log(`[SatsNetClient] getNameInfo 调用成功`);
      console.log(`[SatsNetClient] 返回结果:`, result);

      return result;

    } catch (error) {
      console.error(`[SatsNetClient] getNameInfo 调用失败:`, error);
      throw error;
    }
  }

  /**
   * Update base URL for different environments
   * @param baseUrl - New base URL
   */
  setBaseUrl(baseUrl: string): void {
    console.log(`[SatsNetClient] 更新 baseUrl: ${baseUrl}`);
    this.config.baseUrl = baseUrl;
    this.httpClient = new NextJSHttpClient(this.config);
  }

  /**
   * Update network configuration
   * @param network - New network
   */
  setNetwork(network: 'mainnet' | 'testnet' | 'livenet'): void {
    console.log(`[SatsNetClient] 更新网络: ${network}`);
    this.config.network = network;
    this.httpClient = new NextJSHttpClient(this.config);
  }

  /**
   * 关闭客户端
   */
  async close(): Promise<void> {
    console.log(`[SatsNetClient] 关闭客户端`);
    await this.httpClient.close();
  }
}

// 导出类型以供外部使用
export type { NameService, ApiConfig };