import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { agentsAPI, chatAPI, authAPI, adminAPI } from '@/lib/api';
import { Send, User, Trash2, AlertCircle } from 'lucide-react';

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
  
  // 自动滚动到底部的ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const loadUserInfo = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUserInfo(response.data.user);
      
      // 加载用户统计信息
      if (response.data.user?.id) {
        try {
          const statsResponse = await adminAPI.getUserStats(response.data.user.id);
          setUserStats(statsResponse.data.data);
        } catch (error) {
          console.error('Failed to load user stats:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
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
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  // 当选择智能体改变时，加载对应智能体的会话状态
  const handleAgentChange = (agent: Agent) => {
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
    
    console.log('🔍 智能体切换完成:', {
      newAgentId: agent.id,
      newSessionId: newSessionId,
      newMessageCount: newMessages.length
    });
  };

  const clearMemory = async () => {
    if (!selectedAgent) return;
    
    try {
      await chatAPI.clearAgentConversations(selectedAgent.id);
      setMessages([]);
      updateSessionId(null, selectedAgent.id);
      saveAgentMessages(selectedAgent.id, []);
      alert('记忆已清除！');
    } catch (error) {
      console.error('Failed to clear memory:', error);
      alert('清除记忆失败，请重试');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent || isLoading) return;

    // 检查剩余次数
    if (userStats && userStats.remaining_messages <= 0) {
      alert('今日聊天次数已用完，请明天再试！');
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

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
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
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('发送消息失败，请重试');
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
    <div className="max-w-7xl mx-auto p-4">
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
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedAgent?.id === agent.id
                        ? 'bg-blue-100 border-blue-300 border'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleAgentChange(agent)}
                  >
                                      <div className="flex items-center space-x-2">
                    {agent.avatar_url ? (
                      <img 
                        src={agent.avatar_url} 
                        alt={agent.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          // 如果头像加载失败，显示文字头像
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ${agent.avatar_url ? 'hidden' : ''}`}>
                      <span className="text-white text-sm font-bold">
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{agent.name}</h3>
                      {/* <p className="text-xs text-gray-600 truncate">{agent.description}</p> */}
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 用户统计信息 */}
          {userStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  聊天限制
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className={`text-center p-2 rounded transition-colors ${
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
                  <div className="text-center p-2 bg-green-50 rounded border border-green-200">
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
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

          {/* 记忆管理 */}
          {selectedAgent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">记忆管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={clearMemory}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除记忆
                </Button>
                
                {/* 调试信息 */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="text-center">
                    清除与当前智能体的所有对话记忆
                  </div>
                  <div className="border-t pt-2">
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
          <Card>
              <CardContent className="space-y-3">
               
                
               
                <div className="text-xs text-gray-500 space-y-1">
                  <div className=" pt-5">
                    <div>阿库佐伊人工智能 LLM 集成面板 <br/>Powered by Akuzoi AI<br/>Alpha v1.0.1 <br/><br/>&copy; 2025 ZGIT. All rights reserved.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* 聊天主区域 */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col min-h-0">
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
                        className={`max-w-[70%] rounded-lg px-4 py-2 break-words ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.role !== 'user' ? (
                            <span className="text-sm font-medium">{selectedAgent?.name}</span>
                          ) : (
                            <span className="text-sm font-medium">{userInfo?.nickname}</span>
                          )}
                        </div>
                        
                        <div className="whitespace-pre-wrap break-words overflow-hidden">{message.content}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp instanceof Date 
                            ? message.timestamp.toLocaleTimeString() 
                            : new Date(message.timestamp).toLocaleTimeString()}
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
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm">正在思考...</span>
                      </div>
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
                    className="flex-shrink-0"
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
                {userStats && (
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 