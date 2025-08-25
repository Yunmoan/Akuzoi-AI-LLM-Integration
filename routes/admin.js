const express = require('express');
const { body, validationResult, query } = require('express-validator');
const adminService = require('../services/adminService');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/adminAuth');
const logger = require('../utils/logger');
const { mysqlPool } = require('../config/database');

const router = express.Router();

// 获取所有用户列表
router.get('/users', [
  authenticateToken,
  requirePermission('view_all_users'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const result = await adminService.getAllUsers(page, limit, search);

    // 记录管理员操作
    await adminService.logAdminAction(
      req.user.id,
      'view_all_users',
      null,
      null,
      { page, limit, search },
      req
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 获取用户详细信息
router.get('/users/:userId', [
  authenticateToken,
  requirePermission('view_all_users')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        message: '用户ID必须是正整数'
      });
    }

    const userDetails = await adminService.getUserDetailsWithStats(userId);

    // 记录管理员操作
    await adminService.logAdminAction(
      req.user.id,
      'view_user_details',
      userId,
      null,
      {},
      req
    );

    res.json({
      success: true,
      data: userDetails
    });
  } catch (error) {
    logger.error('获取用户详情失败:', error);
    
    if (error.message === '用户不存在') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '获取用户详情失败'
    });
  }
});

// 获取用户聊天历史
router.get('/users/:userId/chat-history', [
  authenticateToken,
  requirePermission('view_user_chat_history')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        message: '用户ID必须是正整数'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: '页码必须是正整数'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: '每页数量必须在1-100之间'
      });
    }

    const result = await adminService.getUserChatHistory(userId, page, limit);

    // 记录管理员操作
    await adminService.logAdminAction(
      req.user.id,
      'view_user_chat_history',
      userId,
      null,
      { page, limit },
      req
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('获取用户聊天历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户聊天历史失败'
    });
  }
});

// 封禁用户
router.post('/users/:userId/ban', [
  authenticateToken,
  requirePermission('ban_user'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('封禁原因长度必须在1-500个字符之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const userId = parseInt(req.params.userId);
    const { reason } = req.body;

    await adminService.banUser(userId, reason, req.user.id);

    res.json({
      success: true,
      message: '用户封禁成功'
    });
  } catch (error) {
    logger.error('封禁用户失败:', error);
    res.status(500).json({
      success: false,
      message: '封禁用户失败'
    });
  }
});

// 解封用户
router.post('/users/:userId/unban', [
  authenticateToken,
  requirePermission('unban_user')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    await adminService.unbanUser(userId, req.user.id);

    res.json({
      success: true,
      message: '用户解封成功'
    });
  } catch (error) {
    logger.error('解封用户失败:', error);
    res.status(500).json({
      success: false,
      message: '解封用户失败'
    });
  }
});

// 获取系统统计
router.get('/stats', [
  authenticateToken,
  requirePermission('view_system_stats')
], async (req, res) => {
  try {
    const stats = await adminService.getSystemStats();

    // 记录管理员操作
    await adminService.logAdminAction(
      req.user.id,
      'view_system_stats',
      null,
      null,
      {},
      req
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取系统统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统统计失败'
    });
  }
});

// 获取管理员操作日志
router.get('/actions', [
  authenticateToken,
  requireAnyPermission(['view_system_stats', 'manage_admins']),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('adminUserId').optional().isInt({ min: 1 }).withMessage('管理员用户ID必须是正整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const adminUserId = req.query.adminUserId ? parseInt(req.query.adminUserId) : null;

    const result = await adminService.getAdminActions(page, limit, adminUserId);

    // 记录管理员操作
    await adminService.logAdminAction(
      req.user.id,
      'view_admin_actions',
      null,
      null,
      { page, limit, adminUserId },
      req
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('获取管理员操作日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取管理员操作日志失败'
    });
  }
});

// 获取用户统计信息
router.get('/users/:userId/stats', [
  authenticateToken
], async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    logger.info(`获取用户统计信息: userId=${userId}, requesterId=${req.user.id}, isAdmin=${req.user.is_admin}`);
    
    // 检查是否是当前用户或管理员
    if (req.user.id !== userId && !req.user.is_admin) {
      logger.warn(`权限不足: userId=${userId}, requesterId=${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: '没有权限查看该用户的统计信息'
      });
    }

    const userStats = await adminService.getUserStats(userId);
    logger.info(`用户统计信息获取成功: userId=${userId}, stats=${JSON.stringify(userStats)}`);

    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    logger.error('获取用户统计失败:', error);
    
    if (error.message === '用户不存在') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    });
  }
});

// 更新用户每日消息限制
router.put('/users/:userId/daily-limit', [
  authenticateToken,
  requirePermission('manage_users'),
  body('daily_limit')
    .isInt({ min: 1, max: 1000 })
    .withMessage('每日限制必须在1-1000之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const userId = parseInt(req.params.userId);
    const { daily_limit } = req.body;

    logger.info(`更新用户每日限制: userId=${userId}, newLimit=${daily_limit}, adminId=${req.user.id}`);

    // 更新用户每日限制
    const connection = await mysqlPool.getConnection();
    try {
      await connection.execute(
        'UPDATE users SET daily_message_limit = ? WHERE id = ?',
        [daily_limit, userId]
      );

      // 记录管理员操作
      await adminService.logAdminAction(
        req.user.id,
        'update_user_daily_limit',
        userId,
        null,
        { old_limit: null, new_limit: daily_limit },
        req
      );

      res.json({
        success: true,
        message: '用户每日限制更新成功',
        data: { daily_message_limit: daily_limit }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('更新用户每日限制失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户每日限制失败'
    });
  }
});

// 获取管理员配置信息
router.get('/config', [
  authenticateToken,
  requirePermission('manage_admins')
], async (req, res) => {
  try {
    const config = await adminService.loadAdminsConfig();

    res.json({
      success: true,
      data: {
        roles: config.roles,
        permissions: config.permissions
      }
    });
  } catch (error) {
    logger.error('获取管理员配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取管理员配置失败'
    });
  }
});

// 敏感词管理相关路由
const sensitiveWordService = require('../services/sensitiveWordService');

// 获取敏感词统计信息
router.get('/sensitive-words/stats', [
  authenticateToken,
  requirePermission('manage_content')
], async (req, res) => {
  try {
    const stats = sensitiveWordService.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取敏感词统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取敏感词统计失败'
    });
  }
});

// 添加敏感词
router.post('/sensitive-words', [
  authenticateToken,
  requirePermission('manage_content'),
  body('word').notEmpty().withMessage('敏感词不能为空'),
  body('category').notEmpty().withMessage('分类不能为空'),
  body('level').notEmpty().withMessage('级别不能为空'),
  body('synonyms').optional().isArray(),
  body('context').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { word, category, level, synonyms = [], context = [] } = req.body;
    
    sensitiveWordService.addSensitiveWord(word, category, level, synonyms, context);
    
    // 记录管理员操作
    await adminService.logAdminAction(
      req.user.id,
      'add_sensitive_word',
      null,
      null,
      { word, category, level, synonyms, context },
      req
    );

    res.json({
      success: true,
      message: '敏感词添加成功'
    });
  } catch (error) {
    logger.error('添加敏感词失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '添加敏感词失败'
    });
  }
});

// 移除敏感词
router.delete('/sensitive-words/:word', [
  authenticateToken,
  requirePermission('manage_content')
], async (req, res) => {
  try {
    const { word } = req.params;
    const success = sensitiveWordService.removeSensitiveWord(word);
    
    if (success) {
      // 记录管理员操作
      await adminService.logAdminAction(
        req.user.id,
        'remove_sensitive_word',
        null,
        null,
        { word },
        req
      );

      res.json({
        success: true,
        message: '敏感词移除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '敏感词不存在'
      });
    }
  } catch (error) {
    logger.error('移除敏感词失败:', error);
    res.status(500).json({
      success: false,
      message: '移除敏感词失败'
    });
  }
});

// 测试敏感词检测
router.post('/sensitive-words/test', [
  authenticateToken,
  requirePermission('manage_content'),
  body('text').notEmpty().withMessage('测试文本不能为空'),
  body('options').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { text, options = {} } = req.body;
    const result = sensitiveWordService.detectSensitiveWords(text, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('测试敏感词检测失败:', error);
    res.status(500).json({
      success: false,
      message: '测试敏感词检测失败'
    });
  }
});

module.exports = router;