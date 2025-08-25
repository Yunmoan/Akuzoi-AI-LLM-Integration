const { redisClient } = require('./config/database');
const { mysqlPool } = require('./config/database');

async function testRedisStats() {
  try {
    console.log('🔍 测试Redis统计数据...');
    
    // 1. 连接Redis
    console.log('\n1. 连接Redis...');
    await redisClient.connect();
    console.log('Redis连接成功');
    
    // 2. 检查Redis连接
    console.log('\n2. 检查Redis连接状态:');
    const ping = await redisClient.ping();
    console.log('Redis ping结果:', ping);
    
    // 3. 获取所有用户
    const connection = await mysqlPool.getConnection();
    const [users] = await connection.execute('SELECT id, username FROM users');
    console.log(`\n3. 找到 ${users.length} 个用户`);
    
    // 4. 检查每个用户的Redis数据
    const today = new Date().toISOString().split('T')[0];
    
    for (const user of users) {
      console.log(`\n处理用户: ${user.username} (ID: ${user.id})`);
      
      // Redis键名
      const redisKey = `daily_messages:${user.id}:${today}`;
      console.log(`  - Redis键名: ${redisKey}`);
      
      // 获取Redis数据
      const redisCount = await redisClient.get(redisKey);
      console.log(`  - Redis计数: ${redisCount || 'null'}`);
      
      // 获取数据库中的今日统计
      const [dbStats] = await connection.execute(
        'SELECT COUNT(*) as today_count FROM chat_records WHERE user_id = ? AND DATE(created_at) = CURDATE()',
        [user.id]
      );
      const dbCount = dbStats[0].today_count;
      console.log(`  - 数据库计数: ${dbCount}`);
      
      // 检查是否一致
      const redisValue = redisCount ? parseInt(redisCount) : 0;
      console.log(`  - 状态: ${redisValue === dbCount ? '✅ 一致' : '❌ 不一致'}`);
      
      // 如果不一致，尝试同步
      if (redisValue !== dbCount) {
        console.log(`  - 尝试同步Redis数据...`);
        await redisClient.set(redisKey, dbCount);
        await redisClient.expire(redisKey, 86400); // 24小时过期
        console.log(`  - 已设置Redis: ${redisKey} = ${dbCount}`);
      }
    }
    
    // 5. 检查环境变量
    console.log('\n5. 检查环境变量:');
    console.log('MAX_DAILY_MESSAGES:', process.env.MAX_DAILY_MESSAGES);
    
    // 6. 测试API调用
    console.log('\n6. 测试API调用:');
    const testUserId = users[0]?.id;
    if (testUserId) {
      console.log(`测试用户ID: ${testUserId}`);
      
      // 模拟API调用
      const { getUserStats } = require('./services/adminService');
      const stats = await getUserStats(testUserId);
      console.log('API返回的统计数据:', JSON.stringify(stats, null, 2));
    }
    
    connection.release();
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  require('dotenv').config();
  testRedisStats();
}

module.exports = { testRedisStats };
