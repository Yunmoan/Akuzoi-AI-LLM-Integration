const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDailyStats() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akuzoi_ai_db',
  });

  try {
    console.log('🔍 检查每日聊天统计表...');
    
    // 1. 检查表结构
    console.log('\n1. 检查表结构:');
    const [tables] = await connection.execute('SHOW TABLES LIKE "daily_chat_stats"');
    if (tables.length === 0) {
      console.log('❌ daily_chat_stats 表不存在');
      return;
    }
    console.log('✅ daily_chat_stats 表存在');
    
    const [columns] = await connection.execute('DESCRIBE daily_chat_stats');
    console.log('表结构:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 2. 检查表中的数据
    console.log('\n2. 检查表中的数据:');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM daily_chat_stats');
    console.log(`总记录数: ${rows[0].count}`);
    
    if (rows[0].count > 0) {
      const [sampleData] = await connection.execute('SELECT * FROM daily_chat_stats LIMIT 5');
      console.log('示例数据:');
      sampleData.forEach(row => {
        console.log(`  - ID: ${row.id}, 用户: ${row.user_id}, 日期: ${row.date}, 消息数: ${row.message_count}`);
      });
    }
    
    // 3. 检查chat_records表
    console.log('\n3. 检查chat_records表:');
    const [chatRecords] = await connection.execute('SELECT COUNT(*) as count FROM chat_records');
    console.log(`聊天记录总数: ${chatRecords[0].count}`);
    
    if (chatRecords[0].count > 0) {
      const [recentChats] = await connection.execute(`
        SELECT user_id, DATE(created_at) as chat_date, COUNT(*) as message_count 
        FROM chat_records 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY user_id, DATE(created_at)
        ORDER BY chat_date DESC, message_count DESC
        LIMIT 10
      `);
      
      console.log('最近7天的聊天统计:');
      recentChats.forEach(chat => {
        console.log(`  - 用户: ${chat.user_id}, 日期: ${chat.chat_date}, 消息数: ${chat.message_count}`);
      });
    }
    
    // 4. 检查users表
    console.log('\n4. 检查users表:');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`用户总数: ${users[0].count}`);
    
    if (users[0].count > 0) {
      const [sampleUsers] = await connection.execute(`
        SELECT id, username, daily_message_limit, total_messages_sent 
        FROM users 
        LIMIT 5
      `);
      console.log('示例用户:');
      sampleUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 每日限制: ${user.daily_message_limit}, 总发送: ${user.total_messages_sent}`);
      });
    }
    
    // 5. 尝试修复daily_chat_stats表
    console.log('\n5. 尝试修复daily_chat_stats表:');
    try {
      // 从chat_records表生成daily_chat_stats数据
      const [insertResult] = await connection.execute(`
        INSERT IGNORE INTO daily_chat_stats (user_id, date, message_count)
        SELECT 
          user_id, 
          DATE(created_at) as chat_date, 
          COUNT(*) as message_count
        FROM chat_records 
        WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY user_id, DATE(created_at)
        ON DUPLICATE KEY UPDATE 
          message_count = VALUES(message_count),
          updated_at = CURRENT_TIMESTAMP
      `);
      
      console.log(`✅ 修复完成，影响行数: ${insertResult.affectedRows}`);
      
      // 检查修复后的数据
      const [fixedRows] = await connection.execute('SELECT COUNT(*) as count FROM daily_chat_stats');
      console.log(`修复后记录数: ${fixedRows[0].count}`);
      
    } catch (error) {
      console.log('❌ 修复失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行检查
checkDailyStats(); 