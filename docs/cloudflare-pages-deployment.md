# Cloudflare Pages 部署指南

SatsNet API 现在支持在 Cloudflare Pages 上部署，提供全球分布的高性能 API 服务。

## 🌟 主要特性

- **自动环境检测**: 运行时自动检测 Cloudflare Pages 环境
- **双客户端架构**: Node.js 和 Web 环境使用不同的 HTTP 客户端实现
- **零配置部署**: 开箱即用的 Cloudflare Pages 配置
- **全球 CDN**: 自动利用 Cloudflare 的全球网络
- **边缘计算**: 在边缘节点运行，降低延迟

## 📋 部署前准备

### 1. 环境要求

- Node.js 20+ (用于本地构建)
- Cloudflare 账户
- Git 仓库 (GitHub, GitLab 等)

### 2. 项目配置

确保您的项目已经包含以下文件：

```
satsnet-api/
├── src/
│   ├── utils/
│   │   ├── http-factory.ts     # 环境检测和客户端工厂
│   │   └── web-http.ts         # Web 兼容的 HTTP 客户端
│   └── index.ts
├── functions/
│   └── api/
│       └── [...path].ts        # Cloudflare Pages 函数
├── wrangler.toml               # Wrangler 配置
├── _headers                    # HTTP 头配置
├── _redirects                  # URL 重定向配置
└── package.json
```

## 🚀 部署步骤

### 方法 1: 通过 Cloudflare Dashboard

1. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 选择 "Pages" 服务

2. **创建新项目**
   - 点击 "Create a project"
   - 连接您的 Git 仓库

3. **配置构建设置**
   ```bash
   # 构建命令
   npm run build:cloudflare

   # 构建输出目录
   dist
   ```

4. **环境变量设置**
   ```
   ENVIRONMENT=production
   API_VERSION=1.1.2
   NODE_VERSION=20
   ```

5. **部署并等待构建完成**

### 方法 2: 通过 Wrangler CLI

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **构建项目**
   ```bash
   npm run build:cloudflare
   ```

4. **部署到 Cloudflare Pages**
   ```bash
   wrangler pages deploy dist --project-name satsnet-api
   ```

### 方法 3: 使用 GitHub Actions

创建 `.github/workflows/deploy-cloudflare.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for Cloudflare Pages
        run: npm run build:cloudflare

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: satsnet-api
          directory: dist
```

## ⚙️ 配置选项

### Wrangler 配置 (`wrangler.toml`)

```toml
name = "satsnet-api"
main = "dist/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "npm run build:cloudflare"

[vars]
ENVIRONMENT = "production"
API_VERSION = "1.1.2"
```

### HTTP 头配置 (`_headers`)

```apache
# CORS headers for API usage
/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization

# Cache control
/api/*
  Cache-Control: public, max-age=300, s-maxage=600
```

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `ENVIRONMENT` | 环境类型 | `production` |
| `API_VERSION` | API 版本 | `1.1.2` |
| `NODE_VERSION` | Node.js 版本 | `20` |

## 🔧 API 使用示例

### 在 Cloudflare Pages 中使用

```typescript
import { SatsNetClient } from '@btclib/satsnet-api';

// 自动检测环境并使用适当的客户端
const client = new SatsNetClient({
  network: 'mainnet',
  timeout: 10000,
});

// 获取 UTXO
const utxos = await client.getUtxos('bc1q...');
console.log('UTXOs:', utxos);

// 获取最佳区块高度
const height = await client.getBestHeight();
console.log('Best height:', height.height);
```

### 在前端应用中使用

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { SatsNetClient } from 'https://your-domain.pages.dev/dist/web.js';

        const client = new SatsNetClient();

        async function fetchData() {
            try {
                const height = await client.getBestHeight();
                document.getElementById('result').textContent =
                    `Best block height: ${height.height}`;
            } catch (error) {
                console.error('Error:', error);
            }
        }

        fetchData();
    </script>
</head>
<body>
    <div id="result">Loading...</div>
</body>
</html>
```

## 🔍 调试和监控

### 1. 查看构建日志

在 Cloudflare Dashboard 中：
1. 进入您的 Pages 项目
2. 点击 "Deployments" 标签
3. 点击具体的部署查看构建日志

### 2. 实时日志

```bash
# 使用 Wrangler 查看实时日志
wrangler pages deployment tail --project-name satsnet-api
```

### 3. 环境检测

代码会自动检测运行环境：

```typescript
import { getEnvironmentInfo } from '@btclib/satsnet-api';

const envInfo = getEnvironmentInfo();
console.log('Environment:', envInfo);
// 输出: { isWeb: true, isCloudflarePages: true, isNode: false, runtime: 'Cloudflare Pages' }
```

## 📊 性能优化

### 1. 缓存策略

- **静态资源**: 1年缓存
- **API 响应**: 5-10分钟缓存
- **健康检查**: 无缓存

### 2. 边缘优化

- 全球 CDN 分发
- 智能路由
- 压缩传输
- HTTP/2 支持

### 3. 监控指标

Cloudflare Pages 提供以下监控：
- 请求量
- 响应时间
- 错误率
- 带宽使用

## 🛠️ 故障排除

### 常见问题

#### 1. 构建失败

**问题**: 构建过程中出现错误
**解决方案**:
```bash
# 检查本地构建
npm run build:cloudflare

# 检查依赖
npm install

# 清理并重新构建
npm run clean && npm run build:cloudflare
```

#### 2. 运行时错误

**问题**: 部署后 API 调用失败
**解决方案**:
1. 检查环境变量配置
2. 查看 Cloudflare 日志
3. 验证 API 端点配置

#### 3. CORS 错误

**问题**: 前端应用无法调用 API
**解决方案**:
1. 检查 `_headers` 文件中的 CORS 配置
2. 确认域名白名单设置
3. 验证请求头配置

### 调试技巧

1. **使用开发者工具**
   ```typescript
   // 启用详细日志
   const client = new SatsNetClient({
     debug: true,
   });
   ```

2. **检查环境检测**
   ```typescript
   import { EnvironmentDetector } from '@btclib/satsnet-api';
   console.log('Environment detected:', EnvironmentDetector.getEnvironmentInfo());
   ```

3. **验证网络请求**
   ```typescript
   const metrics = client.getMetrics();
   console.log('Performance metrics:', metrics);
   ```

## 📚 更多资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [SatsNet API GitHub](https://github.com/IceHugh/satsnet-api)
- [问题反馈](https://github.com/IceHugh/satsnet-api/issues)

---

*最后更新: 2025-11-03*