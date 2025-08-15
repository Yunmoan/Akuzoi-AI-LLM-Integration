const axios = require('axios');

// 调试sessionId传递
async function debugSessionId() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 调试sessionId传递...\n');

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

    // 2. 模拟前端第一次发送消息（不传递sessionId）
    console.log('2. 模拟前端第一次发送消息（不传递sessionId）...');
    const message1 = '你好，我是小明';
    const response1 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message1
      // 注意：这里没有sessionId
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

    // 4. 模拟前端第二次发送消息（传递sessionId）
    console.log('4. 模拟前端第二次发送消息（传递sessionId）...');
    console.log('🔍 发送请求参数:', {
      agentId: testAgent.id,
      message: '你还记得我叫什么名字吗？',
      sessionId: sessionId1
    });
    
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
    console.log('\n6. 检查数据库记录...');
    try {
      const dbCheckResponse = await axios.get(`${baseURL}/api/chat/sessions`, {
        params: { agentId: testAgent.id },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      
      console.log('会话列表数量:', dbCheckResponse.data.sessions.length);
      
      if (dbCheckResponse.data.sessions.length > 0) {
        console.log('会话列表:');
        dbCheckResponse.data.sessions.forEach((session, index) => {
          console.log(`  会话 ${index + 1}:`, {
            session_id: session.session_id,
            message_count: session.message_count,
            total_tokens: session.total_tokens,
            created_at: session.created_at
          });
        });
        
        // 获取第一个会话的历史
        const firstSession = dbCheckResponse.data.sessions[0];
        const historyResponse = await axios.get(`${baseURL}/api/chat/sessions/${firstSession.session_id}/history`, {
          params: { agentId: testAgent.id },
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
          }
        });
        
        console.log('\n第一个会话的历史记录数:', historyResponse.data.history.length);
        if (historyResponse.data.history.length > 0) {
          console.log('历史记录:', historyResponse.data.history.map(h => ({
            message: h.message.substring(0, 30) + '...',
            response: h.response.substring(0, 30) + '...',
            created_at: h.created_at
          })));
        }
      }
    } catch (error) {
      console.log('❌ 检查数据库记录失败:', error.response?.data || error.message);
    }

    // 7. 模拟前端第三次发送消息（再次传递sessionId）
    console.log('\n7. 模拟前端第三次发送消息（再次传递sessionId）...');
    const message3 = '我刚才说了什么？';
    const response3 = await axios.post(`${baseURL}/api/chat/send`, {
      agentId: testAgent.id,
      message: message3,
      sessionId: sessionId1  // 继续使用第一个sessionId
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    const sessionId3 = response3.data.session_id;
    console.log('✅ 第三条消息发送成功');
    console.log('返回的sessionId:', sessionId3);
    console.log('AI回复:', response3.data.response.substring(0, 100) + '...\n');

    // 8. 最终检查
    console.log('8. 最终检查...');
    console.log('所有sessionId:', [sessionId1, sessionId2, sessionId3]);
    
    const uniqueSessionIds = new Set([sessionId1, sessionId2, sessionId3]);
    if (uniqueSessionIds.size === 1) {
      console.log('✅ 所有消息使用相同的sessionId');
    } else {
      console.log('❌ 存在多个不同的sessionId');
      console.log('唯一sessionId数量:', uniqueSessionIds.size);
    }

    console.log('\n🎉 sessionId传递调试完成！');

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
  console.log('🚀 开始sessionId传递调试\n');
  
  await debugSessionId();
  
  console.log('🎉 调试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { debugSessionId }; 