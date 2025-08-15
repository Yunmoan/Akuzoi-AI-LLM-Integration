const axios = require('axios');

// 测试记忆管理功能
async function testMemoryManagement() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试记忆管理功能...\n');

    // 1. 获取智能体列表
    console.log('1. 获取智能体列表...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data.agents;
    console.log('智能体列表:', agents.map(a => ({ id: a.id, name: a.name })));
    console.log('✅ 获取智能体列表成功\n');

    if (agents.length === 0) {
      console.log('❌ 没有可用的智能体，跳过测试');
      return;
    }

    const testAgent = agents[0];
    console.log(`使用智能体: ${testAgent.name} (${testAgent.id})\n`);

    // 2. 发送第一条消息（创建新会话）
    console.log('2. 发送第一条消息（创建新会话）...');
    const message1 = '你好，请介绍一下你自己';
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

    // 3. 发送第二条消息（继续会话）
    console.log('3. 发送第二条消息（继续会话）...');
    const message2 = '请记住我刚才说的话，现在我问你：我刚才说了什么？';
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

    // 4. 获取会话列表
    console.log('4. 获取会话列表...');
    const sessionsResponse = await axios.get(`${baseURL}/api/chat/sessions`, {
      params: { agentId: testAgent.id },
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('会话列表:', sessionsResponse.data.sessions);
    console.log('✅ 获取会话列表成功\n');

    // 5. 获取会话历史
    console.log('5. 获取会话历史...');
    const historyResponse = await axios.get(`${baseURL}/api/chat/sessions/${sessionId}/history`, {
      params: { agentId: testAgent.id },
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('会话历史记录数:', historyResponse.data.history.length);
    historyResponse.data.history.forEach((record, index) => {
      console.log(`  记录 ${index + 1}:`);
      console.log(`    用户: ${record.message.substring(0, 50)}...`);
      console.log(`    AI: ${record.response.substring(0, 50)}...`);
    });
    console.log('✅ 获取会话历史成功\n');

    // 6. 测试更新会话标题
    console.log('6. 测试更新会话标题...');
    const newTitle = '测试会话 - 记忆管理功能测试';
    const titleResponse = await axios.put(`${baseURL}/api/chat/sessions/${sessionId}/title`, {
      title: newTitle
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('标题更新响应:', titleResponse.data);
    console.log('✅ 更新会话标题成功\n');

    // 7. 测试删除会话
    console.log('7. 测试删除会话...');
    const deleteResponse = await axios.delete(`${baseURL}/api/chat/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('删除会话响应:', deleteResponse.data);
    console.log('✅ 删除会话成功\n');

    // 8. 验证会话已被删除
    console.log('8. 验证会话已被删除...');
    try {
      await axios.get(`${baseURL}/api/chat/sessions/${sessionId}/history`, {
        params: { agentId: testAgent.id },
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });
      console.log('❌ 会话仍然存在，删除失败');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 会话已成功删除');
      } else {
        console.log('❌ 验证删除时出现错误:', error.response?.data);
      }
    }

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
  console.log('🚀 开始记忆管理功能测试\n');
  
  await testDatabase();
  await testMemoryManagement();
  
  console.log('🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testMemoryManagement, testDatabase }; 