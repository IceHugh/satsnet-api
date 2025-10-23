import { SatsNetClient } from './src/api/satsnet-client.ts';

// 测试 getNames 功能
async function testGetNames() {
  console.log('🧪 开始测试 getNames 功能...\n');

  // 创建 testnet 客户端
  const client = new SatsNetClient({
    network: 'testnet'
  });

  const testAddress = 'tb1pt9c60e43sxcvksr7arx9qvczj0w9sqjellk6xg9chw2d5pv7ax4sdy5r7n';

  try {
    console.log(`📍 测试地址: ${testAddress}`);
    console.log(`🌐 网络环境: testnet\n`);

    // 获取地址的名称列表
    console.log('🔍 正在获取地址名称列表...');
    const nameList = await client.getNameListByAddress(testAddress, 0, 10);

    console.log('✅ 获取成功!');
    console.log('📊 返回结果:');
    console.log(JSON.stringify(nameList, null, 2));

    // 检查结果结构
    if (nameList && typeof nameList === 'object') {
      console.log('\n📋 结果分析:');

      if (nameList.names) {
        console.log(`- 名称数量: ${Array.isArray(nameList.names) ? nameList.names.length : '非数组'}`);
        if (Array.isArray(nameList.names) && nameList.names.length > 0) {
          console.log('- 名称列表:');
          nameList.names.forEach((name, index) => {
            console.log(`  ${index + 1}. ${typeof name === 'string' ? name : JSON.stringify(name)}`);
          });
        }
      }

      if (nameList.total !== undefined) {
        console.log(`- 总数量: ${nameList.total}`);
      }

      if (nameList.limit !== undefined) {
        console.log(`- 限制数量: ${nameList.limit}`);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);

    if (error.code) {
      console.error('错误代码:', error.code);
    }

    if (error.statusCode) {
      console.error('HTTP状态码:', error.statusCode);
    }
  }

  console.log('\n🏁 测试完成');
}

// 执行测试
testGetNames().catch(console.error);