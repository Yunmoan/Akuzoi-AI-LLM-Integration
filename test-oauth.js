const axios = require('axios');

// 测试OAuth流程
async function testOAuthFlow() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 测试OAuth流程...\n');

    // 1. 获取登录URL
    console.log('1. 获取OAuth登录URL...');
    const loginResponse = await axios.get(`${baseURL}/api/auth/login`);
    console.log('登录URL:', loginResponse.data.auth_url);
    console.log('✅ 获取登录URL成功\n');

    // 2. 模拟OAuth回调（使用测试数据）
    console.log('2. 模拟OAuth回调...');
    const mockUserData = {
      id: 1,
      username: 'Yunmoan',
      email: 'l13230507790@outlook.com',
      realname: true,
      ADMIN: true,
      feat_enable: true,
      last_access: null,
      last_ip: '183.198.*.*',
      last_login: '2025-08-09 23:43:15',
      reg_ip: '2409:*:a044',
      regip: '2409:8a04:1e18:8790:31fb:d1f7:cf61:a044',
      regtime: '2021-07-17 13:47:57',
      status: 0
    };

    // 模拟回调处理
    const callbackResponse = await axios.get(`${baseURL}/api/auth/callback`, {
      params: {
        code: 'test_code_123',
        state: 'test_state'
      }
    });

    console.log('回调响应:', JSON.stringify(callbackResponse.data, null, 2));
    console.log('✅ OAuth回调处理成功\n');

    // 3. 测试获取当前用户信息
    if (callbackResponse.data.token) {
      console.log('3. 测试获取当前用户信息...');
      const userResponse = await axios.get(`${baseURL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${callbackResponse.data.token}`
        }
      });
      console.log('用户信息:', JSON.stringify(userResponse.data, null, 2));
      console.log('✅ 获取用户信息成功\n');

      // 4. 测试设置昵称
      console.log('4. 测试设置昵称...');
      const nicknameResponse = await axios.post(`${baseURL}/api/auth/set-nickname`, {
        nickname: '测试昵称'
      }, {
        headers: {
          'Authorization': `Bearer ${callbackResponse.data.token}`
        }
      });
      console.log('昵称设置响应:', JSON.stringify(nicknameResponse.data, null, 2));
      console.log('✅ 设置昵称成功\n');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 测试数据库连接
async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...\n');
    
    const response = await axios.get('http://localhost:3000/health');
    console.log('健康检查响应:', response.data);
    console.log('✅ 数据库连接正常\n');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始OAuth流程测试\n');
  
  await testDatabase();
  await testOAuthFlow();
  
  console.log('🎉 测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testOAuthFlow, testDatabase }; 