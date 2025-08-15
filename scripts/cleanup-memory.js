const memoryService = require('../services/memoryService');
const logger = require('../utils/logger');

async function cleanupExpiredMemory() {
  try {
    console.log('开始清理过期记忆...');
    await memoryService.cleanupExpiredMemory();
    console.log('过期记忆清理完成！');
  } catch (error) {
    console.error('清理过期记忆失败:', error);
    logger.error('清理过期记忆失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  require('dotenv').config();
  cleanupExpiredMemory()
    .then(() => {
      console.log('记忆清理任务完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('记忆清理任务失败:', error);
      process.exit(1);
    });
}

module.exports = { cleanupExpiredMemory }; 