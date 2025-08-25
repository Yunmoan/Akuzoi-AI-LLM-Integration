import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import UserDetailPage from './pages/UserDetailPage';
import SetNicknamePage from './pages/SetNicknamePage';
import RealnameVerificationPage from './pages/RealnameVerificationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ServiceTermsPage from './pages/ServiceTermsPage';
import LoadingSpinner from './components/LoadingSpinner';
import ToastManager from './components/ToastManager';
import ErrorBoundary from './components/ErrorBoundary';

// 内部组件，用于在Router内部使用useNavigate
function AppContent() {
  const { isAuthenticated, isLoading, checkAuth, setNavigate } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 设置navigate函数
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  useEffect(() => {
    // 应用启动时检查认证状态
    checkAuth();
  }, [checkAuth]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />
      } />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/service-terms" element={<ServiceTermsPage />} />
      
      {/* 需要认证的路由 */}
      <Route path="/" element={
        isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin/users/:userId" element={<UserDetailPage />} />
        <Route path="user/:userId" element={<UserDetailPage />} />
        <Route path="set-nickname" element={<SetNicknamePage />} />
        <Route path="realname-verification" element={<RealnameVerificationPage />} />
      </Route>
      
      {/* 404页面 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">页面不存在</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              返回上一页
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastManager>
        <Router>
          <div className="App">
            <AppContent />
          </div>
        </Router>
      </ToastManager>
    </ErrorBoundary>
  );
}

export default App; 