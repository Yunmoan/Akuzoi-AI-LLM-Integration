// 测试多行回复分割成多个气泡的功能
function testMultilineBubbles() {
  console.log('🧪 测试多行回复分割成多个气泡功能...');
  
  // 模拟多行回复内容
  const multilineResponse = `这是第一行回复
这是第二行回复
这是第三行回复

这是第五行回复（第四行是空行）`;

  console.log('原始回复内容:');
  console.log(multilineResponse);
  
  console.log('\n分割处理:');
  const responseLines = multilineResponse.split('\n').filter((line) => line.trim());
  console.log('过滤后的行数:', responseLines.length);
  
  console.log('\n生成的消息气泡:');
  if (responseLines.length > 1) {
    console.log('多行回复，分割成多个消息:');
    responseLines.forEach((line, index) => {
      console.log(`气泡 ${index + 1}: "${line.trim()}"`);
    });
  } else {
    console.log('单行回复，保持原样:', responseLines[0]);
  }
  
  console.log('\n✅ 多行回复分割成多个气泡功能测试完成！');
}

// 运行测试
if (require.main === module) {
  testMultilineBubbles();
}

module.exports = { testMultilineBubbles };
