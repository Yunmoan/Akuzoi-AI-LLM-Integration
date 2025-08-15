import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { authAPI } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          setError('缺少授权码');
          return;
        }

        // 调用后端OAuth回调处理
        const response = await authAPI.handleCallback(code, state || '');
        
        if (response.data.success) {
          const { user, token, isNewUser } = response.data;
          
          // 保存用户信息和token
          login(token, user);
          
          // 如果是新用户且没有昵称，跳转到昵称设置页面
          if (isNewUser || !user.nickname) {
            navigate('/set-nickname');
          } else {
            // 跳转到聊天页面
            navigate('/chat');
          }
        } else {
          setError(response.data.message || '登录失败');
        }
      } catch (error: any) {
        console.error('OAuth回调处理失败:', error);
        setError(error.response?.data?.message || '登录失败，请重试');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">登录失败</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              返回登录页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">正在处理登录...</p>
      </div>
    </div>
  );
} 