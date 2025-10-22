import {
  type AddressAssetItem,
  type ApiConfig,
  type AssetHolder,
  type BestHeightResponse,
  type EnhancedUtxo,
  type HealthCheckResponse,
  type NameService,
  type NameServiceListResponse,
  type NameSubUtxosResponse,
  type Network,
  SatsnetApiError,
  type TickerHoldersResponse,
  type TickerInfo,
  type Utxo,
  type UtxoResponse,
} from '@/types';
import type { AdvancedHttpConfig } from '@/utils/advanced-http';
import { HttpClient } from '@/utils/http';
import { tryitAll } from '@/utils/tryit';

/**
 * 支持的批量请求方法类型
 */
export type BatchRequestMethod =
  | 'getUtxos'
  | 'getPlainUtxos'
  | 'getRareUtxos'
  | 'getUtxo'
  | 'getUtxosByValue'
  | 'getTransactionHex'
  | 'pushTransaction'
  | 'getAddressSummary'
  | 'getBestHeight'
  | 'getTickerInfo'
  | 'getTickerHolders'
  | 'getAddressAssetHolders'
  | 'getNameInfo'
  | 'getNameListByAddress'
  | 'getNameSubUtxos'
  | 'healthCheck';

/**
 * 批量请求参数类型
 */
export interface BatchRequestParams {
  method: BatchRequestMethod;
  params: unknown[]; // 使用 unknown 类型来支持不同方法的参数，更安全
}

/**
 * SatsNet API Client
 * High-performance API client with TypeScript support, error handling, and network configuration
 */
export class SatsNetClient {
  private httpClient: HttpClient;
  private config: ApiConfig;

  /**
   * Create SatsNet client instance
   * @param config - API configuration
   */
  constructor(config: Partial<ApiConfig> = {}) {
    const defaultConfig: ApiConfig = {
      baseUrl: 'https://apiprd.ordx.market',
      network: 'mainnet',
      chain: 'btc',
      timeout: 10000,
      retries: 3,
    };

    this.config = { ...defaultConfig, ...config };
    this.httpClient = new HttpClient(this.config);
  }

  /**
   * Update base URL for different environments
   * @param baseUrl - New base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
    this.httpClient.updateConfig({ baseUrl });
  }

  /**
   * Update default network
   * @param network - New default network
   */
  setNetwork(network: Network): void {
    this.config.network = network;
    this.httpClient.updateConfig({ network });
  }

  /**
   * Build query string from parameters
   * @param params - Parameters object
   * @returns Query string
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  }

  /**
   * Validate Bitcoin address format
   * @param address - Bitcoin address to validate
   * @throws SatsnetApiError if address is invalid
   */
  private validateAddress(address: string): void {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      throw new SatsnetApiError('Invalid Bitcoin address: address cannot be empty', -1001);
    }
    // 可以在这里添加更多地址格式验证
    if (address.length < 20 || address.length > 100) {
      throw new SatsnetApiError(
        'Invalid Bitcoin address: length must be between 20-100 characters',
        -1001
      );
    }
  }

  /**
   * Validate transaction ID format
   * @param txid - Transaction ID to validate
   * @throws SatsnetApiError if txid is invalid
   */
  private validateTxid(txid: string): void {
    if (!txid || typeof txid !== 'string' || txid.trim().length === 0) {
      throw new SatsnetApiError('Invalid transaction ID: txid cannot be empty', -1002);
    }
    // Bitcoin transaction IDs are 64 character hex strings
    if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
      throw new SatsnetApiError('Invalid transaction ID: must be a 64-character hex string', -1002);
    }
  }

  // --- UTXO Management ---

  /**
   * Get all UTXOs for an address
   * @param address - Bitcoin address
   * @returns Promise with UTXO response containing plainutxos and total
   */
  async getUtxos(address: string): Promise<UtxoResponse> {
    this.validateAddress(address);
    return this.httpClient.get(`allutxos/address/${address}`, {});
  }

  /**
   * Get plain UTXOs (non-ordinals) for an address
   * @param address - Bitcoin address
   * @returns Promise with UTXO list
   */
  async getPlainUtxos(address: string): Promise<EnhancedUtxo[]> {
    return this.httpClient.get(`utxo/address/${address}/0`, {});
  }

  /**
   * Get rare/exotic UTXOs for an address
   * @param address - Bitcoin address
   * @returns Promise with exotic UTXO list
   */
  async getRareUtxos(address: string): Promise<EnhancedUtxo[]> {
    return this.httpClient.get(`exotic/address/${address}`, {});
  }

  /**
   * Get specific UTXO information
   * @param utxo - UTXO identifier (txid:vout)
   * @returns Promise with UTXO details
   */
  async getUtxo(utxo: string): Promise<Utxo> {
    return this.httpClient.get(`utxo/range/${utxo}`, {});
  }

  /**
   * Get UTXO by value
   * @param address - Bitcoin address
   * @param value - Minimum value in satoshis
   * @returns Promise with UTXO list
   */
  async getUtxosByValue(address: string, value = 600): Promise<EnhancedUtxo[]> {
    return this.httpClient.get(`utxo/address/${address}/${value}`, {});
  }

  /**
   * Get transaction hex
   * @param txid - Transaction ID
   * @returns Promise with transaction hex
   */
  async getTransactionHex(txid: string): Promise<string> {
    this.validateTxid(txid);
    const result = await this.httpClient.get<{ hex: string }>(`btc/rawtx/${txid}`, {});
    return result.hex;
  }

  /**
   * Push signed transaction
   * @param hex - Signed transaction hex
   * @returns Promise with transaction result
   */
  async pushTransaction(hex: string): Promise<{ txid: string }> {
    return this.httpClient.post('btc/tx', { SignedTxHex: hex });
  }

  // --- Address and Account ---

  /**
   * Get address summary with statistics
   * @param address - Bitcoin address
   * @returns Promise with address summary
   */
  async getAddressSummary(address: string): Promise<AddressAssetItem[]> {
    return this.httpClient.get(`v3/address/summary/${address}`, {});
  }

  /**
   * Get best block height
   * @returns Promise with block height
   */
  async getBestHeight(): Promise<BestHeightResponse> {
    return this.httpClient.get('bestheight', {});
  }

  // --- Ticker/Asset Management ---

  /**
   * Get ticker information
   * @param ticker - Asset ticker
   * @returns Promise with ticker info
   */
  async getTickerInfo(ticker: string): Promise<TickerInfo> {
    return this.httpClient.get(`v3/tick/info/${ticker}`, {});
  }

  /**
   * Get asset holders
   * @param ticker - Asset ticker
   * @param start - Start index for pagination
   * @param limit - Limit for pagination
   * @returns Promise with holders list
   */
  async getTickerHolders(ticker: string, start = 0, limit = 10): Promise<TickerHoldersResponse> {
    const queryParams = this.buildQueryString({ start, limit });
    return this.httpClient.get(`v3/tick/holders/${ticker}?${queryParams}`, {});
  }

  /**
   * Get address asset holders
   * @param address - Bitcoin address
   * @param ticker - Asset ticker
   * @param start - Start index for pagination
   * @param limit - Limit for pagination
   * @returns Promise with asset holdings
   */
  async getAddressAssetHolders(
    address: string,
    ticker: string,
    start = 0,
    limit = 10
  ): Promise<AssetHolder[]> {
    const queryParams = this.buildQueryString({ start, limit });
    return this.httpClient.get(`v3/address/asset/${address}/${ticker}?${queryParams}`, {});
  }

  // --- Name Service ---

  /**
   * Get name service information
   * @param name - Name to query
   * @returns Promise with name info
   */
  async getNameInfo(name: string): Promise<NameService> {
    return this.httpClient.get(`ns/name/${name}`, {});
  }

  /**
   * Get name list by address
   * @param address - Bitcoin address
   * @param start - Start index for pagination
   * @param limit - Limit for pagination
   * @returns Promise with name list
   */
  async getNameListByAddress(
    address: string,
    start = 0,
    limit = 100
  ): Promise<NameServiceListResponse> {
    const queryParams = this.buildQueryString({ start, limit });
    return this.httpClient.get(`ns/address/${address}?${queryParams}`, {});
  }

  /**
   * Get name sub-UTXOs
   * @param address - Bitcoin address
   * @param sub - Sub name
   * @param page - Page number
   * @param pagesize - Page size
   * @returns Promise with sub-UTXO list
   */
  async getNameSubUtxos(
    address: string,
    sub: string,
    page = 1,
    pagesize = 10
  ): Promise<NameSubUtxosResponse> {
    const start = (page - 1) * pagesize;
    const queryParams = this.buildQueryString({ start, limit: pagesize });
    return this.httpClient.get(`ns/address/${address}/${sub}?${queryParams}`, {});
  }

  // --- Health and Status ---

  /**
   * Check API health
   * @returns Promise with health status
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.httpClient.get('health', {});
  }

  /**
   * Get current configuration
   * @returns Current client configuration
   */
  getConfig(): ApiConfig {
    return this.httpClient.getConfig();
  }

  /**
   * Get performance metrics
   * @returns Performance metrics from advanced HTTP client
   */
  getMetrics() {
    return this.httpClient.getMetrics();
  }

  /**
   * Clear HTTP cache
   */
  clearCache(): void {
    this.httpClient.clearCache();
  }

  /**
   * Batch parallel requests for improved performance
   * @param requests - Array of request configurations
   * @returns Promise with array of results
   */
  async batchRequest<T = unknown>(requests: BatchRequestParams[]): Promise<T[]> {
    const apiCalls = requests.map(({ method, params }) => {
      switch (method) {
        case 'getUtxos':
          return () => this.getUtxos(params[0] as string);
        case 'getPlainUtxos':
          return () => this.getPlainUtxos(params[0] as string);
        case 'getRareUtxos':
          return () => this.getRareUtxos(params[0] as string);
        case 'getUtxo':
          return () => this.getUtxo(params[0] as string);
        case 'getUtxosByValue':
          return () => this.getUtxosByValue(params[0] as string, params[1] as number);
        case 'getTransactionHex':
          return () => this.getTransactionHex(params[0] as string);
        case 'pushTransaction':
          return () => this.pushTransaction(params[0] as string);
        case 'getAddressSummary':
          return () => this.getAddressSummary(params[0] as string);
        case 'getBestHeight':
          return () => this.getBestHeight();
        case 'getTickerInfo':
          return () => this.getTickerInfo(params[0] as string);
        case 'getTickerHolders':
          return () =>
            this.getTickerHolders(params[0] as string, params[1] as number, params[2] as number);
        case 'getAddressAssetHolders':
          return () =>
            this.getAddressAssetHolders(
              params[0] as string,
              params[1] as string,
              params[2] as number,
              params[3] as number
            );
        case 'getNameInfo':
          return () => this.getNameInfo(params[0] as string);
        case 'getNameListByAddress':
          return () =>
            this.getNameListByAddress(
              params[0] as string,
              params[1] as number,
              params[2] as number
            );
        case 'getNameSubUtxos':
          return () =>
            this.getNameSubUtxos(
              params[0] as string,
              params[1] as string,
              params[2] as number,
              params[3] as number
            );
        case 'healthCheck':
          return () => this.healthCheck();
        default:
          throw new SatsnetApiError(`Unsupported batch method: ${method}`, -1);
      }
    });

    // 更安全的类型处理：先执行再检查结果
    const [errors, results] = await tryitAll(apiCalls as Array<() => Promise<unknown>>);

    // 如果有错误，抛出聚合的错误信息
    if (errors.length > 0) {
      const errorMessages = errors.map((e) => e.message).join('; ');
      throw new SatsnetApiError(`Batch requests failed: ${errorMessages}`, -1, {
        errors,
      });
    }

    // 安全的类型转换
    return results as T[];
  }

  /**
   * Close connection pool and cleanup resources
   */
  async close(): Promise<void> {
    await this.httpClient.close();
  }

  /**
   * Update advanced HTTP configuration
   * @param newConfig - New advanced configuration
   */
  async updateAdvancedConfig(newConfig: Partial<AdvancedHttpConfig>): Promise<void> {
    await this.httpClient.updateAdvancedConfig(newConfig);
  }
}
