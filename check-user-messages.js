const { mysqlPool } = require('./config/database');

async function checkUserMessages() {
  console.log('🔍 检查用户消息记录...\n');
  
  const connection = await mysqlPool.getConnection();
  
  try {
    // 获取所有用户
    const [users] = await connection.execute('SELECT id, username, nickname FROM users LIMIT 10');
    console.log('用户列表:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}`);
    });
    
    if (users.length === 0) {
      console.log('❌ 没有找到用户');
      return;
    }
    
    // 检查第一个用户的消息记录
    const testUserId = users[0].id;
    console.log(`\n🔍 检查用户 ${testUserId} (${users[0].username}) 的消息记录:`);
    
    // 今日消息数
    const [todayMessages] = await connection.execute(
      'SELECT COUNT(*) as count FROM chat_records WHERE user_id = ? AND DATE(created_at) = CURDATE()',
      [testUserId]
    );
    console.log(`今日消息数: ${todayMessages[0].count}`);
    
    // 总消息数
    const [totalMessages] = await connection.execute(
      'SELECT COUNT(*) as count FROM chat_records WHERE user_id = ?',
      [testUserId]
    );
    console.log(`总消息数: ${totalMessages[0].count}`);
    
    // 最近的消息记录
    const [recentMessages] = await connection.execute(
      'SELECT id, agent_id, session_id, created_at FROM chat_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [testUserId]
    );
    
    if (recentMessages.length > 0) {
      console.log('\n最近的消息记录:');
      recentMessages.forEach(msg => {
        console.log(`- ID: ${msg.id}, 智能体: ${msg.agent_id}, 会话: ${msg.session_id}, 时间: ${msg.created_at}`);
      });
    } else {
      console.log('\n❌ 该用户没有任何消息记录');
    }
    
    // 检查所有用户的消息统计
    console.log('\n📊 所有用户的消息统计:');
    const [allStats] = await connection.execute(`
      SELECT 
        u.id,
        u.username,
        u.nickname,
        COUNT(cr.id) as total_messages,
        COUNT(CASE WHEN DATE(cr.created_at) = CURDATE() THEN 1 END) as today_messages
      FROM users u
      LEFT JOIN chat_records cr ON u.id = cr.user_id
      GROUP BY u.id, u.username, u.nickname
      ORDER BY total_messages DESC
    `);
    
    allStats.forEach(stat => {
      console.log(`- ${stat.username} (${stat.nickname}): 总计 ${stat.total_messages}, 今日 ${stat.today_messages}`);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    connection.release();
  }
}

checkUserMessages();
