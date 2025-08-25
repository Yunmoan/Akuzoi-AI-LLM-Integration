const axios = require('axios');

// 简单的限制测试
async function testSimpleLimit() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 简单限制测试...\n');

    // 1. 检查环境变量
    console.log('1. 环境变量检查:');
    console.log('MAX_DAILY_MESSAGES:', process.env.MAX_DAILY_MESSAGES);
    console.log('RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS);
    console.log('');

    // 2. 获取智能体
    console.log('2. 获取智能体...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const testAgent = agentsResponse.data.agents[0];
    console.log(`使用智能体: ${testAgent.name}\n`);

    // 3. 发送测试消息
    console.log('3. 发送测试消息...');
    const response = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: '测试限制功能'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 消息发送成功');
    console.log('响应:', response.data);
    console.log('');

    // 4. 检查日志输出
    console.log('4. 请检查后端日志，应该看到以下调试信息:');
    console.log('  - 🔍 每日限制检查调试:');
    console.log('  - userId, today, maxDailyMessages 等信息');
    console.log('  - Redis key 和 currentCount');
    console.log('  - 限制检查通过，继续执行');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
if (require.main === module) {
  testSimpleLimit().catch(console.error);
}

module.exports = { testSimpleLimit }; 