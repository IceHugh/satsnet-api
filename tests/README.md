# SatsNet API 测试套件

使用 bun:test 和真实 API 端点的完整测试覆盖。

## 测试结构

```
tests/
├── unit/                   # 单元测试
│   ├── satsnet-client.test.ts
│   └── tryit.test.ts
├── integration/           # 集成测试
│   └── api-workflow.test.ts
├── performance/          # 性能测试
│   ├── performance.test.ts
│   └── advanced-http.test.ts
├── helpers/              # 测试辅助工具
│   └── test-data.ts
└── setup.ts             # 测试环境设置
```

## 运行测试

### 运行所有测试
```bash
bun test
```

### 运行特定类型测试
```bash
# 单元测试
bun test tests/unit

# 集成测试
bun test tests/integration

# 性能测试
bun test tests/performance
```

### 监视模式
```bash
bun test --watch
```

### 覆盖率报告
```bash
bun test --coverage
```

## 测试特点

### 1. 真实 API 测试
- 使用真实的 Bitcoin 网络数据
- 测试实际的 API 响应
- 验证网络连接和数据处理

### 2. 性能基准测试
- 连接池性能测试
- 并发请求处理
- HTTP/2 多路复用
- 缓存效果验证
- 内存使用监控

### 3. 完整工作流测试
- 端到端 API 工作流
- 多网络支持测试
- 错误处理验证
- 配置管理测试

## 测试数据

### 真实地址
- Bitcoin Core 捐赠地址
- 创世区块地址
- 测试网络地址

### 性能基准
- 单请求延迟 < 10秒
- 并发请求处理 < 15秒
- 批量请求处理 < 20秒

## 测试配置

- 超时时间：30-45秒（适应真实API请求）
- 重试次数：3次
- 并发级别：10-100个请求
- 性能测试迭代：5-50次

## 注意事项

1. **网络依赖**：测试需要互联网连接访问真实的API端点
2. **执行时间**：由于使用真实API，测试执行时间较长
3. **API限制**：注意不要超过API调用频率限制
4. **资源管理**：测试后正确关闭HTTP连接和清理资源

## 环境变量

```bash
NODE_ENV=test
```

## 故障排除

### API 连接问题
- 检查网络连接
- 验证API端点可用性
- 确认防火墙设置

### 超时问题
- 增加测试超时时间
- 检查API响应速度
- 验证网络延迟

### 内存问题
- 监控内存使用
- 及时清理测试资源
- 调整并发测试级别