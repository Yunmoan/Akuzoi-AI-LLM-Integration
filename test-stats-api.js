const axios = require('axios');

// 测试用户统计API
async function testUserStatsAPI() {
  try {
    console.log('🔍 开始测试用户统计API...');
    
    // 首先获取登录链接
    const loginResponse = await axios.get('http://localhost:3000/api/auth/login');
    console.log('✅ 获取登录链接成功:', loginResponse.data);
    
    // 这里需要模拟OAuth登录过程
    // 由于OAuth需要真实的授权码，我们先测试未认证的情况
    console.log('\n🔍 测试未认证访问统计API...');
    try {
      await axios.get('http://localhost:3000/api/auth/stats');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 未认证访问被正确拒绝 (401)');
      } else {
        console.log('❌ 未认证访问处理异常:', error.response?.status);
      }
    }
    
    // 测试其他API是否正常
    console.log('\n🔍 测试其他API...');
    try {
      const agentsResponse = await axios.get('http://localhost:3000/api/agents');
      console.log('✅ 智能体API正常:', agentsResponse.data.success);
    } catch (error) {
      console.log('❌ 智能体API异常:', error.response?.status);
    }
    
    console.log('\n📋 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testUserStatsAPI();
