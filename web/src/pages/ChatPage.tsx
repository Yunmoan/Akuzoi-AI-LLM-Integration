import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { agentsAPI, chatAPI, authAPI } from '@/lib/api';
import { evaluatePromptLeakage, getPromptGuardHint } from '@/lib/promptGuard';
import PromptGuardDialog from '@/components/PromptGuardDialog';
import { Send, AlertCircle, Heart, X, Plus } from 'lucide-react';
import { useToast } from '@/components/ToastManager';

// 导入图片
import vxQRCode from '../vx.png';
import zfbQRCode from '../zfb.png';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  model: string;
  enabled: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  email: string;
}

interface Conversation {
  id: number;
  agent_id: string;
  session_id: string;
  title: string;
  message_count: number;
  total_tokens: number;
  last_message_at: string | null;
  created_at: string;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 使用localStorage持久化每个智能体的会话状态
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userStats, setUserStats] = useState<{
    daily_message_limit: number;
    total_messages_sent: number;
    today_messages_sent: number;
    remaining_messages: number;
  } | null>(null);
  
  // 赞助模态框状态
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showClearMemoryConfirm, setShowClearMemoryConfirm] = useState(false);
  const [showConversationSwitch, setShowConversationSwitch] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [promptGuardOpen, setPromptGuardOpen] = useState(false);
  const [promptGuardMsg, setPromptGuardMsg] = useState('');
  const [promptGuardDetails, setPromptGuardDetails] = useState<string[]>([]);
  
  // 自动滚动到底部的ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError, showWarning, showSuccess } = useToast();

  // 持久化sessionId到localStorage（按智能体ID）
  const updateSessionId = (newSessionId: string | null, agentId: string) => {
    setSessionId(newSessionId);
    if (newSessionId) {
      localStorage.setItem(`chat_session_id_${agentId}`, newSessionId);
    } else {
      localStorage.removeItem(`chat_session_id_${agentId}`);
    }
  };

  // 持久化智能体ID到localStorage
  const updateCurrentAgentId = (newAgentId: string | null) => {
    setCurrentAgentId(newAgentId);
    if (newAgentId) {
      localStorage.setItem('chat_agent_id', newAgentId);
    } else {
      localStorage.removeItem('chat_agent_id');
    }
  };

  // 获取智能体的会话ID
  const getAgentSessionId = (agentId: string): string | null => {
    const saved = localStorage.getItem(`chat_session_id_${agentId}`);
    return saved && saved !== 'null' && saved !== 'undefined' ? saved : null;
  };

  // 获取智能体的消息历史
  const getAgentMessages = (agentId: string): Message[] => {
    const saved = localStorage.getItem(`chat_messages_${agentId}`);
    if (saved) {
      const messages = JSON.parse(saved);
      // 确保timestamp是Date对象
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [];
  };

  // 保存智能体的消息历史
  const saveAgentMessages = (agentId: string, messages: Message[]) => {
    localStorage.setItem(`chat_messages_${agentId}`, JSON.stringify(messages));
  };

  useEffect(() => {
    loadAgents();
    loadUserInfo();
  }, []);

  // 监控sessionId变化
  useEffect(() => {
    console.log('🔍 sessionId状态变化:', sessionId);
  }, [sessionId]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 定期刷新用户统计信息
  useEffect(() => {
    if (userInfo?.id) {
      const interval = setInterval(async () => {
        try {
          const statsResponse = await authAPI.getUserStats();
          console.log('🔍 定期刷新用户统计信息:', statsResponse.data);
          
          // 验证数据是否合理
          const data = statsResponse.data.data;
          console.log('🔍 定期刷新验证数据:', {
            today_messages_sent: data.today_messages_sent,
            total_messages_sent: data.total_messages_sent,
            remaining_messages: data.remaining_messages,
            daily_message_limit: data.daily_message_limit
          });
          
          setUserStats(data);
        } catch (error: any) {
          console.error('❌ 定期刷新用户统计信息失败:', error);
          console.error('❌ 错误详情:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
      }, 30000); // 每30秒刷新一次

      return () => clearInterval(interval);
    }
  }, [userInfo?.id]);

  const loadUserInfo = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUserInfo(response.data.user);
      
      // 加载用户统计信息
        try {
        const statsResponse = await authAPI.getUserStats();
        console.log('🔍 前端获取到的用户统计信息:', statsResponse.data);
          setUserStats(statsResponse.data.data);
        } catch (error: any) {
          console.error('❌ 获取用户统计信息失败:', error);
          console.error('❌ 错误详情:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers
            }
          });
        // 如果加载失败，使用默认值
        setUserStats({
          daily_message_limit: 100,
          total_messages_sent: 0,
          today_messages_sent: 0,
          remaining_messages: 100
        });
      }
    } catch (error: any) {
      console.error('Failed to load user info:', error);
      
      // 处理特定的错误情况
      if (error.response?.status === 403) {
        if (error.response?.data?.message?.includes('封禁')) {
          showError('账户已被封禁', `您的账户已被封禁，原因：${error.response.data.ban_reason || '未知原因'}`);
        } else if (error.response?.data?.message?.includes('实名认证')) {
          showError('需要实名认证', '请先完成实名认证后再使用平台功能');
        } else {
          showError('访问被拒绝', '您没有权限访问此功能');
        }
      } else if (error.response?.status === 401) {
        showError('登录已过期', '请重新登录');
        // 清除token并重定向到登录页
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        showError('加载用户信息失败', '无法获取用户信息，请重试');
      }
    }
  };

  const loadAgents = async () => {
    try {
      const response = await agentsAPI.getAgents();
      const agentsList = response.data.agents;
      setAgents(agentsList);
      if (agentsList.length > 0) {
        const firstAgent = agentsList[0];
        setSelectedAgent(firstAgent);
        setCurrentAgentId(firstAgent.id);
        
        // 加载第一个智能体的状态
        const savedSessionId = getAgentSessionId(firstAgent.id);
        const savedMessages = getAgentMessages(firstAgent.id);
        
        setSessionId(savedSessionId);
        setMessages(savedMessages);
        
        console.log('🔍 初始加载智能体状态:', {
          agentId: firstAgent.id,
          sessionId: savedSessionId,
          messageCount: savedMessages.length
        });
      }
    } catch (error: any) {
      console.error('Failed to load agents:', error);
      
      // 处理特定的错误情况
      if (error.response?.status === 403) {
        showError('访问被拒绝', '您没有权限访问智能体列表');
      } else if (error.response?.status === 401) {
        showError('登录已过期', '请重新登录');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        showError('加载智能体失败', '无法获取智能体列表，请重试');
      }
    }
  };

  // 当选择智能体改变时，加载对应智能体的会话状态
  const handleAgentChange = (agent: Agent) => {
    // 检查智能体是否被禁用
    if (!agent.enabled) {
      console.log('🔍 尝试选择已禁用的智能体:', agent.id);
      return;
    }
    
    console.log('🔍 智能体切换:', { 
      from: selectedAgent?.id, 
      to: agent.id, 
      oldSessionId: sessionId 
    });
    
    // 保存当前智能体的状态
    if (selectedAgent && selectedAgent.id !== agent.id) {
      saveAgentMessages(selectedAgent.id, messages);
      if (sessionId) {
        updateSessionId(sessionId, selectedAgent.id);
      }
    }
    
    // 切换到新智能体
    setSelectedAgent(agent);
    updateCurrentAgentId(agent.id);
    
    // 加载新智能体的状态
    const newSessionId = getAgentSessionId(agent.id);
    const newMessages = getAgentMessages(agent.id);
    
    setSessionId(newSessionId);
    setMessages(newMessages);
    
    // 如果对话切换弹窗是打开的，重新加载对话列表
    if (showConversationSwitch) {
      loadConversations();
    }
    
    console.log('🔍 智能体切换完成:', {
      newAgentId: agent.id,
      newSessionId: newSessionId,
      newMessageCount: newMessages.length
    });
  };

  const clearMemory = async () => {
    if (!selectedAgent) return;
    
    // 检查智能体是否被禁用
    if (!selectedAgent.enabled) {
      showError('智能体已禁用', '当前智能体已被禁用，无法清除记忆');
      return;
    }
    
    try {
      // 创建新对话而不是删除数据
      const response = await chatAPI.createNewConversation(selectedAgent.id);
      const newSessionId = response.data.session_id;
      
      setMessages([]);
      updateSessionId(newSessionId, selectedAgent.id);
      saveAgentMessages(selectedAgent.id, []);
      showSuccess('新对话已创建', '已创建新的对话，之前的对话记录已保存');
      setShowClearMemoryConfirm(false);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      showError('创建失败', '创建新对话失败，请重试');
    }
  };

  // 获取对话列表
  const loadConversations = async () => {
    if (!selectedAgent) return;
    
    setLoadingConversations(true);
    try {
      const response = await chatAPI.getSessions(selectedAgent.id);
      // 过滤掉消息数为0的会话
      const filteredSessions = (response.data.sessions || []).filter((session: any) => 
        session.message_count > 0
      );
      setConversations(filteredSessions);
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      showError('加载失败', '无法加载对话列表，请重试');
    } finally {
      setLoadingConversations(false);
    }
  };

  // 打开对话切换弹窗时自动加载对话列表
  const handleOpenConversationSwitch = () => {
    setShowConversationSwitch(true);
    loadConversations();
  };

  // 清理用户消息中的增强信息，只保留实际输入内容
  const cleanUserMessage = (message: string): string => {
    // 匹配 [时间: ...] [用户: ...] 格式的增强信息
    const enhancedPattern = /^\[时间: [^\]]+\] \[用户: [^\]]+\]\n?/;
    return message.replace(enhancedPattern, '').trim();
  };

  // 切换对话
  const switchConversation = async (conversation: Conversation) => {
    if (!selectedAgent) return;
    
    try {
      // 保存当前智能体的状态
      if (selectedAgent) {
        saveAgentMessages(selectedAgent.id, messages);
        if (sessionId) {
          updateSessionId(sessionId, selectedAgent.id);
        }
      }
      
      // 加载选中的对话历史
      const response = await chatAPI.getSessionHistory(conversation.session_id, selectedAgent.id);
      const history = response.data.history || [];
      
      // 转换历史记录为消息格式
      const conversationMessages: Message[] = [];
      history.forEach((record: any) => {
        if (record.message) {
          // 清理用户消息中的增强信息
          const cleanMessage = cleanUserMessage(record.message);
          conversationMessages.push({
            role: 'user',
            content: cleanMessage,
            timestamp: new Date(record.created_at)
          });
        }
        if (record.response) {
          // 将智能体的多行回复分割成多个独立的消息
          const responseLines = record.response.split('\n').filter((line: string) => line.trim());
          if (responseLines.length > 1) {
            // 多行回复，分割成多个消息
            responseLines.forEach((line: string) => {
              conversationMessages.push({
                role: 'assistant',
                content: line.trim(),
                timestamp: new Date(record.created_at)
              });
            });
          } else {
            // 单行回复，保持原样
            conversationMessages.push({
              role: 'assistant',
              content: record.response,
              timestamp: new Date(record.created_at)
            });
          }
        }
      });
      
      // 更新状态
      setMessages(conversationMessages);
      updateSessionId(conversation.session_id, selectedAgent.id);
      saveAgentMessages(selectedAgent.id, conversationMessages);
      
      showSuccess('对话已切换', `已切换到对话：${conversation.title || '未命名对话'}`);
      setShowConversationSwitch(false);
      
      // 滚动到消息列表顶部，让用户看到切换后的内容
      setTimeout(() => {
        const messagesContainer = document.querySelector('.scroll-area');
        if (messagesContainer) {
          messagesContainer.scrollTop = 0;
        }
      }, 100);
    } catch (error: any) {
      console.error('Failed to switch conversation:', error);
      showError('切换失败', '无法切换到选中的对话，请重试');
    }
  };




  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent || isLoading) return;
    // 提示词泄露/越狱前置检测
    const guard = evaluatePromptLeakage(inputMessage);
    if (guard.isBlocked) {
      const hint = getPromptGuardHint(guard);
      setPromptGuardMsg(
        `${hint}\n\n为保障平台与模型安全，禁止套取系统提示词、越权探测策略或尝试越狱。请修改您的输入后再试。`
      );
      setPromptGuardDetails(guard.matches);
      setPromptGuardOpen(true);
      return;
    }

    // 检查智能体是否被禁用
    if (!selectedAgent.enabled) {
      showError('智能体已禁用', '当前智能体已被禁用，无法发送消息');
      return;
    }

    // 检查剩余次数
    if (userStats && userStats.remaining_messages <= 0) {
      showError('聊天次数已用完', '今日聊天次数已用完，请明天再试！');
      return;
    }

    console.log('🔍 前端发送消息调试:', { 
      currentSessionId: sessionId, 
      agentId: selectedAgent.id, 
      message: inputMessage 
    });

    // 获取当前时间和用户信息
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const userNickname = userInfo?.nickname || userInfo?.username || '用户';
    
    // 构建包含时间和用户信息的消息
    const enhancedMessage = `[时间: ${timeString}] [用户: ${userNickname}]\n${inputMessage}`;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage, // 显示给用户的消息不包含额外信息
      timestamp: now,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (selectedAgent) {
      saveAgentMessages(selectedAgent.id, newMessages);
    }
    setInputMessage('');
    setIsLoading(true);

    try {
      const requestData = {
        agentId: selectedAgent.id,
        message: enhancedMessage, // 发送给AI的消息包含时间和用户信息
        sessionId: sessionId || undefined,
      };
      
      console.log('🔍 前端API调用参数:', requestData);
      
      const response = await chatAPI.sendMessage(requestData);

      console.log('🔍 后端响应:', { 
        response: response.data.response.substring(0, 50) + '...',
        newSessionId: response.data.session_id,
        oldSessionId: sessionId
      });

      // 处理智能体的回复，如果是多行则分割成多个消息
      const responseContent = response.data.response;
      const responseLines = responseContent.split('\n').filter((line: string) => line.trim());
      
      let finalMessages = [...newMessages];
      
      if (responseLines.length > 1) {
        // 多行回复，分割成多个消息
        responseLines.forEach((line: string) => {
          const assistantMessage: Message = {
            role: 'assistant',
            content: line.trim(),
            timestamp: new Date(),
          };
          finalMessages.push(assistantMessage);
        });
      } else {
        // 单行回复，保持原样
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        };
        finalMessages.push(assistantMessage);
      }
      
      setMessages(finalMessages);
      if (selectedAgent) {
        saveAgentMessages(selectedAgent.id, finalMessages);
      }
      
      // 保存sessionId用于后续对话
      if (!sessionId) {
        console.log('🔍 设置新的sessionId:', response.data.session_id);
        updateSessionId(response.data.session_id, selectedAgent.id);
      } else {
        console.log('🔍 保持现有sessionId:', sessionId);
      }

      // 更新用户统计信息
      if (userStats) {
        setUserStats(prev => prev ? {
          ...prev,
          today_messages_sent: prev.today_messages_sent + 1,
          total_messages_sent: prev.total_messages_sent + 1,
          remaining_messages: Math.max(0, prev.remaining_messages - 1)
        } : null);
      }
      
      // 重新获取最新的用户统计信息，确保与后端同步
      try {
        const statsResponse = await authAPI.getUserStats();
        console.log('🔍 发送消息后刷新用户统计信息:', statsResponse.data);
        setUserStats(statsResponse.data.data);
        
        // 验证数据是否正确更新
        console.log('🔍 验证更新后的数据:', {
          today_messages_sent: statsResponse.data.data.today_messages_sent,
          total_messages_sent: statsResponse.data.data.total_messages_sent,
          remaining_messages: statsResponse.data.data.remaining_messages
        });
      } catch (error: any) {
        console.error('❌ 发送消息后刷新用户统计信息失败:', error);
        console.error('❌ 错误详情:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // 处理不同类型的错误
      if (error.response?.status === 429) {
        // 达到限制
        if (error.response?.data?.message?.includes('每日消息限制') || 
            error.response?.data?.message?.includes('今日消息数量已达上限')) {
          showError('达到每日限制', error.response.data.message);
          
          // 如果有限制信息，更新统计显示
          if (error.response?.data?.limit_info) {
            setUserStats(prev => prev ? {
              ...prev,
              today_messages_sent: error.response.data.limit_info.current_count,
              remaining_messages: error.response.data.limit_info.remaining
            } : null);
          }
        } else if (error.response?.data?.message?.includes('过于频繁')) {
          showWarning('发送过于频繁', error.response.data.message);
        } else {
          showError('请求过于频繁', error.response.data.message);
        }
      } else if (error.response?.status === 400) {
        // 400 场景细分：敏感词拦截 vs 其他参数错误
        if (error.response?.data?.code === 'SENSITIVE_CONTENT_BLOCKED') {
          const detail = error.response?.data?.details;
          const blockedWords = detail?.blockedWords?.join('、');
          const hint = blockedWords ? `包含敏感词：${blockedWords}` : undefined;
          showWarning('内容被拦截', hint || (error.response?.data?.message || '检测到违规内容，消息已被阻止'));
          // 可继续输入发送，不做额外限制
        } else {
          showError('参数错误', error.response.data.message || '请求参数有误');
        }
      } else if (error.response?.status === 401) {
        // 认证错误
        showError('认证失败', '请重新登录');
      } else if (error.code === 'ECONNABORTED') {
        // 超时
        showWarning('请求超时', '生成响应超时，请稍后重试或简化问题');
      } else if (error.response?.status === 500) {
        // 服务器错误
        showError('服务器错误', error.response.data.message || '服务器暂时不可用，请稍后再试');
      } else {
        // 其他错误
        showError('发送失败', error.response?.data?.message || '发送消息失败，请重试');
      }
      
      // 对于网络错误或超时，不强制移除用户消息，避免误删
      if (error.code !== 'ECONNABORTED' && !error.isAxiosError) {
        setMessages(prev => prev.slice(0, -1));
        if (selectedAgent) {
          const updatedMessages = messages;
          saveAgentMessages(selectedAgent.id, updatedMessages);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-8xl mx-auto ">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧边栏 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 智能体选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">选择智能体</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      !agent.enabled || isLoading
                        ? 'bg-gray-100 cursor-not-allowed opacity-50'
                        : selectedAgent?.id === agent.id
                        ? 'bg-blue-100 border-blue-300 border shadow-md cursor-pointer hover:scale-101'
                        : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm cursor-pointer hover:scale-101'
                    }`}
                    onClick={() => agent.enabled && !isLoading && handleAgentChange(agent)}
                  >
                                      <div className="flex items-center space-x-2">
                    {agent.avatar_url ? (
                      <img 
                        src={agent.avatar_url} 
                        alt={agent.name}
                          className={`w-8 h-8 rounded-full object-cover border-2 ${
                            !agent.enabled ? 'border-gray-300' : 'border-gray-200'
                          }`}
                        onError={(e) => {
                          // 如果头像加载失败，显示文字头像
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        agent.avatar_url ? 'hidden' : ''
                      } ${
                        !agent.enabled ? 'bg-gray-400' : 'bg-blue-600'
                      }`}>
                      <span className="text-white text-sm font-bold">
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-sm truncate ${
                          !agent.enabled ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {agent.name}
                          {!agent.enabled && <span className="ml-2 text-xs text-gray-400"></span>}
                        </h3>
                        {/* {agent.enabled && (
                          <p className="text-xs text-gray-600 truncate">{agent.description}</p>
                        )} */}
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 赞助按钮 */}
          <Card>
            <CardContent className="pt-4">
              <Button
                onClick={() => setShowSponsorModal(true)}
                variant="outline"
                className="w-full text-pink-600 hover:text-pink-700 hover:bg-pink-50 border-pink-200 transition-all duration-200 hover:scale-101 hover:shadow-md group"
              >
                <Heart className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                赞助我们
              </Button>
            </CardContent>
          </Card>

          {/* 用户统计信息 */}
          {userStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                
                  聊天限制
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className={`text-center p-2 rounded transition-all duration-200 hover:scale-101 ${
                    userStats.remaining_messages <= 10 
                      ? 'bg-red-50 border border-red-200' 
                      : userStats.remaining_messages <= 30 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className={`text-lg font-bold ${
                      userStats.remaining_messages <= 10 
                        ? 'text-red-600' 
                        : userStats.remaining_messages <= 30 
                        ? 'text-yellow-600' 
                        : 'text-blue-600'
                    }`}>
                      {userStats.remaining_messages}
                    </div>
                    <div className="text-xs text-gray-600">剩余次数</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded border border-green-200 transition-all duration-200 hover:scale-105">
                    <div className="text-lg font-bold text-green-600">
                      {userStats.today_messages_sent}
                    </div>
                    <div className="text-xs text-gray-600">今日已用</div>
                  </div>
                </div>
                
                {/* 进度条 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>使用进度</span>
                    <span>{Math.round((userStats.today_messages_sent / userStats.daily_message_limit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        userStats.remaining_messages <= 10 
                          ? 'bg-red-500' 
                          : userStats.remaining_messages <= 30 
                          ? 'bg-yellow-500' 
                          : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${Math.min((userStats.today_messages_sent / userStats.daily_message_limit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* 详细信息 */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>每日限制:</span>
                    <span className="font-medium">{userStats.daily_message_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>总调用次数:</span>
                    <span className="font-medium">{userStats.total_messages_sent}</span>
                  </div>
                </div>

                {/* 调试按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const statsResponse = await authAPI.getUserStats();
                      console.log('🔍 手动刷新用户统计信息:', statsResponse.data);
                      setUserStats(statsResponse.data.data);
                    } catch (error: any) {
                      console.error('❌ 手动刷新失败:', error);
                    }
                  }}
                  className="w-full"
                >
                  手动刷新统计
                </Button>

                {/* 警告提示 */}
                {userStats.remaining_messages <= 10 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    ⚠️ 剩余次数不足，请谨慎使用
                  </div>
                )}
                {userStats.remaining_messages <= 30 && userStats.remaining_messages > 10 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    ⚠️ 剩余次数较少，请注意使用
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 对话管理 */}
          {selectedAgent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">对话管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleOpenConversationSwitch}
                    variant="outline"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 hover:shadow-md group"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    切换对话
                  </Button>
                  <Button
                    onClick={() => setShowClearMemoryConfirm(true)}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-md group"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新对话
                  </Button>
                </div>
                
                {/* 调试信息 */}
                <div className="text-xs text-gray-500 space-y-1">
                  
                  <div className="">
                    <div>记忆的消息数: {messages.length}</div>
                    <div>智能体: {selectedAgent?.name || '未设置'} ({currentAgentId || '未设置'})</div>
                    <div>会话ID: {sessionId || '新会话'}</div>
                    
                    
                    {/* <div>本地存储: {selectedAgent ? `chat_session_id_${selectedAgent.id}` : 'N/A'}</div> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* 版权信息 */}
          

         
               
          
        
        </div>

        {/* 聊天主区域 */}
        <div className="lg:col-span-3">
          <Card className="h-[700px] flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle>
                {selectedAgent ? `与 Akuzoi AI ${selectedAgent.name} 对话` : '选择智能体开始对话'}
              </CardTitle>
              {selectedAgent && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedAgent.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    <span>会话ID: {sessionId || '新会话'}</span>
                    <span className="ml-4">消息数: {messages.length}</span>
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
              {/* 消息列表 */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    来聊天吧~
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                    >
                      {message.role === 'assistant' && selectedAgent && (
                        <div className="flex-shrink-0">
                          {selectedAgent.avatar_url ? (
                            <img 
                              src={selectedAgent.avatar_url} 
                              alt={selectedAgent.name}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ${selectedAgent.avatar_url ? 'hidden' : ''}`}>
                            <span className="text-white text-sm font-bold">
                              {selectedAgent.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 break-words duration-200 hover:shadow-md ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className={`flex items-center gap-2 mb-1 ${
                          message.role === 'user' ? 'justify-end' : ''
                        }`}>
                          {message.role !== 'user' ? (
                            <span className="text-sm font-medium">{selectedAgent?.name}</span>
                          ) : (
                            <span className="text-sm font-medium">{userInfo?.nickname}</span>
                          )}
                        </div>
                        
                        <div className={`whitespace-pre-wrap break-words overflow-hidden ${
                          message.role === 'user' ? 'text-right' : ''
                        }`}>{message.content}</div>
                        <div className={`text-xs opacity-70 mt-1 ${
                          message.role === 'user' ? 'text-right' : ''
                        }`}>
                          {message.timestamp instanceof Date 
                            ? message.timestamp.toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : new Date(message.timestamp).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                        </div>
                      </div>
                      
                      {/* {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )} */}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start items-end gap-2">
                    {selectedAgent && (
                      <div className="flex-shrink-0">
                        {selectedAgent.avatar_url ? (
                          <img 
                            src={selectedAgent.avatar_url} 
                            alt={selectedAgent.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {selectedAgent.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-muted rounded-lg px-4 py-2">
                    <div className={`flex items-center gap-2 mb-1`}>
                            <span className="text-sm font-medium">{selectedAgent?.name}</span>
                        </div>
                      <div className="flex items-center gap-2">
                        
                        <span className="text-sm">正在输入文本</span>
                        <div className="flex space-x-1">
                          <div className="  animate-bounce">.</div>
                          <div className=" animate-bounce" style={{animationDelay: '0.1s'}}>.</div>
                          <div className=" animate-bounce" style={{animationDelay: '0.2s'}}>.</div>
                        </div>
                      </div>
                      
                        {/* <div className={`text-xs opacity-70 mt-1`}>
                          {new Date().toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            }
                        </div> */}
                    </div>
                  </div>
                )}
                {/* 自动滚动到底部的元素 */}
                <div ref={messagesEndRef} />
              </div>
              </ScrollArea>

              {/* 输入区域 */}
              <div className="flex flex-col gap-2 flex-shrink-0 p-4 border-t bg-background">
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 800) {
                          setInputMessage(value);
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="输入您的消息... (最多800字符)"
                      disabled={!selectedAgent || isLoading}
                      className="min-w-0 pr-16"
                      maxLength={800}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      {inputMessage.length}/800
                    </div>
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || !selectedAgent || isLoading || inputMessage.length > 800}
                    className="flex-shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {inputMessage.length > 750 && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>接近字符限制 ({inputMessage.length}/800)</span>
                  </div>
                )}
                {/* {userStats && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-gray-500">
                      剩余聊天次数: <span className={`font-medium ${
                        userStats.remaining_messages <= 10 
                          ? 'text-red-600' 
                          : userStats.remaining_messages <= 30 
                          ? 'text-yellow-600' 
                          : 'text-blue-600'
                      }`}>{userStats.remaining_messages}</span>
                    </div>
                    {userStats.remaining_messages <= 10 && (
                      <div className="text-red-600">
                        ⚠️ 次数不足
                      </div>
                    )}
                  </div>
                )} */}
              </div>
            </CardContent>
          </Card>
          <div className="text-xs text-gray-500 space-y-1 text-left pt-2">
            <div className="pt-1 transition-all duration-300 hover:text-gray-700">
                <div>请注意：内容由大语言模型生成，请注意甄别。<br/>您与 Akuzoi AI 的对话内容将被保存并用于训练、研究用途，非管理员没有权限访问您的对话内容，如需删除请联系管理员。</div>
                <div>阿库佐伊人工智能 LLM 集成服务 <br/>Powered by Akuzoi AI<br/>Beta v1.8.0 <br/><br/>至远光辉信息技术（天津）有限公司<br/>&copy; 2025 ZGIT Network. All rights reserved. </div>
        </div>
      </div>
          {/* <div className="text-xs text-gray-500 pt-2 text-center">
                  
            
                  
          </div> */}
        </div>
      </div>

      {/* 清除记忆确认模态框 */}
      {showClearMemoryConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">创建新对话</h3>
              <button
                onClick={() => setShowClearMemoryConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 hover:rotate-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              确定要创建与 <strong>{selectedAgent?.name}</strong> 的新对话吗？{selectedAgent?.name} 的记忆将被清除，并开始新的对话过程。另外无法继续之前的对话。<br/><br/>* 您的对话将被保存并用于训练、研究用途，非管理员没有权限访问您的对话内容。
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowClearMemoryConfirm(false)}
                variant="outline"
                className="flex-1 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                取消
              </Button>
              <Button
                onClick={clearMemory}
                className="flex-1 bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                创建新对话
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 赞助模态框 */}
      {showSponsorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">赞助我们</h3>
              <button
                onClick={() => setShowSponsorModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 hover:rotate-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                感谢您对阿库佐伊人工智能的支持！您的赞助将帮助我们持续改进服务。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 mb-2">微信支付</h4>
                                      <img 
                      src={vxQRCode} 
                      alt="微信支付二维码"
                      width="300"
                      className="mx-auto mb-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                    />
                  <p className="text-xs text-gray-600">扫描二维码进行赞助</p>
                </div>
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 mb-2">支付宝</h4>
                                      <img 
                      src={zfbQRCode} 
                      alt="支付宝二维码"
                      width="200"
                      className="mx-auto mb-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                    />
                  <p className="text-xs text-gray-600">扫描二维码进行赞助</p>
                </div>
              </div>
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  您的支持是我们前进的动力 ❤️
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对话切换弹窗 */}
      {showConversationSwitch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">切换对话</h3>
                {selectedAgent && (
                  <p className="text-sm text-gray-600 mt-1">
                    智能体: {selectedAgent.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowConversationSwitch(false)}
                className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 hover:rotate-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <Button
                onClick={loadConversations}
                disabled={loadingConversations}
                className="w-full"
                variant="outline"
              >
                {loadingConversations ? '加载中...' : '刷新对话列表'}
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loadingConversations ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>正在加载对话列表...</span>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  暂无对话记录
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.session_id}
                    className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      conversation.session_id === sessionId
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {conversation.title || '未命名对话'}
                        </h4>
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div>消息数: {conversation.message_count || 0}</div>
                          <div>最后消息: {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString('zh-CN') : '无'}</div>
                          <div>创建时间: {new Date(conversation.created_at).toLocaleString('zh-CN')}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {conversation.session_id === sessionId && (
                          <span className="text-xs text-blue-600 font-medium">当前对话</span>
                        )}
                        <Button
                          onClick={() => switchConversation(conversation)}
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          切换
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                点击"切换"按钮可以切换到选中的对话
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提示词防护弹窗 */}
      <PromptGuardDialog
        open={promptGuardOpen}
        onClose={() => setPromptGuardOpen(false)}
        title="安全警告"
        message={promptGuardMsg}
        details={promptGuardDetails}
      />


    </div>
  );
} 