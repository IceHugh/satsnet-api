import { ApiTypesTester } from '../tests/api-types-test';

async function runTests() {
  console.log('🚀 启动SatsNet API类型测试...\n');

  const tester = new ApiTypesTester();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ 测试执行失败:', (error as Error).message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

runTests();