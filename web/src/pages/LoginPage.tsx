import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 获取OAuth登录链接
      const response = await authAPI.getLoginUrl();
      const { auth_url } = response.data;
      
      // 重定向到OAuth登录页面
      window.location.href = auth_url;
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Akuzoi AI
          </CardTitle>
          <CardDescription className="text-gray-600">
            智能对话平台
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <Button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? '正在跳转...' : '使用 Natayark ID 登录'}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            登录即表示您同意我们的 <a href="/service-terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">服务条款</a> 和 <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">隐私政策</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 