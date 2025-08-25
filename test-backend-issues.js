const mysql = require('mysql2/promise');
require('dotenv').config();

async function testBackendIssues() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akuzoi_ai_db',
  });

  try {
    console.log('🔍 测试后端API问题...');
    
    // 1. 检查用户表结构
    console.log('\n1. 检查用户表结构:');
    const [columns] = await connection.execute('DESCRIBE users');
    const requiredFields = ['id', 'oauth_id', 'username', 'realname_verified', 'is_banned', 'ban_reason', 'is_admin'];
    
    requiredFields.forEach(field => {
      const column = columns.find(col => col.Field === field);
      if (column) {
        console.log(`  ✅ ${field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      } else {
        console.log(`  ❌ ${field}: 缺失`);
      }
    });
    
    // 2. 检查智能体表
    console.log('\n2. 检查智能体配置:');
    try {
      const fs = require('fs');
      const agentsPath = './prompts/agents.json';
      if (fs.existsSync(agentsPath)) {
        const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
        console.log(`  ✅ 智能体配置文件存在，包含 ${agentsData.agents.length} 个智能体`);
        agentsData.agents.forEach(agent => {
          console.log(`    - ${agent.id}: ${agent.name} (${agent.enabled ? '启用' : '禁用'})`);
        });
      } else {
        console.log('  ❌ 智能体配置文件不存在');
      }
    } catch (error) {
      console.log(`  ❌ 读取智能体配置失败: ${error.message}`);
    }
    
    // 3. 检查当前用户状态
    console.log('\n3. 当前用户状态:');
    const [users] = await connection.execute(
      'SELECT id, username, nickname, realname_verified, is_banned, ban_reason, is_admin FROM users ORDER BY id'
    );
    
    if (users.length === 0) {
      console.log('  ❌ 没有用户数据');
    } else {
      users.forEach(user => {
        const realnameStatus = user.realname_verified ? '✅ 已实名' : '❌ 未实名';
        const banStatus = user.is_banned ? '🚫 已封禁' : '✅ 正常';
        const adminStatus = user.is_admin ? '👑 管理员' : '👤 普通用户';
        console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}`);
        console.log(`    状态: ${realnameStatus}, ${banStatus}, ${adminStatus}`);
        if (user.is_banned && user.ban_reason) {
          console.log(`    封禁原因: ${user.ban_reason}`);
        }
      });
    }
    
    // 4. 检查权限配置
    console.log('\n4. 检查权限配置:');
    try {
      const fs = require('fs');
      const adminsPath = './config/admins.json';
      if (fs.existsSync(adminsPath)) {
        const adminsData = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
        console.log(`  ✅ 管理员配置文件存在，包含 ${adminsData.admins.length} 个管理员`);
        adminsData.admins.forEach(admin => {
          console.log(`    - ${admin.oauth_username}: ${admin.role} (${admin.enabled ? '启用' : '禁用'})`);
        });
      } else {
        console.log('  ❌ 管理员配置文件不存在');
      }
    } catch (error) {
      console.log(`  ❌ 读取管理员配置失败: ${error.message}`);
    }
    
    // 5. 检查环境变量
    console.log('\n5. 检查环境变量:');
    const requiredEnvVars = [
      'JWT_SECRET',
      'OAUTH_CLIENT_ID', 
      'OAUTH_CLIENT_SECRET',
      'OAUTH_REDIRECT_URI',
      'ENABLE_REALNAME_CHECK'
    ];
    
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`  ✅ ${envVar}: 已设置`);
      } else {
        console.log(`  ❌ ${envVar}: 未设置`);
      }
    });
    
    // 6. 建议修复步骤
    console.log('\n6. 建议修复步骤:');
    console.log('  📝 如果用户被封禁但仍能访问：');
    console.log('    1. 检查 auth.js 中间件是否正确查询 is_banned 字段');
    console.log('    2. 确保所有API路由都经过认证中间件');
    console.log('    3. 验证封禁状态在数据库中的正确性');
    
    console.log('  📝 如果智能体API返回403：');
    console.log('    1. 检查用户是否有正确的权限');
    console.log('    2. 验证 is_admin 字段是否正确设置');
    console.log('    3. 检查权限中间件配置');
    
    console.log('  📝 如果OAuth回调返回500：');
    console.log('    1. 检查环境变量配置');
    console.log('    2. 验证OAuth服务配置');
    console.log('    3. 查看后端日志获取详细错误信息');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行测试
testBackendIssues(); 