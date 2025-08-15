import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';

export default function SetNicknamePage() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setNickname: updateNickname } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 如果用户已经有昵称，直接跳转到聊天页面
    if (user?.nickname) {
      navigate('/chat');
    }
  }, [user, navigate]);

  // 如果用户未登录，跳转到登录页面
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await updateNickname(nickname.trim());
      navigate('/chat');
    } catch (error: any) {
      setError(error.message || '设置昵称失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>设置您的昵称</CardTitle>
          <CardDescription>
            请设置一个昵称，这将作为您与智能体对话时的昵称，
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                昵称
              </label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入您的昵称"
                disabled={isLoading}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                昵称长度1-50个字符，只能包含字母、数字、中文、下划线和连字符。<br/>注意，昵称只能设置一次，设置后无法修改。
              </p>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !nickname.trim()}
              className="w-full"
            >
              {isLoading ? '设置中...' : '确认设置'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 