const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库结构...\n');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'akuzoi_ai_db',
    });

    // 检查表结构
    console.log('1. 检查表结构...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('已存在的表:', tables.map(t => Object.values(t)[0]));

    // 检查chat_records表结构
    console.log('\n2. 检查chat_records表结构...');
    const [columns] = await connection.execute('DESCRIBE chat_records');
    console.log('chat_records表字段:');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });

    // 检查chat_sessions表结构
    console.log('\n3. 检查chat_sessions表结构...');
    const [sessionColumns] = await connection.execute('DESCRIBE chat_sessions');
    console.log('chat_sessions表字段:');
    sessionColumns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });

    // 检查现有数据
    console.log('\n4. 检查现有数据...');
    const [recordCount] = await connection.execute('SELECT COUNT(*) as count FROM chat_records');
    console.log('chat_records表记录数:', recordCount[0].count);

    const [sessionCount] = await connection.execute('SELECT COUNT(*) as count FROM chat_sessions');
    console.log('chat_sessions表记录数:', sessionCount[0].count);

    if (recordCount[0].count > 0) {
      console.log('\n5. 查看最新的聊天记录...');
      const [recentRecords] = await connection.execute(`
        SELECT user_id, agent_id, session_id, message, response, created_at 
        FROM chat_records 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      recentRecords.forEach((record, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  用户ID: ${record.user_id}`);
        console.log(`  智能体: ${record.agent_id}`);
        console.log(`  会话ID: ${record.session_id}`);
        console.log(`  消息: ${record.message.substring(0, 50)}...`);
        console.log(`  回复: ${record.response.substring(0, 50)}...`);
        console.log(`  时间: ${record.created_at}`);
        console.log('');
      });
    }

    if (sessionCount[0].count > 0) {
      console.log('\n6. 查看会话信息...');
      const [sessions] = await connection.execute(`
        SELECT user_id, agent_id, session_id, title, message_count, total_tokens, last_message_at, created_at 
        FROM chat_sessions 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      sessions.forEach((session, index) => {
        console.log(`会话 ${index + 1}:`);
        console.log(`  用户ID: ${session.user_id}`);
        console.log(`  智能体: ${session.agent_id}`);
        console.log(`  会话ID: ${session.session_id}`);
        console.log(`  标题: ${session.title}`);
        console.log(`  消息数: ${session.message_count}`);
        console.log(`  Token数: ${session.total_tokens}`);
        console.log(`  最后消息: ${session.last_message_at}`);
        console.log(`  创建时间: ${session.created_at}`);
        console.log('');
      });
    }

    await connection.end();
    console.log('✅ 数据库检查完成！');

  } catch (error) {
    console.error('❌ 数据库检查失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  require('dotenv').config();
  checkDatabase().catch(console.error);
}

module.exports = { checkDatabase }; 