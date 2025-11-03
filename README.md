# SatsNet API

<div align="center">

![SatsNet API](https://img.shields.io/badge/SatsNet%20API-1.1.2-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![Universal](https://img.shields.io/badge/Universal%20Runtime-brightgreen)
![Multi-Platform](https://img.shields.io/badge/Platform-Node%20%7C%20Bun%20%7C%20Deno%20%7C%20Browser-9cf)
![ofetch](https://img.shields.io/badge/ofetch-1.5+-orange)

</div>

A high-performance SatsNet protocol API library with universal runtime support for **Node.js**, **Bun**, **Deno**, **Edge Runtimes**, and **Browsers**. Built with TypeScript, ofetch, and radash for optimal performance across all platforms.

## ✨ Features

- 🌍 **Universal Runtime**: Works seamlessly in Node.js, Bun, Deno, Edge Runtimes, and Browsers
- 🚀 **High Performance**: Built with ofetch for optimal HTTP performance across all platforms
- 🔒 **TypeScript Support**: Full TypeScript support with strict type checking
- 🛡️ **Smart Error Handling**: Comprehensive error handling with detailed error messages
- ⚙ **Flexible Configuration**: Dynamic configuration support for different networks and endpoints
- 🔄 **Retry Mechanism**: Built-in retry logic with exponential backoff
- 📊 **Performance Metrics**: Built-in caching and performance monitoring
- 🌐 **Isomorphic Design**: Same API works everywhere without environment-specific code
- 📦 **Batch Requests**: Support for parallel API calls to improve efficiency
- ✅ **Input Validation**: Built-in validation for Bitcoin addresses, transaction IDs, and UTXOs
- 🔧 **Zero Configuration**: Works out of the box with smart defaults

## 🚀 Quick Start

### Installation

```bash
# Install main package
bun add @btclib/satsnet-api

# or npm
npm install @btclib/satsnet-api

# or pnpm
pnpm add @btclib/satsnet-api

# or yarn
yarn add @btclib/satsnet-api
```

**Universal Runtime Support**: Works in Node.js, Bun, Deno, Edge Runtimes, and Browsers with no additional configuration required.

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

// For Next.js environments - enable compatibility mode
const nextjsClient = new SatsNetClient({
  network: 'mainnet',
  timeout: 15000,
  isNextJS: true,  // Required for Next.js compatibility
  compression: false
});
```

## 🌍 Universal Runtime Examples

The same API works across all runtimes without any changes:

### Node.js / Bun
```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

const client = new SatsNetClient({
  network: 'mainnet',
  timeout: 10000
});

const utxos = await client.getUtxos('bc1q...');
console.log('UTXOs:', utxos);
```

### Deno
```typescript
import { SatsNetClient } from 'https://deno.land/x/satsnet_api/mod.ts';

const client = new SatsNetClient({
  network: 'mainnet',
  timeout: 10000
});

const utxos = await client.getUtxos('bc1q...');
console.log('UTXOs:', utxos);
```

### Browser / Edge Runtime
```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { SatsNetClient } from 'https://cdn.skypack.dev/@btclib/satsnet-api';

        const client = new SatsNetClient();

        async function fetchUTXOs() {
            try {
                const utxos = await client.getUtxos('bc1q...');
                console.log('UTXOs:', utxos);
            } catch (error) {
                console.error('Error:', error.message);
            }
        }

        fetchUTXOs();
    </script>
</head>
<body>
    <h1>SatsNet API Example</h1>
</body>
</html>
```

### Cloudflare Pages / Edge Functions
```typescript
// functions/api/utxos/[address].ts
import { SatsNetClient } from '@btclib/satsnet-api';

export async function onRequest(context) {
  const { params } = context;
  const client = new SatsNetClient();

  try {
    const utxos = await client.getUtxos(params.address);
    return new Response(JSON.stringify(utxos), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
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
  keepAlive?: boolean;   // Enable HTTP keep-alive (default: false)
  cache?: boolean;       // Enable caching (default: true)
  compression?: boolean; // Enable compression (default: false)
  isNextJS?: boolean;    // Enable Next.js compatibility mode (default: false)
}
```

### Next.js Compatibility

For Next.js environments, enable compatibility mode to avoid JSON parsing issues:

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// Required for Next.js applications
const nextjsClient = new SatsNetClient({
  network: 'mainnet',
  timeout: 15000,
  isNextJS: true,      // Enable Next.js compatibility mode
  compression: false,  // Recommended for Next.js
  keepAlive: true      // Optimized for Next.js
});

// Works in API routes, server components, and client components
export default async function handler(req, res) {
  try {
    const utxos = await nextjsClient.getUtxos(req.query.address);
    res.status(200).json(utxos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**⚠️ Important**: Always set `isNextJS: true` when using this library in Next.js environments.

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

## 🏗️ Building & Deployment

### Multi-Runtime Building

```bash
# Build for all platforms
npm run build:all

# Build for specific platforms
npm run build          # Node.js (ESM)
npm run build:cjs       # Node.js (CommonJS)
npm run build:web       # Browser/Edge Runtime
npm run build:deno      # Deno
npm run build:cloudflare # Cloudflare Pages

# Production builds
npm run build:prod      # All platforms, optimized
```

### Development

```bash
# Development with different runtimes
npm run dev            # Bun
npm run dev:node       # Node.js
npm run dev:deno       # Deno

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

### Testing

```bash
# Run all tests
npm test

# Run tests with specific runtimes
npm run test:node       # Node.js testing
npm run test:deno       # Deno testing

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
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

- **Main Package**: ~28.13 kB (uncompressed)
- **With Dependencies**: ~92.1 kB (includes ofetch)
- **Tree Shakable**: Supports optimal tree shaking

## 🌍 Cloudflare Pages Deployment

Deploy SatsNet API to Cloudflare Pages for global edge deployment:

### Quick Deploy

```bash
# Build for Cloudflare Pages
npm run build:cloudflare

# Deploy using Wrangler CLI
wrangler pages deploy dist --project-name satsnet-api
```

### Environment Detection

The library automatically detects the runtime environment:

```typescript
import { getEnvironmentInfo } from '@btclib/satsnet-api';

const envInfo = getEnvironmentInfo();
console.log('Environment:', envInfo);
// Output: { isWeb: true, isCloudflarePages: true, isNode: false, runtime: 'Cloudflare Pages' }
```

### Cloudflare Pages Features

- ✅ **Automatic Environment Detection**: Runtime detection for optimal client selection
- ✅ **Global CDN**: Automatic worldwide distribution
- ✅ **Edge Computing**: Run at edge locations for low latency
- ✅ **Zero Configuration**: Works out of the box
- ✅ **Type Safety**: Full TypeScript support

### Example Usage in Cloudflare Pages

```typescript
// functions/api/utxos/[address].ts
import { SatsNetClient } from '@btclib/satsnet-api';

export async function onRequest(context) {
  const { params } = context;
  const client = new SatsNetClient();

  try {
    const utxos = await client.getUtxos(params.address);
    return new Response(JSON.stringify(utxos), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

📖 **[Complete Cloudflare Pages Deployment Guide](./docs/cloudflare-pages-deployment.md)**

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
- ⚛️ [Next.js Usage Guide](./docs/nextjs-usage.md)
- 🌍 [Cloudflare Pages Deployment Guide](./docs/cloudflare-pages-deployment.md)
- 🐛 [Contributing Guide](./CONTRIBUTING.md)
- 🔒 [Security Policy](./SECURITY.md)

---

<div align="center">
  <sub><strong>Made with ❤️ by icehugh</strong></sub>
</div>