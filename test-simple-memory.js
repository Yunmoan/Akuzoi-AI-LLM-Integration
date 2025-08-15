const axios = require('axios');

// 简单的记忆功能测试
async function testSimpleMemory() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试简单记忆功能...\n');

    // 1. 获取智能体列表
    console.log('1. 获取智能体列表...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data.agents;
    console.log('智能体列表:', agents.map(a => ({ id: a.id, name: a.name })));
    
    if (agents.length === 0) {
      console.log('❌ 没有可用的智能体，跳过测试');
      return;
    }

    const testAgent = agents[0];
    console.log(`使用智能体: ${testAgent.name} (${testAgent.id})\n`);

    // 2. 发送第一条消息（创建新会话）
    console.log('2. 发送第一条消息（创建新会话）...');
    const message1 = '你好，我是小明';
    const response1 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    const sessionId = response1.data.session_id;
    console.log('会话ID:', sessionId);
    console.log('AI回复:', response1.data.response.substring(0, 100) + '...');
    console.log('✅ 第一条消息发送成功\n');

    // 3. 发送第二条消息（测试记忆）
    console.log('3. 发送第二条消息（测试记忆）...');
    const message2 = '你还记得我叫什么名字吗？';
    const response2 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message2,
      sessionId: sessionId
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('AI回复:', response2.data.response.substring(0, 100) + '...');
    console.log('✅ 第二条消息发送成功\n');

    // 4. 发送第三条消息（继续测试记忆）
    console.log('4. 发送第三条消息（继续测试记忆）...');
    const message3 = '我刚才说了什么？';
    const response3 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message3,
      sessionId: sessionId
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('AI回复:', response3.data.response.substring(0, 100) + '...');
    console.log('✅ 第三条消息发送成功\n');

    // 5. 测试清除记忆
    console.log('5. 测试清除记忆...');
    const clearResponse = await axios.delete(`${baseURL}/api/chat/agent/${testAgent.id}/conversations`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('清除记忆响应:', clearResponse.data);
    console.log('✅ 清除记忆成功\n');

    // 6. 发送第四条消息（测试记忆是否被清除）
    console.log('6. 发送第四条消息（测试记忆是否被清除）...');
    const message4 = '你还记得我叫什么名字吗？';
    const response4 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message4
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('AI回复:', response4.data.response.substring(0, 100) + '...');
    console.log('✅ 第四条消息发送成功\n');

    console.log('🎉 记忆功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 测试数据库连接
async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...\n');
    
    const response = await axios.get('http://localhost:3000/health');
    console.log('健康检查响应:', response.data);
    console.log('✅ 数据库连接正常\n');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始简单记忆功能测试\n');
  
  await testDatabase();
  await testSimpleMemory();
  
  console.log('🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSimpleMemory, testDatabase }; 