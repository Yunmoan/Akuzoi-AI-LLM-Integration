const { mysqlPool } = require('./config/database');
const logger = require('./utils/logger');

async function diagnoseStatsIssue() {
  console.log('🔍 开始诊断用户统计API问题...\n');
  
  const connection = await mysqlPool.getConnection();
  
  try {
    // 1. 检查数据库连接
    console.log('1️⃣ 检查数据库连接...');
    const [testResult] = await connection.execute('SELECT 1 as test');
    console.log('✅ 数据库连接正常:', testResult[0].test);
    
    // 2. 检查用户表结构
    console.log('\n2️⃣ 检查用户表结构...');
    const [userColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('用户表字段:');
    userColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? '可空' : '非空'}) 默认值: ${col.COLUMN_DEFAULT}`);
    });
    
    // 3. 检查chat_records表结构
    console.log('\n3️⃣ 检查chat_records表结构...');
    const [chatColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_records'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('chat_records表字段:');
    chatColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? '可空' : '非空'}) 默认值: ${col.COLUMN_DEFAULT}`);
    });
    
    // 4. 检查用户数据
    console.log('\n4️⃣ 检查用户数据...');
    const [users] = await connection.execute('SELECT id, username, nickname, daily_message_limit FROM users LIMIT 5');
    console.log('用户数据 (前5条):');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}, 每日限制: ${user.daily_message_limit}`);
    });
    
    // 5. 检查聊天记录数据
    console.log('\n5️⃣ 检查聊天记录数据...');
    const [chatStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_records
      FROM chat_records
    `);
    console.log('聊天记录统计:', chatStats[0]);
    
    // 6. 模拟API查询逻辑
    console.log('\n6️⃣ 模拟API查询逻辑...');
    if (users.length > 0) {
      const testUserId = users[0].id;
      console.log(`使用测试用户ID: ${testUserId}`);
      
      // 获取用户基本信息
      const [userInfo] = await connection.execute(
        'SELECT daily_message_limit FROM users WHERE id = ?',
        [testUserId]
      );
      console.log('用户基本信息:', userInfo[0]);
      
      // 获取今日消息数
      const [todayStats] = await connection.execute(
        'SELECT COUNT(*) as today_count FROM chat_records WHERE user_id = ? AND DATE(created_at) = CURDATE()',
        [testUserId]
      );
      console.log('今日消息数:', todayStats[0]);
      
      // 获取总消息数
      const [totalStats] = await connection.execute(
        'SELECT COUNT(*) as total_count FROM chat_records WHERE user_id = ?',
        [testUserId]
      );
      console.log('总消息数:', totalStats[0]);
      
      // 计算剩余次数
      const userDailyLimit = userInfo[0].daily_message_limit;
      const userDefaultLimit = parseInt(process.env.USER_DAILY_MESSAGE_LIMIT) || 50;
      const dailyLimit = userDailyLimit || userDefaultLimit;
      const todayCount = todayStats[0].today_count;
      const totalCount = totalStats[0].total_count;
      const remainingCount = Math.max(0, dailyLimit - todayCount);
      
      console.log('计算结果:');
      console.log(`  - 每日限制: ${dailyLimit}`);
      console.log(`  - 今日已用: ${todayCount}`);
      console.log(`  - 总调用次数: ${totalCount}`);
      console.log(`  - 剩余次数: ${remainingCount}`);
    }
    
    // 7. 检查环境变量
    console.log('\n7️⃣ 检查环境变量...');
    console.log(`USER_DAILY_MESSAGE_LIMIT: ${process.env.USER_DAILY_MESSAGE_LIMIT || '未设置'}`);
    console.log(`MAX_DAILY_MESSAGES: ${process.env.MAX_DAILY_MESSAGES || '未设置'}`);
    
  } catch (error) {
    console.error('❌ 诊断过程中出现错误:', error);
    logger.error('诊断用户统计API问题失败:', error);
  } finally {
    connection.release();
    console.log('\n📋 诊断完成');
  }
}

// 运行诊断
diagnoseStatsIssue();
