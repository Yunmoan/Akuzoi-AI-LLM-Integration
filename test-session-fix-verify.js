const axios = require('axios');

// 验证sessionId修复
async function testSessionFixVerify() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 验证sessionId修复...\n');

    // 1. 获取智能体列表
    console.log('1. 获取智能体列表...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data.agents;
    
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

    const sessionId1 = response1.data.session_id;
    console.log('✅ 第一条消息发送成功');
    console.log('返回的sessionId:', sessionId1);
    console.log('AI回复:', response1.data.response.substring(0, 100) + '...\n');

    // 3. 检查sessionId是否有效
    if (!sessionId1 || sessionId1 === 'undefined' || sessionId1 === 'null') {
      console.log('❌ sessionId无效:', sessionId1);
      return;
    } else {
      console.log('✅ sessionId有效:', sessionId1);
    }

    // 4. 等待1秒
    console.log('4. 等待1秒...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. 发送第二条消息（使用相同sessionId）
    console.log('5. 发送第二条消息（使用相同sessionId）...');
    const message2 = '你还记得我叫什么名字吗？';
    const response2 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message2,
      sessionId: sessionId1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    const sessionId2 = response2.data.session_id;
    console.log('✅ 第二条消息发送成功');
    console.log('返回的sessionId:', sessionId2);
    console.log('AI回复:', response2.data.response.substring(0, 100) + '...\n');

    // 6. 检查会话ID是否一致
    console.log('6. 检查会话ID一致性...');
    if (sessionId1 === sessionId2) {
      console.log('✅ 会话ID一致，会话被正确重用');
    } else {
      console.log('❌ 会话ID不一致，创建了新会话');
      console.log('  第一条消息sessionId:', sessionId1);
      console.log('  第二条消息sessionId:', sessionId2);
    }

    // 7. 检查AI是否记住对话
    console.log('\n7. 检查AI记忆...');
    if (response2.data.response.includes('小明') || response2.data.response.includes('你好')) {
      console.log('✅ AI记住了之前的对话内容');
    } else {
      console.log('❌ AI没有记住之前的对话内容');
      console.log('AI回复:', response2.data.response);
    }

    console.log('\n🎉 sessionId修复验证完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始sessionId修复验证\n');
  
  await testSessionFixVerify();
  
  console.log('🎉 验证完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSessionFixVerify }; 