const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 测试API连接...');
    
    // 测试健康检查端点
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ 健康检查正常:', healthResponse.data);
    
    // 测试认证登录端点
    const loginResponse = await axios.get('http://localhost:3000/api/auth/login');
    console.log('✅ 登录端点正常:', loginResponse.data.success);
    
    // 测试智能体端点
    const agentsResponse = await axios.get('http://localhost:3000/api/agents');
    console.log('✅ 智能体端点正常:', agentsResponse.data.success);
    
    console.log('\n📋 所有API端点测试通过');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testAPI();
