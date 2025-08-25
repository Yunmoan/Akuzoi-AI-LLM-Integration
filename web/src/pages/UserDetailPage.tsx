import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAPI } from '@/lib/api';
import { ArrowLeft, User, MessageSquare, Calendar, Mail, Shield, Ban, BarChart3 } from 'lucide-react';

interface UserDetail {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  realname_verified: boolean;
  is_banned: boolean;
  ban_reason?: string;
  daily_message_limit: number;
  total_messages_sent: number;
  today_messages_sent: number;
  remaining_messages: number;
  created_at: string;
  updated_at: string;
}

interface ChatRecord {
  id: number;
  agent_id: string;
  session_id: string;
  message: string;
  response: string;
  tokens_used: number;
  created_at: string;
}

interface ChatHistoryResponse {
  records: ChatRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userId) {
      loadUserDetail();
      loadChatHistory(1);
    }
  }, [userId]);

  const loadUserDetail = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getUser(parseInt(userId!));
      setUserDetail(response.data.data);
    } catch (error: any) {
      console.error('Failed to load user detail:', error);
      const errorMessage = error.response?.data?.message || '加载用户详情失败';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getUserChatHistory(parseInt(userId!), {
        page,
        limit: pagination.limit
      });
      const data: ChatHistoryResponse = response.data.data;
      setChatHistory(data.records);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Failed to load chat history:', error);
      const errorMessage = error.response?.data?.message || '加载聊天记录失败';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadChatHistory(newPage);
  };

  const filteredChatHistory = chatHistory.filter(record =>
    record.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.agent_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading && !userDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">用户信息加载失败</p>
          <Button onClick={() => navigate('/admin')}>
            返回管理面板
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回管理面板
        </Button>
        <h1 className="text-2xl font-bold">用户详情</h1>
      </div>

      {/* 用户信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            用户信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">用户ID:</span>
                <span>{userDetail.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">用户名:</span>
                <span>{userDetail.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">昵称:</span>
                <span>{userDetail.nickname || '未设置'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">邮箱:</span>
                <span>{userDetail.email || '未设置'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium">实名认证:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  userDetail.realname_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userDetail.realname_verified ? '已认证' : '未认证'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                <span className="font-medium">账户状态:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  userDetail.is_banned 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userDetail.is_banned ? '已封禁' : '正常'}
                </span>
              </div>
              {userDetail.is_banned && userDetail.ban_reason && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">封禁原因:</span>
                  <span className="text-red-600">{userDetail.ban_reason}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">注册时间:</span>
                <span>{formatDate(userDetail.created_at)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 调用次数统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            调用次数统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {userDetail.daily_message_limit || 100}
              </div>
              <div className="text-sm text-gray-600">每日限制</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {userDetail.today_messages_sent || 0}
              </div>
              <div className="text-sm text-gray-600">今日已用</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {userDetail.remaining_messages || 0}
              </div>
              <div className="text-sm text-gray-600">剩余次数</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              总调用次数: <span className="font-medium">{userDetail.total_messages_sent || 0}</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>使用进度</span>
                <span>{Math.round(((userDetail.today_messages_sent || 0) / (userDetail.daily_message_limit || 100)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((userDetail.today_messages_sent || 0) / (userDetail.daily_message_limit || 100)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 聊天记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            聊天记录
          </CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="搜索聊天记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={() => loadChatHistory(1)} disabled={isLoading}>
              {isLoading ? '加载中...' : '刷新'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredChatHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无聊天记录
              </div>
            ) : (
              <>
                {filteredChatHistory.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>智能体: {record.agent_id}</span>
                      <span>会话ID: {record.session_id}</span>
                      <span>{formatDate(record.created_at)}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium text-sm mb-1">用户消息:</div>
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          {truncateText(record.message)}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-sm mb-1">AI回复:</div>
                        <div className="bg-blue-50 p-2 rounded text-sm">
                          {truncateText(record.response)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Token使用量: {record.tokens_used}
                    </div>
                  </div>
                ))}
                
                {/* 分页 */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {pagination.page} 页，共 {pagination.totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 text-center">
                  共 {pagination.total} 条记录
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 