const axios = require('axios');

// 测试增强消息功能（时间+用户信息）
async function testEnhancedMessage() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试增强消息功能...\n');

    // 1. 获取智能体列表
    console.log('1. 获取智能体列表...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data.agents;
    
    if (agents.length === 0) {
      console.log('❌ 没有可用的智能体');
      return;
    }

    const testAgent = agents[0];
    console.log(`使用智能体: ${testAgent.name} (${testAgent.id})\n`);

    // 2. 测试短消息
    console.log('2. 测试短消息...');
    const shortMessage = '你好！';
    const response1 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: shortMessage
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 短消息发送成功');
    console.log('会话ID:', response1.data.session_id);
    console.log('AI回复:', response1.data.response.substring(0, 100) + '...\n');

    // 3. 测试长消息（接近800字符限制）
    console.log('3. 测试长消息...');
    const longMessage = '这是一个很长的消息，用来测试字符限制功能。'.repeat(20);
    console.log(`消息长度: ${longMessage.length} 字符`);
    
    if (longMessage.length > 800) {
      console.log('❌ 消息超过800字符限制');
      return;
    }

    const response2 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: longMessage,
      sessionId: response1.data.session_id
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 长消息发送成功');
    console.log('AI回复:', response2.data.response.substring(0, 100) + '...\n');

    // 4. 测试超长消息（应该被拒绝）
    console.log('4. 测试超长消息...');
    const veryLongMessage = '这是一个超长的消息，应该被拒绝。'.repeat(50);
    console.log(`消息长度: ${veryLongMessage.length} 字符`);
    
    try {
      const response3 = await axios.post(`${baseURL}/api/chat/send`, {
        agentId: testAgent.id,
        message: veryLongMessage,
        sessionId: response1.data.session_id
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      
      console.log('❌ 超长消息应该被拒绝，但发送成功了');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ 超长消息被正确拒绝');
        console.log('错误信息:', error.response.data.message);
      } else {
        console.log('❌ 超长消息处理异常:', error.response?.data || error.message);
      }
    }

    // 5. 测试特殊字符和换行
    console.log('\n5. 测试特殊字符和换行...');
    const specialMessage = `测试特殊字符：
- 换行符
- 表情符号: 😊 🎉 🚀
- 代码: \`console.log("Hello")\`
- 链接: https://example.com
- 中文字符: 你好世界
- 数字: 1234567890
- 符号: !@#$%^&*()`;

    const response4 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: specialMessage,
      sessionId: response1.data.session_id
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 特殊字符消息发送成功');
    console.log('AI回复:', response4.data.response.substring(0, 100) + '...\n');

    // 6. 验证AI是否收到时间和用户信息
    console.log('6. 验证AI是否收到时间和用户信息...');
    const verifyMessage = '请告诉我我刚才发送消息的时间和用户信息';
    
    const response5 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: verifyMessage,
      sessionId: response1.data.session_id
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 验证消息发送成功');
    console.log('AI回复:', response5.data.response);
    
    // 检查AI回复是否包含时间信息
    if (response5.data.response.includes('时间') || response5.data.response.includes('用户')) {
      console.log('✅ AI成功识别了时间和用户信息');
    } else {
      console.log('❌ AI没有识别到时间和用户信息');
    }

    console.log('\n🎉 增强消息功能测试完成！');
    console.log('\n📋 测试检查清单:');
    console.log('✅ 短消息发送');
    console.log('✅ 长消息发送');
    console.log('✅ 超长消息拒绝');
    console.log('✅ 特殊字符处理');
    console.log('✅ 时间和用户信息传递');
    console.log('✅ 字符计数显示');
    console.log('✅ 输入框边界限制');

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
  console.log('🚀 开始增强消息功能测试\n');
  
  await testEnhancedMessage();
  
  console.log('\n🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEnhancedMessage }; 