const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

async function addMissingFields() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akuzoi_ai_db',
  });

  try {
    console.log('开始添加缺失的字段...');

    // 检查 daily_message_limit 字段是否存在
    const [columns] = await connection.execute('SHOW COLUMNS FROM users LIKE "daily_message_limit"');
    if (columns.length === 0) {
      console.log('添加 daily_message_limit 字段...');
      await connection.execute('ALTER TABLE users ADD COLUMN daily_message_limit INT DEFAULT 100');
      console.log('daily_message_limit 字段添加成功');
    } else {
      console.log('daily_message_limit 字段已存在');
    }

    // 检查 total_messages_sent 字段是否存在
    const [columns2] = await connection.execute('SHOW COLUMNS FROM users LIKE "total_messages_sent"');
    if (columns2.length === 0) {
      console.log('添加 total_messages_sent 字段...');
      await connection.execute('ALTER TABLE users ADD COLUMN total_messages_sent INT DEFAULT 0');
      console.log('total_messages_sent 字段添加成功');
    } else {
      console.log('total_messages_sent 字段已存在');
    }

    // 检查 is_admin 字段是否存在
    const [columns3] = await connection.execute('SHOW COLUMNS FROM users LIKE "is_admin"');
    if (columns3.length === 0) {
      console.log('添加 is_admin 字段...');
      await connection.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
      console.log('is_admin 字段添加成功');
    } else {
      console.log('is_admin 字段已存在');
    }

    console.log('所有缺失字段添加完成！');
    
    // 验证表结构
    console.log('\n验证表结构...');
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('\n用户表结构:');
    userColumns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

  } catch (error) {
    console.error('添加字段失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  require('dotenv').config();
  addMissingFields()
    .then(() => {
      console.log('字段添加成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('字段添加失败:', error);
      process.exit(1);
    });
}

module.exports = { addMissingFields }; 