/**
 * 表单测试数据
 * 提供表单组件测试所需的标准数据
 */

// 用户创建表单数据
export const mockUserCreateFormData = {
  login_name: 'test_user',
  user_name: '测试用户',
  user_type: 'security_auditor'
};

// 用户编辑表单数据
export const mockUserEditFormData = {
  id: 1,
  login_name: 'admin',
  user_name: '系统管理员',
  user_type: 'system_admin'
};

// 登录表单数据
export const mockLoginFormData = {
  login_name: 'admin',
  password: 'password123',
  totp_code: '123456',
  remember: true
};

// 密码修改表单数据
export const mockPasswordChangeFormData = {
  old_password: 'old_password123',
  new_password: 'new_password456',
  confirm_password: 'new_password456'
};

// 集群初始化表单数据
export const mockClusterInitFormData = {
  cluster_name: 'test-cluster',
  management_network: '192.168.1.0/24',
  storage_network: '192.168.2.0/24',
  hosts: [
    {
      hostname: 'node155',
      ip: '192.168.1.155',
      role: 'master'
    },
    {
      hostname: 'node156',
      ip: '192.168.1.156',
      role: 'worker'
    }
  ]
};

// 系统设置表单数据
export const mockSystemSettingsFormData = {
  system_name: 'KR-virt管理平台',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  session_timeout: 30,
  max_login_attempts: 5
};

// 表单验证规则
export const mockFormValidationRules = {
  login_name: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
  ],
  user_name: [
    { required: true, message: '请输入姓名' },
    { max: 50, message: '姓名长度不能超过50个字符' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 8, message: '密码长度至少8个字符' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      message: '密码必须包含大小写字母、数字和特殊字符' }
  ]
};
