const axios = require('axios');
const adminService = require('./services/adminService');

async function testUserDetail() {
  console.log('🔍 测试用户详情功能...\n');
  
  try {
    // 1. 测试获取用户列表
    console.log('1. 测试获取用户列表...');
    const usersResult = await adminService.getAllUsers(1, 5);
    console.log('✅ 用户列表获取成功');
    console.log(`用户数量: ${usersResult.users.length}`);
    
    if (usersResult.users.length === 0) {
      console.log('❌ 没有用户数据，无法继续测试');
      return;
    }
    
    const testUser = usersResult.users[0];
    console.log(`测试用户: ${testUser.username} (ID: ${testUser.id})`);
    console.log('');
    
    // 2. 测试获取用户详情
    console.log('2. 测试获取用户详情...');
    const userDetail = await adminService.getUserDetailsWithStats(testUser.id);
    console.log('✅ 用户详情获取成功');
    console.log('用户详情:', {
      id: userDetail.id,
      username: userDetail.username,
      nickname: userDetail.nickname,
      email: userDetail.email,
      realname_verified: userDetail.realname_verified,
      is_banned: userDetail.is_banned,
      daily_message_limit: userDetail.daily_message_limit,
      total_messages_sent: userDetail.total_messages_sent,
      today_messages_sent: userDetail.today_messages_sent,
      remaining_messages: userDetail.remaining_messages,
      created_at: userDetail.created_at
    });
    console.log('');
    
    // 3. 测试获取用户聊天历史
    console.log('3. 测试获取用户聊天历史...');
    const chatHistory = await adminService.getUserChatHistory(testUser.id, 1, 5);
    console.log('✅ 聊天历史获取成功');
    console.log(`聊天记录数量: ${chatHistory.records.length}`);
    console.log(`总记录数: ${chatHistory.pagination.total}`);
    console.log(`总页数: ${chatHistory.pagination.totalPages}`);
    
    if (chatHistory.records.length > 0) {
      const firstRecord = chatHistory.records[0];
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
    
    // 4. 测试获取用户统计信息
    console.log('4. 测试获取用户统计信息...');
    const userStats = await adminService.getUserStats(testUser.id);
    console.log('✅ 用户统计信息获取成功');
    console.log('用户统计:', userStats);
    console.log('');
    
    console.log('🎉 所有用户详情功能测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 运行测试
testUserDetail().then(() => {
  console.log('\n测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('测试异常:', error);
  process.exit(1);
});
