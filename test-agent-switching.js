const axios = require('axios');

// 测试智能体切换功能
async function testAgentSwitching() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试智能体切换功能...\n');

    // 1. 获取智能体列表
    console.log('1. 获取智能体列表...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data.agents;
    
    if (agents.length < 2) {
      console.log('❌ 需要至少2个智能体来测试切换功能');
      return;
    }

    const agent1 = agents[0];
    const agent2 = agents[1];
    console.log(`使用智能体1: ${agent1.name} (${agent1.id})`);
    console.log(`使用智能体2: ${agent2.name} (${agent2.id})\n`);

    // 2. 与第一个智能体对话
    console.log('2. 与第一个智能体对话...');
    const message1 = '你好，我是小明';
    const response1 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: agent1.id,
      message: message1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    const sessionId1 = response1.data.session_id;
    console.log('✅ 第一条消息发送成功');
    console.log('会话ID:', sessionId1);
    console.log('AI回复:', response1.data.response.substring(0, 100) + '...\n');

    // 3. 继续与第一个智能体对话
    console.log('3. 继续与第一个智能体对话...');
    const message2 = '你还记得我叫什么名字吗？';
    const response2 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: agent1.id,
      message: message2,
      sessionId: sessionId1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 第二条消息发送成功');
    console.log('AI回复:', response2.data.response.substring(0, 100) + '...\n');

    // 4. 检查第一个智能体的会话状态
    console.log('4. 检查第一个智能体的会话状态...');
    try {
      const sessions1 = await axios.get(`${baseURL}/api/chat/sessions`, {
        params: { agentId: agent1.id },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      
      console.log('智能体1会话数量:', sessions1.data.sessions.length);
      if (sessions1.data.sessions.length > 0) {
        const session = sessions1.data.sessions[0];
        console.log('会话详情:', {
          session_id: session.session_id,
          message_count: session.message_count,
          total_tokens: session.total_tokens
        });
      }
    } catch (error) {
      console.log('❌ 检查智能体1会话失败:', error.response?.data || error.message);
    }

    // 5. 与第二个智能体对话（模拟切换智能体）
    console.log('\n5. 与第二个智能体对话（模拟切换智能体）...');
    const message3 = '你好，我是小红';
    const response3 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: agent2.id,
      message: message3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    const sessionId2 = response3.data.session_id;
    console.log('✅ 智能体2第一条消息发送成功');
    console.log('会话ID:', sessionId2);
    console.log('AI回复:', response3.data.response.substring(0, 100) + '...\n');

    // 6. 检查第二个智能体的会话状态
    console.log('6. 检查第二个智能体的会话状态...');
    try {
      const sessions2 = await axios.get(`${baseURL}/api/chat/sessions`, {
        params: { agentId: agent2.id },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      
      console.log('智能体2会话数量:', sessions2.data.sessions.length);
      if (sessions2.data.sessions.length > 0) {
        const session = sessions2.data.sessions[0];
        console.log('会话详情:', {
          session_id: session.session_id,
          message_count: session.message_count,
          total_tokens: session.total_tokens
        });
      }
    } catch (error) {
      console.log('❌ 检查智能体2会话失败:', error.response?.data || error.message);
    }

    // 7. 验证会话独立性
    console.log('\n7. 验证会话独立性...');
    if (sessionId1 !== sessionId2) {
      console.log('✅ 两个智能体使用不同的会话ID，会话独立');
    } else {
      console.log('❌ 两个智能体使用相同的会话ID，会话不独立');
    }

    // 8. 再次与第一个智能体对话（模拟切换回来）
    console.log('\n8. 再次与第一个智能体对话（模拟切换回来）...');
    const message4 = '我刚才说了什么？';
    const response4 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: agent1.id,
      message: message4,
      sessionId: sessionId1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 智能体1第三条消息发送成功');
    console.log('AI回复:', response4.data.response.substring(0, 100) + '...\n');

    // 9. 检查AI是否记住之前的对话
    console.log('9. 检查AI是否记住之前的对话...');
    if (response4.data.response.includes('小明') || response4.data.response.includes('你好')) {
      console.log('✅ 智能体1记住了之前的对话内容');
    } else {
      console.log('❌ 智能体1没有记住之前的对话内容');
    }

    console.log('\n🎉 智能体切换功能测试完成！');

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
  console.log('🚀 开始智能体切换功能测试\n');
  
  await testAgentSwitching();
  
  console.log('🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAgentSwitching }; 