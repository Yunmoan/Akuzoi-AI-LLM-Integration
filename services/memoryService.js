const { mysqlPool } = require('../config/database');
const { redisClient } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class MemoryService {
  constructor() {
    this.agentsConfig = null;
  }

  // 加载智能体配置
  async loadAgentsConfig() {
    if (!this.agentsConfig) {
      const fs = require('fs').promises;
      const path = require('path');
      const configPath = path.join(__dirname, '../prompts/agents.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.agentsConfig = JSON.parse(configData);
    }
    return this.agentsConfig;
  }

  // 生成会话ID
  generateSessionId() {
    return uuidv4();
  }

  // 获取或创建会话
  async getOrCreateSession(userId, agentId, sessionId = null) {
    console.log('🔍 getOrCreateSession 调用:', { userId, agentId, sessionId });
    
    const connection = await mysqlPool.getConnection();
    
    try {
      if (sessionId) {
        console.log('🔍 查找现有会话:', sessionId);
        // 查找现有会话
        const [sessions] = await connection.execute(
          'SELECT * FROM chat_sessions WHERE session_id = ? AND user_id = ? AND agent_id = ?',
          [sessionId, userId, agentId]
        );

        console.log('🔍 查找结果:', { found: sessions.length > 0, session: sessions[0] });

        if (sessions.length > 0) {
          console.log('✅ 找到现有会话，返回:', sessions[0].session_id);
          return sessions[0];
        }
      }

      // 创建新会话
      const newSessionId = sessionId || this.generateSessionId();
      console.log('🔍 创建新会话:', { newSessionId, wasProvided: !!sessionId });
      
      const [result] = await connection.execute(
        'INSERT INTO chat_sessions (user_id, agent_id, session_id, title) VALUES (?, ?, ?, ?)',
        [userId, agentId, newSessionId, `与${agentId}的对话`]
      );

      const [newSessions] = await connection.execute(
        'SELECT * FROM chat_sessions WHERE id = ?',
        [result.insertId]
      );

      console.log('🔍 新会话查询结果:', { 
        insertId: result.insertId, 
        newSessions: newSessions,
        firstSession: newSessions[0],
        sessionId: newSessions[0]?.session_id 
      });
      
      if (newSessions.length === 0) {
        throw new Error('新创建的会话查询失败');
      }
      
      console.log('✅ 新会话创建成功:', newSessions[0].session_id);
      return newSessions[0];
    } finally {
      connection.release();
    }
  }

  // 获取会话历史记录
  async getSessionHistory(userId, agentId, sessionId, limit = 50) {
    const connection = await mysqlPool.getConnection();
    
    try {
      const [records] = await connection.execute(
        `SELECT id, message, response, tokens_used, created_at 
         FROM chat_records 
         WHERE user_id = ? AND agent_id = ? AND session_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, agentId, sessionId, limit]
      );

      return records.reverse(); // 返回时间正序
    } finally {
      connection.release();
    }
  }

  // 保存消息到记忆
  async saveMessage(userId, agentId, sessionId, message, response, tokensUsed) {
    console.log('💾 开始保存消息到记忆:', { userId, agentId, sessionId, messageLength: message.length, responseLength: response.length, tokensUsed });
    
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 保存聊天记录
      const [insertResult] = await connection.execute(
        'INSERT INTO chat_records (user_id, agent_id, session_id, message, response, tokens_used) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, agentId, sessionId, message, response, tokensUsed]
      );
      
      console.log('💾 聊天记录保存结果:', { insertId: insertResult.insertId, affectedRows: insertResult.affectedRows });

      // 更新会话统计
      const [updateResult] = await connection.execute(
        'UPDATE chat_sessions SET message_count = message_count + 1, total_tokens = total_tokens + ?, last_message_at = CURRENT_TIMESTAMP WHERE session_id = ?',
        [tokensUsed, sessionId]
      );
      
      console.log('💾 会话统计更新结果:', { affectedRows: updateResult.affectedRows });

      await connection.commit();
      console.log('💾 消息保存成功！');
      
      // 验证保存是否成功
      const [verifyResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM chat_records WHERE session_id = ?',
        [sessionId]
      );
      console.log('💾 验证保存结果:', { totalRecords: verifyResult[0].count });
      
    } catch (error) {
      console.error('💾 保存消息失败:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取智能体记忆（根据配置限制）
  async getAgentMemory(userId, agentId, sessionId) {
    const agentsConfig = await this.loadAgentsConfig();
    const agent = agentsConfig.agents.find(a => a.id === agentId);
    
    if (!agent || !agent.memory || !agent.memory.enabled) {
      console.log('❌ 智能体记忆未启用:', { agentId, memory: agent?.memory });
      return [];
    }

    const { max_messages, max_age_hours } = agent.memory;
    console.log('🔍 记忆配置:', { max_messages, max_age_hours });
    
    const connection = await mysqlPool.getConnection();
    
    try {
      // 如果没有sessionId，返回空记忆（新对话）
      if (!sessionId) {
        console.log('❌ 没有sessionId，返回空记忆');
        return [];
      }

      console.log('🔍 查询记忆参数:', { userId, agentId, sessionId, max_age_hours, max_messages });

      // 获取符合条件的消息记录
      // 将 .execute 改为 .query，并修复 SQL 语法
       const [records] = await connection.query(
      `SELECT message, response, created_at
       FROM chat_records 
      WHERE user_id = ? AND agent_id = ? AND session_id = ? 
   AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
   ORDER BY created_at ASC 
   LIMIT ?`,
  [
    userId, 
    agentId, 
    sessionId, 
    Number(max_age_hours), // 确保是数字类型
    Number(max_messages)   // 确保是数字类型
  ]
);

//      const [records] = await connection.execute(
//        `SELECT message, response, created_at
//         FROM chat_records 
//        WHERE user_id = ? AND agent_id = ? AND session_id = ? 
//         AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
//         ORDER BY created_at ASC 
//         LIMIT ?`,
//        [userId, agentId, sessionId, max_age_hours, max_messages]
//     );

      console.log('🔍 查询结果:', { 
        recordsCount: records.length, 
        records: records.map(r => ({ 
          message: r.message.substring(0, 30) + '...', 
          response: r.response.substring(0, 30) + '...',
          created_at: r.created_at
        }))
      });

      return records; // 返回时间正序
    } finally {
      connection.release();
    }
  }

  // 构建对话上下文
  async buildConversationContext(userId, agentId, sessionId) {
    const memory = await this.getAgentMemory(userId, agentId, sessionId);
    
    const context = memory.map(record => ({
      role: 'user',
      content: record.message
    })).concat(memory.map(record => ({
      role: 'assistant',
      content: record.response
    })));

    return context;
  }

  // 获取用户的所有会话
  async getUserSessions(userId, agentId = null) {
    const connection = await mysqlPool.getConnection();
    
    try {
      let query = `
        SELECT id, agent_id, session_id, title, message_count, total_tokens, 
               last_message_at, created_at 
        FROM chat_sessions 
        WHERE user_id = ?
      `;
      let params = [userId];

      if (agentId) {
        query += ' AND agent_id = ?';
        params.push(agentId);
      }

      query += ' ORDER BY last_message_at DESC';

      const [sessions] = await connection.execute(query, params);
      return sessions;
    } finally {
      connection.release();
    }
  }

  // 删除会话及其所有消息
  async deleteSession(userId, sessionId) {
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 删除会话
      const [sessionResult] = await connection.execute(
        'DELETE FROM chat_sessions WHERE session_id = ? AND user_id = ?',
        [sessionId, userId]
      );

      if (sessionResult.affectedRows === 0) {
        throw new Error('会话不存在或无权限删除');
      }

      // 删除相关聊天记录
      await connection.execute(
        'DELETE FROM chat_records WHERE session_id = ? AND user_id = ?',
        [sessionId, userId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 创建新对话（清空记忆）
  async createNewConversation(userId, agentId) {
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 生成新的会话ID（使用UUID）
      const newSessionId = this.generateSessionId();
      
      // 创建新的会话记录
      await connection.execute(
        'INSERT INTO chat_sessions (session_id, user_id, agent_id, title, created_at) VALUES (?, ?, ?, ?, NOW())',
        [newSessionId, userId, agentId, '新对话']
      );

      await connection.commit();
      return newSessionId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新会话标题
  async updateSessionTitle(userId, sessionId, title) {
    const connection = await mysqlPool.getConnection();
    
    try {
      const [result] = await connection.execute(
        'UPDATE chat_sessions SET title = ? WHERE session_id = ? AND user_id = ?',
        [title, sessionId, userId]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  // 清理过期记忆（定时任务）
  async cleanupExpiredMemory() {
    const agentsConfig = await this.loadAgentsConfig();
    const connection = await mysqlPool.getConnection();
    
    try {
      for (const agent of agentsConfig.agents) {
        if (agent.memory && agent.memory.enabled) {
          const { max_age_hours } = agent.memory;
          
          // 删除过期的聊天记录
          await connection.execute(
            'DELETE FROM chat_records WHERE agent_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)',
            [agent.id, max_age_hours]
          );
        }
      }

      logger.info('过期记忆清理完成');
    } catch (error) {
      logger.error('清理过期记忆失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new MemoryService(); 
