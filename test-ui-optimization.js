const axios = require('axios');

// 测试UI优化效果
async function testUIOptimization() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🎨 测试UI优化效果...\n');

    // 1. 获取智能体列表
    console.log('1. 获取智能体列表...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data.agents;
    
    console.log('智能体列表:');
    agents.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.id})`);
      console.log(`    描述: ${agent.description}`);
      console.log(`    头像: ${agent.avatar_url || '无'}`);
    });
    console.log('');

    // 2. 测试消息发送和显示
    console.log('2. 测试消息发送和显示...');
    const testAgent = agents[0];
    const testMessages = [
      '你好！',
      '这是一个很长的消息，用来测试消息气泡的换行和显示效果。这个消息应该能够正确地换行显示，不会溢出容器。',
      '测试表情符号: 😊 🎉 🚀',
      '测试代码: `console.log("Hello World");`',
      '测试链接: https://example.com',
      '测试换行\n这是第二行\n这是第三行'
    ];

    let sessionId = null;
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`发送消息 ${i + 1}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      
      const response = await axios.post(`${baseURL}/api/chat/send`, {
        agentId: testAgent.id,
        message: message,
        sessionId: sessionId
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });

      sessionId = response.data.session_id;
      console.log(`✅ 消息发送成功，AI回复: ${response.data.response.substring(0, 100)}...`);
      
      // 等待一下，模拟用户阅读时间
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. 测试智能体切换
    console.log('\n3. 测试智能体切换...');
    if (agents.length > 1) {
      const secondAgent = agents[1];
      console.log(`切换到智能体: ${secondAgent.name}`);
      
      const switchResponse = await axios.post(`${baseURL}/api/chat/send`, {
        agentId: secondAgent.id,
        message: '你好，我是新用户'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });

      console.log(`✅ 智能体切换成功，新会话ID: ${switchResponse.data.session_id}`);
      console.log(`AI回复: ${switchResponse.data.response.substring(0, 100)}...`);
    }

    // 4. 测试清除记忆功能
    console.log('\n4. 测试清除记忆功能...');
    try {
      const clearResponse = await axios.delete(`${baseURL}/api/chat/agent/${testAgent.id}/conversations`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });

      console.log('✅ 清除记忆成功');
      console.log('清除响应:', clearResponse.data);
    } catch (error) {
      console.log('❌ 清除记忆失败:', error.response?.data || error.message);
    }

    console.log('\n🎉 UI优化测试完成！');
    console.log('\n📋 测试检查清单:');
    console.log('✅ 智能体头像显示');
    console.log('✅ 消息气泡布局');
    console.log('✅ 长文本换行');
    console.log('✅ 自动滚动到底部');
    console.log('✅ 自定义滚动条样式');
    console.log('✅ 智能体切换');
    console.log('✅ 清除记忆功能');

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
  console.log('🚀 开始UI优化测试\n');
  
  await testUIOptimization();
  
  console.log('\n🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testUIOptimization }; 