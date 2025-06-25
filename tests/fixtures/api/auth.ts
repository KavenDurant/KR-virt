/**
 * 认证相关测试数据
 * 提供认证功能的标准测试数据
 */

// 登录请求数据
export const mockLoginRequest = {
  login_name: 'admin',
  password: 'password123',
  totp_code: '123456'
};

// 登录响应数据
export const mockLoginResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  expires_in: 3600,
  user_info: {
    login_name: 'admin',
    user_name: '系统管理员',
    user_type: 'system_admin',
    is_first_time_login: false
  }
};

// 首次登录响应数据
export const mockFirstTimeLoginResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  expires_in: 3600,
  user_info: {
    login_name: 'new_user',
    user_name: '新用户',
    user_type: 'security_auditor',
    is_first_time_login: true
  }
};

// Token刷新响应数据
export const mockTokenRefreshResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  expires_in: 3600
};

// 2FA设置数据
export const mock2FASetupData = {
  secret: 'JBSWY3DPEHPK3PXP',
  qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  backup_codes: [
    '12345678',
    '87654321',
    '11111111',
    '22222222',
    '33333333'
  ]
};

// 密码修改请求数据
export const mockPasswordChangeRequest = {
  old_password: 'old_password123',
  new_password: 'new_password456',
  confirm_password: 'new_password456'
};

// 密码修改响应数据
export const mockPasswordChangeResponse = {
  success: true,
  message: '密码修改成功'
};

// 用户权限数据
export const mockUserPermissions = {
  system_admin: [
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'cluster.create',
    'cluster.read',
    'cluster.update',
    'cluster.delete',
    'system.read',
    'system.update'
  ],
  security_admin: [
    'user.read',
    'user.update',
    'cluster.read',
    'system.read'
  ],
  security_auditor: [
    'user.read',
    'cluster.read',
    'system.read',
    'audit.read'
  ]
};

// JWT Token解码数据
export const mockDecodedToken = {
  sub: 'admin',
  user_type: 'system_admin',
  iat: 1640995200,
  exp: 1640998800,
  permissions: mockUserPermissions.system_admin
};
