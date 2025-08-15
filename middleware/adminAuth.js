const adminService = require('../services/adminService');
const logger = require('../utils/logger');

// 管理员认证中间件
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 检查用户是否为管理员
    const admin = await adminService.isAdmin(req.user.username);
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    // 将管理员信息添加到请求对象
    req.admin = admin;
    next();
  } catch (error) {
    logger.error('管理员认证失败:', error);
    return res.status(500).json({
      success: false,
      message: '管理员认证失败'
    });
  }
};

// 检查特定权限的中间件
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 检查用户是否为管理员
      const admin = await adminService.isAdmin(req.user.username);
      if (!admin) {
        return res.status(403).json({
          success: false,
          message: '需要管理员权限'
        });
      }

      // 检查是否有特定权限
      if (!admin.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      // 将管理员信息添加到请求对象
      req.admin = admin;
      next();
    } catch (error) {
      logger.error('权限检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
};

// 检查多个权限的中间件（任一权限即可）
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 检查用户是否为管理员
      const admin = await adminService.isAdmin(req.user.username);
      if (!admin) {
        return res.status(403).json({
          success: false,
          message: '需要管理员权限'
        });
      }

      // 检查是否有任一权限
      const hasPermission = permissions.some(permission => 
        admin.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      // 将管理员信息添加到请求对象
      req.admin = admin;
      next();
    } catch (error) {
      logger.error('权限检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
};

// 检查所有权限的中间件（需要所有权限）
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 检查用户是否为管理员
      const admin = await adminService.isAdmin(req.user.username);
      if (!admin) {
        return res.status(403).json({
          success: false,
          message: '需要管理员权限'
        });
      }

      // 检查是否有所有权限
      const hasAllPermissions = permissions.every(permission => 
        admin.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }

      // 将管理员信息添加到请求对象
      req.admin = admin;
      next();
    } catch (error) {
      logger.error('权限检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
};

module.exports = {
  requireAdmin,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
}; 