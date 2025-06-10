/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群服务类型定义
 */

// 集群状态响应
export interface ClusterStatusResponse {
  is_ready: boolean;
  is_creating: boolean;
  is_joining: boolean;
}

// 集群初始化状态
export type ClusterInitStep = 
  | 'checking'      // 检查集群状态
  | 'auth'          // 输入一次性密码
  | 'config'        // 配置集群（创建或加入）
  | 'processing'    // 处理中（创建中或加入中）
  | 'ready';        // 完成

// 集群配置类型
export type ClusterConfigType = 'create' | 'join';

// 创建集群配置
export interface CreateClusterConfig {
  clusterName: string;
  nodeRole: 'master' | 'worker';
  networkInterface: string;
  storageType: 'local' | 'shared';
  description?: string;
}

// 加入集群配置
export interface JoinClusterConfig {
  masterNodeIp: string;
  masterNodePort: number;
  joinToken: string;
  nodeRole: 'worker';
  description?: string;
}

// 集群初始化状态
export interface ClusterInitState {
  step: ClusterInitStep;
  status: ClusterStatusResponse | null;
  configType: ClusterConfigType;
  createConfig: CreateClusterConfig | null;
  joinConfig: JoinClusterConfig | null;
  isLoading: boolean;
  error: string | null;
  authToken: string | null;
}
