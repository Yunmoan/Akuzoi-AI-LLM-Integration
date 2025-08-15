const axios = require('axios');
const { mysqlPool } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

class OAuthService {
  constructor() {
    this.clientId = process.env.OAUTH_CLIENT_ID;
    this.clientSecret = process.env.OAUTH_CLIENT_SECRET;
    this.redirectUri = process.env.OAUTH_REDIRECT_URI;
    this.authorizationUrl = process.env.OAUTH_AUTHORIZATION_URL;
    this.tokenUrl = process.env.OAUTH_TOKEN_URL;
    this.userDataUrl = process.env.OAUTH_USER_DATA_URL;
  }

  // 生成授权URL
  generateAuthUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state
    });

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  // 获取访问令牌
  async getAccessToken(code) {
    try {
      const response = await axios.post(this.tokenUrl, {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('获取访问令牌失败:', error.response?.data || error.message);
      throw new Error('获取访问令牌失败');
    }
  }

  // 获取用户信息
  async getUserData(accessToken) {
    try {
      const response = await axios.get(this.userDataUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.data.code !== 200 || !response.data.flag) {
        throw new Error(response.data.msg || '获取用户信息失败');
      }

      return response.data.data;
    } catch (error) {
      logger.error('获取用户信息失败:', error.response?.data || error.message);
      throw new Error('获取用户信息失败');
    }
  }

  // 处理OAuth回调
  async handleCallback(code, state) {
    try {
      // 获取访问令牌
      const tokenData = await this.getAccessToken(code);
      
      if (!tokenData.access_token) {
        throw new Error('未获取到访问令牌');
      }

      // 获取用户信息
      const userData = await this.getUserData(tokenData.access_token);

      // 检查实名认证状态
      if (process.env.ENABLE_REALNAME_CHECK === 'true' && !userData.realname) {
        throw new Error('请完成实名认证');
      }

      // 查找或创建用户
      const user = await this.findOrCreateUser(userData);

      // 生成JWT令牌
      const token = generateToken(user.id);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          realname_verified: user.realname_verified
        },
        token: token,
        isNewUser: user.isNewUser
      };

    } catch (error) {
      logger.error('OAuth回调处理失败:', error);
      throw error;
    }
  }

  // 查找或创建用户
  async findOrCreateUser(oauthUserData) {
    const connection = await mysqlPool.getConnection();
    
    try {
      // 查找现有用户
      const [existingUsers] = await connection.execute(
        'SELECT * FROM users WHERE oauth_id = ?',
        [oauthUserData.id.toString()]
      );

      if (existingUsers.length > 0) {
        // 用户已存在，更新信息
        const user = existingUsers[0];
        await connection.execute(
          'UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [oauthUserData.username, oauthUserData.email, user.id]
        );

        return {
          ...user,
          username: oauthUserData.username,
          email: oauthUserData.email,
          isNewUser: false
        };
      } else {
        // 创建新用户
        const [result] = await connection.execute(
          'INSERT INTO users (oauth_id, username, email, realname_verified) VALUES (?, ?, ?, ?)',
          [
            oauthUserData.id.toString(),
            oauthUserData.username,
            oauthUserData.email,
            oauthUserData.realname || false
          ]
        );

        const [newUsers] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [result.insertId]
        );

        return {
          ...newUsers[0],
          isNewUser: true
        };
      }
    } finally {
      connection.release();
    }
  }

  // 更新用户昵称
  async updateNickname(userId, nickname) {
    const connection = await mysqlPool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE users SET nickname = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nickname, userId]
      );

      const [users] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      return users[0];
    } finally {
      connection.release();
    }
  }
}

module.exports = new OAuthService(); 