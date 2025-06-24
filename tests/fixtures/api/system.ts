/**
 * 系统设置测试数据
 * 提供系统设置功能的标准测试数据
 */

// 系统基础设置
export const mockSystemBasicSettings = {
  system_name: 'KR-virt管理平台',
  system_version: '1.0.0',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  session_timeout: 30,
  max_login_attempts: 5,
  password_policy: {
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_expiry_days: 90
  }
};

// 网络设置
export const mockNetworkSettings = {
  management_network: {
    ip_range: '192.168.1.0/24',
    gateway: '192.168.1.1',
    dns_servers: ['8.8.8.8', '8.8.4.4']
  },
  storage_network: {
    ip_range: '192.168.2.0/24',
    gateway: '192.168.2.1',
    dns_servers: ['8.8.8.8', '8.8.4.4']
  },
  vm_network: {
    ip_range: '192.168.100.0/24',
    gateway: '192.168.100.1',
    dns_servers: ['8.8.8.8', '8.8.4.4']
  }
};

// 存储设置
export const mockStorageSettings = {
  default_storage_pool: '/var/lib/libvirt/images',
  backup_storage_pool: '/backup/vms',
  storage_pools: [
    {
      name: 'default',
      path: '/var/lib/libvirt/images',
      type: 'dir',
      capacity: '1TB',
      available: '650GB'
    },
    {
      name: 'backup',
      path: '/backup/vms',
      type: 'dir',
      capacity: '2TB',
      available: '1.8TB'
    }
  ]
};

// 安全设置
export const mockSecuritySettings = {
  enable_2fa: true,
  enable_audit_log: true,
  enable_ssl: true,
  ssl_certificate: {
    issuer: 'KR-virt CA',
    subject: 'kr-virt.local',
    valid_from: '2024-01-01',
    valid_to: '2025-01-01',
    fingerprint: 'SHA256:1234567890abcdef...'
  },
  firewall_rules: [
    {
      port: 22,
      protocol: 'tcp',
      source: '192.168.1.0/24',
      action: 'allow'
    },
    {
      port: 443,
      protocol: 'tcp',
      source: 'any',
      action: 'allow'
    }
  ]
};

// 监控设置
export const mockMonitoringSettings = {
  enable_monitoring: true,
  metrics_retention_days: 30,
  alert_thresholds: {
    cpu_usage: 80,
    memory_usage: 85,
    disk_usage: 90,
    network_latency: 100
  },
  notification_settings: {
    email_enabled: true,
    email_recipients: ['admin@kr-virt.com'],
    sms_enabled: false,
    webhook_enabled: true,
    webhook_url: 'https://hooks.slack.com/services/...'
  }
};
