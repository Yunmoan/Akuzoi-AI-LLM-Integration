require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs').promises;
const path = require('path');
const { initializeDatabase } = require('../config/database');
const { globalRateLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

// 导入路由
const authRoutes = require('../routes/auth');
const agentsRoutes = require('../routes/agents');
const chatRoutes = require('../routes/chat');
const adminRoutes = require('../routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化文件系统
async function initializeFileSystem() {
  try {
    // 确保 prompts 目录存在
    const promptsDir = path.join(__dirname, '../prompts');
    try {
      await fs.access(promptsDir);
      logger.info('prompts 目录已存在');
    } catch {
      await fs.mkdir(promptsDir, { recursive: true });
      logger.info('已创建 prompts 目录');
    }

    // 检查并创建 agents.json 文件
    const agentsPath = path.join(promptsDir, 'agents.json');
    try {
      await fs.access(agentsPath);
      logger.info('agents.json 文件已存在');
    } catch {
      // 创建默认的 agents.json 文件
      const defaultAgents = {
        "agents": [
          {
            "id": "general_assistant",
            "name": "通用助手",
            "description": "一个通用的AI助手，能够帮助用户解决各种问题",
            "avatar_url": "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=AI",
            "model": "gpt-3.5-turbo",
            "system_prompt": "你是一个有用的AI助手。请用中文回答用户的问题，提供准确、有帮助的信息。",
            "max_tokens": 2000,
            "temperature": 0.7,
            "enabled": true,
            "memory": {
              "max_messages": 20,
              "max_age_hours": 24,
              "enabled": true
            }
          },
          {
            "id": "creative_writer",
            "name": "创意写作助手",
            "description": "专门帮助用户进行创意写作的AI助手",
            "avatar_url": "https://via.placeholder.com/100x100/10B981/FFFFFF?text=✍",
            "model": "gpt-3.5-turbo",
            "system_prompt": "你是一个专业的创意写作助手。你擅长故事创作、诗歌写作、文案撰写等。请用中文与用户交流，激发他们的创作灵感。",
            "max_tokens": 3000,
            "temperature": 0.9,
            "enabled": true,
            "memory": {
              "max_messages": 15,
              "max_age_hours": 48,
              "enabled": true
            }
          }
        ]
      };
      
      await fs.writeFile(agentsPath, JSON.stringify(defaultAgents, null, 2), 'utf8');
      logger.info('已创建默认的 agents.json 文件');
    }
    
  } catch (error) {
    logger.error('文件系统初始化失败:', error);
    throw error;
  }
}

// 启动服务器
async function startServer() {
  try {
    // 初始化文件系统
    await initializeFileSystem();
    
    // 初始化数据库
    await initializeDatabase();
    
    // 启动Express服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器启动成功，监听端口: ${PORT}`);
      logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 配置代理信任 - 在生产环境中信任代理
if (process.env.NODE_ENV === 'production') {
  // 信任所有代理，包括Nginx
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  logger.info('已启用代理信任模式 - 信任所有本地和私有网络代理');
} else {
  // 开发环境也信任代理，便于测试
  app.set('trust proxy', true);
  logger.info('开发环境已启用代理信任模式');
}

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS配置 - 允许所有跨域请求
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 全局速率限制
app.use(globalRateLimiter);

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  logger.error('未处理的错误:', error);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : error.message
  });
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app; 