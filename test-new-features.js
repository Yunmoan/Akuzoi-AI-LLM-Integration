const { mysqlPool } = require('./config/database');

async function testNewFeatures() {
  try {
    console.log('🔍 测试新功能...');
    
    // 测试数据库字段
    console.log('\n1. 测试数据库字段...');
    
    // 检查 is_admin 字段
    try {
      const [columns] = await mysqlPool.execute('SHOW COLUMNS FROM users LIKE "is_admin"');
      if (columns.length > 0) {
        console.log('✅ is_admin 字段存在');
      } else {
        console.log('❌ is_admin 字段不存在');
      }
    } catch (error) {
      console.log('❌ 检查 is_admin 字段失败:', error.message);
    }
    
    // 检查 daily_message_limit 字段
    try {
      const [columns] = await mysqlPool.execute('SHOW COLUMNS FROM users LIKE "daily_message_limit"');
      if (columns.length > 0) {
        console.log('✅ daily_message_limit 字段存在');
      } else {
        console.log('❌ daily_message_limit 字段不存在');
      }
    } catch (error) {
      console.log('❌ 检查 daily_message_limit 字段失败:', error.message);
    }
    
    // 检查 total_messages_sent 字段
    try {
      const [columns] = await mysqlPool.execute('SHOW COLUMNS FROM users LIKE "total_messages_sent"');
      if (columns.length > 0) {
        console.log('✅ total_messages_sent 字段存在');
      } else {
        console.log('❌ total_messages_sent 字段不存在');
      }
    } catch (error) {
      console.log('❌ 检查 total_messages_sent 字段失败:', error.message);
    }
    
    // 显示完整的用户表结构
    console.log('\n2. 用户表结构:');
    try {
      const [userColumns] = await mysqlPool.execute('DESCRIBE users');
      userColumns.forEach(col => {
        console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ 获取表结构失败:', error.message);
    }
    
    // 测试用户查询
    console.log('\n3. 测试用户查询...');
    try {
      const [users] = await mysqlPool.execute('SELECT id, username, nickname, email, realname_verified, is_admin FROM users LIMIT 1');
      if (users.length > 0) {
        const user = users[0];
        console.log('✅ 用户查询成功');
        console.log('  用户信息:', {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          realname_verified: user.realname_verified,
          is_admin: user.is_admin
        });
      } else {
        console.log('⚠️ 没有找到用户数据');
      }
    } catch (error) {
      console.log('❌ 用户查询失败:', error.message);
    }
    
    console.log('\n✅ 新功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mysqlPool.end();
  }
}

// 运行测试
require('dotenv').config();
testNewFeatures(); 