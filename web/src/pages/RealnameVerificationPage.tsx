import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RealnameVerificationPage() {
  const navigate = useNavigate();

  const handleGoToNatayark = () => {
    // 跳转到Natayark账户中心进行实名认证
    window.open('https://account.naids.com/real_name', '_blank');
  };

  const handleLogout = () => {
    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 跳转到登录页面
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
           需要完成实名认证
          </CardTitle>
          <CardDescription className="text-gray-600">
            为了确保平台安全和合规性，请先完成实名认证
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              根据相关法律法规要求，使用本平台需要完成实名认证。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">实名认证步骤：</h3>
              <ol className="text-sm text-blue-800 space-y-1 text-left">
                <li>1. 点击下方按钮跳转到 Natayark 账户中心</li>
                <li>2. 在账户中心完成实名认证</li>
                <li>3. 认证完成后返回本页面</li>
                <li>4. 点击"退出登录"按钮并重新登录</li>
              </ol>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleGoToNatayark}
              className="w-full"
              size="lg"
            >
              前往 Natayark 完成实名认证
            </Button>

            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>实名认证信息仅用于身份验证，我们将严格保护您的隐私</p>
            <p>
              遇到问题？请联系  
               <a href="mailto:support@zyghit.cn" className="text-blue-500 hover:underline">
                support@zyghit.cn
              </a>
            </p>
            <p className="mt-2">
              查看 <a href="/service-terms" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">服务条款</a> 和 <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">隐私政策</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 