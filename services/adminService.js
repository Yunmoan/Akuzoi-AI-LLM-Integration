const fs = require('fs').promises;
const path = require('path');
const { mysqlPool } = require('../config/database');
const logger = require('../utils/logger');

class AdminService {
  constructor() {
    this.adminsConfig = null;
  }

  // 加载管理员配置
  async loadAdminsConfig() {
    try {
      if (!this.adminsConfig) {
        const configPath = path.join(__dirname, '../config/admins.json');
        const configData = await fs.readFile(configPath, 'utf8');
        this.adminsConfig = JSON.parse(configData);
      }
      return this.adminsConfig;
    } catch (error) {
      logger.error('加载管理员配置失败:', error);
      throw new Error('管理员配置加载失败');
    }
  }

  // 检查用户是否为管理员
  async isAdmin(username) {
    try {
      const config = await this.loadAdminsConfig();
      const admin = config.admins.find(a => a.oauth_username === username && a.enabled);
      return admin || null;
    } catch (error) {
      logger.error('检查管理员权限失败:', error);
      return null;
    }
  }

  // 检查管理员权限
  async hasPermission(username, permission) {
    try {
      const admin = await this.isAdmin(username);
      if (!admin) return false;
      
      return admin.permissions.includes(permission);
    } catch (error) {
      logger.error('检查管理员权限失败:', error);
      return false;
    }
  }

  // 获取所有用户列表
  async getAllUsers(page = 1, limit = 20, search = '') {
    const connection = await mysqlPool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      let params = [];

      if (search) {
        whereClause = 'WHERE username LIKE ? OR nickname LIKE ? OR email LIKE ?';
        params = [`%${search}%`, `%${search}%`, `%${search}%`];
      }

      const [users] = await connection.execute(
        `SELECT 
          id, oauth_id, username, nickname, email, 
          realname_verified, is_banned, ban_reason,
          daily_message_limit, total_messages_sent,
          created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [total] = await connection.execute(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params
      );

      return {
        users,
        pagination: {
          page,
          limit,
          total: total[0].total,
          totalPages: Math.ceil(total[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  // 获取用户今日已发送的消息数量
  async getUserTodayMessageCount(userId) {
    const connection = await mysqlPool.getConnection();
    
    try {
      const [result] = await connection.execute(
        `SELECT COUNT(*) as today_count
         FROM chat_records 
         WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
        [userId]
      );

      return result[0].today_count;
    } finally {
      connection.release();
    }
  }

  // 获取用户详细信息（包含今日消息数量）
  async getUserDetailsWithStats(userId) {
    const connection = await mysqlPool.getConnection();
    
    try {
      const [users] = await connection.execute(
        `SELECT 
          id, oauth_id, username, nickname, email, 
          realname_verified, is_banned, ban_reason,
          banned_by, banned_at, daily_message_limit, total_messages_sent,
          created_at, updated_at
        FROM users 
        WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        throw new Error('用户不存在');
      }

      const user = users[0];
      
      // 获取今日消息数量
      const todayCount = await this.getUserTodayMessageCount(userId);
      
      // 计算剩余次数
      const remainingCount = Math.max(0, user.daily_message_limit - todayCount);

      return {
        ...user,
        today_messages_sent: todayCount,
        remaining_messages: remainingCount
      };
    } finally {
      connection.release();
    }
  }

  // 获取用户聊天历史
  async getUserChatHistory(userId, page = 1, limit = 50) {
    const connection = await mysqlPool.getConnection();
    
    try {
      const offset = (page - 1) * limit;

      const [records] = await connection.execute(
        `SELECT 
          id, agent_id, session_id, message, response, tokens_used, created_at
        FROM chat_records 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const [total] = await connection.execute(
        'SELECT COUNT(*) as total FROM chat_records WHERE user_id = ?',
        [userId]
      );

      return {
        records,
        pagination: {
          page,
          limit,
          total: total[0].total,
          totalPages: Math.ceil(total[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  // 封禁用户
  async banUser(userId, reason, adminUserId) {
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 更新用户状态
      await connection.execute(
        'UPDATE users SET is_banned = TRUE, ban_reason = ?, banned_by = ?, banned_at = CURRENT_TIMESTAMP WHERE id = ?',
        [reason, adminUserId, userId]
      );

      // 记录管理员操作
      await connection.execute(
        'INSERT INTO admin_actions (admin_user_id, action_type, target_user_id, details) VALUES (?, ?, ?, ?)',
        [adminUserId, 'ban_user', userId, JSON.stringify({ reason })]
      );

      await connection.commit();
      
      logger.info(`用户 ${userId} 被管理员 ${adminUserId} 封禁，原因: ${reason}`);
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error('封禁用户失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 解封用户
  async unbanUser(userId, adminUserId) {
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 更新用户状态
      await connection.execute(
        'UPDATE users SET is_banned = FALSE, ban_reason = NULL, banned_by = NULL, banned_at = NULL WHERE id = ?',
        [userId]
      );

      // 记录管理员操作
      await connection.execute(
        'INSERT INTO admin_actions (admin_user_id, action_type, target_user_id, details) VALUES (?, ?, ?, ?)',
        [adminUserId, 'unban_user', userId, JSON.stringify({})]
      );

      await connection.commit();
      
      logger.info(`用户 ${userId} 被管理员 ${adminUserId} 解封`);
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error('解封用户失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取系统统计
  async getSystemStats() {
    const connection = await mysqlPool.getConnection();
    
    try {
      // 用户统计
      const [userStats] = await connection.execute(
        `SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_banned = TRUE THEN 1 END) as banned_users,
          COUNT(CASE WHEN realname_verified = TRUE THEN 1 END) as verified_users,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_users_today
        FROM users`
      );

      // 聊天统计
      const [chatStats] = await connection.execute(
        `SELECT 
          COUNT(*) as total_messages,
          SUM(tokens_used) as total_tokens,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as messages_today,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN tokens_used ELSE 0 END) as tokens_today
        FROM chat_records`
      );

      // 智能体使用统计
      const [agentStats] = await connection.execute(
        `SELECT 
          agent_id,
          COUNT(*) as message_count,
          SUM(tokens_used) as total_tokens
        FROM chat_records 
        GROUP BY agent_id 
        ORDER BY message_count DESC 
        LIMIT 10`
      );

      return {
        users: userStats[0],
        chat: chatStats[0],
        top_agents: agentStats
      };
    } finally {
      connection.release();
    }
  }

  // 获取管理员操作日志
  async getAdminActions(page = 1, limit = 50, adminUserId = null) {
    const connection = await mysqlPool.getConnection();
    
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      let params = [];

      if (adminUserId) {
        whereClause = 'WHERE admin_user_id = ?';
        params = [adminUserId];
      }

      const [actions] = await connection.execute(
        `SELECT 
          aa.id, aa.action_type, aa.target_user_id, aa.details,
          aa.ip_address, aa.created_at,
          admin.username as admin_username,
          target.username as target_username
        FROM admin_actions aa
        LEFT JOIN users admin ON aa.admin_user_id = admin.id
        LEFT JOIN users target ON aa.target_user_id = target.id
        ${whereClause}
        ORDER BY aa.created_at DESC 
        LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [total] = await connection.execute(
        `SELECT COUNT(*) as total FROM admin_actions ${whereClause}`,
        params
      );

      return {
        actions,
        pagination: {
          page,
          limit,
          total: total[0].total,
          totalPages: Math.ceil(total[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  // 记录管理员操作
  async logAdminAction(adminUserId, actionType, targetUserId = null, targetAgentId = null, details = {}, req = null) {
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.execute(
        'INSERT INTO admin_actions (admin_user_id, action_type, target_user_id, target_agent_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          adminUserId,
          actionType,
          targetUserId,
          targetAgentId,
          JSON.stringify(details),
          req?.ip || null,
          req?.headers['user-agent'] || null
        ]
      );
    } catch (error) {
      logger.error('记录管理员操作失败:', error);
    } finally {
      connection.release();
    }
  }
}

module.exports = new AdminService();