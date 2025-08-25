const { mysqlPool } = require('./config/database');

async function fixRealnameSync() {
  console.log('🔧 修复实名认证同步问题...\n');

  try {
    // 1. 检查当前数据库中的用户状态
    console.log('📊 当前数据库中的用户状态:');
    const [users] = await mysqlPool.execute(`
      SELECT id, oauth_id, username, email, realname_verified, created_at, updated_at 
      FROM users 
      ORDER BY id
    `);

    users.forEach(user => {
      const realnameStatus = user.realname_verified ? '✅ 已实名' : '❌ 未实名';
      console.log(`  - ID: ${user.id}, OAuth ID: ${user.oauth_id}, 用户名: ${user.username}`);
      console.log(`    邮箱: ${user.email || '无'}, 实名状态: ${realnameStatus}`);
      console.log(`    创建时间: ${user.created_at}, 更新时间: ${user.updated_at}\n`);
    });

    // 2. 模拟OAuth返回的数据（您提供的用户数据）
    const mockOAuthData = {
      "code": 200,
      "msg": "query ok",
      "data": {
        "ADMIN": true,
        "email": "l13230507790@outlook.com",
        "feat_enable": true,
        "id": 1,
        "last_access": null,
        "last_ip": "183.198.*.*",
        "last_login": "2025-08-16 00:38:15",
        "realname": true,
        "reg_ip": "2409:*:a044",
        "regip": "2409:8a04:1e18:8790:31fb:d1f7:cf61:a044",
        "regtime": "2021-07-17 13:47:57",
        "status": 0,
        "username": "Yunmoan"
      },
      "flag": true
    };

    console.log('🎯 OAuth返回的用户数据:');
    console.log(`  - 用户ID: ${mockOAuthData.data.id}`);
    console.log(`  - 用户名: ${mockOAuthData.data.username}`);
    console.log(`  - 邮箱: ${mockOAuthData.data.email}`);
    console.log(`  - 实名认证: ${mockOAuthData.data.realname ? '✅ 已实名' : '❌ 未实名'}\n`);

    // 3. 查找并更新对应用户
    const oauthId = mockOAuthData.data.id.toString();
    const [targetUsers] = await mysqlPool.execute(
      'SELECT * FROM users WHERE oauth_id = ?',
      [oauthId]
    );

    if (targetUsers.length > 0) {
      const targetUser = targetUsers[0];
      console.log('🎯 找到对应用户:');
      console.log(`  - 数据库ID: ${targetUser.id}`);
      console.log(`  - OAuth ID: ${targetUser.oauth_id}`);
      console.log(`  - 用户名: ${targetUser.username}`);
      console.log(`  - 数据库实名状态: ${targetUser.realname_verified ? '✅ 已实名' : '❌ 未实名'}`);
      console.log(`  - OAuth实名状态: ${mockOAuthData.data.realname ? '✅ 已实名' : '❌ 未实名'}`);
      
      if (targetUser.realname_verified !== mockOAuthData.data.realname) {
        console.log('\n⚠️  发现状态不一致，正在修复...');
        
        // 更新用户实名状态
        await mysqlPool.execute(
          'UPDATE users SET realname_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE oauth_id = ?',
          [mockOAuthData.data.realname, oauthId]
        );
        
        console.log('✅ 已更新用户实名认证状态');
        
        // 验证更新结果
        const [updatedUsers] = await mysqlPool.execute(
          'SELECT * FROM users WHERE oauth_id = ?',
          [oauthId]
        );
        
        if (updatedUsers.length > 0) {
          const updatedUser = updatedUsers[0];
          console.log(`\n✅ 更新后的状态: ${updatedUser.realname_verified ? '已实名' : '未实名'}`);
        }
      } else {
        console.log('\n✅ 实名认证状态一致，无需修复');
      }
    } else {
      console.log('❌ 数据库中没有找到对应的OAuth用户');
    }

    // 4. 检查修复后的所有用户状态
    console.log('\n📊 修复后的用户状态:');
    const [updatedAllUsers] = await mysqlPool.execute(`
      SELECT id, oauth_id, username, email, realname_verified 
      FROM users 
      ORDER BY id
    `);

    updatedAllUsers.forEach(user => {
      const realnameStatus = user.realname_verified ? '✅ 已实名' : '❌ 未实名';
      console.log(`  - ID: ${user.id}, OAuth ID: ${user.oauth_id}, 用户名: ${user.username}, 实名: ${realnameStatus}`);
    });

    console.log('\n🎉 修复完成！');
    console.log('\n💡 问题原因分析:');
    console.log('  1. 用户第一次登录时，OAuth服务中的 findOrCreateUser 方法');
    console.log('  2. 在创建新用户时，realname_verified 字段被硬编码为 false');
    console.log('  3. 没有使用 OAuth 返回的 realname 状态');
    console.log('  4. 现在已经修复，新用户会正确保存实名认证状态');

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await mysqlPool.end();
  }
}

// 运行修复脚本
fixRealnameSync();
