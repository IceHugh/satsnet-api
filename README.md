# SatsNet API

<div align="center">

![SatsNet API](https://img.shields.io/badge/SatsNet%20API-1.0.0-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Bun](https://img.shields.io/badge/bun-%3E%3D1.0.0-black)

</div>

A high-performance SatsNet protocol API library built with Bun, TypeScript, undici, and radash.

## ✨ Features

- 🚀 **High Performance**: Built with Bun and undici for optimal performance
- 🔒 **TypeScript Support**: Full TypeScript support with strict type checking
- 🛡️ **Smart Error Handling**: Comprehensive error handling with detailed error messages
- ⚙ **Flexible Configuration**: Dynamic configuration support for different networks and endpoints
- 🔄 **Retry Mechanism**: Built-in retry logic with exponential backoff
- 📊 **Performance Metrics**: Built-in caching and performance monitoring
- 🌐 **Browser Compatible**: Works in both Node.js and browser environments
- 📦 **Batch Requests**: Support for parallel API calls to improve efficiency
- ✅ **Input Validation**: Built-in validation for Bitcoin addresses, transaction IDs, and UTXOs

## 🚀 Quick Start

### Installation

```bash
# Install main package
bun add @btclib/satsnet-api

# or npm
npm install @btclib/satsnet-api
```

**Note**: This library requires `undici` as a peer dependency for optimal performance.

### Basic Usage

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// Create client with default configuration (mainnet)
const client = new SatsNetClient();

// Or with custom configuration
const client = new SatsNetClient({
  baseUrl: 'https://api.example.com',
  network: 'testnet',
  timeout: 15000,
  retries: 5
});
```

## 📚 API Examples

### UTXO Management

```typescript
// Get all UTXOs for an address
const utxos = await client.getUtxos('bc1q...');
console.log(utxos);

// Get plain UTXOs (non-ordinals)
const plainUtxos = await client.getPlainUtxos('bc1q...');

// Get rare/special UTXOs
const rareUtxos = await client.getRareUtxos('bc1q...');

// Get specific UTXO
const utxo = await client.getUtxo('txid:vout');

// Get UTXOs by minimum value
const valueUtxos = await client.getUtxosByValue('bc1q...', 1000);
```

### Transaction Management

```typescript
// Get transaction hex data
const hex = await client.getTransactionHex('txid');

// Push signed transaction
const result = await client.pushTransaction('hex-string');
```

### Address Services

```typescript
// Get address summary and statistics
const summary = await client.getAddressSummary('bc1q...');

```

### Asset Management

```typescript
// Get ticker information
const info = await client.getTickerInfo('ordi');

// Get token holders with pagination
const holders = await client.getTickerHolders('ordi', 0, 20);

// Get address asset holders
const addressAssets = await client.getAddressAssetHolders(
  'bc1q...',
  'ordi',
  0,
  10
);
```

### Name Service

```typescript
// Get name service information
const nameInfo = await client.getNameInfo('sats');

// Get names owned by address
const names = await client.getNameListByAddress('bc1q...', 0, 50);

// Get name sub-UTXOs
const subUtxos = await client.getNameSubUtxos('bc1q...', 'subname', 1, 10);
```

### Health Check

```typescript
// Check API health status
const health = await client.healthCheck();

// Get best block height
const height = await client.getBestHeight();
```

## 🔧 Configuration Options

```typescript
interface ApiConfig {
  baseUrl?: string;      // API base URL (default: https://apiprd.ordx.market)
  network?: Network;     // Network: 'mainnet' | 'testnet' | 'livenet' (default: 'mainnet')
  chain?: Chain;         // Chain: 'btc' | 'satsnet' (default: 'btc')
  timeout?: number;     // Request timeout in milliseconds (default: 10000)
  retries?: number;      // Number of retry attempts (default: 3)
  headers?: Record<string, string>; // Custom headers
  connections?: number;  // Connection pool size (default: 50)
  http2?: boolean;      // Enable HTTP/2 (default: true)
  cache?: boolean;       // Enable caching (default: true)
}
```

### Advanced HTTP Client

For advanced use cases, you can access the underlying HTTP client directly:

```typescript
import { AdvancedHttpClient } from '@btclib/satsnet-api';

const httpClient = new AdvancedHttpClient({
  baseUrl: 'https://apiprd.ordx.market',
  network: 'mainnet',
  connections: 100,
  timeout: 30000,
  cache: true,
  metrics: true
});

// Use advanced features
const response = await httpClient.get('endpoint', { param: 'value' });
const metrics = httpClient.getMetrics();
```

## 🛡️ Error Handling

The library provides three different approaches to error handling:

### 1. Traditional Try-Catch (Recommended for beginners)

```typescript
try {
  const utxos = await client.getUtxos(address);
  console.log('UTXOs:', utxos);
} catch (error) {
  console.error('Error:', error.message);
}
```

### 2. Safe Client with tryit Helper Functions

```typescript
import { createSafeClient, isError, isSuccess } from '@btclib/satsnet-api';

const safeClient = createSafeClient();

// All methods return [error, result] tuples
const [error, utxos] = await safeClient.getUtxos(address);
if (isError([error, utxos])) {
  console.error('Error:', error.message);
} else {
  console.log('UTXOs:', utxos);
}
```

### 3. Safe Client with Default Values

```typescript
import { createSafeClient } from '@btclib/satsnet-api';

const safeClient = createSafeClient();

// Returns empty array on error
const utxos = await safeClient.getUtxosByValueOrDefault(address, 1000);

```

## 📊 Performance Monitoring

```typescript
// Get performance metrics
const metrics = client.getMetrics();
console.log('Request count:', metrics.requestCount);
console.log('Cache hits:', metrics.cacheHits);
console.log('Average latency:', metrics.averageLatency);

// Monitor performance in real-time
const advancedClient = new AdvancedHttpClient({
  baseUrl: 'https://apiprd.ordx.market',
  metrics: true,
  onMetrics: (metrics) => {
    console.log('Performance metrics updated:', metrics);
  }
});
```

## 🔄 Batch Requests

Execute multiple API calls in parallel for improved performance:

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

const client = new SatsNetClient();

// Define batch requests
const batchRequests = [
  { method: 'getUtxos', params: ['bc1q...'] },
  { method: 'getTickerInfo', params: ['ordi'] },
  { method: 'getBestHeight', params: [] }
];

// Execute batch request
const results = await client.batchRequest(batchRequests);

// Process results
results.forEach(([error, result], index) => {
  const methodName = batchRequests[index].method;
  if (error) {
    console.error(`${methodName} failed:`, error.message);
  } else {
    console.log(`${methodName} success:`, result);
  }
});
```

## 🧪 Development

### Building

```bash
# Build for development
bun run build

# Build for production
bun run build:prod

# Type checking
bun run type-check

# Linting
bun run lint
bun run lint:fix
```

### Testing

```bash
# Run all tests
bun test

# Run specific test suites
bun run test:unit
bun run test:integration
bun run test:performance

# Type checking only
bun run type-check
```

## 🔒 Input Validation

The library automatically validates inputs and provides detailed error messages:

- **Bitcoin Addresses**: Validates address format and length (20-100 characters)
- **Transaction IDs**: Validates 64-character hex string format
- **UTXO Format**: Validates `txid:vout` format

```typescript
try {
  await client.getUtxos(''); // Empty address
  await client.getTransactionHex('invalid'); // Invalid txid
  await client.getUtxo('invalid-format'); // Invalid UTXO format
} catch (error) {
  console.error('Validation error:', error.message);
  // Examples:
  // "Invalid Bitcoin address: address cannot be empty"
  // "Invalid transaction ID: must be a 64-character hex string"
  // "Invalid UTXO format: must be \"txid:vout\""
}
```

## 🌐 Browser Support

The library is fully compatible with modern browsers:

```html
<!DOCTYPE html>
<html>
<head>
    <title>SatsNet API Example</title>
</head>
<body>
    <script type="module">
        import { SatsNetClient } from 'https://cdn.skypack.dev/@btclib/satsnet-api';

        const client = new SatsNetClient({
            network: 'mainnet'
        });

        // Use the API
        document.getElementById('getUtxos').addEventListener('click', async () => {
            try {
                const utxos = await client.getUtxos('bc1q...');
                console.log('UTXOs:', utxos);
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

## 🔗 Network Support

Supports multiple Bitcoin networks:

```typescript
// Mainnet
const mainnetClient = new SatsNetClient({ network: 'mainnet' });

// Testnet
const testnetClient = new SatsNetClient({ network: 'testnet' });

// Livenet (production)
const livenetClient = new SatsNetClient({ network: 'livenet' });
```

## 📈 Bundle Size

- **Main Package**: ~22.2 kB (uncompressed)
- **With Dependencies**: ~98.4 kB (includes undici)
- **Tree Shakable**: Supports optimal tree shaking

## 📄 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

## 📄 License

[MIT License](./LICENSE)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 🔗 Links

- 📚 [API Documentation](./docs/api/README.md)
- 🚀 [Getting Started Guide](./docs/guide/getting-started.md)
- 🔧 [Advanced Usage](./docs/guide/advanced-usage.md)
- 🐛 [Contributing Guide](./CONTRIBUTING.md)
- 🔒 [Security Policy](./SECURITY.md)

---

<div align="center">
  <sub><strong>Made with ❤️ by icehugh</strong></sub>
</div>