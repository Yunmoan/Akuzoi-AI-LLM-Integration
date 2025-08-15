const jwt = require('jsonwebtoken');
const { mysqlPool } = require('../config/database');
const logger = require('../utils/logger');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 从数据库获取用户信息
    const [users] = await mysqlPool.execute(
      'SELECT id, oauth_id, username, nickname, email, realname_verified FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];
    
    // 检查用户是否被封禁
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: '账户已被封禁',
        ban_reason: user.ban_reason
      });
    }
    
    // 检查实名认证状态
    if (process.env.ENABLE_REALNAME_CHECK === 'true' && !user.realname_verified) {
      return res.status(403).json({
        success: false,
        message: '请完成实名认证'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('JWT验证失败:', error);
    return res.status(403).json({
      success: false,
      message: '无效的访问令牌'
    });
  }
};

// 可选认证中间件（用于某些不需要强制登录的接口）
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await mysqlPool.execute(
      'SELECT id, oauth_id, username, nickname, email, realname_verified FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length > 0) {
      req.user = users[0];
    }
  } catch (error) {
    logger.error('可选认证失败:', error);
  }

  next();
};

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken
};