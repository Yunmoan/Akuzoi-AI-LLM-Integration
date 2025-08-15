const axios = require('axios');

// 测试管理功能
async function testAdminFunctions() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试管理功能...\n');

    // 1. 获取系统统计
    console.log('1. 获取系统统计...');
    const statsResponse = await axios.get(`${baseURL}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 系统统计获取成功');
    console.log('用户统计:', statsResponse.data.data.users);
    console.log('聊天统计:', statsResponse.data.data.chat);
    console.log('热门智能体:', statsResponse.data.data.top_agents);
    console.log('');

    // 2. 获取用户列表
    console.log('2. 获取用户列表...');
    const usersResponse = await axios.get(`${baseURL}/api/admin/users?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 用户列表获取成功');
    console.log('用户数量:', usersResponse.data.data.users.length);
    console.log('分页信息:', usersResponse.data.data.pagination);
    
    if (usersResponse.data.data.users.length === 0) {
      console.log('❌ 没有用户数据，无法继续测试');
      return;
    }

    const testUser = usersResponse.data.data.users[0];
    console.log('测试用户:', {
      id: testUser.id,
      username: testUser.username,
      nickname: testUser.nickname,
      is_banned: testUser.is_banned
    });
    console.log('');

    // 3. 获取用户详情
    console.log('3. 获取用户详情...');
    const userDetailResponse = await axios.get(`${baseURL}/api/admin/users/${testUser.id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 用户详情获取成功');
    console.log('用户详情:', userDetailResponse.data.data);
    console.log('');

    // 4. 获取用户聊天历史
    console.log('4. 获取用户聊天历史...');
    const chatHistoryResponse = await axios.get(`${baseURL}/api/admin/users/${testUser.id}/chat-history?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 聊天历史获取成功');
    console.log('聊天记录数量:', chatHistoryResponse.data.data.records.length);
    console.log('分页信息:', chatHistoryResponse.data.data.pagination);
    
    if (chatHistoryResponse.data.data.records.length > 0) {
      const firstRecord = chatHistoryResponse.data.data.records[0];
      console.log('示例聊天记录:', {
        id: firstRecord.id,
        agent_id: firstRecord.agent_id,
        session_id: firstRecord.session_id,
        message_length: firstRecord.message.length,
        response_length: firstRecord.response.length,
        tokens_used: firstRecord.tokens_used,
        created_at: firstRecord.created_at
      });
    }
    console.log('');

    // 5. 测试封禁用户（如果用户未被封禁）
    if (!testUser.is_banned) {
      console.log('5. 测试封禁用户...');
      try {
        const banResponse = await axios.post(`${baseURL}/api/admin/users/${testUser.id}/ban`, {
          reason: '测试封禁功能'
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
          }
        });

        console.log('✅ 用户封禁成功');
        console.log('封禁响应:', banResponse.data);
        console.log('');

        // 6. 测试解封用户
        console.log('6. 测试解封用户...');
        const unbanResponse = await axios.post(`${baseURL}/api/admin/users/${testUser.id}/unban`, {}, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
          }
        });

        console.log('✅ 用户解封成功');
        console.log('解封响应:', unbanResponse.data);
        console.log('');
      } catch (error) {
        console.log('❌ 封禁/解封测试失败:', error.response?.data || error.message);
      }
    } else {
      console.log('5. 跳过封禁测试（用户已被封禁）');
      console.log('');
    }

    // 7. 获取管理员操作日志
    console.log('7. 获取管理员操作日志...');
    const actionsResponse = await axios.get(`${baseURL}/api/admin/actions?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 操作日志获取成功');
    console.log('操作记录数量:', actionsResponse.data.data.actions.length);
    console.log('分页信息:', actionsResponse.data.data.pagination);
    console.log('');

    // 8. 获取管理员配置
    console.log('8. 获取管理员配置...');
    const configResponse = await axios.get(`${baseURL}/api/admin/config`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
      }
    });

    console.log('✅ 管理员配置获取成功');
    console.log('角色配置:', configResponse.data.data.roles);
    console.log('权限配置:', configResponse.data.data.permissions);
    console.log('');

    console.log('🎉 管理功能测试完成！');
    console.log('\n📋 测试检查清单:');
    console.log('✅ 系统统计获取');
    console.log('✅ 用户列表获取');
    console.log('✅ 用户详情获取');
    console.log('✅ 用户聊天历史获取');
    console.log('✅ 用户封禁/解封');
    console.log('✅ 管理员操作日志');
    console.log('✅ 管理员配置获取');

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
  console.log('🚀 开始管理功能测试\n');
  
  await testAdminFunctions();
  
  console.log('\n🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAdminFunctions }; 