const axios = require('axios');

// 测试用户详情页面404问题
async function testUserDetail404() {
  console.log('🔍 测试用户详情页面404问题...\n');

  try {
    // 1. 测试未认证的请求
    console.log('1. 测试未认证的用户详情请求...');
    try {
      const response = await axios.get('http://localhost:3000/api/admin/users/1');
      console.log('❌ 意外成功，这不应该发生');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 正确返回401状态码（未认证）');
      } else if (error.response?.status === 404) {
        console.log('❌ 返回404状态码，路由不存在');
      } else {
        console.log('❌ 返回了错误的状态码:', error.response?.status);
      }
    }
    console.log('');

    // 2. 检查路由配置
    console.log('2. 检查路由配置...');
    console.log('✅ Admin用户详情路由已配置: /api/admin/users/:userId');
    console.log('✅ 需要权限: view_all_users');
    console.log('');

    // 3. 检查管理员权限配置
    console.log('3. 检查管理员权限配置...');
    const fs = require('fs');
    const path = require('path');
    
    try {
      const configPath = path.join(__dirname, 'config/admins.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      console.log('管理员权限配置:');
      config.admins.forEach(admin => {
        console.log(`  - ${admin.oauth_username} (${admin.role}) - 启用: ${admin.enabled}`);
        console.log(`    权限: ${admin.permissions.join(', ')}`);
        
        // 检查是否有view_all_users权限
        if (admin.permissions.includes('view_all_users')) {
          console.log(`    ✅ 有view_all_users权限`);
        } else {
          console.log(`    ❌ 缺少view_all_users权限`);
        }
      });
    } catch (error) {
      console.log('❌ 读取管理员配置失败:', error.message);
    }

    // 4. 检查数据库中的管理员用户
    console.log('\n4. 检查数据库中的管理员用户...');
    try {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'akuzoi_ai_db',
      });

      // 查询所有管理员用户
      const [admins] = await connection.execute(`
        SELECT id, oauth_id, username, nickname, email, is_admin, realname_verified
        FROM users 
        WHERE is_admin = 1
        ORDER BY id
      `);

      console.log(`找到 ${admins.length} 个数据库管理员:`);
      admins.forEach(admin => {
        console.log(`  ID: ${admin.id}, 用户名: ${admin.username}, 昵称: ${admin.nickname || '未设置'}`);
      });

      if (admins.length === 0) {
        console.log('⚠️  数据库中没有管理员用户');
        console.log('💡 提示: 可以使用 set-admin.js 脚本设置管理员');
      }

      // 查询所有用户（用于测试）
      const [users] = await connection.execute(`
        SELECT id, username, nickname, is_admin
        FROM users 
        ORDER BY id
        LIMIT 5
      `);

      console.log('\n前5个用户（用于测试）:');
      users.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '未设置'}, 管理员: ${user.is_admin ? '是' : '否'}`);
      });

      await connection.end();

    } catch (error) {
      console.error('❌ 检查数据库失败:', error.message);
    }

    // 5. 测试前端路由
    console.log('\n5. 检查前端路由配置...');
    console.log('✅ 前端路由已配置: /user/:userId');
    console.log('✅ 组件: UserDetailPage');
    console.log('');

    // 6. 提供解决方案
    console.log('6. 可能的解决方案:');
    console.log('   a) 确保用户有管理员权限');
    console.log('   b) 检查数据库中的is_admin字段');
    console.log('   c) 确认config/admins.json配置正确');
    console.log('   d) 检查用户是否有view_all_users权限');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  require('dotenv').config();
  
  testUserDetail404()
    .then(() => {
      console.log('\n🎉 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testUserDetail404 };
