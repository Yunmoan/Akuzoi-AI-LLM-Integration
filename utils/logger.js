const winston = require('winston');
const path = require('path');

// 创建日志目录
const logDir = path.join(__dirname, '../logs');

const SENSITIVE_KEY_PATTERN = /(authorization|api[-_]?key|token|secret|password|passwd|pwd|cookie|set-cookie|session|sessionid|access[-_]?token|refresh[-_]?token|private[-_]?key|credential|client[-_]?secret)/i;
const BEARER_TOKEN_PATTERN = /Bearer\s+[^\s,;}\]]+/gi;
const LONG_SECRET_PATTERN = /\b(sk-[A-Za-z0-9_-]{8,}|[A-Za-z0-9_=-]{32,})\b/g;

const redactString = (value) => value
  .replace(BEARER_TOKEN_PATTERN, 'Bearer [REDACTED]')
  .replace(LONG_SECRET_PATTERN, '[REDACTED]');

const sanitizeForLog = (value, seen = new WeakSet(), key = '') => {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message || ''),
      stack: redactString(value.stack || ''),
      code: value.code
    };
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, seen));
  }

  return Object.keys(value).reduce((result, currentKey) => {
    result[currentKey] = sanitizeForLog(value[currentKey], seen, currentKey);
    return result;
  }, {});
};

const safeStringify = (value) => {
  try {
    return JSON.stringify(sanitizeForLog(value));
  } catch (error) {
    return `[Unserializable: ${redactString(error?.message || 'unknown')}]`;
  }
};

const redactFormat = winston.format((info) => sanitizeForLog(info));

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  redactFormat(),
  winston.format.json()
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'akuzoi-ai-api' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 在所有环境下都输出到控制台，但生产环境使用不同的格式
logger.add(new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' 
    ? winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const extra = Object.keys(meta).length ? safeStringify(meta) : '';
          return `${timestamp} [${level.toUpperCase()}] ${service}: ${message} ${extra}`.trim();
        })
      )
    : winston.format.combine(
        redactFormat(),
        winston.format.colorize(),
        winston.format.simple()
      )
}));

module.exports = logger;