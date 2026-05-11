const winston = require('winston');
const path = require('path');

// 创建日志目录
const logDir = path.join(__dirname, '../logs');

const safeStringify = (value) => {
  const seen = new WeakSet();
  try {
    return JSON.stringify(value, (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }

      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
          code: val.code
        };
      }

      return val;
    });
  } catch (error) {
    return `[Unserializable: ${error?.message || 'unknown'}]`;
  }
};

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
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
        winston.format.colorize(),
        winston.format.simple()
      )
}));

module.exports = logger;