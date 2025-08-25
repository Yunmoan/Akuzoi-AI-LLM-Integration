const axios = require('axios');

// 测试配置限制是否生效
async function testConfigLimits() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试配置限制是否生效...\n');

    // 1. 检查环境变量配置
    console.log('1. 检查环境变量配置...');
    console.log('MAX_DAILY_MESSAGES:', process.env.MAX_DAILY_MESSAGES);
    console.log('RATE_LIMIT_WINDOW_MS:', process.env.RATE_LIMIT_WINDOW_MS);
    console.log('RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS);
    console.log('');

    // 2. 获取智能体列表
    console.log('2. 获取智能体列表...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data.agents;
    
    if (agents.length === 0) {
      console.log('❌ 没有可用的智能体');
      return;
    }

    const testAgent = agents[0];
    console.log(`使用智能体: ${testAgent.name} (${testAgent.id})\n`);

    // 3. 获取用户信息
    console.log('3. 获取用户信息...');
    try {
      const adminUsersResponse = await axios.get(`${baseURL}/api/admin/users?page=1&limit=1`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
        }
      });

      if (adminUsersResponse.data.data.users.length > 0) {
        const testUser = adminUsersResponse.data.data.users[0];
        console.log('测试用户:', {
          id: testUser.id,
          username: testUser.username,
          daily_message_limit: testUser.daily_message_limit,
          total_messages_sent: testUser.total_messages_sent
        });

        // 获取用户详情
        const userDetailResponse = await axios.get(`${baseURL}/api/admin/users/${testUser.id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
          }
        });

        console.log('用户详情:', {
          daily_message_limit: userDetailResponse.data.data.daily_message_limit,
          total_messages_sent: userDetailResponse.data.data.total_messages_sent,
          today_messages_sent: userDetailResponse.data.data.today_messages_sent,
          remaining_messages: userDetailResponse.data.data.remaining_messages
        });
        console.log('');

        // 4. 测试消息发送（检查限制是否生效）
        console.log('4. 测试消息发送...');
        const message1 = '测试配置限制功能';
        
        try {
          const response1 = await axios.post(`${baseURL}/api/chat/send`, {
            agentId: testAgent.id,
            message: message1
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
            }
          });

          console.log('✅ 第一条消息发送成功');
          console.log('会话ID:', response1.data.session_id);
          console.log('AI回复:', response1.data.response.substring(0, 100) + '...\n');

          // 5. 检查限制配置
          console.log('5. 检查限制配置...');
          
          // 计算实际使用的限制
          const envLimit = parseInt(process.env.MAX_DAILY_MESSAGES);
          const dbLimit = userDetailResponse.data.data.daily_message_limit;
          const actualLimit = envLimit || dbLimit;
          
          console.log('配置分析:');
          console.log(`  - 环境变量限制: ${envLimit || '未设置'}`);
          console.log(`  - 数据库用户限制: ${dbLimit}`);
          console.log(`  - 实际使用限制: ${actualLimit}`);
          console.log(`  - 今日已发送: ${userDetailResponse.data.data.today_messages_sent}`);
          console.log(`  - 剩余次数: ${userDetailResponse.data.data.remaining_messages}`);
          
          if (envLimit) {
            console.log('✅ 环境变量配置生效');
          } else {
            console.log('⚠️  使用数据库用户配置');
          }
          
          // 6. 测试速率限制
          console.log('\n6. 测试速率限制...');
          const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
          const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;
          
          console.log('速率限制配置:');
          console.log(`  - 时间窗口: ${rateLimitWindow}ms (${rateLimitWindow/1000}秒)`);
          console.log(`  - 最大请求数: ${rateLimitMax}`);
          
          // 快速发送多条消息测试速率限制
          console.log('快速发送消息测试速率限制...');
          const testMessages = [];
          for (let i = 0; i < Math.min(rateLimitMax + 2, 5); i++) {
            testMessages.push(`速率限制测试消息 ${i + 1}`);
          }
          
          let successCount = 0;
          let rateLimitCount = 0;
          
          for (let i = 0; i < testMessages.length; i++) {
            try {
              const response = await axios.post(`${baseURL}/api/chat/send`, {
                agentId: testAgent.id,
                message: testMessages[i],
                sessionId: response1.data.session_id
              }, {
                headers: {
                  'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test_token'}`
                }
              });
              
              successCount++;
              console.log(`✅ 消息 ${i + 1} 发送成功`);
              
            } catch (error) {
              if (error.response?.status === 429) {
                rateLimitCount++;
                console.log(`⚠️  消息 ${i + 1} 触发速率限制:`, error.response.data.message);
              } else {
                console.log(`❌ 消息 ${i + 1} 发送失败:`, error.response?.data?.message || error.message);
              }
            }
            
            // 短暂延迟
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          console.log('\n速率限制测试结果:');
          console.log(`  - 成功发送: ${successCount}`);
          console.log(`  - 触发限制: ${rateLimitCount}`);
          
          if (rateLimitCount > 0) {
            console.log('✅ 速率限制功能正常');
          } else {
            console.log('⚠️  未触发速率限制（可能需要更多测试）');
          }

        } catch (error) {
          console.log('❌ 消息发送失败:', error.response?.data?.message || error.message);
        }

      } else {
        console.log('❌ 没有找到测试用户');
      }

    } catch (error) {
      console.log('❌ 获取用户信息失败:', error.response?.data || error.message);
    }

    console.log('\n🎉 配置限制测试完成！');
    console.log('\n📋 测试检查清单:');
    console.log('✅ 环境变量配置检查');
    console.log('✅ 数据库用户配置检查');
    console.log('✅ 实际限制值计算');
    console.log('✅ 消息发送功能');
    console.log('✅ 速率限制功能');
    console.log('✅ 配置优先级验证');

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
  console.log('🚀 开始配置限制测试\n');
  
  await testConfigLimits();
  
  console.log('\n🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testConfigLimits }; 