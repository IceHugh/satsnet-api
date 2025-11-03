/**
 * Network types
 */
export type Network = 'mainnet' | 'testnet' | 'livenet';

/**
 * Chain types
 */
export type Chain = 'btc' | 'satsnet';

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/**
 * UTXO (Unspent Transaction Output)
 */
export interface Utxo {
  txid: string;
  vout: number;
  value: number;
  address?: string;
  script?: string;
  status?: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

/**
 * Enhanced UTXO interface for API responses
 */
export interface EnhancedUtxo {
  height: number;
  index: number;
  txid: string;
  vout: number;
  value: number;
  address?: string;
  script?: string;
  status?: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

/**
 * UTXO response with additional properties
 */
export interface UtxoResponse {
  code: number;
  msg: string;
  total: number;
  plainutxos: EnhancedUtxo[];
  otherutxos: EnhancedUtxo[];
}

/**
 * Transaction raw data
 */
export interface TransactionRaw {
  hex: string;
  txid: string;
  version: number;
  locktime: number;
  vin: TransactionInput[];
  vout: TransactionOutput[];
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

export interface TransactionInput {
  txid: string;
  vout: number;
  scriptsig: string;
  scriptsig_asm?: string;
  witness?: string[];
  sequence: number;
}

export interface TransactionOutput {
  scriptpubkey: string;
  scriptpubkey_asm?: string;
  scriptpubkey_type?: string;
  scriptpubkey_address?: string;
  value: number;
}

/**
 * Address asset summary item
 */
export interface AddressAssetItem {
  Name: TickerName;
  Amount: string;
  Precision: number;
  BindingSat: number;
  Offsets: Record<string, unknown>[] | null;
}

/**
 * Address summary (returns array of assets)
 */
export interface AddressSummaryData extends AddressAssetItem {}
export type AddressSummary = AddressAssetItem[];

/**
 * Enhanced Address Summary for API response
 */
export interface AddressSummaryResponse {
  address?: string;
  balance?: number;
  // 实际API返回AddressAssetItem数组格式，但为了测试兼容性保留上述属性
  // API实际返回: AddressAssetItem[]
}

/**
 * Fee rates
 */
export interface FeeRates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

/**
 * Ticker name information
 */
export interface TickerName {
  Protocol: string;
  Type: string;
  Ticker: string;
}

/**
 * Ticker/Asset information
 */
export interface TickerInfo {
  name: TickerName;
  ticker?: string; // 添加 ticker 属性
  displayname: string;
  id: number;
  startBlock: number;
  endBlock: number;
  deployHeight: number;
  deployBlockTime: number;
  deployTx: string;
  limit: string;
  n: number;
  totalMinted: string;
  mintTimes: number;
  maxSupply: string;
  holdersCount: number;
  inscriptionId: string;
  inscriptionNum: number;
  description?: string;
  deployAddress: string;
  content: string;
  contenttype: string;
  status: number;
}

/**
 * Asset holder information
 */
export interface AssetHolder {
  address: string;
  balance: string;
  rank?: number;
}

/**
 * Ticker holder information from API
 */
export interface TickerHolder {
  wallet: string;
  total_balance: string;
}

/**
 * Ticker holders response
 */
export interface TickerHoldersResponse {
  start: number;
  total: number;
  detail: TickerHolder[];
}

/**
 * Name service (BRC-20 names)
 */
export interface NameService {
  name: string;
  address: string;
  block?: number;
  txid?: string;
  status?: 'registered' | 'available';
}

/**
 * Enhanced Name service item from API
 */
export interface NameServiceItem {
  id: number;
  name: string;
  sat: number;
  address: string;
  inscriptionId: string;
  utxo: string;
  value: number;
  height: number;
  time: number;
  inscriptionAddress: string;
  kvs: Record<string, unknown> | null;
}

/**
 * Name service list response
 */
export interface NameServiceListResponse {
  address: string;
  total: number;
  names: NameServiceItem[] | null;
}

/**
 * Name sub-UTXOs response
 */
export interface NameSubUtxosResponse {
  address: string;
  total: number;
  names: NameServiceItem[] | null;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: string;
  version: string;
  basedbver: string;
  ordxdbver: string;
}

/**
 * Best height response
 */
export interface BestHeightResponse {
  height: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  start?: number;
  limit?: number;
  page?: number;
  pagesize?: number;
}

/**
 * API request parameters
 */
export interface RequestParams extends PaginationParams {
  address?: string;
  network?: Network;
  txid?: string;
  utxo?: string;
  name?: string;
  ticker?: string;
  hex?: string;
  sub?: string;
  pubkey?: string;
  value?: number;
  start?: number;
  limit?: number;
  page?: number;
  pagesize?: number;
}

/**
 * API configuration
 */
export interface ApiConfig {
  baseUrl: string;
  network: Network;
  chain?: Chain;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  connections?: number;
  keepAlive?: boolean;
  // 压缩配置 - 由用户自主选择
  compression?: boolean;
  acceptEncoding?: string[];
  // Next.js 环境配置
  isNextJS?: boolean;
}

/**
 * Enhanced UTXO response for getUtxo method
 */
export interface EnhancedUtxoResponse {
  code: number;
  msg: string;
  data?: {
    height: number;
    index: number;
    txid: string;
    vout: number;
    value: number;
    address?: string;
    script?: string;
    scriptPubKey?: string;
    status?: {
      confirmed: boolean;
      block_height?: number;
      block_hash?: string;
      block_time?: number;
    };
    coinbase?: boolean;
  };
}

/**
 * Transaction hex response for getTransactionHex method
 */
export interface TransactionHexResponse {
  code: number;
  msg: string;
  data?: {
    hex: string;
    txid: string;
    complete: boolean;
    final: boolean;
    size?: number;
    vsize?: number;
    weight?: number;
    fee?: number;
  };
}

/**
 * Name info response for getNameInfo method
 */
export interface NameInfoResponse {
  code: number;
  msg: string;
  data?: {
    id?: number;
    name: string;
    address?: string;
    block?: number;
    txid?: string;
    status?: 'registered' | 'available' | 'expired';
    inscriptionId?: string;
    inscriptionNumber?: number;
    satoshi?: number;
    utxo?: string;
    value?: number;
    height?: number;
    time?: number;
    inscriptionAddress?: string;
    kvs?: Record<string, unknown> | null;
  };
}

/**
 * Error types
 */
export class SatsnetApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'SatsnetApiError';
  }
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  mainnet: string;
  testnet: string;
  livenet?: string;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  ordxBaseUrl: string;
  network: Network;
}

/**
 * HTTP Client interface
 */
export interface IHttpClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(path: string, body: Record<string, unknown>): Promise<T>;
  batchRequest<T>(
    requests: Array<{ path: string; params?: Record<string, unknown> }>
  ): Promise<T[]>;
  getMetrics(): unknown;
  clearCache(): void;
  updateConfig(newConfig: Partial<ApiConfig>): void;
  getConfig(): ApiConfig;
  close(): Promise<void>;
}
