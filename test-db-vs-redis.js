const adminService = require('./services/adminService');
const { redisClient } = require('./config/database');

async function testDbVsRedis() {
  console.log('🔍 测试数据库 vs Redis 数据差异...\n');
  
  try {
    // 1. 获取用户列表
    console.log('1. 获取用户列表...');
    const usersResult = await adminService.getAllUsers(1, 5);
    console.log(`用户数量: ${usersResult.users.length}`);
    
    if (usersResult.users.length === 0) {
      console.log('❌ 没有用户数据，无法继续测试');
      return;
    }
    
    const testUser = usersResult.users[0];
    console.log(`测试用户: ${testUser.username} (ID: ${testUser.id})`);
    console.log('');
    
    // 2. 从数据库获取今日消息数
    console.log('2. 从数据库获取今日消息数...');
    const dbTodayCount = testUser.today_messages_sent;
    console.log(`数据库今日消息数: ${dbTodayCount}`);
    
    // 3. 从Redis获取今日消息数
    console.log('3. 从Redis获取今日消息数...');
    const today = new Date().toISOString().split('T')[0];
    const redisKey = `daily_messages:${testUser.id}:${today}`;
    const redisCount = await redisClient.get(redisKey);
    const redisTodayCount = redisCount ? parseInt(redisCount) : 0;
    console.log(`Redis今日消息数: ${redisTodayCount}`);
    
    // 4. 比较差异
    console.log('4. 数据差异分析...');
    console.log(`数据库: ${dbTodayCount}, Redis: ${redisTodayCount}`);
    
    if (dbTodayCount === redisTodayCount) {
      console.log('✅ 数据库和Redis数据一致');
    } else {
      console.log('⚠️  数据库和Redis数据不一致');
      console.log(`差异: ${Math.abs(dbTodayCount - redisTodayCount)}`);
    }
    
    // 5. 显示用户详情
    console.log('5. 用户详情统计...');
    console.log(`用户ID: ${testUser.id}`);
    console.log(`用户名: ${testUser.username}`);
    console.log(`每日限制: ${testUser.daily_message_limit || 100}`);
    console.log(`今日已用: ${dbTodayCount}`);
    console.log(`剩余次数: ${testUser.remaining_messages}`);
    console.log(`总调用次数: ${testUser.total_messages_sent || 0}`);
    console.log(`使用进度: ${Math.round((dbTodayCount / (testUser.daily_message_limit || 100)) * 100)}%`);
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 运行测试
testDbVsRedis().then(() => {
  console.log('\n测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('测试异常:', error);
  process.exit(1);
});
