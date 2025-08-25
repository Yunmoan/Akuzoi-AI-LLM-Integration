const { mysqlPool } = require('./config/database');
const logger = require('./utils/logger');

async function fixUserData() {
  const connection = await mysqlPool.getConnection();
  
  try {
    console.log('🔍 开始检查用户数据...\n');

    // 1. 检查所有用户的基本信息
    console.log('1. 检查用户基本信息...');
    const [users] = await connection.execute(`
      SELECT 
        id, 
        oauth_id, 
        username, 
        nickname, 
        email, 
        realname_verified, 
        is_admin, 
        is_banned, 
        daily_message_limit, 
        total_messages_sent,
        created_at,
        updated_at
      FROM users 
      ORDER BY id
    `);

    console.log(`找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 每日限制: ${user.daily_message_limit}, 总消息: ${user.total_messages_sent}`);
    });

    // 2. 检查需要修复的用户
    console.log('\n2. 检查需要修复的用户...');
    const [usersToFix] = await connection.execute(`
      SELECT id, username, daily_message_limit, total_messages_sent
      FROM users 
      WHERE daily_message_limit IS NULL OR total_messages_sent IS NULL
    `);

    if (usersToFix.length > 0) {
      console.log(`发现 ${usersToFix.length} 个用户需要修复:`);
      usersToFix.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}`);
      });

      // 3. 修复用户数据
      console.log('\n3. 开始修复用户数据...');
      const defaultDailyLimit = parseInt(process.env.USER_DAILY_MESSAGE_LIMIT) || 50;
      
      for (const user of usersToFix) {
        await connection.execute(`
          UPDATE users 
          SET 
            daily_message_limit = COALESCE(daily_message_limit, ?),
            total_messages_sent = COALESCE(total_messages_sent, 0),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [defaultDailyLimit, user.id]);
        
        console.log(`✅ 已修复用户 ${user.username} (ID: ${user.id})`);
      }
    } else {
      console.log('✅ 所有用户数据都正常，无需修复');
    }

    // 4. 检查用户统计信息
    console.log('\n4. 检查用户统计信息...');
    const [userStats] = await connection.execute(`
      SELECT 
        u.id,
        u.username,
        u.daily_message_limit,
        u.total_messages_sent,
        COUNT(cr.id) as actual_total_messages,
        COUNT(CASE WHEN DATE(cr.created_at) = CURDATE() THEN 1 END) as today_messages
      FROM users u
      LEFT JOIN chat_records cr ON u.id = cr.user_id
      GROUP BY u.id, u.username, u.daily_message_limit, u.total_messages_sent
      ORDER BY u.id
    `);

    console.log('用户统计信息:');
    userStats.forEach(stat => {
      const remainingToday = Math.max(0, stat.daily_message_limit - stat.today_messages);
      console.log(`  ${stat.username}: 每日限制 ${stat.daily_message_limit}, 今日已用 ${stat.today_messages}, 剩余 ${remainingToday}, 总计 ${stat.actual_total_messages}`);
    });

    // 5. 同步总消息数（如果需要）
    console.log('\n5. 检查是否需要同步总消息数...');
    const [usersToSync] = await connection.execute(`
      SELECT 
        u.id,
        u.username,
        u.total_messages_sent,
        COUNT(cr.id) as actual_total
      FROM users u
      LEFT JOIN chat_records cr ON u.id = cr.user_id
      GROUP BY u.id, u.username, u.total_messages_sent
      HAVING u.total_messages_sent != COUNT(cr.id)
    `);

    if (usersToSync.length > 0) {
      console.log(`发现 ${usersToSync.length} 个用户的总消息数需要同步:`);
      
      for (const user of usersToSync) {
        await connection.execute(`
          UPDATE users 
          SET total_messages_sent = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [user.actual_total, user.id]);
        
        console.log(`✅ 已同步用户 ${user.username} 的总消息数: ${user.total_messages_sent} → ${user.actual_total}`);
      }
    } else {
      console.log('✅ 所有用户的总消息数都已同步');
    }

    console.log('\n🎉 用户数据检查和修复完成！');

  } catch (error) {
    console.error('❌ 修复用户数据失败:', error);
    logger.error('修复用户数据失败:', error);
  } finally {
    connection.release();
  }
}

// 运行修复脚本
if (require.main === module) {
  require('dotenv').config();
  fixUserData()
    .then(() => {
      console.log('用户数据修复完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('用户数据修复失败:', error);
      process.exit(1);
    });
}

module.exports = { fixUserData };
