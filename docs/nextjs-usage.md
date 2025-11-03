# Next.js 环境使用指南

## 问题说明

在 Next.js 环境中使用 SatsNet API 时可能会遇到 JSON 解析错误，特别是当响应编码为 `undefined` 时。为了解决这个问题，需要在配置中明确指定 `isNextJS: true` 来启用 Next.js 兼容模式。

## 解决方案

### 1. 启用 Next.js 兼容模式

在创建 SatsNet 客户端时，设置 `isNextJS: true` 来启用 Next.js 兼容配置：

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// Next.js 环境专用配置
const nextjsClient = new SatsNetClient({
  network: 'mainnet',
  timeout: 15000,
  、            // 启用 Next.js 兼容模式
  baseUrl: 'https://apiprd.ordx.market',
});
```

### 2. Next.js 兼容模式特性

当启用 `isNextJS: true` 时，库会应用以下优化：

- **缓冲区优先解析**: 在 Next.js 环境中，当响应编码为 `undefined` 时，优先使用缓冲区解析 JSON
- **增强错误处理**: 提供更详细的错误信息和调试日志
- **兼容性优化**: 确保 Next.js 服务端、客户端和 Edge Runtime 的兼容性
- **性能优化**: 基于 HTTP/1.1 和 keep-alive 的优化配置

### 3. 基本使用

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// 创建客户端实例（启用 Next.js 兼容模式）
const client = new SatsNetClient({
  baseUrl: 'https://apiprd.ordx.market',
  network: 'mainnet',
  timeout: 15000,
  isNextJS: true  // 在 Next.js 环境中必须明确启用
});

// 在 Next.js API Route 中使用
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const utxos = await client.getUtxos('bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    res.status(200).json({ success: true, data: utxos });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### 4. 客户端组件中使用

```typescript
'use client';

import { useState, useEffect } from 'react';
import { SatsNetClient } from '@btclib/satsnet-api';

export default function UtxoComponent({ address }: { address: string }) {
  const [utxos, setUtxos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new SatsNetClient({
      baseUrl: 'https://apiprd.ordx.market',
      network: 'mainnet',
      isNextJS: true  // 客户端组件中也需要启用
    });

    const fetchUtxos = async () => {
      try {
        const data = await client.getUtxos(address);
        setUtxos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch UTXOs');
      } finally {
        setLoading(false);
      }
    };

    fetchUtxos();
  }, [address]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>UTXOs for {address}</h3>
      <pre>{JSON.stringify(utxos, null, 2)}</pre>
    </div>
  );
}
```

### 5. 服务器端组件中使用

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// 服务器端组件
export default async function ServerComponent({ address }: { address: string }) {
  const client = new SatsNetClient({
    baseUrl: 'https://apiprd.ordx.market',
    network: 'mainnet',
    isNextJS: true  // 服务器端组件中也需要启用
  });

  try {
    const utxos = await client.getUtxos(address);

    return (
      <div>
        <h3>UTXOs for {address}</h3>
        <ul>
          {utxos.map((utxo, index) => (
            <li key={index}>
              {utxo.txid}:{utxo.vout} - {utxo.value} satoshis
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    return (
      <div className="error">
        Failed to load UTXOs: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}
```

## 环境变量配置

在 `.env.local` 中添加：

```env
# Next.js 环境自动检测，这些是可选的显式配置
NEXT_RUNTIME=node
```

## 性能优化建议

### 1. 客户端实例复用

```typescript
// utils/satsnet-client.ts
import { SatsNetClient } from '@btclib/satsnet-api';

// 创建单例客户端
const client = new SatsNetClient({
  baseUrl: process.env.SATSNET_API_BASE_URL || 'https://apiprd.ordx.market',
  network: 'mainnet'
});

export default client;
```

### 2. 缓存策略

```typescript
// app/api/utxos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from '@/utils/satsnet-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    const utxos = await client.getUtxos(address);

    return NextResponse.json(utxos, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('UTXO fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch UTXOs' },
      { status: 500 }
    );
  }
}
```

## 错误处理

库已提供增强的错误处理，包含详细的错误信息：

```typescript
try {
  const result = await client.getUtxos(address);
} catch (error) {
  if (error instanceof SatsnetApiError) {
    console.error('SatsNet API Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      originalError: error.details?.originalError
    });
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 调试和故障排除

### 1. 启用调试日志

库内置了详细的调试日志，帮助诊断问题：

```typescript
// 在开发环境中启用详细日志
if (process.env.NODE_ENV === 'development') {
  console.log('[SatsNet API] Next.js environment detected');
}
```

您可能会看到以下日志信息：
- `[AdvancedHttpClient] Response encoding: undefined` - 响应编码状态
- `[AdvancedHttpClient] Next.js mode enabled, using buffer-based parsing` - Next.js 模式已启用
- `[AdvancedHttpClient] Buffer-based parsing successful` - 缓冲区解析成功

### 2. 常见问题解决

#### 问题：JSON 解析失败
```typescript
// 确保使用正确的配置
const client = new SatsNetClient({
  network: 'mainnet',
  compression: false,  // 在 Next.js 中禁用压缩
  keepAlive: true,     // 使用 keep-alive
  isNextJS: true,      // 必须明确启用 Next.js 兼容模式
});

// 使用 try-catch 捕获详细错误
try {
  const result = await client.getUtxos(address);
  console.log('Success:', result);
} catch (error) {
  if (error instanceof SatsnetApiError) {
    console.error('SatsNet API Error:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
  }
}
```

#### 问题：性能优化
```typescript
// 使用客户端实例复用
let clientInstance: SatsNetClient | null = null;

function getClient() {
  if (!clientInstance) {
    clientInstance = new SatsNetClient({
      network: 'mainnet',
      timeout: 15000,
      retries: 3,
      keepAlive: true,
      compression: false,
      isNextJS: true,  // 在 Next.js 中必须启用
    });
  }
  return clientInstance;
}

// 在 API 路由中使用
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = getClient();
  // ... 使用 client
}
```

## 注意事项

1. **明确配置**: 在 Next.js 环境中必须明确设置 `isNextJS: true` 来启用兼容模式
2. **缓冲区解析**: 当启用 Next.js 模式时，使用缓冲区优先解析 JSON，避免编码问题
3. **压缩配置**: 建议在 Next.js 中禁用压缩以确保最大兼容性
4. **错误日志**: 增强的错误日志帮助调试 JSON 解析问题
5. **性能**: 基于 HTTP/1.1 优化，仍保持良好的性能表现
6. **客户端复用**: 建议复用客户端实例以提高性能

## 重要提醒

**⚠️ 必须设置 `isNextJS: true`**

与之前的自动检测不同，现在需要在 Next.js 环境中**明确指定** `isNextJS: true` 配置项。如果遇到 JSON 解析错误，请确认：

1. 所有 `SatsNetClient` 实例都设置了 `isNextJS: true`
2. API 路由、服务器组件、客户端组件都需要设置此配置
3. 复用的客户端实例也需要启用此选项

## 故障排除

如果仍然遇到问题：

1. **检查网络**: 确保可以访问 API 端点
2. **验证响应**: 使用 `curl` 检查 API 是否返回有效 JSON
3. **查看日志**: 检查 Next.js 应用日志中的详细错误信息
4. **简化配置**: 尝试使用最基本的配置进行测试

```bash
# 测试 API 端点
curl -H "Content-Type: application/json" \
  "https://apiprd.ordx.market/btc/mainnet/utxos/bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```