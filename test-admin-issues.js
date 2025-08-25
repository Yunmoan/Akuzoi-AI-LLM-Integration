const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAdminIssues() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akuzoi_ai_db',
  });

  try {
    console.log('🔍 测试管理员功能和用户统计问题...');
    
    // 1. 检查用户表结构
    console.log('\n1. 检查用户表结构:');
    const [columns] = await connection.execute('DESCRIBE users');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // 2. 检查当前用户状态
    console.log('\n2. 当前用户状态:');
    const [users] = await connection.execute(
      'SELECT id, username, nickname, realname_verified, is_banned, ban_reason, banned_by, banned_at, daily_message_limit, total_messages_sent FROM users ORDER BY id'
    );
    
    users.forEach(user => {
      const realnameStatus = user.realname_verified ? '✅ 已实名' : '❌ 未实名';
      const banStatus = user.is_banned ? '🚫 已封禁' : '✅ 正常';
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}`);
      console.log(`    实名: ${realnameStatus}, 状态: ${banStatus}`);
      if (user.is_banned) {
        console.log(`    封禁原因: ${user.ban_reason || '无'}, 封禁者: ${user.banned_by || '无'}, 封禁时间: ${user.banned_at || '无'}`);
      }
      console.log(`    每日限制: ${user.daily_message_limit || 'NULL'}, 总发送: ${user.total_messages_sent || 'NULL'}`);
    });
    
    // 3. 检查daily_chat_stats表
    console.log('\n3. 检查daily_chat_stats表:');
    const [dailyStats] = await connection.execute(
      'SELECT user_id, date, message_count FROM daily_chat_stats ORDER BY user_id, date DESC LIMIT 10'
    );
    
    if (dailyStats.length === 0) {
      console.log('  ❌ daily_chat_stats表为空');
    } else {
      dailyStats.forEach(stat => {
        console.log(`  - 用户ID: ${stat.user_id}, 日期: ${stat.date}, 消息数: ${stat.message_count}`);
      });
    }
    
    // 4. 检查chat_records表
    console.log('\n4. 检查chat_records表:');
    const [chatRecords] = await connection.execute(
      'SELECT user_id, agent_id, DATE(created_at) as date, COUNT(*) as count FROM chat_records GROUP BY user_id, agent_id, DATE(created_at) ORDER BY user_id, date DESC LIMIT 10'
    );
    
    if (chatRecords.length === 0) {
      console.log('  ❌ chat_records表为空');
    } else {
      chatRecords.forEach(record => {
        console.log(`  - 用户ID: ${record.user_id}, 智能体: ${record.agent_id}, 日期: ${record.date}, 消息数: ${record.count}`);
      });
    }
    
    // 5. 测试封禁功能
    console.log('\n5. 测试封禁功能:');
    if (users.length > 0) {
      const testUserId = users[0].id;
      console.log(`  测试封禁用户ID: ${testUserId}`);
      
      // 尝试封禁用户
      try {
        await connection.execute(
          'UPDATE users SET is_banned = TRUE, ban_reason = ?, banned_by = ?, banned_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['测试封禁', 1, testUserId]
        );
        console.log(`  ✅ 用户 ${testUserId} 封禁成功`);
        
        // 验证封禁状态
        const [bannedUser] = await connection.execute(
          'SELECT is_banned, ban_reason, banned_by, banned_at FROM users WHERE id = ?',
          [testUserId]
        );
        
        if (bannedUser.length > 0) {
          const user = bannedUser[0];
          console.log(`  ✅ 封禁状态验证: is_banned=${user.is_banned}, reason=${user.ban_reason}, by=${user.banned_by}, at=${user.banned_at}`);
        }
        
        // 解封用户
        await connection.execute(
          'UPDATE users SET is_banned = FALSE, ban_reason = NULL, banned_by = NULL, banned_at = NULL WHERE id = ?',
          [testUserId]
        );
        console.log(`  ✅ 用户 ${testUserId} 解封成功`);
        
      } catch (error) {
        console.error(`  ❌ 封禁测试失败: ${error.message}`);
      }
    }
    
    // 6. 测试用户统计计算
    console.log('\n6. 测试用户统计计算:');
    if (users.length > 0) {
      const testUserId = users[0].id;
      console.log(`  测试用户ID: ${testUserId} 的统计信息`);
      
      try {
        // 模拟getUserStats的逻辑
        const [userInfo] = await connection.execute(
          'SELECT daily_message_limit, total_messages_sent FROM users WHERE id = ?',
          [testUserId]
        );
        
        if (userInfo.length > 0) {
          const user = userInfo[0];
          const dailyLimit = user.daily_message_limit || 100;
          const totalSent = user.total_messages_sent || 0;
          
          console.log(`  ✅ 用户基本信息: daily_limit=${dailyLimit}, total_sent=${totalSent}`);
          
          // 计算今日消息数
          const [todayStats] = await connection.execute(
            'SELECT COUNT(*) as today_count FROM chat_records WHERE user_id = ? AND DATE(created_at) = CURDATE()',
            [testUserId]
          );
          
          const todayCount = todayStats[0].today_count;
          const remainingCount = Math.max(0, dailyLimit - todayCount);
          
          console.log(`  ✅ 今日统计: today_count=${todayCount}, remaining=${remainingCount}`);
          
          // 尝试更新daily_chat_stats
          try {
            await connection.execute(
              'INSERT INTO daily_chat_stats (user_id, date, message_count) VALUES (?, CURDATE(), ?) ON DUPLICATE KEY UPDATE message_count = VALUES(message_count)',
              [testUserId, todayCount]
            );
            console.log(`  ✅ daily_chat_stats表更新成功`);
          } catch (updateError) {
            console.log(`  ⚠️ daily_chat_stats表更新失败: ${updateError.message}`);
          }
        }
      } catch (error) {
        console.error(`  ❌ 统计计算失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行测试
testAdminIssues(); 