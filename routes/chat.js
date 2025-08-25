const express = require('express');
const { body, validationResult } = require('express-validator');
const llmService = require('../services/llmService');
const memoryService = require('../services/memoryService');
const { authenticateToken, requireRealnameVerification } = require('../middleware/auth');
const { chatRateLimiter, dailyMessageLimiter } = require('../middleware/rateLimiter');
const { sensitiveWordFilter, aiOutputFilter, sensitiveWordHandler } = require('../middleware/sensitiveWordFilter');
const logger = require('../utils/logger');

const router = express.Router();

// 发送消息到智能体（需要实名认证）
router.post('/send', [
  authenticateToken,
  requireRealnameVerification,
  chatRateLimiter,
  dailyMessageLimiter,
  body('agentId')
    .notEmpty()
    .withMessage('智能体ID不能为空'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 800 })
    .withMessage('消息长度必须在1-800个字符之间'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('会话ID格式错误'),
  // 敏感词检测中间件
  sensitiveWordFilter({
    strictMode: false,        // 用户输入使用普通模式
    checkContext: true,
    minLevel: 'notice',
    logViolations: true,
    autoBlock: true
  }),
  // 敏感词处理中间件
  sensitiveWordHandler({
    notifyAdmin: true,        // 通知管理员
    recordViolation: true,    // 记录违规记录
    userWarning: true         // 向用户发送警告
  }),
  // AI输出敏感词检测中间件
  aiOutputFilter({
    strictMode: true,         // AI输出使用严格模式
    checkContext: true,
    minLevel: 'notice',
    logViolations: true,
    autoBlock: true,
    replaceSensitiveWords: false,  // 不替换敏感词，直接阻止
    replacementChar: '*'
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { agentId, message, sessionId } = req.body;
    const userId = req.user.id;

    // 基于系统提示词的相似度与关键字检测（后端防护）
    try {
      const llmServiceLocal = require('../services/llmService');
      const guard = require('../services/promptGuardService');
      const agent = await llmServiceLocal.getAgent(agentId);
      const evalRes = guard.evaluateSystemPromptSimilarity(agent.system_prompt || '', message || '');
      if (evalRes.blocked) {
        return res.status(400).json({
          success: false,
          code: 'PROMPT_GUARD_BLOCKED',
          message: `为保障平台与模型安全，已拦截高风险内容：${evalRes.reason}`,
          info: { score: evalRes.score, similarity: Number(evalRes.similarity.toFixed(2)) }
        });
      }
    } catch (err) {
      // 保护性降级：若防护模块异常，不影响主流程
      logger.warn('提示词防护模块异常(降级继续):', err?.message || err);
    }

    // 发送消息到LLM
    const result = await llmService.sendMessage(userId, agentId, message, sessionId);

    res.json({
      success: true,
      response: result.response,
      tokens_used: result.tokens_used,
      session_id: result.session_id
    });

  } catch (error) {
    logger.error('发送消息失败:', error);
    
    if (error.message.includes('智能体不存在') || error.message.includes('API密钥无效')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || '发送消息失败，请重试'
    });
  }
});

// 获取对话历史（需要实名认证）
router.get('/conversation/:agentId/:conversationId', [authenticateToken, requireRealnameVerification], async (req, res) => {
  try {
    const { agentId, conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await llmService.getConversation(userId, agentId, conversationId);

    res.json({
      success: true,
      conversation: conversation,
      conversation_id: conversationId
    });

  } catch (error) {
    logger.error('获取对话历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取对话历史失败'
    });
  }
});

// 获取用户会话列表（需要实名认证）
router.get('/sessions', [authenticateToken, requireRealnameVerification], async (req, res) => {
  try {
    const userId = req.user.id;
    const { agentId } = req.query;

    const sessions = await memoryService.getUserSessions(userId, agentId);

    res.json({
      success: true,
      sessions: sessions
    });

  } catch (error) {
    logger.error('获取会话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败'
    });
  }
});

// 获取会话历史记录（需要实名认证）
router.get('/sessions/:sessionId/history', [authenticateToken, requireRealnameVerification], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { agentId } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: '智能体ID不能为空'
      });
    }

    const history = await memoryService.getSessionHistory(userId, agentId, sessionId);

    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    logger.error('获取会话历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话历史失败'
    });
  }
});

// 删除会话（需要实名认证）
router.delete('/sessions/:sessionId', [authenticateToken, requireRealnameVerification], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const success = await memoryService.deleteSession(userId, sessionId);

    if (success) {
      res.json({
        success: true,
        message: '会话删除成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '对话删除失败'
      });
    }

  } catch (error) {
    logger.error('删除对话失败:', error);
    res.status(500).json({
      success: false,
      message: '删除对话失败'
    });
  }
});

// 获取用户今日消息统计（需要实名认证）
router.get('/stats/today', [authenticateToken, requireRealnameVerification], async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const maxDailyMessages = parseInt(process.env.MAX_DAILY_MESSAGES) || 100;

    // 从Redis获取今日消息数量
    const { redisClient } = require('../config/database');
    const key = `daily_messages:${userId}:${today}`;
    const currentCount = await redisClient.get(key) || 0;

    res.json({
      success: true,
      stats: {
        today_messages: parseInt(currentCount),
        max_daily_messages: maxDailyMessages,
        remaining_messages: Math.max(0, maxDailyMessages - parseInt(currentCount))
      }
    });

  } catch (error) {
    logger.error('获取今日统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

// 获取用户总体统计（需要实名认证）
router.get('/stats/overview', [authenticateToken, requireRealnameVerification], async (req, res) => {
  try {
    const userId = req.user.id;
    const { mysqlPool } = require('../config/database');
    const connection = await mysqlPool.getConnection();

    try {
      // 获取总消息数
      const [totalMessages] = await connection.execute(
        'SELECT COUNT(*) as total FROM chat_records WHERE user_id = ?',
        [userId]
      );

      // 获取总token使用量
      const [totalTokens] = await connection.execute(
        'SELECT SUM(tokens_used) as total FROM chat_records WHERE user_id = ?',
        [userId]
      );

      // 获取最常用的智能体
      const [topAgents] = await connection.execute(
        `SELECT agent_id, COUNT(*) as count 
         FROM chat_records 
         WHERE user_id = ? 
         GROUP BY agent_id 
         ORDER BY count DESC 
         LIMIT 5`,
        [userId]
      );

      res.json({
        success: true,
        stats: {
          total_messages: totalMessages[0].total || 0,
          total_tokens: totalTokens[0].total || 0,
          top_agents: topAgents
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    logger.error('获取总体统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

// 创建新对话（清空记忆）（需要实名认证）
router.post('/agent/:agentId/new-conversation', [authenticateToken, requireRealnameVerification], async (req, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;

    const newSessionId = await memoryService.createNewConversation(userId, agentId);

    res.json({
      success: true,
      message: '新对话已创建',
      session_id: newSessionId
    });

  } catch (error) {
    logger.error('创建新对话失败:', error);
    res.status(500).json({
      success: false,
      message: '创建新对话失败'
    });
  }
});

// 更新会话标题（需要实名认证）
router.put('/sessions/:sessionId/title', [
  authenticateToken,
  requireRealnameVerification,
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度必须在1-100个字符之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { sessionId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    const success = await memoryService.updateSessionTitle(userId, sessionId, title);

    if (success) {
      res.json({
        success: true,
        message: '会话标题更新成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

  } catch (error) {
    logger.error('更新会话标题失败:', error);
    res.status(500).json({
      success: false,
      message: '更新会话标题失败'
    });
  }
});

module.exports = router; 