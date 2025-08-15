import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import UserDetailPage from './pages/UserDetailPage';
import SetNicknamePage from './pages/SetNicknamePage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />
          } />
          
          {/* OAuth回调路由 */}
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          
          {/* 需要认证的路由 */}
          <Route path="/" element={
            isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
          }>
            <Route index element={<Navigate to="/chat" replace />} />
                      <Route path="chat" element={<ChatPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/users/:userId" element={<UserDetailPage />} />
          <Route path="set-nickname" element={<SetNicknamePage />} />
          </Route>
          
          {/* 404页面 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 