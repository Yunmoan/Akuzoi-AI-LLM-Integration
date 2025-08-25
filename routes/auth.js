const express = require('express');
const { body, validationResult } = require('express-validator');
const oauthService = require('../services/oauthService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { mysqlPool } = require('../config/database');

const router = express.Router();

// 生成OAuth授权URL
router.get('/login', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const authUrl = oauthService.generateAuthUrl(state);
    
    res.json({
      success: true,
      auth_url: authUrl,
      state: state
    });
  } catch (error) {
    logger.error('生成授权URL失败:', error);
    res.status(500).json({
      success: false,
      message: '生成授权链接失败'
    });
  }
});

// OAuth回调处理
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '授权码缺失'
      });
    }

    const result = await oauthService.handleCallback(code, state);
    
    // 如果是新用户，重定向到设置昵称页面
    if (result.isNewUser) {
      return res.json({
        success: true,
        user: result.user,
        token: result.token,
        isNewUser: true,
        message: '请设置您的昵称'
      });
    }

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      isNewUser: false
    });

  } catch (error) {
    logger.error('OAuth回调处理失败:', error);
    
    if (error.message === '请完成实名认证') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '登录失败，请重试'
    });
  }
});

// 设置用户昵称
router.post('/set-nickname', [
  authenticateToken,
  body('nickname')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度必须在1-50个字符之间')
    .matches(/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/)
    .withMessage('昵称只能包含字母、数字、中文、下划线和连字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { nickname } = req.body;
    const userId = req.user.id;

    // 检查昵称是否已被使用
    const { mysqlPool } = require('../config/database');
    const connection = await mysqlPool.getConnection();
    
    try {
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE nickname = ? AND id != ?',
        [nickname, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '该昵称已被使用'
        });
      }

      // 更新用户昵称
      const updatedUser = await oauthService.updateNickname(userId, nickname);

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          nickname: updatedUser.nickname,
          email: updatedUser.email,
          realname_verified: updatedUser.realname_verified,
          is_admin: updatedUser.is_admin
        },
        message: '昵称设置成功'
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    logger.error('设置昵称失败:', error);
    res.status(500).json({
      success: false,
      message: '设置昵称失败，请重试'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        nickname: req.user.nickname,
        email: req.user.email,
        realname_verified: req.user.realname_verified,
        is_admin: req.user.is_admin
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 获取用户自己的统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  const connection = await mysqlPool.getConnection();
  
  try {
    const userId = req.user.id;
    
    // 获取用户基本信息
    const [users] = await connection.execute(
      'SELECT daily_message_limit FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];
    const userDailyLimit = user.daily_message_limit;
    const userDefaultLimit = parseInt(process.env.USER_DAILY_MESSAGE_LIMIT) || 50;
    const maxDailyMessages = parseInt(process.env.MAX_DAILY_MESSAGES) || 100;
    const dailyLimit = userDailyLimit || userDefaultLimit; // 优先使用个人限制，没有则使用新用户默认限制
    
    // 从数据库获取今日消息数
    const [todayStats] = await connection.execute(
      'SELECT COUNT(*) as today_count FROM chat_records WHERE user_id = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );
    const todayCount = todayStats[0].today_count;
    
    // 直接从chat_records表计算总消息数
    const [totalStats] = await connection.execute(
      'SELECT COUNT(*) as total_count FROM chat_records WHERE user_id = ?',
      [userId]
    );
    const totalCount = totalStats[0].total_count;
    
    // 添加调试日志
    console.log('🔍 用户统计API调试信息:', {
      userId,
      userDailyLimit,
      userDefaultLimit,
      maxDailyMessages,
      dailyLimit,
      todayCount,
      totalCount,
      remainingCount: Math.max(0, dailyLimit - todayCount)
    });
    
    const remainingCount = Math.max(0, dailyLimit - todayCount);
    
    const userStats = {
      daily_message_limit: dailyLimit,
      total_messages_sent: totalCount,
      today_messages_sent: todayCount,
      remaining_messages: remainingCount,
      max_daily_messages: maxDailyMessages,
      user_daily_message_limit: userDefaultLimit
    };
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    logger.error('获取用户统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计信息失败'
    });
  } finally {
    connection.release();
  }
});

// 登出（前端处理，这里只是返回成功状态）
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router; 