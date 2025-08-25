const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRealnameStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akuzoi_ai_db',
  });

  try {
    console.log('🔍 修复实名认证状态...');
    
    // 1. 显示当前所有用户的实名认证状态
    console.log('\n1. 当前用户实名认证状态:');
    const [users] = await connection.execute(
      'SELECT id, username, nickname, realname_verified, is_banned, created_at FROM users ORDER BY id'
    );
    
    users.forEach(user => {
      const realnameStatus = user.realname_verified ? '✅ 已实名' : '❌ 未实名';
      const banStatus = user.is_banned ? '🚫 已封禁' : '✅ 正常';
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}, 实名: ${realnameStatus}, 状态: ${banStatus}`);
    });
    
    // 2. 询问是否要修复所有未实名用户
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const shouldFix = await new Promise((resolve) => {
      rl.question('\n是否要将所有未实名用户标记为未实名认证？(y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
    
    if (!shouldFix) {
      console.log('❌ 操作已取消');
      rl.close();
      return;
    }
    
    // 3. 修复实名认证状态
    console.log('\n2. 修复实名认证状态...');
    
    // 将所有用户的 realname_verified 设置为 false（除了特定用户）
    const [updateResult] = await connection.execute(
      'UPDATE users SET realname_verified = FALSE WHERE realname_verified = TRUE'
    );
    
    console.log(`✅ 已修复 ${updateResult.affectedRows} 个用户的实名认证状态`);
    
    // 4. 显示修复后的状态
    console.log('\n3. 修复后的用户状态:');
    const [updatedUsers] = await connection.execute(
      'SELECT id, username, nickname, realname_verified, is_banned FROM users ORDER BY id'
    );
    
    updatedUsers.forEach(user => {
      const realnameStatus = user.realname_verified ? '✅ 已实名' : '❌ 未实名';
      const banStatus = user.is_banned ? '🚫 已封禁' : '✅ 正常';
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}, 实名: ${realnameStatus}, 状态: ${banStatus}`);
    });
    
    // 5. 检查封禁状态
    console.log('\n4. 检查封禁用户状态...');
    const [bannedUsers] = await connection.execute(
      'SELECT id, username, nickname, is_banned, ban_reason FROM users WHERE is_banned = TRUE'
    );
    
    if (bannedUsers.length === 0) {
      console.log('✅ 没有封禁用户');
    } else {
      console.log('🚫 封禁用户列表:');
      bannedUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}, 封禁原因: ${user.ban_reason || '无'}`);
      });
    }
    
    rl.close();
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行脚本
fixRealnameStatus(); 