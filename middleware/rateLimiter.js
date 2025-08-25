const rateLimit = require('express-rate-limit');
const { redisClient, mysqlPool } = require('../config/database');
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
  // 自定义密钥生成器，确保正确处理代理环境下的IP地址
  keyGenerator: (req) => {
    // 在代理环境下，使用 X-Forwarded-For 头部获取真实IP
    let clientIp = 'unknown';
    
    // 优先使用 X-Forwarded-For
    if (req.headers['x-forwarded-for']) {
      const forwardedFor = req.headers['x-forwarded-for'];
      // 如果包含多个IP，取第一个（客户端IP）
      clientIp = forwardedFor.split(',')[0].trim();
    } else if (req.ip) {
      // 使用Express的trust proxy设置后的IP
      clientIp = req.ip;
    } else if (req.connection && req.connection.remoteAddress) {
      // 直接连接地址
      clientIp = req.connection.remoteAddress;
    }
    
    // 处理IPv6地址格式
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }
    
    logger.debug(`速率限制密钥生成 - 原始IP: ${req.ip}, 客户端IP: ${clientIp}, X-Forwarded-For: ${req.headers['x-forwarded-for'] || 'none'}`);
    return clientIp;
  },
  handler: (req, res) => {
    let clientIp = 'unknown';
    
    // 优先使用 X-Forwarded-For
    if (req.headers['x-forwarded-for']) {
      const forwardedFor = req.headers['x-forwarded-for'];
      clientIp = forwardedFor.split(',')[0].trim();
    } else if (req.ip) {
      clientIp = req.ip;
    } else if (req.connection && req.connection.remoteAddress) {
      clientIp = req.connection.remoteAddress;
    }
    
    // 处理IPv6地址格式
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }
    
    logger.warn(`全局速率限制触发: ${clientIp}`);
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
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1分钟窗口
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10; // 每分钟最多10条消息

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
    // 如果Redis出错，阻止请求继续
    return res.status(500).json({
      success: false,
      message: '系统暂时不可用，请稍后再试'
    });
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

  try {
    // 首先从数据库获取用户的每日限制
    let userRows;
    try {
      [userRows] = await mysqlPool.execute(
      'SELECT daily_message_limit FROM users WHERE id = ?',
      [userId]
    );
    } catch (dbError) {
      // 如果字段不存在，使用默认值
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('daily_message_limit 字段不存在，使用默认值');
        userRows = [{ daily_message_limit: 100 }];
      } else {
        throw dbError;
      }
    }

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 优先使用用户个人的每日限制，如果没有则使用新用户默认限制
    const userDailyLimit = userRows[0].daily_message_limit;
    const userDefaultLimit = parseInt(process.env.USER_DAILY_MESSAGE_LIMIT) || 50;
    const envMaxDailyMessages = parseInt(process.env.MAX_DAILY_MESSAGES) || 100;
    const maxDailyMessages = userDailyLimit || userDefaultLimit;
    
    // 调试日志
    console.log('🔍 每日限制检查调试:');
    console.log('  - userId:', userId);
    console.log('  - today:', today);
    console.log('  - userDailyLimit:', userDailyLimit);
    console.log('  - userDefaultLimit:', userDefaultLimit);
    console.log('  - envMaxDailyMessages:', envMaxDailyMessages);
    console.log('  - maxDailyMessages:', maxDailyMessages);

    // 检查Redis中的每日消息计数
    const key = `daily_messages:${userId}:${today}`;
    const currentCount = await redisClient.get(key);
    
    console.log('  - Redis key:', key);
    console.log('  - currentCount:', currentCount);
    console.log('  - parsed currentCount:', currentCount ? parseInt(currentCount) : 0);
    
    if (currentCount && parseInt(currentCount) >= maxDailyMessages) {
      logger.warn(`用户 ${userId} 达到每日消息限制`);
      console.log('  - 触发限制，返回429错误');
      return res.status(429).json({
        success: false,
        message: `今日消息数量已达上限（${maxDailyMessages}条），请明天再试`,
        limit_info: {
          daily_limit: maxDailyMessages,
          current_count: parseInt(currentCount),
          remaining: 0
        }
      });
    }

    // 增加Redis计数
    await redisClient.incr(key);
    await redisClient.expire(key, 86400); // 24小时过期

    // 更新数据库中的总消息计数
    try {
    await mysqlPool.execute(
      'UPDATE users SET total_messages_sent = total_messages_sent + 1 WHERE id = ?',
      [userId]
    );
    } catch (updateError) {
      // 如果字段不存在，忽略更新错误
      if (updateError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('total_messages_sent 字段不存在，跳过更新');
      } else {
        throw updateError;
      }
    }

    console.log('  - 限制检查通过，继续执行');
    next();
  } catch (error) {
    logger.error('每日消息限制检查失败:', error);
    // 如果数据库或Redis出错，阻止请求继续
    return res.status(500).json({
      success: false,
      message: '系统暂时不可用，请稍后再试'
    });
  }
};

module.exports = {
  globalRateLimiter,
  chatRateLimiter,
  dailyMessageLimiter
}; 