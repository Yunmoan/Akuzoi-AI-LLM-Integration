const { LLMService } = require('./services/llmService');

async function testDisabledAgents() {
  try {
    console.log('🔍 测试禁用智能体功能...');
    
    const llmService = new LLMService();
    
    // 测试获取智能体列表
    console.log('\n1. 获取智能体列表:');
    const agents = await llmService.getAgentsList();
    
    agents.forEach(agent => {
      const status = agent.enabled ? '✅ 启用' : '❌ 禁用';
      const avatar = agent.avatar_url ? `头像: ${agent.avatar_url}` : '无头像';
      console.log(`  - ${agent.name} (${agent.id}): ${status} | ${avatar}`);
    });
    
    // 测试获取特定智能体
    console.log('\n2. 测试获取特定智能体:');
    
    // 测试启用的智能体
    try {
      const enabledAgent = await llmService.getAgent('qing');
      console.log(`  ✅ 启用智能体 'qing': ${enabledAgent.name} (enabled: ${enabledAgent.enabled})`);
    } catch (error) {
      console.log(`  ❌ 获取启用智能体失败: ${error.message}`);
    }
    
    // 测试禁用的智能体
    try {
      const disabledAgent = await llmService.getAgent('cat_girl');
      console.log(`  ⚠️  禁用智能体 'cat_girl': ${disabledAgent.name} (enabled: ${disabledAgent.enabled})`);
    } catch (error) {
      console.log(`  ❌ 获取禁用智能体失败: ${error.message}`);
    }
    
    // 测试API响应格式
    console.log('\n3. 测试API响应格式:');
    const sampleAgent = agents[0];
    console.log('  智能体对象结构:');
    console.log(`    - id: ${sampleAgent.id}`);
    console.log(`    - name: ${sampleAgent.name}`);
    console.log(`    - description: ${sampleAgent.description}`);
    console.log(`    - avatar_url: ${sampleAgent.avatar_url || 'undefined'}`);
    console.log(`    - enabled: ${sampleAgent.enabled}`);
    console.log(`    - model: ${sampleAgent.model}`);
    
    console.log('\n✅ 禁用智能体功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDisabledAgents(); 