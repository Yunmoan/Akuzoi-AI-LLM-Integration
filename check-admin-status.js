const { mysqlPool } = require('./config/database');

async function checkAdminStatus() {
  console.log('🔍 检查用户管理员状态...\n');
  
  const connection = await mysqlPool.getConnection();
  
  try {
    // 1. 检查所有用户的管理员状态
    console.log('1️⃣ 检查所有用户的管理员状态:');
    const [users] = await connection.execute(`
      SELECT id, username, nickname, email, is_admin, realname_verified, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    users.forEach(user => {
      console.log(`- ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname || '未设置'}, 管理员: ${user.is_admin ? '是' : '否'}, 实名认证: ${user.realname_verified ? '是' : '否'}`);
    });
    
    // 2. 统计管理员数量
    const [adminCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
    console.log(`\n📊 管理员统计: ${adminCount[0].count} 个管理员`);
    
    // 3. 检查数据库表结构
    console.log('\n2️⃣ 检查users表结构:');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin'
    `);
    
    if (columns.length > 0) {
      console.log('is_admin字段存在:', columns[0]);
    } else {
      console.log('❌ is_admin字段不存在！');
    }
    
    // 4. 提供设置管理员的选项
    if (users.length > 0) {
      console.log('\n3️⃣ 设置管理员选项:');
      console.log('要设置某个用户为管理员，请运行以下命令:');
      console.log('node set-admin.js <用户ID>');
      
      const firstUser = users[0];
      console.log(`\n示例: node set-admin.js ${firstUser.id} (将 ${firstUser.username} 设置为管理员)`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    connection.release();
  }
}

checkAdminStatus();


