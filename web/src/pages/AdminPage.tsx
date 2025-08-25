import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAPI } from '@/lib/api';
import { Users, MessageSquare, BarChart3, Shield } from 'lucide-react';
import { useToast } from '@/components/ToastManager';

interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  realname_verified: boolean;
  is_banned: boolean;
  daily_message_limit: number;
  total_messages_sent: number;
  today_messages_sent: number;
  remaining_messages: number;
  created_at: string;
}

interface SystemStats {
  users: {
    total_users: number;
    banned_users: number;
    verified_users: number;
    new_users_today: number;
  };
  chat: {
    total_messages: number;
    total_tokens: number;
    messages_today: number;
    tokens_today: number;
  };
  top_agents: Array<{
    agent_id: string;
    message_count: number;
    total_tokens: number;
  }>;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLimit, setEditingLimit] = useState<number | null>(null);
  const [newLimit, setNewLimit] = useState<number>(100);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        adminAPI.getUsers({ page: 1, limit: 50 }),
        adminAPI.getSystemStats(),
      ]);
      
      setUsers(usersResponse.data.data.users);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBanUser = async (userId: number) => {
    const reason = prompt('请输入封禁原因:');
    if (!reason) return;
    
    try {
      await adminAPI.banUser(userId, reason);
      showSuccess('用户封禁成功');
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('封禁用户失败:', error);
      showError('封禁用户失败');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    if (!confirm('确定要解封此用户吗？')) return;
    
    try {
      await adminAPI.unbanUser(userId);
      showSuccess('用户解封成功');
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('解封用户失败:', error);
      showError('解封用户失败');
    }
  };

  const handleUpdateDailyLimit = async (userId: number) => {
    if (newLimit < 1 || newLimit > 1000) {
      showError('每日限制必须在1-1000之间');
      return;
    }
    
    try {
      await adminAPI.updateUserDailyLimit(userId, newLimit);
      showSuccess('用户每日限制更新成功');
      setEditingLimit(null);
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('更新用户每日限制失败:', error);
      showError('更新用户每日限制失败');
    }
  };

  const startEditingLimit = (userId: number, currentLimit: number) => {
    setEditingLimit(userId);
    setNewLimit(currentLimit);
  };

  const handleViewUserDetail = (userId: number) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总用户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total_users}</div>
              <p className="text-xs text-muted-foreground">
                今日新增 {stats.users.new_users_today} 人
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总消息数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.chat.total_messages}</div>
              <p className="text-xs text-muted-foreground">
                今日 {stats.chat.messages_today} 条
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token使用量</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.chat.total_tokens.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                今日 {stats.chat.tokens_today.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">封禁用户</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.banned_users}</div>
              <p className="text-xs text-muted-foreground">
                实名认证 {stats.users.verified_users} 人
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={loadData} disabled={isLoading}>
              {isLoading ? '加载中...' : '刷新'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">用户名</th>
                  <th className="text-left p-2">昵称</th>
                  <th className="text-left p-2">邮箱</th>
                  <th className="text-left p-2">状态</th>
                  <th className="text-left p-2">调用次数</th>
                  <th className="text-left p-2">注册时间</th>
                  <th className="text-left p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.id}</td>
                    <td className="p-2">{user.username}</td>
                    <td className="p-2">{user.nickname || '-'}</td>
                    <td className="p-2">{user.email || '-'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_banned 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_banned ? '已封禁' : '正常'}
                      </span>
                    </td>
                    <td className="p-2 text-sm">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">
                          今日: {user.today_messages_sent || 0} / {user.daily_message_limit || 100}
                        </div>
                        <div className="text-xs text-gray-500">
                          剩余: {user.remaining_messages || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          总计: {user.total_messages_sent || 0}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewUserDetail(user.id)}
                        >
                          查看详情
                        </Button>
                        {editingLimit === user.id ? (
                          <div className="flex gap-1 items-center">
                            <Input
                              type="number"
                              min="1"
                              max="1000"
                              value={newLimit}
                              onChange={(e) => setNewLimit(parseInt(e.target.value) || 100)}
                              className="w-20 h-8 text-xs"
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateDailyLimit(user.id)}
                            >
                              保存
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingLimit(null)}
                            >
                              取消
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditingLimit(user.id, user.daily_message_limit || 100)}
                          >
                            修改限制
                          </Button>
                        )}
                        {user.is_banned ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUnbanUser(user.id)}
                          >
                            解封
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleBanUser(user.id)}
                          >
                            封禁
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 