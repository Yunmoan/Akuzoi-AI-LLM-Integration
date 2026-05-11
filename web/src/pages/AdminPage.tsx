import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAPI } from '@/lib/api';
import { Users, MessageSquare, BarChart3, Shield, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, Plus, Trash2, TestTube } from 'lucide-react';
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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

interface SensitiveWord {
  word: string;
  category: string;
  level: string;
  synonyms?: string[];
  context?: string[];
}

interface SensitiveWordStats {
  totalWords: number;
  categories: Record<string, number>;
  levels: Record<string, number>;
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
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // 敏感词管理状态
  const [activeTab, setActiveTab] = useState<'users' | 'sensitive-words'>('users');
  const [sensitiveWordStats, setSensitiveWordStats] = useState<SensitiveWordStats | null>(null);
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWord[]>([]);
  const [showAddWordForm, setShowAddWordForm] = useState(false);
  const [newWord, setNewWord] = useState({
    word: '',
    category: 'political',
    level: 'block',
    synonyms: '',
    context: ''
  });
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  useEffect(() => {
    if (activeTab === 'sensitive-words') {
      loadSensitiveWordData();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        adminAPI.getUsers({ page: currentPage, limit: pageSize, search: searchTerm }),
        adminAPI.getSystemStats(),
      ]);
      
      setUsers(usersResponse.data.data.users);
      setPagination(usersResponse.data.data.pagination);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSensitiveWordData = async () => {
    try {
      const [statsResponse, wordsResponse] = await Promise.all([
        adminAPI.getSensitiveWordStats(),
        adminAPI.getSensitiveWords({ page: 1, limit: 100 }),
      ]);
      setSensitiveWordStats(statsResponse.data.data);
      setSensitiveWords(wordsResponse.data.data.words || []);
    } catch (error) {
      console.error('Failed to load sensitive word data:', error);
    }
  };

  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    setCurrentPage(1); // 搜索时重置到第一页
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 改变页面大小时重置到第一页
  };

  // 敏感词管理函数
  const handleAddSensitiveWord = async () => {
    if (!newWord.word.trim()) {
      showError('请输入敏感词');
      return;
    }

    // 检查敏感词是否已存在
    if (sensitiveWords.some(w => w.word.toLowerCase() === newWord.word.trim().toLowerCase())) {
      showError('该敏感词已存在');
      return;
    }

    try {
      const synonyms = newWord.synonyms ? newWord.synonyms.split(',').map(s => s.trim()).filter(s => s) : [];
      const context = newWord.context ? newWord.context.split(',').map(s => s.trim()).filter(s => s) : [];

      await adminAPI.addSensitiveWord({
        word: newWord.word.trim(),
        category: newWord.category,
        level: newWord.level,
        synonyms,
        context
      });

      showSuccess('敏感词添加成功');
      setNewWord({ word: '', category: 'political', level: 'block', synonyms: '', context: '' });
      loadSensitiveWordData();
    } catch (error) {
      console.error('添加敏感词失败:', error);
      showError('添加敏感词失败');
    }
  };

  const handleRemoveSensitiveWord = async (word: string) => {
    if (!confirm(`确定要删除敏感词 "${word}" 吗？`)) return;

    try {
      await adminAPI.removeSensitiveWord(word);
      showSuccess('敏感词删除成功');
      loadSensitiveWordData();
    } catch (error) {
      console.error('删除敏感词失败:', error);
      showError('删除敏感词失败');
    }
  };

  const handleTestSensitiveWord = async () => {
    if (!testText.trim()) {
      showError('请输入测试文本');
      return;
    }

    try {
      const response = await adminAPI.testSensitiveWordDetection({
        text: testText,
        options: { strictMode: true, checkContext: true }
      });
      setTestResult(response.data.data);
    } catch (error) {
      console.error('测试敏感词检测失败:', error);
      showError('测试敏感词检测失败');
    }
  };

  // 防抖搜索
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchValue: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchTerm(searchValue);
          setCurrentPage(1); // 搜索时重置到第一页
        }, 500); // 500ms 防抖延迟
      };
    })(),
    []
  );

  // 分页组件
  const Pagination = () => {
    if (!pagination) return null;

    const { page, totalPages, total } = pagination;
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-gray-700">
          显示第 {startItem} 到 {endItem} 条，共 {total} 条记录
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
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

      {/* 标签页切换 */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'users'
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          用户管理
        </button>
        <button
          onClick={() => setActiveTab('sensitive-words')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'sensitive-words'
              ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          敏感词管理
        </button>
      </div>

      {/* 用户管理标签页 */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>用户管理</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="搜索用户..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  debouncedSearch(value);
                }}
                className="max-w-sm"
              />
              <Button onClick={() => handleSearch(searchTerm)} disabled={isLoading}>
                {isLoading ? '加载中...' : '搜索'}
              </Button>
              <Button onClick={loadData} disabled={isLoading}>
                {isLoading ? '加载中...' : '刷新'}
              </Button>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value) || 20)}
                className="max-w-sm h-8 text-xs"
              >
                <option value={10}>每页10条</option>
                <option value={20}>每页20条</option>
                <option value={50}>每页50条</option>
                <option value={100}>每页100条</option>
              </select>
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
            <Pagination />
          </CardContent>
        </Card>
      )}

      {/* 敏感词管理标签页 */}
      {activeTab === 'sensitive-words' && (
        <div className="space-y-6">
          {/* 敏感词统计 */}
          {sensitiveWordStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总敏感词数</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sensitiveWordStats.totalWords}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">分类统计</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(sensitiveWordStats.categories).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">级别统计</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(sensitiveWordStats.levels).map(([level, count]) => (
                      <div key={level} className="flex justify-between text-sm">
                        <span className="capitalize">{level}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 添加敏感词 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                添加敏感词
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">敏感词</label>
                  <Input
                    placeholder="输入敏感词"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">分类</label>
                  <select
                    value={newWord.category}
                    onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="political">政治敏感</option>
                    <option value="violence">暴力恐怖</option>
                    <option value="porn">色情内容</option>
                    <option value="drugs">毒品相关</option>
                    <option value="gambling">赌博相关</option>
                    <option value="fraud">诈骗相关</option>
                    <option value="hate_speech">仇恨言论</option>
                    <option value="illegal_activities">违法活动</option>
                    <option value="controversial">争议话题</option>
                    <option value="spam">垃圾信息</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">级别</label>
                  <select
                    value={newWord.level}
                    onChange={(e) => setNewWord({ ...newWord, level: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="block">完全阻止</option>
                    <option value="warn">警告提示</option>
                    <option value="review">人工审核</option>
                    <option value="notice">注意提醒</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">同义词（逗号分隔）</label>
                  <Input
                    placeholder="同义词1,同义词2,同义词3"
                    value={newWord.synonyms}
                    onChange={(e) => setNewWord({ ...newWord, synonyms: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">上下文关键词（逗号分隔）</label>
                  <Input
                    placeholder="上下文1,上下文2,上下文3"
                    value={newWord.context}
                    onChange={(e) => setNewWord({ ...newWord, context: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddSensitiveWord}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加敏感词
                </Button>
                <Button variant="outline" onClick={() => setShowAddWordForm(!showAddWordForm)}>
                  {showAddWordForm ? '收起' : '展开'}
                </Button>
                <Button variant="outline" onClick={() => {
                  const sampleWords = [
                    { word: '示例敏感词1', category: 'political', level: 'block' },
                    { word: '示例敏感词2', category: 'violence', level: 'warn' },
                    { word: '示例敏感词3', category: 'spam', level: 'notice' }
                  ];
                  const csvContent = sampleWords.map(w => `${w.word},${w.category},${w.level}`).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sensitive-words-template.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}>
                  下载模板
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 敏感词列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                敏感词列表
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <select
                  className="p-2 border rounded-md text-sm"
                  onChange={(e) => {
                    const category = e.target.value;
                    if (category) {
                      loadSensitiveWordData();
                    }
                  }}
                >
                  <option value="">所有分类</option>
                  <option value="political">政治敏感</option>
                  <option value="violence">暴力恐怖</option>
                  <option value="porn">色情内容</option>
                  <option value="drugs">毒品相关</option>
                  <option value="gambling">赌博相关</option>
                  <option value="fraud">诈骗相关</option>
                  <option value="hate_speech">仇恨言论</option>
                  <option value="illegal_activities">违法活动</option>
                  <option value="controversial">争议话题</option>
                  <option value="spam">垃圾信息</option>
                </select>
                <select
                  className="p-2 border rounded-md text-sm"
                  onChange={(e) => {
                    const level = e.target.value;
                    if (level) {
                      loadSensitiveWordData();
                    }
                  }}
                >
                  <option value="">所有级别</option>
                  <option value="block">完全阻止</option>
                  <option value="warn">警告提示</option>
                  <option value="review">人工审核</option>
                  <option value="notice">注意提醒</option>
                </select>
                <Button onClick={loadSensitiveWordData} size="sm" variant="outline">
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">敏感词</th>
                      <th className="text-left p-2">分类</th>
                      <th className="text-left p-2">级别</th>
                      <th className="text-left p-2">同义词</th>
                      <th className="text-left p-2">上下文</th>
                      <th className="text-left p-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitiveWords.map((word, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{word.word}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 capitalize">
                            {word.category}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            word.level === 'block' ? 'bg-red-100 text-red-800' :
                            word.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                            word.level === 'review' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {word.level}
                          </span>
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {word.synonyms && word.synonyms.length > 0 
                            ? word.synonyms.join(', ') 
                            : '-'}
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {word.context && word.context.length > 0 
                            ? word.context.join(', ') 
                            : '-'}
                        </td>
                        <td className="p-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRemoveSensitiveWord(word.word)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sensitiveWords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    暂无敏感词数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 敏感词测试 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                敏感词检测测试
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">测试文本</label>
                  <textarea
                    placeholder="输入要测试的文本内容..."
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="w-full p-3 border rounded-md h-24 resize-none"
                  />
                </div>
                <Button onClick={handleTestSensitiveWord} disabled={!testText.trim()}>
                  <TestTube className="h-4 w-4 mr-2" />
                  开始检测
                </Button>
                
                {testResult && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">检测结果：</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">状态：</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          testResult.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {testResult.isBlocked ? '已阻止' : '安全'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">风险等级：</span>
                        <span className="capitalize">{testResult.level}</span>
                      </div>
                      <div>
                        <span className="font-medium">风险评分：</span>
                        <span>{testResult.riskScore}/100</span>
                      </div>
                      {testResult.detectedWords.length > 0 && (
                        <div>
                          <span className="font-medium">检测到的敏感词：</span>
                          <div className="mt-2 space-y-1">
                            {testResult.detectedWords.map((word: any, index: number) => (
                              <div key={index} className="text-xs bg-white p-2 rounded border">
                                <div className="flex justify-between">
                                  <span className="font-medium">{word.word}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    word.level === 'block' ? 'bg-red-100 text-red-800' :
                                    word.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                                    word.level === 'review' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {word.level}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  分类: {word.category} | 匹配类型: {word.matchType} | 严重程度: {word.severity}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 