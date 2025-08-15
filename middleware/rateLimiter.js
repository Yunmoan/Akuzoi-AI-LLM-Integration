const rateLimit = require('express-rate-limit');
const { redisClient } = require('../config/database');
const logger = require('../utils/logger');

// 全局速率限制
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 限制每个IP每分钟最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`全局速率限制触发: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试'
    });
  }
});

// 聊天速率限制中间件
const chatRateLimiter = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '用户未认证'
    });
  }

  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60000; // 1分钟窗口
  const maxRequests = 10; // 每分钟最多10条消息

  try {
    const key = `chat_rate_limit:${userId}`;
    
    // 获取当前时间窗口内的请求次数
    const requests = await redisClient.zRangeByScore(key, now - windowMs, now);
    
    if (requests.length >= maxRequests) {
      logger.warn(`用户 ${userId} 聊天速率限制触发`);
      return res.status(429).json({
        success: false,
        message: '发送消息过于频繁，请稍后再试'
      });
    }

    // 添加当前请求到Redis
    await redisClient.zAdd(key, { score: now, value: now.toString() });
    
    // 设置过期时间（清理旧数据）
    await redisClient.expire(key, Math.ceil(windowMs / 1000));

    next();
  } catch (error) {
    logger.error('聊天速率限制检查失败:', error);
    // 如果Redis出错，允许请求通过
    next();
  }
};

// 每日消息数量限制中间件
const dailyMessageLimiter = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '用户未认证'
    });
  }

  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
  const maxDailyMessages = parseInt(process.env.MAX_DAILY_MESSAGES) || 100;

  try {
    // 检查Redis中的每日消息计数
    const key = `daily_messages:${userId}:${today}`;
    const currentCount = await redisClient.get(key);
    
    if (currentCount && parseInt(currentCount) >= maxDailyMessages) {
      logger.warn(`用户 ${userId} 达到每日消息限制`);
      return res.status(429).json({
        success: false,
        message: `今日消息数量已达上限（${maxDailyMessages}条），请明天再试`
      });
    }

    // 增加计数
    await redisClient.incr(key);
    await redisClient.expire(key, 86400); // 24小时过期

    next();
  } catch (error) {
    logger.error('每日消息限制检查失败:', error);
    // 如果Redis出错，允许请求通过
    next();
  }
};

module.exports = {
  globalRateLimiter,
  chatRateLimiter,
  dailyMessageLimiter
}; 