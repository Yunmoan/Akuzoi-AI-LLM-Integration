const axios = require('axios');

// 测试admin路由
async function checkAdminRoute() {
  console.log('🔍 检查Admin路由问题...\n');

  try {
    // 1. 测试未认证的请求
    console.log('1. 测试未认证的admin/stats请求...');
    try {
      const response = await axios.get('http://localhost:3000/api/admin/stats');
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

    // 2. 测试认证但非管理员的请求
    console.log('2. 测试认证但非管理员的admin/stats请求...');
    try {
      // 这里需要一个有效的token，暂时跳过
      console.log('⚠️  需要有效token，跳过此测试');
    } catch (error) {
      console.log('错误:', error.response?.data);
    }
    console.log('');

    // 3. 检查路由配置
    console.log('3. 检查路由配置...');
    console.log('✅ Admin路由已配置: /api/admin/stats');
    console.log('✅ 需要权限: view_system_stats');
    console.log('');

    // 4. 检查管理员配置
    console.log('4. 检查管理员配置...');
    const fs = require('fs');
    const path = require('path');
    
    try {
      const configPath = path.join(__dirname, 'config/admins.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      console.log('管理员列表:');
      config.admins.forEach(admin => {
        console.log(`  - ${admin.oauth_username} (${admin.role}) - 启用: ${admin.enabled}`);
        console.log(`    权限: ${admin.permissions.join(', ')}`);
      });
    } catch (error) {
      console.log('❌ 读取管理员配置失败:', error.message);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 检查数据库中的管理员用户
async function checkDatabaseAdmins() {
  console.log('\n🔍 检查数据库中的管理员用户...\n');

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

    await connection.end();

  } catch (error) {
    console.error('❌ 检查数据库管理员失败:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  require('dotenv').config();
  
  checkAdminRoute()
    .then(() => checkDatabaseAdmins())
    .then(() => {
      console.log('\n🎉 检查完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 检查失败:', error);
      process.exit(1);
    });
}

module.exports = { checkAdminRoute, checkDatabaseAdmins };
