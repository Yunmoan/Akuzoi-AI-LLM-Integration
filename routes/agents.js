const express = require('express');
const llmService = require('../services/llmService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// 获取智能体列表（不包含system_prompt）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const agents = await llmService.getAgentsList();
    
    res.json({
      success: true,
      agents: agents
    });
  } catch (error) {
    logger.error('获取智能体列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取智能体列表失败'
    });
  }
});

// 获取智能体详情（不包含system_prompt）
router.get('/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await llmService.getAgent(agentId);
    
    // 移除system_prompt，确保不被泄露到前端
    const { system_prompt, ...agentInfo } = agent;
    
    res.json({
      success: true,
      agent: agentInfo
    });
  } catch (error) {
    logger.error('获取智能体详情失败:', error);
    
    if (error.message === '智能体不存在或已禁用') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '获取智能体详情失败'
    });
  }
});

// 获取用户与特定智能体的对话统计
router.get('/:agentId/conversations', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;
    
    const conversations = await llmService.getUserConversations(userId, agentId);
    
    res.json({
      success: true,
      conversations: conversations
    });
  } catch (error) {
    logger.error('获取对话统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取对话统计失败'
    });
  }
});

module.exports = router; 