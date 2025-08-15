const axios = require('axios');

// 测试清除记忆功能
async function testClearMemory() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试清除记忆功能...\n');

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

    // 3. 等待1秒
    console.log('3. 等待1秒...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. 发送第二条消息（使用相同sessionId）
    console.log('4. 发送第二条消息（使用相同sessionId）...');
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

    // 5. 检查会话ID是否一致
    console.log('5. 检查会话ID一致性...');
    if (sessionId1 === sessionId2) {
      console.log('✅ 会话ID一致，会话被正确重用');
    } else {
      console.log('❌ 会话ID不一致，创建了新会话');
      console.log('  第一条消息sessionId:', sessionId1);
      console.log('  第二条消息sessionId:', sessionId2);
    }

    // 6. 检查数据库中的记录
    console.log('\n6. 检查数据库记录（清除前）...');
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
      }
    } catch (error) {
      console.log('❌ 检查数据库记录失败:', error.response?.data || error.message);
    }

    // 7. 测试清除记忆功能
    console.log('\n7. 测试清除记忆功能...');
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
      return;
    }

    // 8. 检查清除后的数据库状态
    console.log('\n8. 检查清除后的数据库状态...');
    try {
      const dbCheckResponse2 = await axios.get(`${baseURL}/api/chat/sessions`, {
        params: { agentId: testAgent.id },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      
      console.log('清除后会话列表数量:', dbCheckResponse2.data.sessions.length);
      
      if (dbCheckResponse2.data.sessions.length === 0) {
        console.log('✅ 记忆清除成功，所有会话已删除');
      } else {
        console.log('❌ 记忆清除失败，仍有会话存在');
      }
    } catch (error) {
      console.log('❌ 检查清除后状态失败:', error.response?.data || error.message);
    }

    console.log('\n🎉 清除记忆功能测试完成！');

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
  console.log('🚀 开始清除记忆功能测试\n');
  
  await testClearMemory();
  
  console.log('🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testClearMemory }; 