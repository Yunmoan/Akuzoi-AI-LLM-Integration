const mysql = require('mysql2/promise');
const redis = require('redis');
const logger = require('../utils/logger');

// MySQL连接池配置
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'akuzoi_ai_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Redis客户端配置
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0
});

// Redis连接事件处理
redisClient.on('error', (err) => {
  logger.error('Redis连接错误:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis连接成功');
});

redisClient.on('ready', () => {
  logger.info('Redis客户端就绪');
});

// 初始化数据库连接
async function initializeDatabase() {
  try {
    // 测试MySQL连接
    await mysqlPool.getConnection();
    logger.info('MySQL连接成功');

    // 连接Redis
    await redisClient.connect();
    logger.info('Redis连接成功');

    // 创建数据库表
    await createTables();
    
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 创建数据库表
async function createTables() {
  const connection = await mysqlPool.getConnection();
  
  try {
    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
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
        daily_message_limit INT DEFAULT 100,
        total_messages_sent INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_oauth_id (oauth_id),
        INDEX idx_username (username),
        INDEX idx_is_banned (is_banned)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 对话会话表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
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

    // 聊天记录表（用于统计和备份）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_records (
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

    // 用户每日聊天统计表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS daily_chat_stats (
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

    // 管理员操作日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_actions (
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

    logger.info('数据库表创建成功');
  } catch (error) {
    logger.error('创建数据库表失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  mysqlPool,
  redisClient,
  initializeDatabase
}; 