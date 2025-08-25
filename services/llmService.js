const axios = require('axios');
const { redisClient } = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const memoryService = require('./memoryService');

class LLMService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.agents = null;
  }

  // 加载智能体配置
  async loadAgents() {
    try {
      if (!this.agents) {
        const agentsPath = path.join(__dirname, '../prompts/agents.json');
        const agentsData = await fs.readFile(agentsPath, 'utf8');
        this.agents = JSON.parse(agentsData);
      }
      return this.agents;
    } catch (error) {
      logger.error('加载智能体配置失败:', error);
      throw new Error('智能体配置加载失败');
    }
  }

  // 获取智能体列表（不包含system_prompt）
  async getAgentsList() {
    const agents = await this.loadAgents();
    return agents.agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar_url: agent.avatar_url,
      model: agent.model,
      max_tokens: agent.max_tokens,
      temperature: agent.temperature,
      enabled: agent.enabled,
      memory: agent.memory
    }));
  }

  // 获取特定智能体配置
  async getAgent(agentId) {
    const agents = await this.loadAgents();
    const agent = agents.agents.find(a => a.id === agentId && a.enabled);
    
    if (!agent) {
      throw new Error('智能体不存在或已禁用');
    }

    return agent;
  }

  // 发送消息到LLM
  async sendMessage(userId, agentId, message, sessionId = null) {
    try {
      // 获取智能体配置
      const agent = await this.getAgent(agentId);
      
      // 获取或创建会话
      const session = await memoryService.getOrCreateSession(userId, agentId, sessionId);
      
      // 获取智能体记忆（根据配置限制）
      // 注意：这里获取的是之前保存的记忆，不包括当前消息
      // 第一次发送消息时，memory为空数组（新会话）
      // 第二次发送消息时，memory包含第一次的对话记录
      const memory = await memoryService.getAgentMemory(userId, agentId, session.session_id);
      
      // 调试日志
      console.log('🔍 记忆调试信息:');
      console.log('  - userId:', userId);
      console.log('  - agentId:', agentId);
      console.log('  - sessionId:', session.session_id);
      console.log('  - 获取到的记忆条数:', memory ? memory.length : 0);
      if (memory && memory.length > 0) {
        console.log('  - 记忆内容:', memory);
      }
      
      // 构建消息数组
      const messages = [
        { role: 'system', content: agent.system_prompt }
      ];

      // 添加记忆中的对话历史（按时间顺序）
      if (memory && memory.length > 0) {
        memory.forEach(record => {
          messages.push({ role: 'user', content: record.message });
          messages.push({ role: 'assistant', content: record.response });
        });
      }

      // 添加当前消息
      messages.push({ role: 'user', content: message });
      
      // 调试日志
      console.log('  - 发送给LLM的消息数组:', messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })));

      // 调用OpenAI API
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: agent.model,
          messages: messages,
          max_tokens: agent.max_tokens,
          temperature: agent.temperature,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage.total_tokens;

      // 保存消息到记忆
      await memoryService.saveMessage(userId, agentId, session.session_id, message, aiResponse, tokensUsed);

      return {
        success: true,
        response: aiResponse,
        session_id: session.session_id,
        tokens_used: tokensUsed
      };

    } catch (error) {
      logger.error('LLM服务调用失败:', error);
      
      if (error.response?.status === 401) {
        throw new Error('API密钥无效');
      } else if (error.response?.status === 429) {
        throw new Error('API调用频率超限');
      } else if (error.response?.status === 400) {
        throw new Error('请求参数错误');
      } else {
        throw new Error('AI服务暂时不可用，请稍后再试');
      }
    }
  }

  // 获取智能体记忆（已移至memoryService）
  async getAgentMemory(userId, agentId, sessionId) {
    return await memoryService.getAgentMemory(userId, agentId, sessionId);
  }

  // 获取用户会话列表（已移至memoryService）
  async getUserSessions(userId, agentId) {
    return await memoryService.getUserSessions(userId, agentId);
  }
}

module.exports = new LLMService(); 