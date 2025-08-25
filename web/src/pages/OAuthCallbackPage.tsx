import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { authAPI } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, token, isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // 防止重复处理
      if (hasProcessed) {
        return;
      }
      setHasProcessed(true);

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
        
        // 检查是否是授权码过期错误
        if (error.response?.data?.message?.includes('授权码已过期')) {
          // 检查用户是否已经有有效的JWT token
          if (token) {
            try {
              // 尝试使用现有token获取用户信息
              const userResponse = await authAPI.getCurrentUser();
              if (userResponse.data.success) {
                // 用户已经有有效的token，直接跳转到聊天页面
                console.log('用户已有有效token，跳过OAuth登录');
                navigate('/chat');
                return;
              }
            } catch (tokenError) {
              // token无效，继续OAuth登录流程
              console.log('现有token无效，需要重新OAuth登录');
            }
          }
          
          // 授权码过期，直接跳转到登录页面，让用户重新开始OAuth流程
          setError('登录会话已过期，请重新登录');
          // 清除可能存在的无效token
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // 检查是否是实名认证错误
        if (error.response?.data?.message?.includes('实名认证')) {
          // 跳转到实名认证页面
          navigate('/realname-verification');
          return;
        }
        
        // 处理不同类型的错误
        if (error.response?.status === 500) {
          setError('服务器内部错误，请稍后重试');
        } else if (error.response?.status === 403) {
          if (error.response?.data?.message?.includes('封禁')) {
            setError(`账户已被封禁：${error.response.data.ban_reason || '未知原因'}`);
          } else if (error.response?.data?.message?.includes('实名认证')) {
            setError('需要完成实名认证后才能登录');
          } else {
            setError('访问被拒绝，请检查账户状态');
          }
        } else if (error.response?.status === 401) {
          setError('认证失败，请重新登录');
        } else {
        setError(error.response?.data?.message || '登录失败，请重试');
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate, login, token, hasProcessed]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">登录失败</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {isRetrying ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">正在重试...</span>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                返回登录页面
              </button>
            )}
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