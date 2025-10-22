import { SatsNetClient } from './src/index.js';

async function debugBatchTiming() {
  console.log('=== 调试批量请求时序问题 ===\n');

  const client = new SatsNetClient();
  const validAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

  // 测试单个接口的一致性
  console.log('1. 测试单个接口的一致性...');

  const singleResults = [];

  try {
    const addr1 = await client.getAddressSummary(validAddress);
    singleResults.push({ method: 'getAddressSummary', result: addr1, isArray: Array.isArray(addr1), length: addr1?.length });
    console.log('✅ getAddressSummary 单次调用成功');
  } catch (error) {
    console.log('❌ getAddressSummary 单次调用失败:', error.message);
  }

  try {
    const ticker1 = await client.getTickerInfo('ordi');
    singleResults.push({ method: 'getTickerInfo', result: ticker1, isArray: Array.isArray(ticker1), hasDisplayname: ticker1 && 'displayname' in ticker1 });
    console.log('✅ getTickerInfo 单次调用成功');
  } catch (error) {
    console.log('❌ getTickerInfo 单次调用失败:', error.message);
  }

  try {
    const height1 = await client.getBestHeight();
    singleResults.push({ method: 'getBestHeight', result: height1, isArray: Array.isArray(height1), hasHeight: height1 && 'height' in height1 });
    console.log('✅ getBestHeight 单次调用成功');
  } catch (error) {
    console.log('❌ getBestHeight 单次调用失败:', error.message);
  }

  console.log('\n单个调用结果:');
  singleResults.forEach(r => {
    console.log(`- ${r.method}: type=${typeof r.result}, isArray=${r.isArray}, ${Object.keys(r.result || {}).slice(0, 3).join(', ')}`);
  });

  // 清除缓存
  client.clearCache();
  console.log('\n2. 缓存已清除');

  // 立即执行批量请求
  console.log('\n3. 立即执行批量请求...');
  try {
    const batchRequests = [
      { method: 'getAddressSummary', params: [validAddress] },
      { method: 'getTickerInfo', params: ['ordi'] },
      { method: 'getBestHeight', params: [] }
    ];

    const startTime = Date.now();
    const batchResults = await client.batchRequest(batchRequests);
    const endTime = Date.now();

    console.log(`批量请求完成，耗时: ${endTime - startTime}ms`);
    console.log('批量请求结果数量:', batchResults.length);

    console.log('\n4. 批量请求结果详情:');
    batchResults.forEach((result, index) => {
      const request = batchRequests[index];
      console.log(`\n结果 ${index + 1} (${request.method}):`);
      console.log(`- 类型: ${typeof result}`);
      console.log(`- 是数组: ${Array.isArray(result)}`);
      console.log(`- 长度: ${result?.length || 'undefined'}`);
      console.log(`- 属性: ${Object.keys(result || {}).slice(0, 5).join(', ')}`);

      // 与单次调用结果对比
      const singleResult = singleResults.find(r => r.method === request.method);
      if (singleResult) {
        const typeMatch = typeof result === typeof singleResult.result;
        const arrayMatch = Array.isArray(result) === singleResult.isArray;
        const lengthMatch = (result?.length || 0) === (singleResult.length || 0);

        console.log(`\n与单次调用对比:`);
        console.log(`- 类型匹配: ${typeMatch ? '✅' : '❌'} (${typeof result} vs ${typeof singleResult.result})`);
        console.log(`- 数组匹配: ${arrayMatch ? '✅' : '❌'} (${Array.isArray(result)} vs ${singleResult.isArray})`);
        console.log(`- 长度匹配: ${lengthMatch ? '✅' : '❌'} (${result?.length || 0} vs ${singleResult.length || 0})`);

        if (!typeMatch || !arrayMatch || !lengthMatch) {
          console.log('\n❌ 不匹配! 详细对比:');
          console.log('单次调用结果:', JSON.stringify(singleResult.result, null, 2).substring(0, 200));
          console.log('批量请求结果:', JSON.stringify(result, null, 2).substring(0, 200));
        }
      }
    });

  } catch (error) {
    console.log('❌ 批量请求失败:', error.message);
    if (error.errors) {
      error.errors.forEach((e, i) => {
        console.log(`错误 ${i + 1}: ${e.message}`);
      });
    }
  }

  await client.httpClient?.advancedClient?.close();
}

debugBatchTiming().catch(console.error);