const axios = require('axios');

// 配置基础URL
const BASE_URL = 'http://localhost:3000';
let authToken = null;

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，添加认证token
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// 响应拦截器，处理错误
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API请求失败:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 测试函数
async function runTests() {
  console.log('🚀 开始API测试...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await api.get('/health');
    console.log('✅ 健康检查通过:', healthResponse.data);

    // 2. 获取OAuth登录链接
    console.log('\n2. 获取OAuth登录链接...');
    const loginResponse = await api.get('/api/auth/login');
    console.log('✅ OAuth登录链接:', loginResponse.data.auth_url);

    // 3. 测试未认证的智能体列表（应该失败）
    console.log('\n3. 测试未认证访问智能体列表...');
    try {
      await api.get('/api/agents');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 未认证访问被正确拒绝');
      } else {
        throw error;
      }
    }

    // 4. 测试未认证的聊天接口（应该失败）
    console.log('\n4. 测试未认证发送消息...');
    try {
      await api.post('/api/chat/send', {
        agentId: 'general_assistant',
        message: '测试消息'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 未认证聊天被正确拒绝');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 基础API测试完成！');
    console.log('\n📝 下一步操作：');
    console.log('1. 配置OAuth客户端信息到.env文件');
    console.log('2. 启动MySQL和Redis服务');
    console.log('3. 运行 npm run dev 启动服务');
    console.log('4. 使用OAuth登录获取token');
    console.log('5. 使用token测试其他API接口');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 模拟OAuth回调测试（需要有效的code）
async function testOAuthCallback(code) {
  console.log('\n🔐 测试OAuth回调...');
  try {
    const response = await api.get(`/api/auth/callback?code=${code}&state=test`);
    console.log('✅ OAuth回调成功:', response.data);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ 获取到认证token');
      
      // 测试认证后的接口
      await testAuthenticatedAPIs();
    }
  } catch (error) {
    console.error('❌ OAuth回调失败:', error.response?.data || error.message);
  }
}

// 测试认证后的API
async function testAuthenticatedAPIs() {
  console.log('\n🔒 测试认证后的API...');

  try {
    // 1. 获取用户信息
    console.log('1. 获取用户信息...');
    const userResponse = await api.get('/api/auth/me');
    console.log('✅ 用户信息:', userResponse.data);

    // 2. 获取智能体列表
    console.log('\n2. 获取智能体列表...');
    const agentsResponse = await api.get('/api/agents');
    console.log('✅ 智能体列表:', agentsResponse.data);

    // 3. 发送聊天消息
    console.log('\n3. 发送聊天消息...');
    const chatResponse = await api.post('/api/chat/send', {
      agentId: 'general_assistant',
      message: '你好，这是一个测试消息'
    });
    console.log('✅ 聊天响应:', chatResponse.data);

    // 4. 获取今日统计
    console.log('\n4. 获取今日统计...');
    const statsResponse = await api.get('/api/chat/stats/today');
    console.log('✅ 今日统计:', statsResponse.data);

    console.log('\n🎉 认证API测试完成！');

  } catch (error) {
    console.error('❌ 认证API测试失败:', error.response?.data || error.message);
  }
}

// 设置昵称测试
async function testSetNickname(nickname) {
  console.log(`\n📝 测试设置昵称: ${nickname}`);
  try {
    const response = await api.post('/api/auth/set-nickname', {
      nickname: nickname
    });
    console.log('✅ 昵称设置成功:', response.data);
  } catch (error) {
    console.error('❌ 昵称设置失败:', error.response?.data || error.message);
  }
}

// 导出测试函数
module.exports = {
  runTests,
  testOAuthCallback,
  testAuthenticatedAPIs,
  testSetNickname,
  setAuthToken: (token) => { authToken = token; }
};

// 如果直接运行此文件
if (require.main === module) {
  runTests();
} 