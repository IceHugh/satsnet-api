# 贡献指南

感谢您对 SatsNet API 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ⭐ 增加测试覆盖率
- 🎨 优化代码结构和性能

## 开发环境设置

### 前置要求

- **Node.js** >= 20.0.0 或 **Bun** >= 1.0.0
- **Git**
- **TypeScript** >= 5.3.0
- 推荐使用 **VS Code** 作为开发环境

### 设置步骤

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上 Fork 仓库，然后克隆你的 Fork
   git clone https://github.com/your-username/satsnet-api.git
   cd satsnet-api
   ```

2. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/icehugh/satsnet-api.git
   ```

3. **安装依赖**
   ```bash
   bun install
   # 或者使用 npm
   npm install
   ```

4. **验证环境**
   ```bash
   bun run type-check  # TypeScript 类型检查
   bun run lint        # 代码风格检查
   bun run test        # 运行测试
   bun run build       # 构建项目
   bun audit           # 安全漏洞检查
   ```

## 开发工作流

### 分支策略

- `main` - 稳定的主分支
- `develop` - 开发分支
- `feature/*` - 新功能分支
- `bugfix/*` - Bug 修复分支
- `hotfix/*` - 紧急修复分支

### 创建新功能

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发和测试**
   ```bash
   # 开发过程中保持代码质量
   bun run lint:fix        # 自动修复格式问题
   bun run type-check      # 确保类型正确
   bun run test:watch      # 监视模式运行测试
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### 提交消息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 类型 (Type)

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例

```bash
git commit -m "feat(api): add batch request support"
git commit -m "fix(client): resolve timeout issue with retry mechanism"
git commit -m "docs: update API reference documentation"
git commit -m "test: add unit tests for error handling"
```

## 代码规范

### TypeScript 规范

1. **严格类型检查**
   ```typescript
   // ✅ 好 - 明确的类型定义
   const address: string = 'bc1q...';

   // ❌ 避免 - 使用 any
   const data: any = response;
   ```

2. **接口优于类型别名**
   ```typescript
   // ✅ 好 - 使用 interface
   interface ApiConfig {
     baseUrl: string;
     timeout?: number;
   }

   // ✅ 可接受 - 联合类型使用 type
   type Network = 'mainnet' | 'testnet' | 'livenet';
   ```

3. **函数参数和返回值**
   ```typescript
   // ✅ 好 - 明确的参数和返回类型
   async function getUtxos(address: string, network?: Network): Promise<UtxoResponse> {
     // ...
   }
   ```

### 命名规范

1. **变量和函数**: camelCase
   ```typescript
   const addressSummary = '...';
   const getRecommendedFees = () => { ... };
   ```

2. **类和接口**: PascalCase
   ```typescript
   class SatsNetClient { ... }
   interface ApiConfig { ... }
   ```

3. **常量**: UPPER_SNAKE_CASE
   ```typescript
   const DEFAULT_TIMEOUT = 10000;
   const MAX_RETRIES = 3;
   ```

4. **文件名**: kebab-case
   ```
   src/utils/http-client.ts
   src/api/satsnet-client.ts
   tests/unit/api-client.test.ts
   ```

### 错误处理规范

1. **使用自定义错误类型**
   ```typescript
   // ✅ 好 - 使用自定义错误
   throw new SatsnetApiError('Request timeout', 408);

   // ❌ 避免 - 抛出字符串
   throw 'Request timeout';
   ```

2. **错误处理优先级**
   ```typescript
   // ✅ 好 - 使用 tryit 函数
   const [error, result] = await tryit(() => api.getUtxos(address))();

   // ✅ 可接受 - 传统 try-catch
   try {
     const result = await api.getUtxos(address);
   } catch (error) {
     handleApiError(error);
   }
   ```

### 文档规范

1. **JSDoc 注释**
   ```typescript
   /**
    * 获取地址的 UTXO
    * @param address - Bitcoin 地址
    * @param network - 网络类型，可选
    * @returns UTXO 响应数据
    * @throws {SatsnetApiError} 当 API 请求失败时
    * @example
    * ```typescript
    * const utxos = await client.getUtxos('bc1q...');
    * ```
    */
   async getUtxos(address: string, network?: Network): Promise<UtxoResponse>
   ```

2. **代码注释**
   ```typescript
   // HTTP/2 Agent 配置
   const agentOptions = {
     connections: this.config.connections,
     keepAliveTimeout: this.config.keepAliveTimeout,
   };
   ```

## 测试规范

### 测试结构

```
tests/
├── unit/                   # 单元测试
│   ├── api-client.test.ts
│   ├── error-handler.test.ts
│   └── utils.test.ts
├── integration/            # 集成测试
│   ├── api-workflow.test.ts
│   └── network-switching.test.ts
├── performance/            # 性能测试
│   ├── http-client.test.ts
│   └── batch-request.test.ts
├── helpers/               # 测试辅助工具
│   ├── mocks.ts
│   ├── test-data.ts
│   └── performance-reporter.ts
└── setup.ts              # 测试环境设置
```

### 编写测试

1. **单元测试示例**
   ```typescript
   import { describe, it, expect, beforeEach } from 'bun:test';
   import { SatsNetClient } from '@/api/satsnet-client';

   describe('SatsNetClient', () => {
     let client: SatsNetClient;

     beforeEach(() => {
       client = new SatsNetClient({ network: 'mainnet' });
     });

     it('should create client with default config', () => {
       expect(client.getNetwork()).toBe('mainnet');
     });

     it('should handle API errors gracefully', async () => {
       const [error, result] = await tryit(() =>
         client.getUtxos('invalid-address')
       )();

       expect(isError([error, result])).toBe(true);
       expect(error).toBeInstanceOf(SatsnetApiError);
     });
   });
   ```

2. **性能测试示例**
   ```typescript
   import { describe, it, expect } from 'bun:test';
   import { performance } from 'perf_hooks';

   describe('Performance', () => {
     it('should complete request within timeout', async () => {
       const startTime = performance.now();

       await client.getUtxos(testAddress);

       const duration = performance.now() - startTime;
       expect(duration).toBeLessThan(10000); // 10秒内完成
     }, 15000); // 测试超时15秒
   });
   ```

3. **运行测试**
   ```bash
   # 运行所有测试
   bun test

   # 运行特定类型测试
   bun test tests/unit
   bun test tests/integration
   bun test tests/performance

   # 监视模式
   bun test --watch

   # 覆盖率报告
   bun test --coverage
   ```

## 文档贡献

### 文档类型

1. **API 文档** (`docs/api/`)
   - 方法参考
   - 类型定义
   - 使用示例

2. **用户指南** (`docs/guide/`)
   - 快速开始
   - 高级用法
   - 最佳实践

3. **开发文档** (`CONTRIBUTING.md`, `CHANGELOG.md`)
   - 贡献指南
   - 变更日志
   - 架构设计

### 文档规范

1. **Markdown 格式**
   - 使用标准 Markdown 语法
   - 代码块指定语言类型
   - 适当的标题层级

2. **示例代码**
   ```typescript
   // ✅ 好 - 完整的示例
   import { satsnet } from 'satsnet-api';

   async function example() {
     const utxos = await satsnet.getUtxos('bc1q...');
     console.log('UTXO count:', utxos.plainutxos.length);
   }

   example();
   ```

3. **中英混排**
   - 技术术语使用英文
   - 说明文字使用中文
   - 代码注释使用中文

## 发布流程

### 版本管理

我们使用 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH`
- `MAJOR`: 不兼容的 API 变更
- `MINOR`: 向后兼容的功能性新增
- `PATCH`: 向后兼容的问题修正

### 发布步骤

1. **更新版本号**
   ```bash
   # 更新 package.json 版本号
   npm version patch  # 或 minor, major
   ```

2. **更新 CHANGELOG**
   ```bash
   # 在 CHANGELOG.md 中添加变更记录
   ```

3. **运行完整测试**
   ```bash
   bun run build
   bun run test
   bun run lint
   bun run audit
   ```

4. **创建 Git 标签**
   ```bash
   git tag -a v1.0.1 -m "Release version 1.0.1"
   git push origin v1.0.1
   ```

5. **发布到 npm**
   ```bash
   npm publish
   ```

## Pull Request 指南

### PR 模板

在创建 PR 时，请使用以下模板：

```markdown
## 变更描述
简要描述这个 PR 的变更内容。

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 测试
- [ ] 添加了新的测试
- [ ] 所有测试通过
- [ ] 手动测试通过

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 自我审查了代码
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有引入新的警告

## 相关 Issue
关闭 #issue_number
```

### PR 审查流程

1. **自动化检查**
   - CI/CD 流水线运行测试
   - 代码风格检查
   - 类型检查

2. **代码审查**
   - 至少一个维护者审查
   - 关注代码质量和设计
   - 检查测试覆盖率

3. **合并要求**
   - 所有检查通过
   - 至少一个 approving review
   - 解决所有审查意见

## 社区准则

### 行为准则

1. **尊重他人** - 尊重不同的观点和经验
2. **建设性反馈** - 提供有用和建设性的反馈
3. **包容性** - 欢迎所有背景的贡献者
4. **专业性** - 保持专业和友好的交流

### 沟通渠道

- **GitHub Issues** - Bug 报告和功能请求
- **GitHub Discussions** - 一般讨论和问答
- **Pull Requests** - 代码审查和讨论

## 常见问题

### Q: 如何运行开发环境？

A: 运行 `bun install` 安装依赖，然后使用 `bun run dev` 启动开发模式。

### Q: 如何调试测试？

A: 使用 `bun test --watch` 运行监视模式，或者在 VS Code 中配置调试器。

### Q: 如何添加新的 API 方法？

A: 在 `src/api/satsnet-client.ts` 中添加方法，在 `src/types/index.ts` 中添加类型定义，然后添加相应的测试。

### Q: 如何处理性能问题？

A: 使用 `tests/performance/` 中的性能测试，分析瓶颈并优化代码。

## 获取帮助

如果您在贡献过程中遇到任何问题，请：

1. 查看 [现有的 Issues](https://github.com/icehugh/satsnet-api/issues)
2. 创建新的 [Discussion](https://github.com/icehugh/satsnet-api/discussions)
3. 在 Issue 中 `@mention` 维护者

---

再次感谢您的贡献！您的参与让这个项目变得更好。 🙏