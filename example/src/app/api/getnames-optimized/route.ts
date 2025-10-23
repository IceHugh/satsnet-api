import { NextRequest, NextResponse } from 'next/server';

// 使用优化的 SatsNet API 客户端（保留性能功能，去掉流处理问题）
import { SatsNetClient } from './optimized-client.js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    console.log('=== 开始处理 getNames 请求 (优化版本) ===');
    console.log('请求参数 name:', name);

    // 简单验证
    if (!name) {
      console.log('验证失败: name 参数为空');
      return NextResponse.json(
        { error: 'Name 参数是必需的' },
        { status: 400 }
      );
    }

    if (name.length < 1 || name.length > 100) {
      console.log('验证失败: name 长度不合规:', name.length);
      return NextResponse.json(
        { error: 'Name 长度必须在 1-100 字符之间' },
        { status: 400 }
      );
    }

    console.log('验证通过，开始创建优化 SatsNet 客户端...');

    // 创建优化的 SatsNet API 客户端（保留性能功能）
    const client = new SatsNetClient({
      baseUrl: 'https://apiprd.ordx.market',
      network: 'testnet',
      timeout: 30000,
      retries: 2,
      connections: 50,
      cache: true,
      metrics: true,
      keepAlive: false, // Next.js 环境下禁用
      http2: false, // Next.js 环境下禁用
    });

    console.log('优化 SatsNet 客户端创建成功');
    console.log('客户端配置:', {
      baseUrl: client.config?.baseUrl || 'https://apiprd.ordx.market',
      network: client.config?.network || 'testnet',
      timeout: client.config?.timeout || 30000,
      cache: client.config?.cache,
      connections: client.config?.connections,
      metrics: client.config?.metrics,
    });

    console.log('开始调用优化 getNameInfo 方法，参数:', name);

    // 调用优化的 getNameInfo API
    const nameInfo = await client.getNameInfo(name);

    console.log('优化 getNameInfo 调用成功');
    console.log('返回数据类型:', typeof nameInfo);
    console.log('返回数据内容:', JSON.stringify(nameInfo, null, 2));

    // 获取性能指标
    const metrics = client.getMetrics();
    console.log('性能指标:', metrics);

    return NextResponse.json({
      success: true,
      data: nameInfo,
      debug: {
        functionName: 'getNameInfo',
        parameter: name,
        dataType: typeof nameInfo,
        timestamp: new Date().toISOString(),
        implementation: 'optimized',
        features: ['cache', 'connection-pool', 'metrics', 'no-stream-processing'],
        performance: metrics,
      }
    });

  } catch (error) {
    console.error('=== getNames API 错误详情 (优化版本) ===');
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
      // 检查是否是自定义错误
      if ('code' in error) {
        errorCode = String((error as any).code);
      }
      if ('data' in error) {
        errorData = (error as any).data;
      }
    }

    console.error('处理后的错误信息 (优化版本):', {
      message: errorMessage,
      code: errorCode,
      data: errorData
    });

    return NextResponse.json(
      {
        error: '优化 SatsNet API 调用失败',
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
          errorStack: error instanceof Error ? error.stack : null,
          implementation: 'optimized',
          features: ['cache', 'connection-pool', 'metrics', 'no-stream-processing']
        }
      },
      { status: 500 }
    );
  }
}