// 演示压缩配置的用法
import { SatsNetClient } from '@btclib/satsnet-api';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const compression = searchParams.get('compression') === 'true';

    console.log('=== 压缩配置演示 API ===');
    console.log('请求参数 name:', name);
    console.log('请求参数 compression:', compression);

    // 简单验证
    if (!name) {
      console.log('验证失败: name 参数为空');
      return NextResponse.json({ error: 'Name 参数是必需的' }, { status: 400 });
    }

    console.log('验证通过，开始创建 SatsNet 客户端...');

    // 演示不同的压缩配置
    const client = new SatsNetClient({
      baseUrl: 'https://apiprd.ordx.market',
      network: 'testnet',
      timeout: 30000,
      retries: 2,
      compression: compression, // 根据用户请求决定是否启用压缩
      acceptEncoding: compression ? ['gzip', 'deflate'] : [], // 避免使用 brotli
      keepAlive: false, // 禁用 keepAlive
    });

    console.log('SatsNet 客户端创建成功');
    console.log('客户端配置:', {
      baseUrl: client.config?.baseUrl || 'https://apiprd.ordx.market',
      network: client.config?.network || 'testnet',
      timeout: client.config?.timeout || 30000,
      compression: client.config?.compression,
      acceptEncoding: client.config?.acceptEncoding,
    });

    console.log(`开始调用 getNameInfo 方法（${compression ? '启用' : '禁用'}压缩），参数:`, name);

    const startTime = Date.now();
    const nameInfo = await client.getNameInfo(name);
    const endTime = Date.now();

    console.log('getNameInfo 调用成功');
    console.log(`响应时间: ${endTime - startTime}ms`);
    console.log('返回数据类型:', typeof nameInfo);
    console.log('返回数据内容:', JSON.stringify(nameInfo, null, 2));

    return NextResponse.json({
      success: true,
      data: nameInfo,
      demo: {
        functionName: 'getNameInfo',
        parameter: name,
        dataType: typeof nameInfo,
        responseTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString(),
        package: '@btclib/satsnet-api',
        version: '1.1.0',
        config: {
          compression: client.config?.compression,
          acceptEncoding: client.config?.acceptEncoding,
        },
        features: [
          compression ? 'compression-enabled' : 'compression-disabled',
          'user-controlled-compression',
          'no-brotli-issues',
          'flexible-configuration',
        ],
      },
      usage: {
        note: '通过 ?compression=true 参数可以启用压缩',
        warning: compression
          ? '已启用压缩，请注意 Brotli 兼容性问题'
          : '已禁用压缩，确保最大兼容性',
        recommended: '在 Next.js 环境中建议保持 compression=false',
      },
    });
  } catch (error) {
    console.error('=== 压缩配置演示 API 错误详情 ===');
    console.error('错误对象:', error);
    console.error('错误类型:', typeof error);
    console.error('错误名称:', error instanceof Error ? error.name : 'Unknown');
    console.error('错误消息:', error instanceof Error ? error.message : 'No message');
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack');

    // 尝试提取更详细的错误信息
    let errorMessage = '未知错误';
    let errorCode = 'UNKNOWN';
    let errorData = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) {
        errorCode = String((error as any).code);
      }
      if ('data' in error) {
        errorData = (error as any).data;
      }
    }

    console.error('处理后的错误信息:', {
      message: errorMessage,
      code: errorCode,
      data: errorData,
    });

    return NextResponse.json(
      {
        error: '压缩配置演示 API 调用失败',
        message: errorMessage,
        code: errorCode,
        data: errorData,
        type: typeof error,
        timestamp: new Date().toISOString(),
        debugInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV,
          parameter: name || 'unknown',
          compression: compression || false,
          errorStack: error instanceof Error ? error.stack : null,
          package: '@btclib/satsnet-api',
          version: '1.1.0',
        },
        help: {
          compressionIssue: '如果遇到 JSON 解析错误，请设置 compression=false',
          brotliIssue: '避免使用 brotli 压缩，推荐使用 gzip 或 deflate',
          nextjsTip: '在 Next.js 环境中建议禁用压缩以确保兼容性',
        },
      },
      { status: 500 }
    );
  }
}
