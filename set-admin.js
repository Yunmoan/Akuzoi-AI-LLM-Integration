const mysql = require('mysql2/promise');
require('dotenv').config();

async function setAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akuzoi_ai_db',
  });

  try {
    console.log('🔍 设置管理员权限...');
    
    // 显示所有用户
    console.log('\n1. 当前所有用户:');
    const [users] = await connection.execute(
      'SELECT id, username, nickname, is_admin FROM users ORDER BY id'
    );
    
    users.forEach(user => {
      const adminStatus = user.is_admin ? '✅ 管理员' : '❌ 普通用户';
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '无'}, 状态: ${adminStatus}`);
    });
    
    // 询问要设置哪个用户为管理员
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const userId = await new Promise((resolve) => {
      rl.question('\n请输入要设置为管理员的用户ID: ', (answer) => {
        resolve(parseInt(answer));
      });
    });
    
    rl.close();
    
    // 检查用户是否存在
    const [targetUser] = await connection.execute(
      'SELECT id, username, nickname, is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    if (targetUser.length === 0) {
      console.log('❌ 用户不存在');
      return;
    }
    
    const user = targetUser[0];
    console.log(`\n2. 目标用户信息:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - 用户名: ${user.username}`);
    console.log(`  - 昵称: ${user.nickname || '无'}`);
    console.log(`  - 当前状态: ${user.is_admin ? '管理员' : '普通用户'}`);
    
    if (user.is_admin) {
      console.log('✅ 该用户已经是管理员了');
      return;
    }
    
    // 设置为管理员
    console.log('\n3. 设置为管理员...');
    await connection.execute(
      'UPDATE users SET is_admin = TRUE WHERE id = ?',
      [userId]
    );
    
    console.log('✅ 用户已设置为管理员');
    
    // 验证设置
    const [updatedUser] = await connection.execute(
      'SELECT id, username, nickname, is_admin FROM users WHERE id = ?',
      [userId]
    );
    
    console.log('\n4. 更新后的用户信息:');
    console.log(`  - ID: ${updatedUser[0].id}`);
    console.log(`  - 用户名: ${updatedUser[0].username}`);
    console.log(`  - 昵称: ${updatedUser[0].nickname || '无'}`);
    console.log(`  - 状态: ${updatedUser[0].is_admin ? '✅ 管理员' : '❌ 普通用户'}`);
    
  } catch (error) {
    console.error('❌ 设置失败:', error);
  } finally {
    await connection.end();
  }
}

// 运行脚本
setAdmin(); 