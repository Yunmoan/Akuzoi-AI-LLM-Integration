const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akuzoi_ai_db',
  });

  try {
    console.log('开始初始化数据库...');

    // 删除现有表（如果存在）
    console.log('删除现有表...');
    await connection.execute('DROP TABLE IF EXISTS admin_actions');
    await connection.execute('DROP TABLE IF EXISTS daily_chat_stats');
    await connection.execute('DROP TABLE IF EXISTS chat_records');
    await connection.execute('DROP TABLE IF EXISTS users');

    // 创建用户表
    console.log('创建用户表...');
    await connection.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        oauth_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        nickname VARCHAR(255),
        email VARCHAR(255),
        avatar_url TEXT,
        realname_verified BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        ban_reason TEXT,
        banned_by INT,
        banned_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_oauth_id (oauth_id),
        INDEX idx_username (username),
        INDEX idx_is_banned (is_banned)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建对话会话表
    console.log('创建对话会话表...');
    await connection.execute(`
      CREATE TABLE chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        agent_id VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255),
        message_count INT DEFAULT 0,
        total_tokens INT DEFAULT 0,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_agent (user_id, agent_id),
        INDEX idx_session_id (session_id),
        INDEX idx_last_message (last_message_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建聊天记录表
    console.log('创建聊天记录表...');
    await connection.execute(`
      CREATE TABLE chat_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        agent_id VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        tokens_used INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, created_at),
        INDEX idx_agent (agent_id),
        INDEX idx_session (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建用户每日聊天统计表
    console.log('创建每日聊天统计表...');
    await connection.execute(`
      CREATE TABLE daily_chat_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        message_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (user_id, date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建管理员操作日志表
    console.log('创建管理员操作日志表...');
    await connection.execute(`
      CREATE TABLE admin_actions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_user_id INT NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        target_user_id INT,
        target_agent_id VARCHAR(255),
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_admin_user (admin_user_id),
        INDEX idx_action_type (action_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('数据库初始化完成！');
    
    // 验证表结构
    console.log('\n验证表结构...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('已创建的表:', tables.map(t => Object.values(t)[0]));

    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('\n用户表结构:');
    userColumns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  require('dotenv').config();
  initDatabase()
    .then(() => {
      console.log('数据库初始化成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase }; 