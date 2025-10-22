import { SatsNetClient } from '@/api/satsnet-client';
import type { ApiConfig, Network } from '@/types';
import { isError, isSuccess, tryit, tryitAll, tryitOrDefault } from '@/utils/tryit';

/**
 * Safe API wrapper that provides error handling for all SatsNet API calls
 * This eliminates the need for users to handle try-catch blocks manually
 */
export class SafeSatsNetClient {
  private client: SatsNetClient;

  constructor(config?: Partial<{ network: Network; baseUrl: string }>) {
    this.client = new SatsNetClient(config);
  }

  // --- UTXO Management ---

  /**
   * Get all UTXOs for an address
   * @returns [error, result] tuple
   */
  async getUtxos(address: string) {
    return tryit(() => this.client.getUtxos(address))();
  }

  /**
   * Get plain UTXOs for an address
   * @returns [error, result] tuple
   */
  async getPlainUtxos(address: string) {
    return tryit(() => this.client.getPlainUtxos(address))();
  }

  /**
   * Get rare UTXOs for an address
   * @returns [error, result] tuple
   */
  async getRareUtxos(address: string) {
    return tryit(() => this.client.getRareUtxos(address))();
  }

  /**
   * Get specific UTXO information
   * @returns [error, result] tuple
   */
  async getUtxo(utxo: string) {
    return tryit(() => this.client.getUtxo(utxo))();
  }

  /**
   * Get UTXOs by value with default
   * @returns UTXO list or empty array on error
   */
  async getUtxosByValueOrDefault(address: string, value = 600) {
    return tryitOrDefault(() => this.client.getUtxosByValue(address, value), [])();
  }

  // --- Transaction Management ---

  /**
   * Get transaction hex
   * @returns [error, result] tuple
   */
  async getTransactionHex(txid: string) {
    return tryit(() => this.client.getTransactionHex(txid))();
  }

  /**
   * Push transaction
   * @returns [error, result] tuple
   */
  async pushTransaction(hex: string) {
    return tryit(() => this.client.pushTransaction(hex))();
  }

  // --- Address and Account ---

  /**
   * Get address summary
   * @returns [error, result] tuple
   */
  async getAddressSummary(address: string) {
    return tryit(() => this.client.getAddressSummary(address))();
  }

  // --- Network ---

  /**
   * Get best height
   * @returns [error, result] tuple
   */
  async getBestHeight() {
    return tryit(() => this.client.getBestHeight())();
  }

  // --- Ticker/Asset Management ---

  /**
   * Get ticker information
   * @returns [error, result] tuple
   */
  async getTickerInfo(ticker: string) {
    return tryit(() => this.client.getTickerInfo(ticker))();
  }

  /**
   * Get multiple ticker infos in parallel
   * @returns [errors, results] tuple
   */
  async getMultipleTickerInfos(tickers: string[]) {
    const fns = tickers.map((ticker) => () => this.client.getTickerInfo(ticker));
    return tryitAll(fns);
  }

  /**
   * Get asset holders
   * @returns [error, result] tuple
   */
  async getTickerHolders(ticker: string, start = 0, limit = 10) {
    return tryit(() => this.client.getTickerHolders(ticker, start, limit))();
  }

  /**
   * Get address asset holders
   * @returns [error, result] tuple
   */
  async getAddressAssetHolders(address: string, ticker: string, start = 0, limit = 10) {
    return tryit(() => this.client.getAddressAssetHolders(address, ticker, start, limit))();
  }

  // --- Name Service ---

  /**
   * Get name info
   * @returns [error, result] tuple
   */
  async getNameInfo(name: string) {
    return tryit(() => this.client.getNameInfo(name))();
  }

  /**
   * Get name list by address
   * @returns [error, result] tuple
   */
  async getNameListByAddress(address: string, start = 0, limit = 100) {
    return tryit(() => this.client.getNameListByAddress(address, start, limit))();
  }

  /**
   * Get name sub UTXOs
   * @returns [error, result] tuple
   */
  async getNameSubUtxos(address: string, sub: string, page = 1, pagesize = 10) {
    return tryit(() => this.client.getNameSubUtxos(address, sub, page, pagesize))();
  }

  // --- Health and Status ---

  /**
   * Health check with default
   * @returns Health status or default on error
   */
  async healthCheckOrDefault() {
    return tryitOrDefault(() => this.client.healthCheck(), {
      status: 'error',
      version: 'unknown',
      basedbver: 'unknown',
      ordxdbver: 'unknown',
    })();
  }

  /**
   * Health check
   * @returns [error, result] tuple
   */
  async healthCheck() {
    return tryit(() => this.client.healthCheck())();
  }

  // --- Utility Methods ---

  /**
   * Execute multiple API calls in parallel
   * @param apiCalls - Array of API call functions
   * @returns [errors, results] tuple
   */
  async executeParallel<T>(apiCalls: Array<() => Promise<T>>) {
    return tryitAll(apiCalls);
  }

  /**
   * Get the underlying client instance
   * @returns SatsNetClient instance
   */
  getClient(): SatsNetClient {
    return this.client;
  }

  /**
   * Update client configuration
   * @param config - New configuration
   */
  updateConfig(config: Partial<{ network: Network; baseUrl: string }>) {
    // Create new client with updated config
    const newConfig: Partial<ApiConfig> = {};
    if (config.network !== undefined) newConfig.network = config.network;
    if (config.baseUrl !== undefined) newConfig.baseUrl = config.baseUrl;

    this.client = new SatsNetClient(newConfig);
  }
}

/**
 * Create a safe API client instance
 * @param config - Optional configuration
 * @returns SafeSatsNetClient instance
 */
export function createSafeClient(config?: Partial<{ network: Network; baseUrl: string }>) {
  return new SafeSatsNetClient(config);
}

/**
 * Default safe client instance
 */
export const safeSatsnet = new SafeSatsNetClient();

// Export utility functions for direct use
export { isError, isSuccess, tryit, tryitOrDefault, tryitAll };
