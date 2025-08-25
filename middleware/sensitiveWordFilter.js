// 敏感词过滤中间件
// 用于在聊天流程中检测AI输出内容是否存在违反中国大陆法律的内容

const sensitiveWordService = require('../services/sensitiveWordService');
const logger = require('../utils/logger');

/**
 * 敏感词检测中间件
 * @param {Object} options 配置选项
 * @param {boolean} options.strictMode 严格模式，警告级别也会被阻止
 * @param {boolean} options.checkContext 是否检查上下文
 * @param {string} options.minLevel 最低检测级别
 * @param {boolean} options.logViolations 是否记录违规日志
 * @param {boolean} options.autoBlock 是否自动阻止违规内容
 */
function sensitiveWordFilter(options = {}) {
  const {
    strictMode = false,
    checkContext = true,
    minLevel = 'notice',
    logViolations = true,
    autoBlock = true
  } = options;

  return async (req, res, next) => {
    try {
      // 检查请求体中的消息内容
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return next();
      }

      // 检测敏感词
      const detectionResult = sensitiveWordService.detectSensitiveWords(message, {
        strictMode,
        checkContext,
        minLevel
      });

      // 记录检测结果
      if (detectionResult.detectedWords.length > 0) {
        if (logViolations) {
          logger.warn('敏感词检测结果:', {
            userId: req.user?.id,
            agentId: req.body?.agentId,
            message: message.substring(0, 100) + '...',
            detectionResult: {
              isBlocked: detectionResult.isBlocked,
              level: detectionResult.level,
              totalCount: detectionResult.totalCount,
              categories: detectionResult.categories,
              riskScore: detectionResult.riskScore,
              detectedWords: detectionResult.detectedWords.map(w => ({
                word: w.word,
                category: w.category,
                level: w.level,
                matchType: w.matchType
              }))
            }
          });
        }

        // 如果启用了自动阻止且内容被标记为阻止
        if (autoBlock && detectionResult.isBlocked) {
          return res.status(400).json({
            success: false,
            code: 'SENSITIVE_CONTENT_BLOCKED',
            message: '检测到违规内容，消息已被阻止',
            details: {
              level: detectionResult.level,
              categories: detectionResult.categories,
              riskScore: detectionResult.riskScore,
              blockedWords: detectionResult.detectedWords
                .filter(w => w.level === 'block')
                .map(w => w.word)
            }
          });
        }

        // 将检测结果添加到请求对象中，供后续处理使用
        req.sensitiveWordDetection = detectionResult;
      }

      next();
    } catch (error) {
      logger.error('敏感词检测中间件错误:', error);
      // 发生错误时继续处理，不阻止请求
      next();
    }
  };
}

/**
 * AI输出内容敏感词检测中间件
 * 专门用于检测AI生成的内容
 */
function aiOutputFilter(options = {}) {
  const {
    strictMode = true,  // AI输出使用更严格的模式
    checkContext = true,
    minLevel = 'notice',
    logViolations = true,
    autoBlock = true,
    replaceSensitiveWords = false,  // 是否替换敏感词
    replacementChar = '*'  // 替换字符
  } = options;

  return async (req, res, next) => {
    try {
      // 检查响应体中的AI输出内容
      const originalSend = res.json;
      
      res.json = function(data) {
        // 检查AI响应内容
        if (data && data.response && typeof data.response === 'string') {
          const detectionResult = sensitiveWordService.detectSensitiveWords(data.response, {
            strictMode,
            checkContext,
            minLevel
          });

          if (detectionResult.detectedWords.length > 0) {
            if (logViolations) {
              logger.warn('AI输出敏感词检测结果:', {
                userId: req.user?.id,
                agentId: req.body?.agentId,
                response: data.response.substring(0, 100) + '...',
                detectionResult: {
                  isBlocked: detectionResult.isBlocked,
                  level: detectionResult.level,
                  totalCount: detectionResult.totalCount,
                  categories: detectionResult.categories,
                  riskScore: detectionResult.riskScore
                }
              });
            }

            // 如果启用了自动阻止且内容被标记为阻止
            if (autoBlock && detectionResult.isBlocked) {
              // 替换为安全提示
              data.response = '[内容已被系统过滤，包含违规信息]';
              data.filtered = true;
              data.filterReason = 'sensitive_content';
              data.detectedWords = detectionResult.detectedWords
                .filter(w => w.level === 'block')
                .map(w => w.word);
            }
            // 如果启用了敏感词替换
            else if (replaceSensitiveWords) {
              let filteredResponse = data.response;
              detectionResult.detectedWords.forEach(detected => {
                const regex = new RegExp(detected.word, 'gi');
                filteredResponse = filteredResponse.replace(regex, 
                  replacementChar.repeat(detected.word.length)
                );
              });
              data.response = filteredResponse;
              data.filtered = true;
              data.filterReason = 'word_replacement';
            }

            // 添加检测信息到响应中
            data.sensitiveWordDetection = {
              level: detectionResult.level,
              categories: detectionResult.categories,
              riskScore: detectionResult.riskScore,
              totalCount: detectionResult.totalCount
            };
          }
        }

        // 调用原始的json方法
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('AI输出敏感词检测中间件错误:', error);
      next();
    }
  };
}

/**
 * 敏感词检测结果处理中间件
 * 用于在检测到敏感内容后执行相应的处理逻辑
 */
function sensitiveWordHandler(options = {}) {
  const {
    notifyAdmin = false,      // 是否通知管理员
    recordViolation = true,   // 是否记录违规记录
    userWarning = true        // 是否向用户发送警告
  } = options;

  return async (req, res, next) => {
    try {
      const detection = req.sensitiveWordDetection;
      
      if (detection && detection.detectedWords.length > 0) {
        // 记录违规记录
        if (recordViolation) {
          await recordViolationLog(req, detection);
        }

        // 通知管理员
        if (notifyAdmin) {
          await notifyAdminViolation(req, detection);
        }

        // 向用户发送警告
        if (userWarning && detection.level !== 'safe') {
          addWarningToResponse(res, detection);
        }
      }

      next();
    } catch (error) {
      logger.error('敏感词处理中间件错误:', error);
      next();
    }
  };
}

// 记录违规日志
async function recordViolationLog(req, detection) {
  try {
    // 这里可以集成数据库记录违规日志
    const violationLog = {
      userId: req.user?.id,
      agentId: req.body?.agentId,
      timestamp: new Date(),
      message: req.body?.message?.substring(0, 200),
      detection: detection,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    logger.info('违规内容记录:', violationLog);
    
    // TODO: 可以在这里添加数据库记录逻辑
    // await violationLogService.create(violationLog);
    
  } catch (error) {
    logger.error('记录违规日志失败:', error);
  }
}

// 通知管理员
async function notifyAdminViolation(req, detection) {
  try {
    // 这里可以集成通知系统
    const adminNotification = {
      type: 'sensitive_content_violation',
      severity: detection.level,
      userId: req.user?.id,
      agentId: req.body?.agentId,
      timestamp: new Date(),
      details: detection
    };

    logger.info('管理员通知:', adminNotification);
    
    // TODO: 可以在这里添加通知逻辑
    // await notificationService.notifyAdmins(adminNotification);
    
  } catch (error) {
    logger.error('通知管理员失败:', error);
  }
}

// 向响应中添加警告信息
function addWarningToResponse(res, detection) {
  const originalSend = res.json;
  
  res.json = function(data) {
    if (data && typeof data === 'object') {
      data.warnings = data.warnings || [];
      data.warnings.push({
        type: 'sensitive_content',
        level: detection.level,
        message: `检测到${detection.totalCount}个敏感内容`,
        categories: detection.categories,
        riskScore: detection.riskScore
      });
    }
    
    return originalSend.call(this, data);
  };
}

module.exports = {
  sensitiveWordFilter,
  aiOutputFilter,
  sensitiveWordHandler
};
