import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Tabs,
  Statistic,
  Row,
  Col,
  Progress,
  Typography,
  Descriptions,
  Alert,
  App,
  Modal,
  Form,
  Input,
  Empty,
  Spin,
} from "antd";
import SafetyConfirmModal from "@/components/SafetyConfirmModal";
import {
  SyncOutlined,
  ClusterOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ApiOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  HddOutlined,
  MonitorOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  CopyOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  SafetyOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  AppstoreOutlined,
  UsbOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  formatResourceUsage,
  formatUptime,
  formatNetworkThroughput,
  formatLoadAverage,
  formatPowerState,
} from "../../utils/format";
import {
  useSidebarSelection,
  useSidebarRefresh,
  useSidebarHostActions,
  SidebarRefreshTriggers,
  useTimeZone,
} from "../../hooks";
import { clusterInitService } from "@/services/cluster";
import networkService from "@/services/network";
import { loginService } from "@/services/login";
import type { ClusterNodesResponse } from "@/services/cluster";
import type { ClusterSummaryResponse } from "@/services/cluster";
import type { ClusterResourcesResponse } from "@/services/cluster";
import type { NodeSummaryResponse } from "@/services/cluster";
import {
  CpuPerformanceChart,
  MemoryPerformanceChart,
  DiskPerformanceChart,
  NetworkPerformanceChart,
} from "@/components/ClusterComponent";
import DiskDeviceTreeTable from "@/components/DiskDeviceTreeTable";

const { Text } = Typography;

// 定义扩展的资源类型用于表格展示
interface ExpandableResourceNode {
  key: string;
  id: string;
  type: string;
  class_: string;
  provider: string;
  attributes: Record<string, string>;
  operations: Array<{ name: string; interval: string; timeout: string }>;
  isGroup: boolean;
  resourceCount?: number;
  groupName?: string;
  children?: ExpandableResourceNode[];
}

// 获取状态标签
const getStatusTag = (status: string) => {
  switch (status) {
    case "running":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          运行中
        </Tag>
      );
    case "healthy":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          健康
        </Tag>
      );
    case "warning":
      return (
        <Tag icon={<ExclamationCircleOutlined />} color="warning">
          警告
        </Tag>
      );
    case "maintenance":
      return (
        <Tag icon={<SyncOutlined spin />} color="processing">
          维护中
        </Tag>
      );
    case "error":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          错误
        </Tag>
      );
    case "connected":
      return <Tag color="success">已连接</Tag>;
    case "disconnected":
      return <Tag color="error">已断开</Tag>;
    case "active":
      return <Tag color="success">活跃</Tag>;
    case "online":
      return <Tag color="success">在线</Tag>;
    case "offline":
      return <Tag color="error">离线</Tag>;
    case "stopped":
      return <Tag color="default">已停止</Tag>;
    case "suspended":
      return <Tag color="warning">已挂起</Tag>;
    case "standby":
      return <Tag color="orange">待机</Tag>;
    case "started":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          已启动
        </Tag>
      );
    case "failed":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          失败
        </Tag>
      );
    case "inactive":
      return <Tag color="default">未激活</Tag>;
    default:
      return <Tag color="default">{status}</Tag>;
  }
};

/**
 * 集群管理主组件
 *
 * 重构说明：
 * - 使用 useSidebarSelection Hook 统一管理侧边栏选择状态
 * - 使用 useSidebarRefresh Hook 处理刷新事件
 * - 使用 useSidebarHostActions Hook 处理主机操作
 * - 简化了事件处理逻辑，提高了代码可维护性
 */
const ClusterManagement: React.FC = () => {
  const { modal, message } = App.useApp();

  /**
   * 侧边栏选择状态管理
   *
   * 这个Hook替代了原来复杂的事件监听逻辑：
   * - 自动处理 hierarchical-sidebar-select 事件
   * - 提供类型安全的状态访问
   * - 统一的状态清理接口
   *
   * 注意：selectedCluster 始终为 null，因为选择集群时会清空所有选择状态
   * 这样可以确保页面显示集群管理主页面而不是集群详情页面
   */
  const { selectedHost: sidebarSelectedHost, selectedVM: sidebarSelectedVM } =
    useSidebarSelection();

  /**
   * 侧边栏刷新事件处理
   *
   * 替代了原来的手动事件监听：
   * window.addEventListener("refresh-sidebar", ...)
   *
   * 现在只需要提供回调函数，Hook会自动处理事件监听和清理
   */
  useSidebarRefresh((detail) => {
    console.log("收到侧边栏刷新事件:", detail);

    // 只有在显示集群页面时才刷新
    if (detail.type === "cluster") {
      console.log("正在刷新集群数据...");
      fetchRealClusterData();
    }
  });

  /**
   * 侧边栏主机操作事件处理
   *
   * 替代了原来复杂的操作映射逻辑：
   * - 自动处理 hierarchical-sidebar-host-action 事件
   * - 标准化操作类型映射
   * - 类型安全的回调接口
   */
  useSidebarHostActions((operation, hostname, hostData) => {
    console.log("收到侧边栏主机操作事件:", { operation, hostname, hostData });

    // 确保操作类型是有效的
    const validOperations = [
      "reboot",
      "stop",
      "enter_maintenance",
      "exit_maintenance",
      "migrate",
    ];
    if (validOperations.includes(operation)) {
      handleNodeOperation(
        operation as
          | "reboot"
          | "stop"
          | "enter_maintenance"
          | "exit_maintenance"
          | "migrate",
        hostname,
      );
    } else {
      console.warn(`未知的主机操作: ${operation}`);
    }
  });

  // 全局API防重复调用机制
  const globalApiLockRef = useRef<Set<string>>(new Set());

  // 通用的API防重复包装器
  const withApiLock = useCallback(
    <T extends unknown[]>(
      apiName: string,
      apiFunc: (...args: T) => Promise<void>,
    ) => {
      return async (...args: T) => {
        const timestamp = new Date().toLocaleTimeString();
        if (globalApiLockRef.current.has(apiName)) {
          console.log(
            `⛔ [${timestamp}][API Lock] ${apiName} 正在执行中，跳过重复调用`,
          );
          return;
        }

        globalApiLockRef.current.add(apiName);
        console.log(`🔒 [${timestamp}][API Lock] 锁定 ${apiName}`);

        try {
          await apiFunc(...args);
        } finally {
          globalApiLockRef.current.delete(apiName);
          console.log(`🔓 [${timestamp}][API Unlock] 解锁 ${apiName}`);
        }
      };
    },
    [],
  );

  const [activeTab, setActiveTab] = useState("overview");

  // 真实集群数据状态
  const [realClusterData, setRealClusterData] =
    useState<ClusterNodesResponse | null>(null);
  const [realClusterLoading, setRealClusterLoading] = useState(false);
  const [realClusterError, setRealClusterError] = useState<string | null>(null);

  // 集群概览数据状态
  const [clusterSummaryData, setClusterSummaryData] =
    useState<ClusterSummaryResponse | null>(null);
  const [clusterSummaryLoading, setClusterSummaryLoading] = useState(false);
  const [clusterSummaryError, setClusterSummaryError] = useState<string | null>(
    null,
  );

  // 时间转换Hook调用
  const { localTime: lastUpdatedTime, isValid: lastUpdatedValid } = useTimeZone(
    clusterSummaryData?.last_updated || "",
    { format: "YYYY-MM-DD HH:mm:ss" },
  );
  const { localTime: lastChangeTime, isValid: lastChangeValid } = useTimeZone(
    clusterSummaryData?.last_change_time || "",
    { format: "YYYY-MM-DD HH:mm:ss" },
  );

  // 集群资源数据状态
  const [clusterResourcesData, setClusterResourcesData] =
    useState<ClusterResourcesResponse | null>(null);
  const [clusterResourcesLoading, setClusterResourcesLoading] = useState(false);
  const [clusterResourcesError, setClusterResourcesError] = useState<
    string | null
  >(null);

  // 节点摘要数据状态
  const [nodeDetailData, setNodeDetailData] =
    useState<NodeSummaryResponse | null>(null);
  const [nodeDetailLoading, setNodeDetailLoading] = useState(false);
  const [nodeDetailError, setNodeDetailError] = useState<string | null>(null);

  // 硬件信息相关状态 - PCI设备
  const [nodePCIData, setNodePCIData] = useState<
    import("@/services/cluster").NodePCIResponse | null
  >(null);
  const [nodePCILoading, setNodePCILoading] = useState(false);
  const [nodePCIError, setNodePCIError] = useState<string | null>(null);

  // 硬件信息相关状态 - 磁盘设备
  const [nodeDisksData, setNodeDisksData] = useState<
    import("@/services/cluster").NodeDisksResponse | null
  >(null);
  const [nodeDisksLoading, setNodeDisksLoading] = useState(false);
  const [nodeDisksError, setNodeDisksError] = useState<string | null>(null);

  // 硬件信息相关状态 - USB设备
  const [nodeUsbData, setNodeUsbData] = useState<
    import("@/services/cluster").NodeUsbResponse | null
  >(null);
  const [nodeUsbLoading, setNodeUsbLoading] = useState(false);
  const [nodeUsbError, setNodeUsbError] = useState<string | null>(null);

  // 硬件信息相关状态 - 网络设备
  const [nodeNetworkData, setNodeNetworkData] = useState<
    import("@/services/network").NodeNetworkListResponse | null
  >(null);
  const [nodeNetworkLoading, setNodeNetworkLoading] = useState(false);
  const [nodeNetworkError, setNodeNetworkError] = useState<string | null>(null);

  // 节点操作相关状态
  const [nodeOperationLoading, setNodeOperationLoading] = useState<
    string | null
  >(null);

  // 添加节点相关状态
  const [addNodeModalVisible, setAddNodeModalVisible] = useState(false);
  const [addNodeLoading, setAddNodeLoading] = useState(false);

  // 安全确认模态框状态
  const [safetyConfirmVisible, setSafetyConfirmVisible] = useState(false);
  const [safetyConfirmLoading, setSafetyConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "removeNode" | "dissolveCluster";
    data: { hostname?: string; nodeName?: string };
  } | null>(null);
  // 主机详情Tab状态 - 用于按需加载硬件信息
  const [hostDetailActiveTab, setHostDetailActiveTab] = useState("basic");

  // ===== 节点操作相关函数 =====

  /**
   * 检查节点是否可以进入维护模式（基于节点摘要数据检查运行中的虚拟机）
   */
  const checkCanEnterMaintenance = useCallback(
    (hostname: string): boolean => {
      try {
        // 使用节点摘要数据来检查，避免调用不存在的checkNodeStatus接口
        if (nodeDetailData && nodeDetailData.node_name === hostname) {
          return nodeDetailData.running_vm_num === 0;
        }

        // 如果没有节点详情数据，则直接允许进入维护模式
        // 后端会在实际操作时进行检查
        console.warn(
          `没有找到节点 ${hostname} 的详情数据，允许尝试进入维护模式`,
        );
        return true;
      } catch (error) {
        console.error("检查节点状态失败:", error);
        // 出错时也允许尝试，让后端来决定是否可以进入维护模式
        return true;
      }
    },
    [nodeDetailData],
  );

  // 当选择主机时，自动获取节点详细信息
  useEffect(() => {
    if (sidebarSelectedHost) {
      // 清空之前的节点摘要数据
      setNodeDetailData(null);
      setNodeDetailError(null);
      // 获取节点详细信息（将在fetchNodeDetailData定义后调用）
      // fetchNodeDetailData(sidebarSelectedHost.name);
    }
  }, [sidebarSelectedHost]);

  // 获取进度条颜色的函数
  const getProgressColor = (percent: number) => {
    if (percent > 80) return "#ff4d4f"; // 保留语义颜色：危险/错误
    if (percent > 60) return "#faad14"; // 保留语义颜色：警告
    return "#52c41a"; // 保留语义颜色：成功/正常
  };

  // 格式化公钥显示的函数
  const formatPublicKey = (pubKey: string): string => {
    if (!pubKey) return "";
    const parts = pubKey.split(" ");
    if (parts.length < 2) return pubKey;

    const keyPart = parts[1]; // 获取实际的key部分，去掉ssh-rsa等前缀
    if (keyPart.length <= 20) return pubKey;

    // 显示前8位和后8位
    return `${keyPart.substring(0, 8)}...${keyPart.substring(
      keyPart.length - 8,
    )}`;
  };

  // 复制公钥到剪贴板的函数
  const copyPublicKey = async (pubKey: string, nodeName: string) => {
    try {
      await navigator.clipboard.writeText(pubKey);
      message.success(`${nodeName} 的公钥已复制到剪贴板`);
    } catch (error) {
      console.error("复制失败:", error);
      message.error("复制公钥失败，请手动复制");
    }
  };

  // 获取真实集群数据基础函数
  const fetchRealClusterDataBase = useCallback(async () => {
    const timestamp = new Date().toLocaleTimeString();
    setRealClusterLoading(true);
    setRealClusterError(null);
    try {
      const result = await clusterInitService.getClusterNodes();
      if (result.success && result.data) {
        setRealClusterData(result.data);
      } else {
        setRealClusterError(result.message);
        message.error(result.message);
      }
    } catch (error) {
      console.error(
        `❌ [${timestamp}][API Exception] 获取集群节点数据异常:`,
        error,
      );
      const errorMessage = "获取集群数据失败，请稍后重试";
      setRealClusterError(errorMessage);
      message.error(errorMessage);
    } finally {
      setRealClusterLoading(false);
    }
  }, [message]);

  // 使用API锁包装的函数
  const fetchRealClusterData = useMemo(
    () => withApiLock("fetchRealClusterData", fetchRealClusterDataBase),
    [withApiLock, fetchRealClusterDataBase],
  );

  // 获取集群概览数据基础函数
  const fetchClusterSummaryDataBase = useCallback(async () => {
    const timestamp = new Date().toLocaleTimeString();
    setClusterSummaryLoading(true);
    setClusterSummaryError(null);
    try {
      console.log(
        `📡 [${timestamp}][API Call] 开始调用集群概览API (/cluster/summary)`,
      );
      const result = await clusterInitService.getClusterSummary();
      if (result.success && result.data) {
        setClusterSummaryData(result.data);
        console.log(`✅ [${timestamp}][API Success] 获取集群概览数据成功`);
      } else {
        console.error(
          `❌ [${timestamp}][API Error] 获取集群概览数据失败:`,
          result.message,
        );
        setClusterSummaryError(result.message);
        message.error(result.message);
      }
    } catch (error) {
      console.error(
        `❌ [${timestamp}][API Exception] 获取集群概览数据异常:`,
        error,
      );
      const errorMessage = "获取集群概览数据失败，请稍后重试";
      setClusterSummaryError(errorMessage);
      message.error(errorMessage);
    } finally {
      setClusterSummaryLoading(false);
      console.log(`🏁 [${timestamp}][API Complete] 集群概览API调用完成`);
    }
  }, [message]);

  // 使用API锁包装的函数
  const fetchClusterSummaryData = useMemo(
    () => withApiLock("fetchClusterSummaryData", fetchClusterSummaryDataBase),
    [withApiLock, fetchClusterSummaryDataBase],
  );

  // 获取集群资源数据基础函数
  const fetchClusterResourcesDataBase = useCallback(async () => {
    const timestamp = new Date().toLocaleTimeString();
    setClusterResourcesLoading(true);
    setClusterResourcesError(null);
    try {
      const result = await clusterInitService.getClusterResources();
      if (result.success && result.data) {
        setClusterResourcesData(result.data);
      } else {
        setClusterResourcesError(result.message);
        message.error(result.message);
      }
    } catch (error) {
      console.error(
        `❌ [${timestamp}][API Exception] 获取集群资源数据异常:`,
        error,
      );
      const errorMessage = "获取集群资源数据失败，请稍后重试";
      setClusterResourcesError(errorMessage);
      message.error(errorMessage);
    } finally {
      setClusterResourcesLoading(false);
    }
  }, [message]);

  // 使用API锁包装的函数
  const fetchClusterResourcesData = useMemo(
    () =>
      withApiLock("fetchClusterResourcesData", fetchClusterResourcesDataBase),
    [withApiLock, fetchClusterResourcesDataBase],
  );

  // 获取节点摘要数据基础函数
  const fetchNodeDetailDataBase = useCallback(
    async (hostname: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setNodeDetailLoading(true);
      setNodeDetailError(null);
      try {
        console.log(
          `📡 [${timestamp}][API Call] 开始调用节点摘要API (/node/summary), hostname: ${hostname}`,
        );
        const result = await clusterInitService.getNodeSummary(hostname);
        if (result.success && result.data) {
          setNodeDetailData(result.data);
          console.log(`✅ [${timestamp}][API Success] 获取节点摘要数据成功`);
        } else {
          console.error(
            `❌ [${timestamp}][API Error] 获取节点摘要数据失败:`,
            result.message,
          );
          setNodeDetailError(result.message);
          message.error(result.message);
        }
      } catch (error) {
        console.error(
          `❌ [${timestamp}][API Exception] 获取节点摘要数据异常:`,
          error,
        );
        const errorMessage = "获取节点摘要数据失败，请稍后重试";
        setNodeDetailError(errorMessage);
        message.error(errorMessage);
      } finally {
        setNodeDetailLoading(false);
        console.log(`🏁 [${timestamp}][API Complete] 节点摘要API调用完成`);
      }
    },
    [message],
  );

  // 使用API锁包装的函数
  const fetchNodeDetailData = useMemo(
    () => withApiLock("fetchNodeDetailData", fetchNodeDetailDataBase),
    [withApiLock, fetchNodeDetailDataBase],
  );

  // ===== 硬件信息获取函数 =====

  // 获取节点PCI设备信息基础函数
  const fetchNodePCIDataBase = useCallback(
    async (hostname: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setNodePCILoading(true);
      setNodePCIError(null);
      try {
        const result = await clusterInitService.getNodePCIDevices(hostname);
        if (result.success && result.data) {
          setNodePCIData(result.data);
        } else {
          console.error(
            `❌ [${timestamp}][API Error] 获取节点PCI设备数据失败:`,
            result.message,
          );
          setNodePCIError(result.message);
          message.error(result.message);
        }
      } catch (error) {
        console.error(
          `❌ [${timestamp}][API Exception] 获取节点PCI设备数据异常:`,
          error,
        );
        const errorMessage = "获取节点PCI设备数据失败，请稍后重试";
        setNodePCIError(errorMessage);
        message.error(errorMessage);
      } finally {
        setNodePCILoading(false);
      }
    },
    [message],
  );

  // 获取节点磁盘设备信息基础函数
  const fetchNodeDisksDataBase = useCallback(
    async (hostname: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setNodeDisksLoading(true);
      setNodeDisksError(null);
      try {
        const result = await clusterInitService.getNodeDiskDevices(hostname);
        if (result.success && result.data) {
          setNodeDisksData(result.data);
        } else {
          setNodeDisksError(result.message);
          message.error(result.message);
        }
      } catch (error) {
        console.error(
          `❌ [${timestamp}][API Exception] 获取节点磁盘设备数据异常:`,
          error,
        );
        const errorMessage = "获取节点磁盘设备数据失败，请稍后重试";
        setNodeDisksError(errorMessage);
        message.error(errorMessage);
      } finally {
        setNodeDisksLoading(false);
      }
    },
    [message],
  );

  // 使用API锁包装的硬件信息获取函数
  const fetchNodePCIData = useMemo(
    () => withApiLock("fetchNodePCIData", fetchNodePCIDataBase),
    [withApiLock, fetchNodePCIDataBase],
  );

  const fetchNodeDisksData = useMemo(
    () => withApiLock("fetchNodeDisksData", fetchNodeDisksDataBase),
    [withApiLock, fetchNodeDisksDataBase],
  );

  // 获取节点USB设备信息基础函数
  const fetchNodeUsbDataBase = useCallback(
    async (hostname: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setNodeUsbLoading(true);
      setNodeUsbError(null);
      try {
        const result = await clusterInitService.getNodeUsbDevices(hostname);
        if (result.success && result.data) {
          setNodeUsbData(result.data);
        } else {
          console.error(
            `❌ [${timestamp}][API Error] 获取节点USB设备数据失败:`,
            result.message,
          );
          setNodeUsbError(result.message);
          message.error(result.message);
        }
      } catch (error) {
        console.error(
          `❌ [${timestamp}][API Exception] 获取节点USB设备数据异常:`,
          error,
        );
        const errorMessage = "获取节点USB设备数据失败，请稍后重试";
        setNodeUsbError(errorMessage);
        message.error(errorMessage);
      } finally {
        setNodeUsbLoading(false);
      }
    },
    [message],
  );

  const fetchNodeUsbData = useMemo(
    () => withApiLock("fetchNodeUsbData", fetchNodeUsbDataBase),
    [withApiLock, fetchNodeUsbDataBase],
  );

  // 获取节点网络设备信息基础函数
  const fetchNodeNetworkDataBase = useCallback(
    async (hostname: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setNodeNetworkLoading(true);
      setNodeNetworkError(null);
      try {
        const result = await networkService.getNodeNetworks(hostname);
        if (result.success && result.data) {
          setNodeNetworkData(result.data);
        } else {
          console.error(
            `❌ [${timestamp}][API Error] 获取节点网络设备数据失败:`,
            result.message,
          );
          setNodeNetworkError(result.message);
          message.error(result.message);
        }
      } catch (error) {
        console.error(
          `❌ [${timestamp}][API Exception] 获取节点网络设备数据异常:`,
          error,
        );
        const errorMessage = "获取节点网络设备数据失败，请稍后重试";
        setNodeNetworkError(errorMessage);
        message.error(errorMessage);
      } finally {
        setNodeNetworkLoading(false);
      }
    },
    [message],
  );

  const fetchNodeNetworkData = useMemo(
    () => withApiLock("fetchNodeNetworkData", fetchNodeNetworkDataBase),
    [withApiLock, fetchNodeNetworkDataBase],
  );

  // ===== 节点操作相关函数 =====

  // 节点操作处理函数
  const handleNodeOperation = useCallback(
    async (
      operation:
        | "reboot"
        | "stop"
        | "enter_maintenance"
        | "exit_maintenance"
        | "migrate",
      hostname: string,
    ) => {
      const operationNames = {
        reboot: "重启",
        stop: "关机",
        enter_maintenance: "进入维护模式",
        exit_maintenance: "退出维护模式",
        migrate: "迁移虚拟机",
      };

      try {
        // 特殊处理：进入维护模式前检查虚拟机状态
        if (operation === "enter_maintenance") {
          const canEnter = checkCanEnterMaintenance(hostname);
          if (!canEnter) {
            modal.warning({
              title: "无法进入维护模式",
              content:
                "该节点上还有运行中的虚拟机，请先关闭或迁移虚拟机后再进入维护模式。",
              okText: "确定",
            });
            return;
          }
        }

        modal.confirm({
          title: `确认${operationNames[operation]}`,
          content: `您确定要对节点 ${hostname} 执行${operationNames[operation]}操作吗？`,
          okText: "确认",
          cancelText: "取消",
          onOk: async () => {
            try {
              // 在用户确认后才设置loading状态
              setNodeOperationLoading(operation);

              let result;
              switch (operation) {
                case "reboot":
                  result = await clusterInitService.rebootNode(hostname);
                  break;
                case "stop":
                  result = await clusterInitService.stopNode(hostname);
                  break;
                case "enter_maintenance":
                  result =
                    await clusterInitService.enterMaintenanceMode(hostname);
                  break;
                case "exit_maintenance":
                  result =
                    await clusterInitService.exitMaintenanceMode(hostname);
                  break;
                case "migrate":
                  // 虚拟机迁移逻辑（暂时简化处理）
                  message.info("虚拟机迁移功能正在开发中");
                  setNodeOperationLoading(null);
                  return;
                default:
                  console.error("未知的操作类型:", operation);
                  setNodeOperationLoading(null);
                  return;
              }

              if (result.success) {
                message.success(
                  result.message || `${operationNames[operation]}操作成功`,
                );
                // 操作成功后同时刷新节点详情和侧边栏数据
                setTimeout(() => {
                  // 刷新节点详情数据
                  fetchNodeDetailData(hostname);
                  // 刷新侧边栏数据以更新主机状态
                  fetchRealClusterData();
                  // 触发侧边栏刷新事件
                  SidebarRefreshTriggers.cluster(`host-${operation}-completed`);
                }, 500);
              } else {
                modal.error({
                  title: `${operationNames[operation]}失败`,
                  content:
                    result.message || `${operationNames[operation]}操作失败`,
                });
              }
            } catch (error) {
              console.error(`${operation} operation failed:`, error);
              modal.error({
                title: "操作失败",
                content: `${operationNames[operation]}操作执行失败`,
              });
            } finally {
              setNodeOperationLoading(null);
            }
          },
        });
      } catch (error) {
        console.error(`Error in handleNodeOperation:`, error);
        modal.error({
          title: "操作失败",
          content: "操作执行过程中发生错误",
        });
        // 确保在错误情况下也重置loading状态
        setNodeOperationLoading(null);
      }
    },
    [
      checkCanEnterMaintenance,
      fetchNodeDetailData,
      fetchRealClusterData,
      modal,
      message,
    ],
  );

  // 添加节点处理函数
  const handleAddNode = useCallback(
    async (values: { join_ip: string; join_hostname: string }) => {
      setAddNodeLoading(true);
      try {
        const result = await clusterInitService.addNode(values);
        if (result.success) {
          modal.success({
            title: "添加节点成功",
            content:
              result.message ||
              `节点 ${values.join_hostname} (${values.join_ip}) 已成功添加到集群`,
          });
          setAddNodeModalVisible(false);
          // 刷新物理机列表
          fetchRealClusterData();

          // 触发侧边栏刷新事件
          SidebarRefreshTriggers.cluster("node-added");
        } else {
          modal.error({
            title: "添加节点失败",
            content: result.message || "添加节点失败，请检查节点信息",
          });
        }
      } catch (error) {
        console.error("添加节点失败:", error);
        modal.error({
          title: "添加节点失败",
          content: "添加节点过程中发生错误，请稍后重试",
        });
      } finally {
        setAddNodeLoading(false);
      }
    },
    [modal, fetchRealClusterData],
  );

  // 移除节点处理函数
  const handleRemoveNode = useCallback(
    async (hostname: string, nodeName: string) => {
      // 设置待处理的操作并显示安全确认模态框
      setPendingAction({
        type: "removeNode",
        data: { hostname, nodeName },
      });
      setSafetyConfirmVisible(true);
    },
    [],
  );

  // 执行移除节点操作
  const executeRemoveNode = useCallback(
    async (hostname: string, nodeName: string) => {
      setSafetyConfirmLoading(true);
      try {
        const result = await clusterInitService.removeNode({ hostname });
        if (result.success) {
          modal.success({
            title: "移除节点成功",
            content: result.message || `节点 ${nodeName} 已成功从集群中移除`,
          });
          // 刷新物理机列表
          fetchRealClusterData();

          // 触发侧边栏刷新事件
          SidebarRefreshTriggers.cluster("node-removed");
        } else {
          modal.error({
            title: "移除节点失败",
            content: result.message || "移除节点失败，请检查节点状态",
          });
        }
      } catch (error) {
        console.error("移除节点失败:", error);
        modal.error({
          title: "移除节点失败",
          content: "移除节点过程中发生错误，请稍后重试",
        });
      } finally {
        setSafetyConfirmLoading(false);
        setSafetyConfirmVisible(false);
        setPendingAction(null);
      }
    },
    [modal, fetchRealClusterData],
  );

  // 监听主机选择变化，优化数据加载策略
  useEffect(() => {
    if (sidebarSelectedHost) {
      console.log(
        `🔍 [Node Detail] 开始获取主机 ${sidebarSelectedHost.name} 的详细信息`,
      );

      // 清空之前的所有数据，准备按需加载
      setNodeDetailData(null);
      setNodeDetailError(null);
      setNodePCIData(null);
      setNodePCIError(null);
      setNodeDisksData(null);
      setNodeDisksError(null);
      setNodeUsbData(null);
      setNodeUsbError(null);
      setNodeNetworkData(null);
      setNodeNetworkError(null);

      // 根据当前活跃的Tab加载对应的数据
      console.log(
        `📊 [Smart Loading] 根据当前Tab (${hostDetailActiveTab}) 加载对应数据: ${sidebarSelectedHost.name}`,
      );

      switch (hostDetailActiveTab) {
        case "basic":
          fetchNodeDetailData(sidebarSelectedHost.name);
          break;
        case "performance":
          // 性能监控数据由图表组件自己管理
          fetchNodeDetailData(sidebarSelectedHost.name); // 性能页面也需要基本信息
          break;
        case "hardware":
          // 硬件信息页面需要加载所有硬件数据
          fetchNodeDetailData(sidebarSelectedHost.name); // 也需要基本信息
          fetchNodePCIData(sidebarSelectedHost.name);
          fetchNodeDisksData(sidebarSelectedHost.name);
          fetchNodeUsbData(sidebarSelectedHost.name);
          fetchNodeNetworkData(sidebarSelectedHost.name);
          break;
        default:
          // 默认加载基本信息
          fetchNodeDetailData(sidebarSelectedHost.name);
          break;
      }
    }
  }, [
    sidebarSelectedHost,
    hostDetailActiveTab,
    fetchNodeDetailData,
    fetchNodePCIData,
    fetchNodeDisksData,
    fetchNodeUsbData,
    fetchNodeNetworkData,
  ]);

  // 防重复调用的标记和上一次激活的Tab追踪
  const loadingRef = useRef<Set<string>>(new Set());
  const lastActiveTabRef = useRef<string | null>(null);
  const tabChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 实时Tab数据加载函数 - 防止重复调用
  const loadTabData = useCallback(
    async (tab: string, force = false) => {
      // 防止重复调用检查
      if (!force && loadingRef.current.has(tab)) {
        console.log(
          `⚠️ [Duplicate Prevention] Tab ${tab} 正在加载中，跳过重复请求`,
        );
        return;
      }

      loadingRef.current.add(tab);
      console.log(
        `🎯 [Real-time Loading] 开始加载Tab: ${tab} - ${
          force ? "强制" : "正常"
        }刷新`,
      );

      try {
        switch (tab) {
          case "overview":
            console.log("📊 [Overview Tab] 加载集群概览数据");
            await fetchClusterSummaryData();
            console.log("✅ [Overview Tab] 集群概览数据加载完成");
            break;

          case "list":
            console.log("🖥️ [List Tab] 加载物理机列表数据");
            await fetchRealClusterData();
            console.log("✅ [List Tab] 物理机列表数据加载完成");
            break;

          case "resources":
            console.log("🔧 [Resources Tab] 加载集群资源数据");
            await fetchClusterResourcesData();
            console.log("✅ [Resources Tab] 集群资源数据加载完成");
            break;

          default:
            console.log(`❓ [Unknown Tab] 未知Tab: ${tab}`);
        }
      } catch (error) {
        console.error(`❌ [Loading Error] Tab ${tab} 加载失败:`, error);
      } finally {
        loadingRef.current.delete(tab);
        console.log(`🏁 [Loading Complete] Tab ${tab} 加载流程结束`);
      }
    },
    [fetchClusterSummaryData, fetchRealClusterData, fetchClusterResourcesData],
  );

  // 监听Tab切换，使用防抖策略和严格的重复检查
  useEffect(() => {
    console.log(
      `🔄 [Tab Switch Effect] 切换到Tab: ${activeTab}, 上次Tab: ${lastActiveTabRef.current}, 初始化状态: ${isInitialized}`,
    );

    // 清除之前的定时器
    if (tabChangeTimerRef.current) {
      clearTimeout(tabChangeTimerRef.current);
      console.log(`🧹 [Timer Clear] 清除之前的tab切换定时器`);
    }

    // 如果Tab没有实际变化，跳过（除非是强制初始化）
    if (isInitialized && lastActiveTabRef.current === activeTab) {
      console.log(`⏭️ [Skip] Tab未变化，跳过加载: ${activeTab}`);
      return;
    }

    // 更新lastActiveTab引用
    lastActiveTabRef.current = activeTab;

    // 使用防抖延迟执行，避免快速切换时的重复调用
    tabChangeTimerRef.current = setTimeout(
      () => {
        if (!isInitialized) {
          console.log(`🚀 [Initial Load] 首次加载Tab: ${activeTab}`);
          setIsInitialized(true);
        } else {
          console.log(`⚡ [Subsequent Load] Tab切换加载: ${activeTab}`);
        }
        loadTabData(activeTab);
      },
      isInitialized ? 50 : 100,
    ); // 初始化时延迟更长

    // 清理函数
    return () => {
      if (tabChangeTimerRef.current) {
        clearTimeout(tabChangeTimerRef.current);
      }
    };
  }, [activeTab, isInitialized, loadTabData]);

  // 解散集群
  const handleDissolveCluster = () => {
    // 设置待处理的操作并显示安全确认模态框
    setPendingAction({
      type: "dissolveCluster",
      data: {},
    });
    setSafetyConfirmVisible(true);
  };

  // 执行解散集群操作
  const executeDissolveCluster = useCallback(async () => {
    setSafetyConfirmLoading(true);
    try {
      console.log("开始调用解散集群API...");
      const result = await clusterInitService.dissolveCluster();
      console.log("解散集群API返回结果:", result);

      if (result.success) {
        message.success(result.message);

        // 调用登出API清除认证状态
        await loginService.logout();

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          // 跳转到bootstrap页面，该页面会自动调用status接口检查集群状态
          window.location.href = "/bootstrap";
          // 强制刷新页面，确保重新检查集群状态
          window.location.reload();
        }, 1500);
      } else {
        console.log("解散集群失败，显示错误消息:", result.message);
        message.error(result.message);
      }
    } catch (error) {
      console.error("解散集群异常:", error);
      message.error("解散集群失败，请稍后重试");
    } finally {
      setSafetyConfirmLoading(false);
      setSafetyConfirmVisible(false);
      setPendingAction(null);
    }
  }, [message]);

  // 安全确认处理函数
  const handleSafetyConfirm = useCallback(() => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case "removeNode":
        if (pendingAction.data.hostname && pendingAction.data.nodeName) {
          executeRemoveNode(
            pendingAction.data.hostname,
            pendingAction.data.nodeName,
          );
        }
        break;
      case "dissolveCluster":
        executeDissolveCluster();
        break;
      default:
        setSafetyConfirmVisible(false);
        setPendingAction(null);
    }
  }, [pendingAction, executeRemoveNode, executeDissolveCluster]);

  const handleSafetyCancel = useCallback(() => {
    setSafetyConfirmVisible(false);
    setSafetyConfirmLoading(false);
    setPendingAction(null);
  }, []);

  // 获取确认文本和相关信息
  const getSafetyConfirmProps = useCallback(() => {
    if (!pendingAction) return null;

    switch (pendingAction.type) {
      case "removeNode":
        return {
          title: "确认移除节点",
          description: `您即将从集群中移除节点 "${pendingAction.data.nodeName}"。此操作将会影响集群的可用性，请确保该节点上没有重要的运行中虚拟机。`,
          confirmText: `remove ${pendingAction.data.nodeName}`,
          warning:
            "移除节点是不可逆操作，移除后节点上的数据将无法恢复。请确保已备份重要数据。",
          confirmButtonText: "移除节点",
        };
      case "dissolveCluster":
        return {
          title: "确认解散集群",
          description: "您即将解散当前集群。此操作将清除所有集群配置和数据。",
          confirmText: "dissolve cluster",
          warning:
            "解散集群是极其危险的操作，所有数据将被永久删除且无法恢复。请确保已备份所有重要数据。",
          confirmButtonText: "解散集群",
        };
      default:
        return null;
    }
  }, [pendingAction]);

  // 真实集群节点列表的表格列定义
  const realClusterNodesColumns = [
    {
      title: "节点名称",
      dataIndex: "name",
      key: "name",
      render: (
        name: string,
        record: { node_id: string; name: string; ip: string; is_dc: boolean },
      ) => (
        <div>
          <div style={{ fontWeight: "bold" }}>
            {name}
            {record.is_dc && (
              <Tag color="purple" style={{ marginLeft: "8px" }}>
                DC
              </Tag>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            ID: {record.node_id}
          </div>
        </div>
      ),
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
      render: (ip: string) => <Tag color="blue">{ip}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        switch (status) {
          case "online":
            return (
              <Tag icon={<CheckCircleOutlined />} color="success">
                在线
              </Tag>
            );
          case "offline":
            return (
              <Tag icon={<ExclamationCircleOutlined />} color="error">
                离线
              </Tag>
            );
          case "standby":
            return (
              <Tag icon={<SyncOutlined />} color="warning">
                待机
              </Tag>
            );
          default:
            return <Tag color="default">{status}</Tag>;
        }
      },
    },
    {
      title: "资源使用",
      key: "resources",
      render: (
        _: unknown,
        record: {
          cpu_total: number | null;
          cpu_used: number | null;
          mem_total: number | null;
          mem_used: number | null;
        },
      ) => {
        // 使用格式化工具处理CPU和内存资源
        const cpuUsage = formatResourceUsage(
          record.cpu_used,
          record.cpu_total,
          "核",
        );

        const memUsage = formatResourceUsage(
          record.mem_used,
          record.mem_total,
          "GB",
        );

        return (
          <div style={{ fontSize: "12px" }}>
            <div style={{ marginBottom: "4px" }}>
              <span style={{ color: "#666" }}>CPU: </span>
              <span
                style={{
                  color:
                    cpuUsage.percentage !== null
                      ? getProgressColor(cpuUsage.percentage)
                      : "#999",
                }}
              >
                {cpuUsage.display}
              </span>
            </div>
            <div>
              <span style={{ color: "#666" }}>内存: </span>
              <span
                style={{
                  color:
                    memUsage.percentage !== null
                      ? getProgressColor(memUsage.percentage)
                      : "#999",
                }}
              >
                {memUsage.display}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "SSH公钥",
      dataIndex: "pub_key",
      key: "pub_key",
      width: "200px",
      render: (pubKey: string, record: { name: string }) => {
        if (!pubKey) {
          return (
            <span style={{ color: "#999", fontSize: "12px" }}>
              未配置SSH公钥
            </span>
          );
        }

        const formattedKey = formatPublicKey(pubKey);

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#666",
                backgroundColor: "#f5f5f5",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
              }}
            >
              {formattedKey}
            </span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyPublicKey(pubKey, record.name)}
              title="复制完整公钥"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                minWidth: "24px",
              }}
            />
          </div>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      render: (
        _: unknown,
        record: { node_id: string; name: string; ip: string },
      ) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => message.info(`查看节点 ${record.name} 详情`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<MonitorOutlined />}
            onClick={() => message.info(`监控节点 ${record.name}`)}
          >
            监控
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ApiOutlined />}
            onClick={() => message.info(`管理节点 ${record.name}`)}
          >
            管理
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<ExclamationCircleOutlined />}
            onClick={() => handleRemoveNode(record.name, record.name)}
          >
            移除
          </Button>
        </Space>
      ),
    },
  ];

  // 集群选择不再触发详情页面显示，因为我们始终显示集群管理主页面
  // 移除了集群详情相关的 useEffect

  // 移除了集群详情页面显示逻辑
  // 现在选择集群时会清空所有选择状态，始终显示集群管理主页面

  // 如果从侧边栏选中了物理主机，显示主机详情
  if (sidebarSelectedHost) {
    // 安全获取虚拟机数量 - 处理数据结构不匹配的问题
    const getHostVMsCount = (): number => {
      // 类型断言为更通用的对象类型来处理不同的数据结构
      const hostData = sidebarSelectedHost as unknown as Record<
        string,
        unknown
      >;

      // 如果有 vms 字段，返回其长度
      if (hostData.vms && Array.isArray(hostData.vms)) {
        return hostData.vms.length;
      }

      // 如果有 data 字段且包含 vms，使用 data.vms
      if (
        hostData.data &&
        typeof hostData.data === "object" &&
        hostData.data !== null &&
        "vms" in hostData.data &&
        Array.isArray((hostData.data as Record<string, unknown>).vms)
      ) {
        return ((hostData.data as Record<string, unknown>).vms as unknown[])
          .length;
      }

      // 默认返回0
      return 0;
    };

    // 计算CPU和内存使用百分比
    const cpuUsagePercent = nodeDetailData
      ? Math.round((nodeDetailData.cpu_used / nodeDetailData.cpu_total) * 100)
      : 0;
    const memoryUsagePercent = nodeDetailData
      ? Math.round((nodeDetailData.mem_used / nodeDetailData.mem_total) * 100)
      : 0;
    const totalVmsCount = nodeDetailData
      ? nodeDetailData.vms_num
      : getHostVMsCount();

    const hostDetailTabs = [
      {
        key: "basic",
        label: "基本信息",
        children: (
          <div>
            {nodeDetailLoading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <SyncOutlined spin style={{ fontSize: "24px" }} />
                <div style={{ marginTop: "16px" }}>加载节点详情中...</div>
              </div>
            ) : nodeDetailError ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Alert
                  message="获取节点详情失败"
                  description={nodeDetailError}
                  type="error"
                  showIcon
                  action={
                    <Button
                      type="primary"
                      onClick={() =>
                        fetchNodeDetailData(sidebarSelectedHost.name)
                      }
                      icon={<SyncOutlined />}
                    >
                      重新加载
                    </Button>
                  }
                />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {/* 第一行：核心性能指标 */}
                <Col xs={24} lg={12}>
                  <Card
                    title="性能指标"
                    size="small"
                    extra={
                      <Button
                        icon={<SyncOutlined />}
                        size="small"
                        loading={nodeDetailLoading}
                        onClick={() => {
                          console.log(
                            `🔄 [Basic Info Refresh] 刷新主机 ${sidebarSelectedHost.name} 的基本信息`,
                          );
                          fetchNodeDetailData(sidebarSelectedHost.name);
                        }}
                      >
                        刷新
                      </Button>
                    }
                  >
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title="CPU 使用率"
                          value={cpuUsagePercent}
                          suffix="%"
                          valueStyle={{
                            color: cpuUsagePercent > 80 ? "#ff4d4f" : "#3f8600",
                          }}
                          prefix={<ThunderboltOutlined />}
                        />
                        {nodeDetailData && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            {nodeDetailData.cpu_used}核 /{" "}
                            {nodeDetailData.cpu_total}核
                          </div>
                        )}
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="内存使用率"
                          value={memoryUsagePercent}
                          suffix="%"
                          valueStyle={{
                            color:
                              memoryUsagePercent > 80 ? "#ff4d4f" : "#3f8600",
                          }}
                          prefix={<DatabaseOutlined />}
                        />
                        {nodeDetailData && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            {(nodeDetailData.mem_used / 1024).toFixed(1)}GB /{" "}
                            {(nodeDetailData.mem_total / 1024).toFixed(1)}GB
                          </div>
                        )}
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="存储使用率"
                          value={
                            nodeDetailData?.storage_total &&
                            nodeDetailData?.storage_used
                              ? Math.round(
                                  (nodeDetailData.storage_used /
                                    nodeDetailData.storage_total) *
                                    100,
                                )
                              : 0
                          }
                          suffix="%"
                          valueStyle={{
                            color:
                              nodeDetailData?.storage_total &&
                              nodeDetailData?.storage_used &&
                              (nodeDetailData.storage_used /
                                nodeDetailData.storage_total) *
                                100 >
                                80
                                ? "#ff4d4f"
                                : "#3f8600",
                          }}
                          prefix={<HddOutlined />}
                        />
                        {nodeDetailData &&
                          nodeDetailData.storage_total &&
                          nodeDetailData.storage_used && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                marginTop: "4px",
                              }}
                            >
                              {(nodeDetailData.storage_used / 1024).toFixed(1)}
                              TB /{" "}
                              {(nodeDetailData.storage_total / 1024).toFixed(1)}
                              TB
                            </div>
                          )}
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 第二行：虚拟机统计 */}
                <Col xs={24} lg={12}>
                  <Card title="虚拟机管理" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="虚拟机总数"
                          value={totalVmsCount}
                          suffix="台"
                          prefix={<DesktopOutlined />}
                        />
                        {nodeDetailData && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            运行: {nodeDetailData.running_vm_num}台 | 停止:{" "}
                            {nodeDetailData.stopped_vm_num}台
                          </div>
                        )}
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="容量限制"
                          value={nodeDetailData?.vm_max_allowed || "未限制"}
                          suffix={nodeDetailData?.vm_max_allowed ? "台" : ""}
                          prefix={<SafetyOutlined />}
                        />
                        {nodeDetailData?.vm_max_allowed && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            剩余可创建:{" "}
                            {nodeDetailData.vm_max_allowed - totalVmsCount}台
                          </div>
                        )}
                      </Col>
                    </Row>
                    {nodeDetailData &&
                      (nodeDetailData.suspended_vm_num > 0 ||
                        nodeDetailData.paused_vm_num > 0 ||
                        nodeDetailData.error_vm_num > 0) && (
                        <div style={{ marginTop: "16px", fontSize: "12px" }}>
                          {nodeDetailData.paused_vm_num > 0 && (
                            <div>
                              暂停:{" "}
                              <span style={{ color: "#faad14" }}>
                                {nodeDetailData.paused_vm_num}台
                              </span>
                            </div>
                          )}
                          {nodeDetailData.suspended_vm_num > 0 && (
                            <div>
                              挂起:{" "}
                              <span style={{ color: "#722ed1" }}>
                                {nodeDetailData.suspended_vm_num}台
                              </span>
                            </div>
                          )}
                          {nodeDetailData.error_vm_num > 0 && (
                            <div>
                              异常:{" "}
                              <span style={{ color: "#ff4d4f" }}>
                                {nodeDetailData.error_vm_num}台
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                  </Card>
                </Col>

                {/* 第三行：系统信息 */}
                <Col xs={24} lg={12}>
                  <Card title="系统信息" size="small">
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="节点名称">
                        {nodeDetailData
                          ? nodeDetailData.node_name
                          : sidebarSelectedHost.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="集群名称">
                        {nodeDetailData ? nodeDetailData.cluster_name : "未知"}
                      </Descriptions.Item>
                      <Descriptions.Item label="电源状态">
                        {nodeDetailData?.power_state ? (
                          <Tag
                            color={
                              formatPowerState(nodeDetailData.power_state).color
                            }
                          >
                            {formatPowerState(nodeDetailData.power_state).text}
                          </Tag>
                        ) : (
                          getStatusTag(sidebarSelectedHost.status)
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="运行时间">
                        {nodeDetailData
                          ? formatUptime(nodeDetailData.running_time)
                          : sidebarSelectedHost.uptime || "未知"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                {/* 第四行：磁盘信息 */}
                <Col xs={24} lg={12}>
                  <Card title="磁盘信息" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="系统盘使用率"
                          value={
                            nodeDetailData?.disk_total &&
                            nodeDetailData?.disk_used
                              ? Math.round(
                                  (nodeDetailData.disk_used /
                                    nodeDetailData.disk_total) *
                                    100,
                                )
                              : 0
                          }
                          suffix="%"
                          valueStyle={{
                            color:
                              nodeDetailData?.disk_total &&
                              nodeDetailData?.disk_used &&
                              (nodeDetailData.disk_used /
                                nodeDetailData.disk_total) *
                                100 >
                                80
                                ? "#ff4d4f"
                                : nodeDetailData?.disk_total &&
                                    nodeDetailData?.disk_used &&
                                    (nodeDetailData.disk_used /
                                      nodeDetailData.disk_total) *
                                      100 >
                                      60
                                  ? "#faad14"
                                  : "#3f8600",
                          }}
                          prefix={<HddOutlined />}
                        />
                        {nodeDetailData &&
                          nodeDetailData.disk_total &&
                          nodeDetailData.disk_used && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                marginTop: "4px",
                              }}
                            >
                              已用: {nodeDetailData.disk_used.toFixed(2)}GB /
                              总计: {nodeDetailData.disk_total.toFixed(2)}GB
                            </div>
                          )}
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="可用空间"
                          value={
                            nodeDetailData?.disk_total &&
                            nodeDetailData?.disk_used
                              ? Number(
                                  (
                                    nodeDetailData.disk_total -
                                    nodeDetailData.disk_used
                                  ).toFixed(2),
                                )
                              : 0
                          }
                          suffix="GB"
                          valueStyle={{ color: "#3f8600" }}
                          prefix={<DatabaseOutlined />}
                        />
                        {nodeDetailData &&
                          nodeDetailData.disk_total &&
                          nodeDetailData.disk_used && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                marginTop: "4px",
                              }}
                            >
                              可用率:{" "}
                              {(
                                ((nodeDetailData.disk_total -
                                  nodeDetailData.disk_used) /
                                  nodeDetailData.disk_total) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          )}
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 第五行：网络和负载信息 */}
                <Col xs={24} lg={12}>
                  <Card title="网络和负载" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="网络吞吐量"
                          value={
                            nodeDetailData?.network_throughput
                              ? formatNetworkThroughput(
                                  nodeDetailData.network_throughput,
                                )
                              : "N/A"
                          }
                          prefix={<CloudServerOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="系统负载"
                          value={
                            nodeDetailData?.load_average
                              ? formatLoadAverage(nodeDetailData.load_average)
                                  .display
                              : "N/A"
                          }
                          prefix={<DashboardOutlined />}
                          valueStyle={{
                            color: nodeDetailData?.load_average
                              ? formatLoadAverage(nodeDetailData.load_average)
                                  .status === "high"
                                ? "#ff4d4f"
                                : formatLoadAverage(nodeDetailData.load_average)
                                      .status === "medium"
                                  ? "#faad14"
                                  : "#3f8600"
                              : "#666",
                          }}
                        />
                        {nodeDetailData?.load_average && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            1min, 5min, 15min
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            )}
          </div>
        ),
      },
      {
        key: "performance",
        label: "性能监控",
        children: (
          <div>
            {nodeDetailLoading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <SyncOutlined spin style={{ fontSize: "24px" }} />
                <div style={{ marginTop: "16px" }}>加载性能数据中...</div>
              </div>
            ) : nodeDetailError ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Alert
                  message="获取性能数据失败"
                  description={nodeDetailError}
                  type="error"
                  showIcon
                />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {/* 第一行：核心性能指标 - 响应式布局 */}
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Card>
                    <Statistic
                      title="CPU 使用率"
                      value={cpuUsagePercent}
                      precision={0}
                      valueStyle={{
                        color: cpuUsagePercent > 80 ? "#ff4d4f" : "#3f8600",
                      }}
                      prefix={<ThunderboltOutlined />}
                      suffix="%"
                    />
                    <Progress
                      percent={cpuUsagePercent}
                      size="small"
                      strokeColor={
                        cpuUsagePercent > 80
                          ? "#ff4d4f"
                          : cpuUsagePercent > 60
                            ? "#faad14"
                            : "#52c41a"
                      }
                    />
                    {nodeDetailData && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "8px",
                        }}
                      >
                        使用: {nodeDetailData.cpu_used}核 / 总计:{" "}
                        {nodeDetailData.cpu_total}核
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Card>
                    <Statistic
                      title="内存使用率"
                      value={memoryUsagePercent}
                      precision={0}
                      valueStyle={{
                        color: memoryUsagePercent > 80 ? "#ff4d4f" : "#3f8600",
                      }}
                      prefix={<DatabaseOutlined />}
                      suffix="%"
                    />
                    <Progress
                      percent={memoryUsagePercent}
                      size="small"
                      strokeColor={
                        memoryUsagePercent > 80
                          ? "#ff4d4f"
                          : memoryUsagePercent > 60
                            ? "#faad14"
                            : "#52c41a"
                      }
                    />
                    {nodeDetailData && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "8px",
                        }}
                      >
                        使用: {(nodeDetailData.mem_used / 1024).toFixed(1)}GB /
                        总计: {(nodeDetailData.mem_total / 1024).toFixed(1)}GB
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Card>
                    <Statistic
                      title="存储使用率"
                      value={
                        nodeDetailData?.storage_total &&
                        nodeDetailData?.storage_used
                          ? Math.round(
                              (nodeDetailData.storage_used /
                                nodeDetailData.storage_total) *
                                100,
                            )
                          : 0
                      }
                      precision={0}
                      valueStyle={{
                        color:
                          nodeDetailData?.storage_total &&
                          nodeDetailData?.storage_used &&
                          (nodeDetailData.storage_used /
                            nodeDetailData.storage_total) *
                            100 >
                            80
                            ? "#ff4d4f"
                            : "#3f8600",
                      }}
                      prefix={<HddOutlined />}
                      suffix="%"
                    />
                    <Progress
                      percent={
                        nodeDetailData?.storage_total &&
                        nodeDetailData?.storage_used
                          ? Math.round(
                              (nodeDetailData.storage_used /
                                nodeDetailData.storage_total) *
                                100,
                            )
                          : 0
                      }
                      size="small"
                      strokeColor={
                        nodeDetailData?.storage_total &&
                        nodeDetailData?.storage_used &&
                        (nodeDetailData.storage_used /
                          nodeDetailData.storage_total) *
                          100 >
                          80
                          ? "#ff4d4f"
                          : nodeDetailData?.storage_total &&
                              nodeDetailData?.storage_used &&
                              (nodeDetailData.storage_used /
                                nodeDetailData.storage_total) *
                                100 >
                                60
                            ? "#faad14"
                            : "#52c41a"
                      }
                    />
                    {nodeDetailData &&
                      nodeDetailData.storage_total &&
                      nodeDetailData.storage_used && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "8px",
                          }}
                        >
                          使用:{" "}
                          {(nodeDetailData.storage_used / 1024).toFixed(1)}TB /
                          总计:{" "}
                          {(nodeDetailData.storage_total / 1024).toFixed(1)}TB
                        </div>
                      )}
                  </Card>
                </Col>

                {/* 性能监控图表 - 只在当前Tab是性能监控时渲染 */}
                {hostDetailActiveTab === "performance" && (
                  <>
                    <Col xs={24} xl={12}>
                      <CpuPerformanceChart
                        hostname={sidebarSelectedHost.name}
                        shouldFetch={true}
                      />
                    </Col>
                    <Col xs={24} xl={12}>
                      <MemoryPerformanceChart
                        hostname={sidebarSelectedHost.name}
                        shouldFetch={true}
                      />
                    </Col>
                    <Col xs={24} xl={12}>
                      <DiskPerformanceChart
                        hostname={sidebarSelectedHost.name}
                        shouldFetch={true}
                      />
                    </Col>
                    <Col xs={24} xl={12}>
                      <NetworkPerformanceChart
                        hostname={sidebarSelectedHost.name}
                        shouldFetch={true}
                      />
                    </Col>
                  </>
                )}

                {/* 系统性能指标 - 响应式布局 */}
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Card>
                    <Statistic
                      title="系统负载"
                      value={
                        nodeDetailData?.load_average
                          ? formatLoadAverage(nodeDetailData.load_average)
                              .display
                          : "N/A"
                      }
                      prefix={<DashboardOutlined />}
                      valueStyle={{
                        color: nodeDetailData?.load_average
                          ? formatLoadAverage(nodeDetailData.load_average)
                              .status === "high"
                            ? "#ff4d4f"
                            : formatLoadAverage(nodeDetailData.load_average)
                                  .status === "medium"
                              ? "#faad14"
                              : "#3f8600"
                          : "#666",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "8px",
                      }}
                    >
                      1分钟, 5分钟, 15分钟平均负载
                    </div>
                    {nodeDetailData?.load_average && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          marginTop: "4px",
                        }}
                      >
                        负载状态:{" "}
                        {formatLoadAverage(nodeDetailData.load_average)
                          .status === "high"
                          ? "高负载"
                          : formatLoadAverage(nodeDetailData.load_average)
                                .status === "medium"
                            ? "中等负载"
                            : "低负载"}
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Card>
                    <Statistic
                      title="网络吞吐量"
                      value={
                        nodeDetailData?.network_throughput
                          ? formatNetworkThroughput(
                              nodeDetailData.network_throughput,
                            )
                          : "N/A"
                      }
                      prefix={<CloudServerOutlined />}
                    />
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "8px",
                      }}
                    >
                      当前网络接口速率
                    </div>
                    {nodeDetailData?.network_throughput && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          marginTop: "4px",
                        }}
                      >
                        {nodeDetailData.network_throughput >= 1000
                          ? "千兆网络"
                          : "百兆网络"}
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Card>
                    <Statistic
                      title="虚拟机数量"
                      value={totalVmsCount}
                      prefix={<DesktopOutlined />}
                      suffix="台"
                    />
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "8px",
                      }}
                    >
                      <div>
                        运行:{" "}
                        <span style={{ color: "#52c41a" }}>
                          {nodeDetailData?.running_vm_num || 0}台
                        </span>
                      </div>
                      <div>
                        停止:{" "}
                        <span style={{ color: "#d9d9d9" }}>
                          {nodeDetailData?.stopped_vm_num || 0}台
                        </span>
                      </div>
                      {nodeDetailData && nodeDetailData.error_vm_num > 0 && (
                        <div>
                          异常:{" "}
                          <span style={{ color: "#ff4d4f" }}>
                            {nodeDetailData.error_vm_num}台
                          </span>
                        </div>
                      )}
                    </div>
                    {nodeDetailData?.vm_max_allowed && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          marginTop: "4px",
                        }}
                      >
                        容量限制: {nodeDetailData.vm_max_allowed}台 (剩余{" "}
                        {nodeDetailData.vm_max_allowed - totalVmsCount}台)
                      </div>
                    )}
                  </Card>
                </Col>

                {/* 系统盘监控 - 新增 */}
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Card>
                    <Statistic
                      title="系统盘使用率"
                      value={
                        nodeDetailData?.disk_total && nodeDetailData?.disk_used
                          ? Math.round(
                              (nodeDetailData.disk_used /
                                nodeDetailData.disk_total) *
                                100,
                            )
                          : 0
                      }
                      precision={0}
                      valueStyle={{
                        color:
                          nodeDetailData?.disk_total &&
                          nodeDetailData?.disk_used &&
                          (nodeDetailData.disk_used /
                            nodeDetailData.disk_total) *
                            100 >
                            80
                            ? "#ff4d4f"
                            : nodeDetailData?.disk_total &&
                                nodeDetailData?.disk_used &&
                                (nodeDetailData.disk_used /
                                  nodeDetailData.disk_total) *
                                  100 >
                                  60
                              ? "#faad14"
                              : "#3f8600",
                      }}
                      prefix={<HddOutlined />}
                      suffix="%"
                    />
                    <Progress
                      percent={
                        nodeDetailData?.disk_total && nodeDetailData?.disk_used
                          ? Math.round(
                              (nodeDetailData.disk_used /
                                nodeDetailData.disk_total) *
                                100,
                            )
                          : 0
                      }
                      size="small"
                      strokeColor={
                        nodeDetailData?.disk_total &&
                        nodeDetailData?.disk_used &&
                        (nodeDetailData.disk_used / nodeDetailData.disk_total) *
                          100 >
                          80
                          ? "#ff4d4f"
                          : nodeDetailData?.disk_total &&
                              nodeDetailData?.disk_used &&
                              (nodeDetailData.disk_used /
                                nodeDetailData.disk_total) *
                                100 >
                                60
                            ? "#faad14"
                            : "#52c41a"
                      }
                    />
                    {nodeDetailData &&
                      nodeDetailData.disk_total &&
                      nodeDetailData.disk_used && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "8px",
                          }}
                        >
                          已用: {nodeDetailData.disk_used.toFixed(2)}GB / 总计:{" "}
                          {nodeDetailData.disk_total.toFixed(2)}GB
                        </div>
                      )}
                  </Card>
                </Col>

                {/* 第三行：运行状态监控 - 响应式布局 */}
                <Col span={24}>
                  <Card title="运行状态监控" size="small">
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="电源状态"
                          value={
                            nodeDetailData?.power_state
                              ? formatPowerState(nodeDetailData.power_state)
                                  .text
                              : "在线"
                          }
                          prefix={<PoweroffOutlined />}
                          valueStyle={{
                            color: nodeDetailData?.power_state
                              ? formatPowerState(nodeDetailData.power_state)
                                  .color === "success"
                                ? "#52c41a"
                                : formatPowerState(nodeDetailData.power_state)
                                      .color === "error"
                                  ? "#ff4d4f"
                                  : "#faad14"
                              : "#52c41a",
                          }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="运行时间"
                          value={
                            nodeDetailData
                              ? formatUptime(nodeDetailData.running_time)
                              : "未知"
                          }
                          prefix={<MonitorOutlined />}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="集群角色"
                          value={
                            nodeDetailData
                              ? nodeDetailData.cluster_name || "独立节点"
                              : "未知"
                          }
                          prefix={<ClusterOutlined />}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="节点名称"
                          value={
                            nodeDetailData
                              ? nodeDetailData.node_name
                              : sidebarSelectedHost.name
                          }
                          prefix={<HddOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            )}
          </div>
        ),
      },
      {
        key: "hardware",
        label: "硬件信息",
        children: (
          <div>
            {/* 硬件信息页面统一操作栏 */}
            <Card
              size="small"
              style={{ marginBottom: 16 }}
              title="硬件信息管理"
            >
              <Space>
                <Button
                  icon={<SyncOutlined />}
                  type="primary"
                  loading={
                    nodePCILoading ||
                    nodeDisksLoading ||
                    nodeUsbLoading ||
                    nodeNetworkLoading
                  }
                  onClick={() => {
                    if (sidebarSelectedHost) {
                      console.log(
                        `🔄 [Hardware] 刷新所有硬件信息: ${sidebarSelectedHost.name}`,
                      );
                      fetchNodePCIData(sidebarSelectedHost.name);
                      fetchNodeDisksData(sidebarSelectedHost.name);
                      fetchNodeUsbData(sidebarSelectedHost.name);
                      fetchNodeNetworkData(sidebarSelectedHost.name);
                    }
                  }}
                >
                  刷新所有硬件信息
                </Button>
                <span style={{ color: "#666", fontSize: "12px" }}>
                  包含PCI设备、磁盘设备、USB设备和网络设备信息
                </span>
              </Space>
            </Card>

            <Row gutter={[16, 16]}>
              {/* PCI设备信息 */}
              <Col span={24}>
                <Card
                  title={
                    <Space>
                      <SettingOutlined />
                      <span>PCI设备列表</span>
                    </Space>
                  }
                  extra={
                    <Button
                      icon={<SyncOutlined />}
                      loading={nodePCILoading}
                      onClick={() => {
                        if (sidebarSelectedHost) {
                          fetchNodePCIData(sidebarSelectedHost.name);
                        }
                      }}
                    >
                      刷新
                    </Button>
                  }
                  size="small"
                >
                  {nodePCILoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <SyncOutlined spin style={{ fontSize: "18px" }} />
                      <div style={{ marginTop: "8px" }}>
                        加载PCI设备信息中...
                      </div>
                    </div>
                  ) : nodePCIError ? (
                    <Alert
                      message="获取PCI设备信息失败"
                      description={nodePCIError}
                      type="error"
                      showIcon
                    />
                  ) : nodePCIData && nodePCIData.devices.length > 0 ? (
                    <Table
                      dataSource={nodePCIData.devices}
                      rowKey={(record, index) => `${record.slot || index}`}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      size="small"
                      columns={[
                        {
                          title: "插槽",
                          dataIndex: "slot",
                          key: "slot",
                          width: "15%",
                          render: (slot: string) => (
                            <Tag color="blue">{slot}</Tag>
                          ),
                        },
                        {
                          title: "厂商",
                          dataIndex: "vendor_name",
                          key: "vendor_name",
                          width: "25%",
                          ellipsis: true,
                        },
                        {
                          title: "设备名称",
                          dataIndex: "device_name",
                          key: "device_name",
                          width: "30%",
                          ellipsis: true,
                        },
                        {
                          title: "设备类型",
                          dataIndex: "device_type",
                          key: "device_type",
                          width: "20%",
                          render: (type: string) => (
                            <Tag color="green">{type}</Tag>
                          ),
                        },
                        {
                          title: "IOMMU组",
                          dataIndex: "iommu_group",
                          key: "iommu_group",
                          width: "10%",
                          render: (group: number) =>
                            group !== null ? (
                              <Tag color="orange">{group}</Tag>
                            ) : (
                              <Tag color="default">-</Tag>
                            ),
                        },
                      ]}
                    />
                  ) : (
                    <Empty description="暂无PCI设备信息" />
                  )}
                </Card>
              </Col>

              {/* 磁盘设备信息 */}
              <Col span={24}>
                <Card
                  title={
                    <Space>
                      <AppstoreOutlined />
                      <span>磁盘设备列表</span>
                    </Space>
                  }
                  extra={
                    <Button
                      icon={<SyncOutlined />}
                      loading={nodeDisksLoading}
                      onClick={() => {
                        if (sidebarSelectedHost) {
                          fetchNodeDisksData(sidebarSelectedHost.name);
                        }
                      }}
                    >
                      刷新
                    </Button>
                  }
                  size="small"
                >
                  {nodeDisksLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <SyncOutlined spin style={{ fontSize: "18px" }} />
                      <div style={{ marginTop: "8px" }}>
                        加载磁盘设备信息中...
                      </div>
                    </div>
                  ) : nodeDisksError ? (
                    <Alert
                      message="获取磁盘设备信息失败"
                      description={nodeDisksError}
                      type="error"
                      showIcon
                    />
                  ) : nodeDisksData && nodeDisksData.devices.length > 0 ? (
                    <DiskDeviceTreeTable
                      devices={nodeDisksData.devices}
                      loading={nodeDisksLoading}
                    />
                  ) : (
                    <Empty description="暂无磁盘设备信息" />
                  )}
                </Card>
              </Col>

              {/* USB设备信息 */}
              <Col span={24}>
                <Card
                  title={
                    <Space>
                      <UsbOutlined />
                      <span>USB设备列表</span>
                    </Space>
                  }
                  extra={
                    <Button
                      icon={<SyncOutlined />}
                      loading={nodeUsbLoading}
                      onClick={() => {
                        if (sidebarSelectedHost) {
                          fetchNodeUsbData(sidebarSelectedHost.name);
                        }
                      }}
                    >
                      刷新
                    </Button>
                  }
                  size="small"
                >
                  {nodeUsbLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <SyncOutlined spin style={{ fontSize: "18px" }} />
                      <div style={{ marginTop: "8px" }}>
                        加载USB设备信息中...
                      </div>
                    </div>
                  ) : nodeUsbError ? (
                    <Alert
                      message="获取USB设备信息失败"
                      description={nodeUsbError}
                      type="error"
                      showIcon
                    />
                  ) : nodeUsbData && nodeUsbData.devices.length > 0 ? (
                    <Table
                      dataSource={nodeUsbData.devices}
                      rowKey={(record, index) =>
                        `${record.bus_id}-${record.device_num || index}`
                      }
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      size="small"
                      columns={[
                        {
                          title: "总线ID",
                          dataIndex: "bus_id",
                          key: "bus_id",
                          width: "12%",
                          render: (busId: string) => (
                            <Tag color="blue">{busId}</Tag>
                          ),
                        },
                        {
                          title: "设备编号",
                          dataIndex: "device_num",
                          key: "device_num",
                          width: "10%",
                          render: (deviceNum: string) => (
                            <Tag color="purple">{deviceNum}</Tag>
                          ),
                        },
                        {
                          title: "厂商ID",
                          dataIndex: "vendor_id",
                          key: "vendor_id",
                          width: "12%",
                          render: (vendorId: string) => (
                            <code style={{ fontSize: "12px" }}>{vendorId}</code>
                          ),
                        },
                        {
                          title: "产品ID",
                          dataIndex: "product_id",
                          key: "product_id",
                          width: "12%",
                          render: (productId: string) => (
                            <code style={{ fontSize: "12px" }}>
                              {productId}
                            </code>
                          ),
                        },
                        {
                          title: "厂商名称",
                          dataIndex: "vendor_name",
                          key: "vendor_name",
                          width: "20%",
                          ellipsis: true,
                        },
                        {
                          title: "产品名称",
                          dataIndex: "product_name",
                          key: "product_name",
                          width: "25%",
                          ellipsis: true,
                        },
                        {
                          title: "设备名称",
                          dataIndex: "device_name",
                          key: "device_name",
                          width: "19%",
                          ellipsis: true,
                          render: (deviceName: string) => (
                            <Tag color="green">{deviceName}</Tag>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <Empty description="暂无USB设备信息" />
                  )}
                </Card>
              </Col>

              {/* 网络设备信息 */}
              <Col span={24}>
                <Card
                  title={
                    <Space>
                      <GlobalOutlined />
                      <span>网络设备列表</span>
                    </Space>
                  }
                  extra={
                    <Button
                      icon={<SyncOutlined />}
                      loading={nodeNetworkLoading}
                      onClick={() => {
                        if (sidebarSelectedHost) {
                          fetchNodeNetworkData(sidebarSelectedHost.name);
                        }
                      }}
                    >
                      刷新
                    </Button>
                  }
                  size="small"
                >
                  {nodeNetworkLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <SyncOutlined spin style={{ fontSize: "18px" }} />
                      <div style={{ marginTop: "8px" }}>
                        加载网络设备信息中...
                      </div>
                    </div>
                  ) : nodeNetworkError ? (
                    <Alert
                      message="获取网络设备信息失败"
                      description={nodeNetworkError}
                      type="error"
                      showIcon
                    />
                  ) : nodeNetworkData && nodeNetworkData.networks.length > 0 ? (
                    <Table
                      dataSource={nodeNetworkData.networks}
                      rowKey={(record, index) => `${record.device}-${index}`}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      size="small"
                      scroll={{ x: 1200 }}
                      columns={[
                        {
                          title: "设备名称",
                          dataIndex: "device",
                          key: "device",
                          width: "12%",
                          render: (
                            device: string,
                            record: import("@/services/network").NodeNetwork,
                          ) => (
                            <Space direction="vertical" size={0}>
                              <Tag
                                color={record.is_physical ? "green" : "blue"}
                              >
                                {device}
                              </Tag>
                              <span style={{ fontSize: "11px", color: "#666" }}>
                                {record.is_physical ? "物理网卡" : "虚拟网卡"}
                              </span>
                            </Space>
                          ),
                        },
                        {
                          title: "类型",
                          dataIndex: "type",
                          key: "type",
                          width: "10%",
                          render: (type: string) => (
                            <Tag color="purple">{type}</Tag>
                          ),
                        },
                        {
                          title: "MAC地址",
                          dataIndex: "mac",
                          key: "mac",
                          width: "15%",
                          render: (mac: string) => (
                            <code style={{ fontSize: "11px" }}>{mac}</code>
                          ),
                        },
                        {
                          title: "状态",
                          dataIndex: "state",
                          key: "state",
                          width: "12%",
                          render: (state: string) => {
                            const isConnected = state.includes("连接");
                            return (
                              <Tag color={isConnected ? "success" : "default"}>
                                {state}
                              </Tag>
                            );
                          },
                        },
                        {
                          title: "IPv4地址",
                          dataIndex: "ip4_addresses",
                          key: "ip4_addresses",
                          width: "15%",
                          render: (
                            addresses: Array<{ index: number; value: string }>,
                          ) => (
                            <div>
                              {addresses && addresses.length > 0 ? (
                                addresses.map((addr, idx) => (
                                  <div key={idx} style={{ fontSize: "11px" }}>
                                    {addr.value}
                                  </div>
                                ))
                              ) : (
                                <span style={{ color: "#999" }}>--</span>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: "IPv4网关",
                          dataIndex: "ip4_gateway",
                          key: "ip4_gateway",
                          width: "12%",
                          render: (gateway: string) => (
                            <span style={{ fontSize: "11px" }}>
                              {gateway === "--" ? (
                                <span style={{ color: "#999" }}>--</span>
                              ) : (
                                gateway
                              )}
                            </span>
                          ),
                        },
                        {
                          title: "MTU",
                          dataIndex: "mtu",
                          key: "mtu",
                          width: "8%",
                          render: (mtu: number) => (
                            <Tag color="cyan">{mtu}</Tag>
                          ),
                        },
                        {
                          title: "连接",
                          dataIndex: "connection",
                          key: "connection",
                          width: "12%",
                          ellipsis: true,
                          render: (connection: string) => (
                            <span style={{ fontSize: "11px" }}>
                              {connection}
                            </span>
                          ),
                        },
                      ]}
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ margin: 0, padding: "8px 0" }}>
                            <Row gutter={16}>
                              <Col span={12}>
                                <Descriptions
                                  title="IPv4 详细信息"
                                  bordered
                                  size="small"
                                  column={1}
                                >
                                  <Descriptions.Item label="DNS服务器">
                                    {record.ip4_dns && record.ip4_dns.length > 0
                                      ? record.ip4_dns.map(
                                          (
                                            dns: {
                                              index: number;
                                              value: string;
                                            },
                                            idx: number,
                                          ) => (
                                            <div
                                              key={idx}
                                              style={{ fontSize: "11px" }}
                                            >
                                              {dns.value}
                                            </div>
                                          ),
                                        )
                                      : "--"}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="路由信息">
                                    {record.ip4_routes &&
                                    record.ip4_routes.length > 0
                                      ? record.ip4_routes.map(
                                          (
                                            route: {
                                              dst: string;
                                              nh: string;
                                              mt: number;
                                            },
                                            idx: number,
                                          ) => (
                                            <div
                                              key={idx}
                                              style={{
                                                fontSize: "10px",
                                                marginBottom: "2px",
                                              }}
                                            >
                                              目标: {route.dst} → 网关:{" "}
                                              {route.nh} (优先级: {route.mt})
                                            </div>
                                          ),
                                        )
                                      : "--"}
                                  </Descriptions.Item>
                                </Descriptions>
                              </Col>
                              <Col span={12}>
                                <Descriptions
                                  title="IPv6 详细信息"
                                  bordered
                                  size="small"
                                  column={1}
                                >
                                  <Descriptions.Item label="IPv6地址">
                                    {record.ip6_addresses &&
                                    record.ip6_addresses.length > 0
                                      ? record.ip6_addresses.map(
                                          (
                                            addr: {
                                              index: number;
                                              value: string;
                                            },
                                            idx: number,
                                          ) => (
                                            <div
                                              key={idx}
                                              style={{ fontSize: "11px" }}
                                            >
                                              {addr.value}
                                            </div>
                                          ),
                                        )
                                      : "--"}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="IPv6网关">
                                    {record.ip6_gateway === "--"
                                      ? "--"
                                      : record.ip6_gateway}
                                  </Descriptions.Item>
                                  <Descriptions.Item label="IPv6 DNS">
                                    {record.ip6_dns && record.ip6_dns.length > 0
                                      ? record.ip6_dns.map(
                                          (
                                            dns: {
                                              index: number;
                                              value: string;
                                            },
                                            idx: number,
                                          ) => (
                                            <div
                                              key={idx}
                                              style={{ fontSize: "11px" }}
                                            >
                                              {dns.value}
                                            </div>
                                          ),
                                        )
                                      : "--"}
                                  </Descriptions.Item>
                                </Descriptions>
                              </Col>
                            </Row>
                          </div>
                        ),
                        rowExpandable: () => true,
                      }}
                    />
                  ) : (
                    <Empty description="暂无网络设备信息" />
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
    ];

    return (
      <div>
        <Card
          title={
            <Space>
              <HddOutlined />
              <span>
                物理主机详情 -{" "}
                {nodeDetailData
                  ? nodeDetailData.node_name
                  : sidebarSelectedHost.name}
              </span>
              {getStatusTag(sidebarSelectedHost.status)}
              {nodeDetailLoading && (
                <SyncOutlined spin style={{ marginLeft: "8px" }} />
              )}
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<MonitorOutlined />}
                onClick={() => message.info("正在打开主机控制台...")}
              >
                控制台
              </Button>
            </Space>
          }
        >
          {/* 物理机操作区域 */}
          <Card title="主机操作" style={{ marginBottom: "16px" }} size="small">
            <Space wrap>
              {/* 根据主机状态动态显示按钮 */}
              {sidebarSelectedHost.status === "maintenance" ? (
                <>
                  {/* 维护模式下可用的操作 */}
                  <Button
                    icon={<ReloadOutlined />}
                    loading={nodeOperationLoading === "reboot"}
                    onClick={() =>
                      handleNodeOperation("reboot", sidebarSelectedHost.name)
                    }
                  >
                    重启主机
                  </Button>
                  <Button
                    icon={<PoweroffOutlined />}
                    danger
                    loading={nodeOperationLoading === "stop"}
                    onClick={() =>
                      handleNodeOperation("stop", sidebarSelectedHost.name)
                    }
                  >
                    关闭主机
                  </Button>
                  <Button
                    icon={<PlayCircleOutlined />}
                    loading={nodeOperationLoading === "exit_maintenance"}
                    onClick={() =>
                      handleNodeOperation(
                        "exit_maintenance",
                        sidebarSelectedHost.name,
                      )
                    }
                  >
                    退出维护模式
                  </Button>
                  <Button
                    icon={<CloudServerOutlined />}
                    loading={nodeOperationLoading === "migrate"}
                    onClick={() =>
                      handleNodeOperation("migrate", sidebarSelectedHost.name)
                    }
                  >
                    迁移虚拟机
                  </Button>
                </>
              ) : (
                <>
                  {/* 非维护模式下只能进入维护模式 */}
                  <Button
                    icon={<StopOutlined />}
                    loading={nodeOperationLoading === "enter_maintenance"}
                    onClick={() =>
                      handleNodeOperation(
                        "enter_maintenance",
                        sidebarSelectedHost.name,
                      )
                    }
                  >
                    进入维护模式
                  </Button>
                </>
              )}
            </Space>
          </Card>
          <Tabs
            activeKey={hostDetailActiveTab}
            onChange={(key) => {
              console.log(`🔄 [Host Detail Tab] 切换到Tab: ${key}`);
              setHostDetailActiveTab(key);

              // 按需加载：点击哪个Tab就调用对应的接口
              if (sidebarSelectedHost) {
                switch (key) {
                  case "basic":
                    // 切换到基本信息Tab时，如果数据不存在或正在加载则加载
                    if (!nodeDetailData && !nodeDetailLoading) {
                      console.log(`📊 [Basic Loading] 加载基本信息`);
                      fetchNodeDetailData(sidebarSelectedHost.name);
                    } else if (nodeDetailLoading) {
                      console.log(
                        `⏳ [Loading] 基本信息正在加载中，跳过重复请求`,
                      );
                    } else {
                      console.log(
                        `✅ [Cache Hit] 基本信息已存在，无需重新加载`,
                      );
                    }
                    break;

                  case "hardware":
                    // 确保基本信息存在（硬件页面也需要显示基本统计）
                    if (!nodeDetailData && !nodeDetailLoading) {
                      fetchNodeDetailData(sidebarSelectedHost.name);
                    }

                    // 智能加载PCI设备数据
                    if (!nodePCIData && !nodePCILoading) {
                      console.log(`📡 [PCI Loading] 加载PCI设备信息`);
                      fetchNodePCIData(sidebarSelectedHost.name);
                    } else if (nodePCILoading) {
                      console.log(
                        `⏳ [PCI Loading] PCI设备信息正在加载中，跳过重复请求`,
                      );
                    } else {
                      console.log(
                        `✅ [Cache Hit] PCI设备信息已存在，无需重新加载`,
                      );
                    }

                    // 智能加载磁盘设备数据
                    if (!nodeDisksData && !nodeDisksLoading) {
                      console.log(`💾 [Disks Loading] 加载磁盘设备信息`);
                      fetchNodeDisksData(sidebarSelectedHost.name);
                    } else if (nodeDisksLoading) {
                      console.log(
                        `⏳ [Disks Loading] 磁盘设备信息正在加载中，跳过重复请求`,
                      );
                    } else {
                      console.log(
                        `✅ [Cache Hit] 磁盘设备信息已存在，无需重新加载`,
                      );
                    }

                    // 智能加载USB设备数据
                    if (!nodeUsbData && !nodeUsbLoading) {
                      console.log(`🔌 [USB Loading] 加载USB设备信息`);
                      fetchNodeUsbData(sidebarSelectedHost.name);
                    } else if (nodeUsbLoading) {
                      console.log(
                        `⏳ [USB Loading] USB设备信息正在加载中，跳过重复请求`,
                      );
                    } else {
                      console.log(
                        `✅ [Cache Hit] USB设备信息已存在，无需重新加载`,
                      );
                    }

                    // 智能加载网络设备数据
                    if (!nodeNetworkData && !nodeNetworkLoading) {
                      console.log(`🌐 [Network Loading] 加载网络设备信息`);
                      fetchNodeNetworkData(sidebarSelectedHost.name);
                    } else if (nodeNetworkLoading) {
                      console.log(
                        `⏳ [Network Loading] 网络设备信息正在加载中，跳过重复请求`,
                      );
                    } else {
                      console.log(
                        `✅ [Cache Hit] 网络设备信息已存在，无需重新加载`,
                      );
                    }
                    break;

                  case "performance":
                    // 确保基本信息存在（性能页面需要显示基本统计）
                    if (!nodeDetailData && !nodeDetailLoading) {
                      console.log(`📊 [Performance] 加载基本信息用于性能页面`);
                      fetchNodeDetailData(sidebarSelectedHost.name);
                    }
                    // 性能监控Tab的图表数据由图表组件自己管理，无需在这里加载
                    break;

                  default:
                    console.log(`❓ [Unknown Tab] 切换到未知Tab: ${key}`);
                }
              }
            }}
            items={hostDetailTabs}
          />
        </Card>
      </div>
    );
  }

  // 如果从侧边栏选中了虚拟机，显示虚拟机详情
  if (sidebarSelectedVM) {
    const vmDetailTabs = [
      {
        key: "basic",
        label: "基本信息",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="基本配置" size="small">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="虚拟机名称">
                      {sidebarSelectedVM.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="虚拟机ID">
                      {sidebarSelectedVM.vmid}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {getStatusTag(sidebarSelectedVM.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">
                      {sidebarSelectedVM.type.toUpperCase()}
                    </Descriptions.Item>
                    <Descriptions.Item label="物理节点">
                      {sidebarSelectedVM.node}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="硬件配置" size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="CPU 核心数"
                        value={sidebarSelectedVM.cpu}
                        suffix="核"
                        prefix={<ThunderboltOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="内存大小"
                        value={sidebarSelectedVM.memory}
                        suffix="GB"
                        prefix={<DatabaseOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="磁盘大小"
                        value={sidebarSelectedVM.diskSize}
                        suffix="GB"
                        prefix={<HddOutlined />}
                      />
                    </Col>
                  </Row>
                  {sidebarSelectedVM.uptime && (
                    <div style={{ marginTop: "16px" }}>
                      <Statistic
                        title="运行时间"
                        value={sidebarSelectedVM.uptime}
                      />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
      {
        key: "operations",
        label: "操作日志",
        children: (
          <Alert
            message="虚拟机操作日志"
            description="此功能将显示虚拟机的操作日志和系统事件记录。"
            type="info"
            showIcon
          />
        ),
      },
    ];

    return (
      <div>
        <Card
          title={
            <Space>
              <DesktopOutlined />
              <span>虚拟机详情 - {sidebarSelectedVM.name}</span>
              {getStatusTag(sidebarSelectedVM.status)}
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => message.info("正在刷新虚拟机信息...")}
              >
                刷新状态
              </Button>
              <Button
                icon={<MonitorOutlined />}
                onClick={() => message.info("正在打开虚拟机控制台...")}
              >
                控制台
              </Button>
            </Space>
          }
        >
          <Tabs items={vmDetailTabs} />
        </Card>
      </div>
    );
  }

  // 只有在选择了主机或虚拟机时才不显示默认的集群管理页面
  if (sidebarSelectedHost || sidebarSelectedVM) {
    return null; // 这种情况已经在上面的条件中处理了
  }
  return (
    <Spin spinning={false} tip="加载集群数据中...">
      <div
        style={{
          width: "100%",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ClusterOutlined />
            <span>集群管理</span>
          </h3>
          <Space>
            <Button
              type="primary"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={handleDissolveCluster}
            >
              解散集群
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: "集群概览",
              children: (
                <div className="cluster-overview">
                  {clusterSummaryLoading ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <SyncOutlined spin style={{ fontSize: "24px" }} />
                      <div style={{ marginTop: "16px" }}>
                        加载集群概览数据中...
                      </div>
                    </div>
                  ) : clusterSummaryError ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <Alert
                        message="获取集群概览数据失败"
                        description={clusterSummaryError}
                        type="error"
                        showIcon
                        action={
                          <Button
                            type="primary"
                            onClick={fetchClusterSummaryData}
                            icon={<SyncOutlined />}
                          >
                            重新加载
                          </Button>
                        }
                      />
                    </div>
                  ) : clusterSummaryData ? (
                    <>
                      {/* 集群基本信息 */}
                      <Card
                        title="集群基本信息"
                        style={{ marginBottom: "16px" }}
                        extra={
                          <Button
                            icon={<SyncOutlined />}
                            onClick={fetchClusterSummaryData}
                            size="small"
                          >
                            刷新
                          </Button>
                        }
                      >
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={12}>
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label="集群名称">
                                {clusterSummaryData.cluster_name}
                              </Descriptions.Item>
                              <Descriptions.Item label="技术栈">
                                {clusterSummaryData.stack}
                              </Descriptions.Item>
                              <Descriptions.Item label="DC节点">
                                {clusterSummaryData.dc_node}
                              </Descriptions.Item>
                              <Descriptions.Item label="DC版本">
                                {clusterSummaryData.dc_version}
                              </Descriptions.Item>
                              <Descriptions.Item label="仲裁状态">
                                {clusterSummaryData.dc_quorum}
                              </Descriptions.Item>
                            </Descriptions>
                          </Col>
                          <Col xs={24} md={12}>
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label="最后更新">
                                {lastUpdatedValid
                                  ? lastUpdatedTime
                                  : clusterSummaryData.last_updated || "未知"}
                              </Descriptions.Item>
                              <Descriptions.Item label="最后变更时间">
                                {lastChangeValid
                                  ? lastChangeTime
                                  : clusterSummaryData.last_change_time ||
                                    "未知"}
                              </Descriptions.Item>
                              <Descriptions.Item label="变更用户">
                                {clusterSummaryData.last_change_user}
                              </Descriptions.Item>
                              <Descriptions.Item label="变更方式">
                                {clusterSummaryData.last_change_via}
                              </Descriptions.Item>
                              <Descriptions.Item label="变更节点">
                                {clusterSummaryData.last_change_node}
                              </Descriptions.Item>
                            </Descriptions>
                          </Col>
                        </Row>
                      </Card>

                      {/* 统计信息 */}
                      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
                        <Col xs={24} sm={8} md={6}>
                          <Card size="small">
                            <Statistic
                              title="配置节点数"
                              value={clusterSummaryData.nodes_configured}
                              prefix={<ClusterOutlined />}
                              valueStyle={{ color: "#1890ff" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={8} md={6}>
                          <Card size="small">
                            <Statistic
                              title="在线节点数"
                              value={
                                clusterSummaryData.nodes.filter(
                                  (node) => node.status === "online",
                                ).length
                              }
                              prefix={<CheckCircleOutlined />}
                              valueStyle={{ color: "#52c41a" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={8} md={6}>
                          <Card size="small">
                            <Statistic
                              title="配置资源数"
                              value={clusterSummaryData.resources_configured}
                              prefix={<DatabaseOutlined />}
                              valueStyle={{ color: "#722ed1" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={8} md={6}>
                          <Card size="small">
                            <Statistic
                              title="运行资源数"
                              value={
                                clusterSummaryData.resources.filter(
                                  (resource) => resource.status === "started",
                                ).length
                              }
                              prefix={<ThunderboltOutlined />}
                              valueStyle={{ color: "#52c41a" }}
                            />
                          </Card>
                        </Col>
                      </Row>

                      {/* 节点列表 */}
                      <Card title="集群节点" style={{ marginBottom: "16px" }}>
                        <Table
                          dataSource={clusterSummaryData.nodes}
                          rowKey="name"
                          pagination={false}
                          size="small"
                          columns={[
                            {
                              title: "节点名称",
                              dataIndex: "name",
                              key: "name",
                              render: (name: string) => (
                                <Space>
                                  <HddOutlined />
                                  <strong>{name}</strong>
                                </Space>
                              ),
                            },
                            {
                              title: "状态",
                              dataIndex: "status",
                              key: "status",
                              render: (status: string) => getStatusTag(status),
                            },
                          ]}
                        />
                      </Card>

                      {/* 资源列表 */}
                      <Card title="集群资源">
                        <Table
                          dataSource={clusterSummaryData.resources}
                          rowKey="name"
                          pagination={false}
                          size="small"
                          columns={[
                            {
                              title: "资源名称",
                              dataIndex: "name",
                              key: "name",
                              render: (name: string) => (
                                <Space>
                                  <ApiOutlined />
                                  <strong>{name}</strong>
                                </Space>
                              ),
                            },
                            {
                              title: "类型",
                              dataIndex: "type",
                              key: "type",
                              render: (type: string) => (
                                <Tag color="blue">{type}</Tag>
                              ),
                            },
                            {
                              title: "状态",
                              dataIndex: "status",
                              key: "status",
                              render: (status: string) => getStatusTag(status),
                            },
                            {
                              title: "运行节点",
                              dataIndex: "node",
                              key: "node",
                              render: (node: string) => (
                                <Tag color="geekblue">{node}</Tag>
                              ),
                            },
                          ]}
                        />
                      </Card>

                      {/* 守护进程状态 */}
                      <Card title="守护进程状态" style={{ marginTop: "16px" }}>
                        <Row gutter={[16, 16]}>
                          {Object.entries(clusterSummaryData.daemons).map(
                            ([daemon, status]) => (
                              <Col xs={24} sm={12} md={8} lg={6} key={daemon}>
                                <Card size="small">
                                  <Space
                                    direction="vertical"
                                    style={{ width: "100%" }}
                                  >
                                    <Text strong>{daemon}</Text>
                                    {getStatusTag(status)}
                                  </Space>
                                </Card>
                              </Col>
                            ),
                          )}
                        </Row>
                      </Card>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <Alert
                        message="暂无集群概览数据"
                        description="请检查集群是否正常运行"
                        type="info"
                        showIcon
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "list",
              label: "物理机列表",
              children: (
                <div>
                  {realClusterLoading ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <SyncOutlined spin style={{ fontSize: "24px" }} />
                      <div style={{ marginTop: "16px" }}>
                        加载物理机数据中...
                      </div>
                    </div>
                  ) : realClusterError ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <Alert
                        message="获取物理机数据失败"
                        description={realClusterError}
                        type="error"
                        showIcon
                        action={
                          <Button
                            type="primary"
                            onClick={fetchRealClusterData}
                            icon={<SyncOutlined />}
                          >
                            重新加载
                          </Button>
                        }
                      />
                    </div>
                  ) : realClusterData && realClusterData.nodes.length > 0 ? (
                    <div>
                      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
                        <Col xs={24} sm={8}>
                          <Card size="small">
                            <Statistic
                              title="集群名称"
                              value={realClusterData.cluster_name}
                              prefix={<ClusterOutlined />}
                              valueStyle={{ color: "#1890ff" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Card size="small">
                            <Statistic
                              title="物理机总数"
                              value={realClusterData.nodes.length}
                              prefix={<HddOutlined />}
                              valueStyle={{ color: "#1890ff" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                          <Card size="small">
                            <Statistic
                              title="在线节点"
                              value={
                                realClusterData.nodes.filter(
                                  (node) => node.status === "online",
                                ).length
                              }
                              prefix={<CheckCircleOutlined />}
                              valueStyle={{ color: "#52c41a" }}
                            />
                          </Card>
                        </Col>
                      </Row>

                      <Card
                        title={
                          <Space>
                            <HddOutlined />
                            <span>物理机节点列表</span>
                          </Space>
                        }
                        extra={
                          <Space>
                            <Button
                              size="small"
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => setAddNodeModalVisible(true)}
                            >
                              添加节点
                            </Button>
                            <Button
                              size="small"
                              icon={<SyncOutlined />}
                              onClick={fetchRealClusterData}
                            >
                              刷新
                            </Button>
                          </Space>
                        }
                      >
                        <Table
                          columns={realClusterNodesColumns}
                          dataSource={realClusterData.nodes}
                          rowKey="node_id"
                          loading={realClusterLoading}
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                          }}
                          scroll={{ x: 800 }}
                        />
                      </Card>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <Alert
                        message="暂无物理机数据"
                        description="点击下方按钮获取最新的物理机节点信息"
                        type="info"
                        showIcon
                        action={
                          <Button
                            type="primary"
                            onClick={fetchRealClusterData}
                            icon={<SyncOutlined />}
                          >
                            获取数据
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "resources",
              label: "集群资源",
              children: (
                <div>
                  {clusterResourcesLoading ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <SyncOutlined spin style={{ fontSize: "24px" }} />
                      <div style={{ marginTop: "16px" }}>
                        加载集群资源数据中...
                      </div>
                    </div>
                  ) : clusterResourcesError ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <Alert
                        message="获取集群资源数据失败"
                        description={clusterResourcesError}
                        type="error"
                        showIcon
                        action={
                          <Button
                            type="primary"
                            onClick={fetchClusterResourcesData}
                            icon={<SyncOutlined />}
                          >
                            重新加载
                          </Button>
                        }
                      />
                    </div>
                  ) : clusterResourcesData ? (
                    <>
                      {/* 资源统计概览 */}
                      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
                        <Col xs={24} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="资源组数量"
                              value={clusterResourcesData.group.length}
                              prefix={<DatabaseOutlined />}
                              valueStyle={{ color: "#722ed1" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="独立资源数量"
                              value={clusterResourcesData.resources.length}
                              prefix={<ApiOutlined />}
                              valueStyle={{ color: "#1890ff" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="资源总数"
                              value={
                                clusterResourcesData.group.reduce(
                                  (acc, group) => acc + group.resources.length,
                                  0,
                                ) + clusterResourcesData.resources.length
                              }
                              prefix={<ClusterOutlined />}
                              valueStyle={{ color: "#52c41a" }}
                            />
                          </Card>
                        </Col>
                        <Col xs={24} sm={6}>
                          <Card size="small">
                            <Statistic
                              title="监控资源数"
                              value={
                                clusterResourcesData.group.reduce(
                                  (acc, group) =>
                                    acc +
                                    group.resources.filter((r) =>
                                      r.operations.some(
                                        (op) => op.name === "monitor",
                                      ),
                                    ).length,
                                  0,
                                ) +
                                clusterResourcesData.resources.filter((r) =>
                                  r.operations.some(
                                    (op) => op.name === "monitor",
                                  ),
                                ).length
                              }
                              prefix={<CheckCircleOutlined />}
                              valueStyle={{ color: "#fa8c16" }}
                            />
                          </Card>
                        </Col>
                      </Row>

                      {/* 统一资源列表 - 可展开的树形表格 */}
                      <Card
                        title={
                          <Space>
                            <ClusterOutlined />
                            <span>集群资源列表</span>
                            <Tag color="processing">
                              {clusterResourcesData.group.reduce(
                                (acc, group) => acc + group.resources.length,
                                0,
                              ) + clusterResourcesData.resources.length}{" "}
                              个资源
                            </Tag>
                          </Space>
                        }
                        extra={
                          <Button
                            size="small"
                            icon={<SyncOutlined />}
                            onClick={fetchClusterResourcesData}
                          >
                            刷新
                          </Button>
                        }
                      >
                        <Table
                          dataSource={[
                            // 资源组作为父节点
                            ...clusterResourcesData.group.map(
                              (group, groupIndex) => ({
                                key: `group-${groupIndex}`,
                                id: group.group,
                                type: "资源组",
                                class_: "",
                                provider: "",
                                attributes: {},
                                operations: [],
                                isGroup: true,
                                resourceCount: group.resources.length,
                                children: group.resources.map(
                                  (resource, resourceIndex) => ({
                                    key: `group-${groupIndex}-resource-${resourceIndex}`,
                                    ...resource,
                                    isGroup: false,
                                    groupName: group.group,
                                  }),
                                ),
                              }),
                            ),
                            // 独立资源组（如果有独立资源的话）
                            ...(clusterResourcesData.resources.length > 0
                              ? [
                                  {
                                    key: "standalone-group",
                                    id: "独立资源",
                                    type: "资源组",
                                    class_: "",
                                    provider: "",
                                    attributes: {},
                                    operations: [],
                                    isGroup: true,
                                    resourceCount:
                                      clusterResourcesData.resources.length,
                                    children:
                                      clusterResourcesData.resources.map(
                                        (resource, resourceIndex) => ({
                                          key: `standalone-resource-${resourceIndex}`,
                                          ...resource,
                                          isGroup: false,
                                          groupName: "独立资源",
                                        }),
                                      ),
                                  },
                                ]
                              : []),
                          ]}
                          rowKey="key"
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                          }}
                          size="small"
                          expandable={{
                            defaultExpandAllRows: false,
                            indentSize: 20,
                            expandRowByClick: false,
                          }}
                          columns={[
                            {
                              title: "资源名称/ID",
                              dataIndex: "id",
                              key: "id",
                              width: "25%",
                              render: (
                                id: string,
                                record: ExpandableResourceNode,
                              ) => {
                                if (record.isGroup) {
                                  return (
                                    <div>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        <DatabaseOutlined
                                          style={{
                                            marginRight: "8px",
                                            color: "#722ed1",
                                          }}
                                        />
                                        <strong style={{ fontSize: "14px" }}>
                                          {id}
                                        </strong>
                                        <Tag
                                          color="purple"
                                          style={{ marginLeft: "8px" }}
                                        >
                                          {record.resourceCount} 个资源
                                        </Tag>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        <ApiOutlined
                                          style={{
                                            marginRight: "6px",
                                            color: "#1890ff",
                                          }}
                                        />
                                        <strong>{id}</strong>
                                      </div>
                                      <div
                                        style={{
                                          paddingLeft: "20px", // 与图标对齐
                                          fontSize: "12px",
                                          color: "#666",
                                        }}
                                      >
                                        <Tag color="blue">
                                          {record.groupName}
                                        </Tag>
                                      </div>
                                    </div>
                                  );
                                }
                              },
                            },
                            {
                              title: "类型信息",
                              key: "typeInfo",
                              width: "20%",
                              render: (_, record: ExpandableResourceNode) => {
                                if (record.isGroup) {
                                  return (
                                    <div>
                                      <Tag color="purple">资源组</Tag>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#666",
                                          marginTop: "4px",
                                        }}
                                      >
                                        包含 {record.resourceCount} 个资源
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div>
                                      <Tag color="geekblue">{record.type}</Tag>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#666",
                                          marginTop: "4px",
                                        }}
                                      >
                                        {record.class_} / {record.provider}
                                      </div>
                                    </div>
                                  );
                                }
                              },
                            },
                            {
                              title: "配置属性",
                              dataIndex: "attributes",
                              key: "attributes",
                              width: "30%",
                              render: (
                                attributes: Record<string, string>,
                                record: ExpandableResourceNode,
                              ) => {
                                if (record.isGroup) {
                                  return (
                                    <div
                                      style={{
                                        color: "#666",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      展开查看具体资源配置
                                    </div>
                                  );
                                } else {
                                  const attributeEntries =
                                    Object.entries(attributes);
                                  if (attributeEntries.length === 0) {
                                    return (
                                      <span style={{ color: "#999" }}>
                                        无配置属性
                                      </span>
                                    );
                                  }

                                  return (
                                    <div>
                                      {attributeEntries.map(([key, value]) => (
                                        <div
                                          key={key}
                                          style={{
                                            fontSize: "12px",
                                            marginBottom: "4px",
                                          }}
                                        >
                                          <Text
                                            code
                                            style={{ fontSize: "11px" }}
                                          >
                                            {key}
                                          </Text>
                                          <span style={{ marginLeft: "4px" }}>
                                            {value}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                              },
                            },
                            {
                              title: "监控配置",
                              dataIndex: "operations",
                              key: "operations",
                              width: "15%",
                              render: (
                                operations: Array<{
                                  name: string;
                                  interval: string;
                                  timeout: string;
                                }>,
                                record: ExpandableResourceNode,
                              ) => {
                                if (record.isGroup) {
                                  const totalOps = record.children
                                    ? record.children.reduce(
                                        (
                                          acc: number,
                                          child: ExpandableResourceNode,
                                        ) =>
                                          acc + (child.operations?.length || 0),
                                        0,
                                      )
                                    : 0;
                                  return (
                                    <div style={{ color: "#666" }}>
                                      <Tag color="orange">{totalOps}</Tag>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          marginTop: "2px",
                                        }}
                                      >
                                        个操作配置
                                      </div>
                                    </div>
                                  );
                                } else {
                                  if (!operations || operations.length === 0) {
                                    return (
                                      <span style={{ color: "#999" }}>
                                        无监控配置
                                      </span>
                                    );
                                  }

                                  return (
                                    <div>
                                      {operations.slice(0, 2).map((op, idx) => (
                                        <div
                                          key={idx}
                                          style={{ marginBottom: "4px" }}
                                        >
                                          <Tag color="orange">{op.name}</Tag>
                                          <div
                                            style={{
                                              fontSize: "11px",
                                              color: "#666",
                                            }}
                                          >
                                            {op.interval} / {op.timeout}
                                          </div>
                                        </div>
                                      ))}
                                      {/* {operations.length > 2 && (
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: "11px" }}
                                      >
                                        +{operations.length - 2} 更多...
                                      </Text>
                                    )} */}
                                    </div>
                                  );
                                }
                              },
                            },
                            {
                              title: "操作",
                              key: "action",
                              width: "10%",
                              render: (_, record: ExpandableResourceNode) => {
                                if (record.isGroup) {
                                  return (
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<InfoCircleOutlined />}
                                      onClick={() =>
                                        message.info(
                                          `查看资源组 ${record.id} 详情`,
                                        )
                                      }
                                    >
                                      详情
                                    </Button>
                                  );
                                } else {
                                  return (
                                    <Space size="small" direction="vertical">
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<InfoCircleOutlined />}
                                        onClick={() =>
                                          message.info(
                                            `查看资源 ${record.id} 详情`,
                                          )
                                        }
                                      >
                                        详情
                                      </Button>
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<MonitorOutlined />}
                                        onClick={() =>
                                          message.info(`监控资源 ${record.id}`)
                                        }
                                      >
                                        监控
                                      </Button>
                                    </Space>
                                  );
                                }
                              },
                            },
                          ]}
                        />
                      </Card>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                      <Alert
                        message="暂无集群资源数据"
                        description="点击下方按钮获取最新的集群资源信息"
                        type="info"
                        showIcon
                        action={
                          <Button
                            type="primary"
                            onClick={fetchClusterResourcesData}
                            icon={<SyncOutlined />}
                          >
                            获取数据
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* 添加节点弹窗 */}
        <Modal
          title="添加节点到集群"
          open={addNodeModalVisible}
          onCancel={() => {
            setAddNodeModalVisible(false);
            setAddNodeLoading(false);
            // 重置表单在destroyOnClose为true时会自动处理
          }}
          footer={null}
          destroyOnHidden
          width={500}
        >
          <Form layout="vertical" onFinish={handleAddNode} autoComplete="off">
            <Form.Item
              label="节点IP地址"
              name="join_ip"
              rules={[
                { required: true, message: "请输入节点IP地址" },
                {
                  pattern:
                    /^((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/,
                  message: "请输入有效的IP地址",
                },
              ]}
            >
              <Input placeholder="例如: 192.168.1.100" />
            </Form.Item>
            <Form.Item
              label="节点主机名"
              name="join_hostname"
              rules={[
                { required: true, message: "请输入节点主机名" },
                {
                  pattern: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/,
                  message:
                    "主机名只能包含字母、数字和连字符，且不能以连字符开头或结尾",
                },
              ]}
            >
              <Input placeholder="例如: node-2" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setAddNodeModalVisible(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={addNodeLoading}
                  icon={<PlusOutlined />}
                >
                  添加节点
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 安全确认模态框 */}
        {safetyConfirmVisible && getSafetyConfirmProps() && (
          <SafetyConfirmModal
            visible={safetyConfirmVisible}
            onConfirm={handleSafetyConfirm}
            onCancel={handleSafetyCancel}
            loading={safetyConfirmLoading}
            {...getSafetyConfirmProps()!}
          />
        )}
      </div>
    </Spin>
  );
};

export default ClusterManagement;
