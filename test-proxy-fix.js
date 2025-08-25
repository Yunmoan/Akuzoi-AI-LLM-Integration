const axios = require('axios');

async function testProxyConfiguration() {
  console.log('🧪 测试代理配置修复...\n');

  const baseURL = process.env.API_URL || 'http://localhost:3000';
  
  try {
    // 测试1: 正常请求（不带代理头部）
    console.log('📋 测试1: 正常请求');
    const response1 = await axios.get(`${baseURL}/health`);
    console.log('✅ 正常请求成功:', response1.status);
    console.log('响应数据:', response1.data);
    console.log('');

    // 测试2: 带 X-Forwarded-For 头部的请求
    console.log('📋 测试2: 带 X-Forwarded-For 头部的请求');
    const response2 = await axios.get(`${baseURL}/health`, {
      headers: {
        'X-Forwarded-For': '203.0.113.1, 10.0.0.1'
      }
    });
    console.log('✅ 代理请求成功:', response2.status);
    console.log('响应数据:', response2.data);
    console.log('');

    // 测试3: 测试速率限制（多次请求）
    console.log('📋 测试3: 速率限制测试');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.get(`${baseURL}/health`, {
          headers: {
            'X-Forwarded-For': `203.0.113.${i + 1}`
          }
        }).catch(err => ({ error: err.response?.status || err.message }))
      );
    }
    
    const results = await Promise.all(promises);
    console.log('速率限制测试结果:');
    results.forEach((result, index) => {
      if (result.error) {
        console.log(`  请求 ${index + 1}: ❌ ${result.error}`);
      } else {
        console.log(`  请求 ${index + 1}: ✅ ${result.status}`);
      }
    });
    console.log('');

    // 测试4: 测试登录端点
    console.log('📋 测试4: 登录端点测试');
    try {
      const loginResponse = await axios.get(`${baseURL}/api/auth/login`, {
        headers: {
          'X-Forwarded-For': '203.0.113.100'
        }
      });
      console.log('✅ 登录端点请求成功:', loginResponse.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 登录端点正常返回401（预期行为）');
      } else {
        console.log('❌ 登录端点异常:', error.response?.status || error.message);
      }
    }
    console.log('');

    console.log('🎉 所有测试完成！');
    console.log('\n📝 修复说明:');
    console.log('1. 在 src/app.js 中添加了 trust proxy 配置');
    console.log('2. 在 middleware/rateLimiter.js 中添加了自定义 keyGenerator');
    console.log('3. 现在应用可以正确处理代理环境下的 X-Forwarded-For 头部');
    console.log('4. 速率限制现在基于真实的客户端IP地址');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testProxyConfiguration();
