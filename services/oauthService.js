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
      // 验证授权码格式
      if (!code || typeof code !== 'string' || code.trim().length === 0) {
        throw new Error('无效的授权码格式');
      }

      const tokenData = {
        grant_type: 'authorization_code',
        code: code.trim(),
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      };

      logger.debug('正在获取访问令牌，授权码长度:', code.length);

      const response = await axios.post(this.tokenUrl, tokenData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10秒超时
      });

      if (!response.data || !response.data.access_token) {
        throw new Error('OAuth服务器返回的响应格式无效');
      }

      logger.debug('成功获取访问令牌');
      return response.data;
    } catch (error) {
      logger.error('获取访问令牌失败:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        code: code ? `${code.substring(0, 10)}...` : 'null'
      });
      
      // 处理特定的OAuth错误
      if (error.response?.data?.error === 'invalid_grant') {
        // 授权码过期或无效，这是正常现象，不需要特殊处理
        throw new Error('授权码已过期，请重新获取授权链接');
      } else if (error.response?.data?.error === 'invalid_client') {
        throw new Error('客户端认证失败，请检查配置');
      } else if (error.response?.data?.error === 'redirect_uri_mismatch') {
        throw new Error('重定向URI不匹配，请检查配置');
      } else if (error.response?.data?.error === 'invalid_request') {
        throw new Error('请求参数无效，请重试');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请重试');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到OAuth服务器，请检查网络');
      }
      
      throw new Error('获取访问令牌失败，请重试');
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
      // 验证参数
      if (!code) {
        throw new Error('缺少授权码参数');
      }

      logger.debug('开始处理OAuth回调，授权码长度:', code.length);

      // 获取访问令牌
      const tokenData = await this.getAccessToken(code);
      
      if (!tokenData.access_token) {
        throw new Error('未获取到访问令牌');
      }

      logger.debug('成功获取访问令牌，开始获取用户信息');

      // 获取用户信息
      const userData = await this.getUserData(tokenData.access_token);

      if (!userData || !userData.id) {
        throw new Error('获取用户信息失败或用户信息不完整');
      }

      logger.debug('成功获取用户信息:', {
        userId: userData.id,
        username: userData.username,
        realname: userData.realname
      });

      // 查找或创建用户
      const user = await this.findOrCreateUser(userData);

      // 生成JWT令牌
      const token = generateToken(user.id);

      logger.info('OAuth登录成功:', {
        userId: user.id,
        username: user.username,
        isNewUser: user.isNewUser,
        realnameVerified: user.realname_verified
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          realname_verified: user.realname_verified,
          is_admin: user.is_admin
        },
        token: token,
        isNewUser: user.isNewUser
      };

    } catch (error) {
      logger.error('OAuth回调处理失败:', {
        error: error.message,
        code: code ? `${code.substring(0, 10)}...` : 'null',
        state: state
      });
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
        // 用户已存在，更新信息（包括实名认证状态）
        const user = existingUsers[0];
        await connection.execute(
          'UPDATE users SET username = ?, email = ?, realname_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [oauthUserData.username, oauthUserData.email, oauthUserData.realname || false, user.id]
        );

        return {
          ...user,
          username: oauthUserData.username,
          email: oauthUserData.email,
          realname_verified: oauthUserData.realname || false,
          isNewUser: false
        };
      } else {
        // 创建新用户，设置默认值
        const defaultDailyLimit = parseInt(process.env.USER_DAILY_MESSAGE_LIMIT) || 50;
        
        const [result] = await connection.execute(
          'INSERT INTO users (oauth_id, username, email, realname_verified, daily_message_limit, total_messages_sent) VALUES (?, ?, ?, ?, ?, ?)',
          [
            oauthUserData.id.toString(),
            oauthUserData.username,
            oauthUserData.email,
            oauthUserData.realname || false,  // 使用OAuth返回的实名认证状态
            defaultDailyLimit,  // 设置默认每日消息限制
            0  // 初始总消息数为0
          ]
        );

        const [newUsers] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [result.insertId]
        );

        logger.info('新用户创建成功:', {
          userId: newUsers[0].id,
          username: newUsers[0].username,
          dailyLimit: newUsers[0].daily_message_limit,
          oauthId: newUsers[0].oauth_id
        });

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