// 测试消息清理功能
function testMessageCleaning() {
  console.log('🧪 测试消息清理功能...');
  
  // 清理用户消息中的增强信息，只保留实际输入内容
  const cleanUserMessage = (message) => {
    // 匹配 [时间: ...] [用户: ...] 格式的增强信息
    const enhancedPattern = /^\[时间: [^\]]+\] \[用户: [^\]]+\]\n?/;
    return message.replace(enhancedPattern, '').trim();
  };
  
  // 测试用例
  const testCases = [
    {
      input: '[时间: 2025/09/14 23:24:56] [用户: 云默安]\n你好，请帮我写一个Python函数',
      expected: '你好，请帮我写一个Python函数'
    },
    {
      input: '[时间: 2025/09/14 23:24:56] [用户: 云默安]\n\n这是一个多行消息\n第二行内容',
      expected: '这是一个多行消息\n第二行内容'
    },
    {
      input: '普通消息，没有增强信息',
      expected: '普通消息，没有增强信息'
    },
    {
      input: '[时间: 2025/09/14 23:24:56] [用户: 云默安]',
      expected: ''
    }
  ];
  
  console.log('测试结果:');
  testCases.forEach((testCase, index) => {
    const result = cleanUserMessage(testCase.input);
    const passed = result === testCase.expected;
    console.log(`\n测试 ${index + 1}: ${passed ? '✅ 通过' : '❌ 失败'}`);
    console.log(`输入: "${testCase.input}"`);
    console.log(`期望: "${testCase.expected}"`);
    console.log(`实际: "${result}"`);
  });
  
  console.log('\n✅ 消息清理功能测试完成！');
}

// 运行测试
if (require.main === module) {
  testMessageCleaning();
}

module.exports = { testMessageCleaning };
