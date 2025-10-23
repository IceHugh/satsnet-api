# Next.js 环境使用指南

## 问题说明

在 Next.js 环境中使用 SatsNet API 时可能会遇到 JSON 解析错误：
```
Unexpected undici error: Unexpected token '�ߔ�."... is not valid JSON
```

## 解决方案

### 1. 自动环境检测

库已内置 Next.js 环境检测，会自动应用兼容性配置：
- 自动禁用 HTTP/2
- 使用更保守的压缩算法
- 优化连接池配置

### 2. 基本使用

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// 创建客户端实例（自动检测 Next.js 环境）
const client = new SatsNetClient({
  baseUrl: 'https://apiprd.ordx.market',
  network: 'mainnet',
  timeout: 15000
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

### 3. 客户端组件中使用

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
      network: 'mainnet'
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

### 4. 服务器端组件中使用

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// 服务器端组件
export default async function ServerComponent({ address }: { address: string }) {
  const client = new SatsNetClient({
    baseUrl: 'https://apiprd.ordx.market',
    network: 'mainnet'
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

## 注意事项

1. **环境检测**: 库会自动检测 Next.js 环境并应用兼容性配置
2. **压缩处理**: 在 Next.js 中使用更保守的压缩算法以提高兼容性
3. **错误日志**: 增强的错误日志帮助调试 JSON 解析问题
4. **性能**: 虽然禁用了某些高级特性，但仍保持良好的性能表现

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