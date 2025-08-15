const axios = require('axios');

// 测试记忆流程
async function testMemoryFlow() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试记忆流程...\n');

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

    // 3. 等待2秒，确保数据保存完成
    console.log('3. 等待2秒，确保数据保存完成...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. 直接检查数据库中的记录
    console.log('4. 检查数据库中的记录...');
    try {
      const dbCheckResponse = await axios.get(`${baseURL}/api/chat/sessions`, {
        params: { agentId: testAgent.id },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      
      console.log('会话列表数量:', dbCheckResponse.data.sessions.length);
      
      if (dbCheckResponse.data.sessions.length > 0) {
        const session = dbCheckResponse.data.sessions[0];
        console.log('第一个会话:', {
          session_id: session.session_id,
          message_count: session.message_count,
          total_tokens: session.total_tokens
        });
        
        // 获取会话历史
        const historyResponse = await axios.get(`${baseURL}/api/chat/sessions/${session.session_id}/history`, {
          params: { agentId: testAgent.id },
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
          }
        });
        
        console.log('会话历史记录数:', historyResponse.data.history.length);
        if (historyResponse.data.history.length > 0) {
          console.log('✅ 会话历史正确保存');
          console.log('历史记录:', historyResponse.data.history.map(h => ({
            message: h.message.substring(0, 30) + '...',
            response: h.response.substring(0, 30) + '...',
            created_at: h.created_at
          })));
        } else {
          console.log('❌ 会话历史为空');
        }
      }
    } catch (error) {
      console.log('❌ 检查数据库记录失败:', error.response?.data || error.message);
    }

    // 5. 发送第二条消息（使用相同sessionId）
    console.log('\n5. 发送第二条消息（使用相同sessionId）...');
    const message2 = '你还记得我叫什么名字吗？';
    const response2 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message2,
      sessionId: sessionId1  // 关键：传递第一条消息的sessionId
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

    // 7. 再次检查数据库记录
    console.log('\n7. 再次检查数据库记录...');
    try {
      const historyResponse2 = await axios.get(`${baseURL}/api/chat/sessions/${sessionId1}/history`, {
        params: { agentId: testAgent.id },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      
      console.log('最终会话历史记录数:', historyResponse2.data.history.length);
      if (historyResponse2.data.history.length > 0) {
        console.log('✅ 最终会话历史正确保存');
        console.log('最终历史记录:', historyResponse2.data.history.map(h => ({
          message: h.message.substring(0, 30) + '...',
          response: h.response.substring(0, 30) + '...',
          created_at: h.created_at
        })));
      } else {
        console.log('❌ 最终会话历史为空');
      }
    } catch (error) {
      console.log('❌ 最终检查失败:', error.response?.data || error.message);
    }

    console.log('\n🎉 记忆流程测试完成！');

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
  console.log('🚀 开始记忆流程测试\n');
  
  await testMemoryFlow();
  
  console.log('🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testMemoryFlow }; 