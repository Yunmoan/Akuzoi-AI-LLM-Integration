const { OAuthService } = require('./services/oauthService');

async function testOAuthConfig() {
  try {
    console.log('🔍 测试OAuth配置...');
    
    // 检查环境变量
    console.log('\n1. 环境变量检查:');
    const requiredVars = [
      'OAUTH_CLIENT_ID',
      'OAUTH_CLIENT_SECRET', 
      'OAUTH_REDIRECT_URI',
      'OAUTH_AUTHORIZATION_URL',
      'OAUTH_TOKEN_URL',
      'OAUTH_USER_DATA_URL'
    ];
    
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      } else {
        console.log(`❌ ${varName}: 未设置`);
      }
    });
    
    // 测试OAuth服务实例
    console.log('\n2. OAuth服务测试:');
    const oauthService = new OAuthService();
    
    console.log('✅ OAuth服务实例创建成功');
    console.log(`  - Client ID: ${oauthService.clientId ? '已设置' : '未设置'}`);
    console.log(`  - Client Secret: ${oauthService.clientSecret ? '已设置' : '未设置'}`);
    console.log(`  - Redirect URI: ${oauthService.redirectUri}`);
    console.log(`  - Authorization URL: ${oauthService.authorizationUrl}`);
    console.log(`  - Token URL: ${oauthService.tokenUrl}`);
    console.log(`  - User Data URL: ${oauthService.userDataUrl}`);
    
    // 测试授权URL生成
    console.log('\n3. 授权URL生成测试:');
    try {
      const state = 'test_state_' + Date.now();
      const authUrl = oauthService.generateAuthUrl(state);
      console.log('✅ 授权URL生成成功');
      console.log(`  - State: ${state}`);
      console.log(`  - URL: ${authUrl.substring(0, 100)}...`);
    } catch (error) {
      console.log('❌ 授权URL生成失败:', error.message);
    }
    
    console.log('\n✅ OAuth配置测试完成！');
    
  } catch (error) {
    console.error('❌ OAuth配置测试失败:', error);
  }
}

// 运行测试
require('dotenv').config();
testOAuthConfig(); 