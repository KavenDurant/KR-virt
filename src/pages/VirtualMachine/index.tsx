/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-10 16:09:04
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-17 10:15:12
 * @FilePath: /KR-virt/src/pages/VirtualMachine/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Dropdown,
  Tooltip,
  Progress,
  Descriptions,
  Tabs,
  Modal,
  Alert,
  App,
  Switch,
  Empty,
  Spin,
  Form,
  Checkbox,
  InputNumber,
} from "antd";
import type { MenuProps, TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PoweroffOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  DownOutlined,
  PlusOutlined,
  SyncOutlined,
  ExportOutlined,
  DeleteOutlined,
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  CloudServerOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  ApiOutlined,
  AreaChartOutlined,
  ThunderboltOutlined,
  HddOutlined,
  DesktopOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PauseOutlined,
  FileImageOutlined,
  MenuOutlined,
  CodeOutlined,
  CameraOutlined,
  SaveOutlined,
  CaretRightOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";
import { useSidebarSelection } from "../../hooks";

import type { VirtualMachine as SidebarVM } from "../../services/mockData";
import {
  CreateVMModal,
  NetworkManagement,
  CDRomManagement,
  USBManagement,
  DiskManagement,
  BootManagement,
} from "./components";
import { vmService, type VMInfo, type CreateVMRequest, type VMSnapshot } from "@/services/vm";

// 使用统一的虚拟机数据类型 - 使用包含完整配置信息的 VMInfo
type VirtualMachine = VMInfo;

// 虚拟机状态分析结果接口
interface VMStatusAnalysis {
  total: number;
  runningCount: number;
  stoppedCount: number;
  errorCount: number;
  configuringCount: number;
  pausedCount: number;
  hasIssues: boolean;
  healthyPercentage: number;
}

/**
 * 分析虚拟机状态统计
 * @param vms 虚拟机列表
 * @returns 状态分析结果
 */
const analyzeVMStatus = (vms: VirtualMachine[]): VMStatusAnalysis => {
  const total = vms.length;
  const runningCount = vms.filter((vm) => vm.status === "running").length;
  const stoppedCount = vms.filter(
    (vm) => vm.status === "stopped" || vm.status === "shutoff"
  ).length;
  const errorCount = vms.filter((vm) => vm.status === "error").length;
  const configuringCount = vms.filter(
    (vm) => vm.status === "configuring"
  ).length;
  const pausedCount = vms.filter(
    (vm) => vm.status === "paused" || vm.status === "suspended"
  ).length;

  const hasIssues = errorCount > 0 || configuringCount > 0;
  const healthyCount = runningCount + stoppedCount + pausedCount;
  const healthyPercentage =
    total > 0 ? Math.round((healthyCount / total) * 100) : 100;

  return {
    total,
    runningCount,
    stoppedCount,
    errorCount,
    configuringCount,
    pausedCount,
    hasIssues,
    healthyPercentage,
  };
};

/**
 * 智能重试机制
 * @param operation 要执行的操作
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 操作结果
 */
const withRetry = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 等待一段时间后重试
      await new Promise((resolve) =>
        setTimeout(resolve, delay * (attempt + 1))
      );
      console.warn(`操作失败，正在进行第 ${attempt + 1} 次重试...`, error);
    }
  }

  throw lastError!;
};

// 备份接口
interface Backup {
  id: number;
  name: string;
  type: string;
  createTime: string;
  size: string;
  status: string;
  retention: string;
}

// 数据磁盘接口
interface DataDisk {
  id: number;
  name: string;
  type: string;
  size: number;
  used: number;
  format: string;
  storage: string;
  backup: boolean;
  cache: string;
  mount?: string;
}

// 统计信息类型
interface VMStats {
  total: number;
  running: number;
  stopped: number;
  error: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  paused?: number;
  configuring?: number;
}

/**
 * 虚拟机管理主组件
 *
 * 重构说明：
 * - 使用 useSidebarSelection Hook 统一管理侧边栏选择状态
 */
const VirtualMachineManagement: React.FC = () => {
  const { themeConfig } = useTheme();
  const { message } = App.useApp();
  const [modal, contextHolder] = Modal.useModal();

  /**
   * 侧边栏选择状态管理
   *
   * 重构优势：
   * - 复用了集群管理模块的相同逻辑
   * - 自动处理事件监听和清理
   * - 类型安全的状态访问
   * - 统一的状态清理接口
   */
  const { selectedHost: sidebarSelectedHost, selectedVM: sidebarSelectedVM } =
    useSidebarSelection();

  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(false);
  const [vmList, setVmList] = useState<VirtualMachine[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VirtualMachine | null>(null);
  const [createVMModal, setCreateVMModal] = useState(false);
  const [snapshotList, setSnapshotList] = useState<VMSnapshot[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [vmDetailActiveTab, setVmDetailActiveTab] = useState("basic"); // 新增：虚拟机详情页面的活动tab状态
  
  // 快照操作相关状态
  const [createSnapshotModal, setCreateSnapshotModal] = useState(false);
  const [createSnapshotLoading, setCreateSnapshotLoading] = useState(false);
  const [snapshotOperationLoading, setSnapshotOperationLoading] = useState(false);
  const [deleteSnapshotModal, setDeleteSnapshotModal] = useState(false);
  const [selectedSnapshotForDelete, setSelectedSnapshotForDelete] = useState<VMSnapshot | null>(null);
  
  // 引导设置相关状态
  const [bootManagementModal, setBootManagementModal] = useState(false);
  const [cpuModalVisible, setCpuModalVisible] = useState(false);
  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const [cpuForm] = Form.useForm();
  const [memoryForm] = Form.useForm();
  const [cpuLoading, setCpuLoading] = useState(false);
  const [memoryLoading, setMemoryLoading] = useState(false);
  /**
   * 侧边栏选择事件处理
   *
   * useSidebarSelection Hook 自动处理所有事件监听
   */

  // 数据加载函数
  const loadVmData = useCallback(async () => {
    setLoading(true);
    try {
      // 根据侧边栏选择状态构建请求参数
      let requestParams: {
        hostnames: string[] | null;
        vm_names: string[] | null;
      };

      if (sidebarSelectedVM) {
        // 如果选中了虚拟机，传递虚拟机名和对应的物理机名
        // 修复：兼容不同的数据结构中的主机名字段
        const vmData = sidebarSelectedVM as unknown as Record<string, unknown>;
        const hostname =
          (vmData.hostname as string) || (vmData.node as string) || "unknown";
        requestParams = {
          hostnames: [hostname],
          vm_names: [sidebarSelectedVM.name],
        };
      } else if (sidebarSelectedHost) {
        // 如果选中了物理机，传递物理机名，虚拟机名为null
        requestParams = {
          hostnames: [sidebarSelectedHost.name],
          vm_names: null,
        };
      } else {
        // 选中集群或无选择时，获取所有虚拟机
        requestParams = {
          hostnames: null,
          vm_names: null,
        };
      }

      // 使用重试机制调用API
      const response = await withRetry(
        () => vmService.getVMList(requestParams),
        2, // 最多重试2次
        1000 // 重试间隔1秒
      );

      if (response.success) {
        // 安全地获取数据，处理可能的空值情况
        const responseData = response.data || { vms: [] };

        // 直接使用服务层返回的适配后数据，无需重新处理
        const vms: VirtualMachine[] = responseData.vms || [];
        setVmList(vms);
        // 优化的用户提示逻辑
        if (vms.length === 0) {
          // 根据选择状态提供更精确的提示
          if (sidebarSelectedHost) {
            message.info({
              content: `物理机 "${sidebarSelectedHost.name}" 上暂无虚拟机`,
              duration: 3,
            });
          } else if (sidebarSelectedVM) {
            message.warning({
              content: `未找到指定的虚拟机 "${sidebarSelectedVM.name}"，可能已被删除或移动`,
              duration: 4,
            });
          } else {
            message.info({
              content: "当前集群中暂无虚拟机，您可以创建新的虚拟机",
              duration: 3,
            });
          }
        } else {
          // 使用状态分析函数进行智能提示
          const statusAnalysis = analyzeVMStatus(vms);

          // 显示状态分析结果
          if (statusAnalysis.hasIssues) {
            if (statusAnalysis.errorCount > 0) {
              message.warning({
                content: `发现 ${statusAnalysis.errorCount} 台虚拟机存在配置错误，请检查详情`,
                duration: 5,
              });
            }

            if (statusAnalysis.configuringCount > 0) {
              message.info({
                content: `有 ${statusAnalysis.configuringCount} 台虚拟机正在配置中，请稍候`,
                duration: 4,
              });
            }
          } else if (vms.length > 0) {
            // 成功加载且无问题时的简洁提示（仅在控制台）
            console.log(
              `成功加载 ${vms.length} 台虚拟机，健康度: ${statusAnalysis.healthyPercentage}%`
            );
          }
        }
      } else {
        // API调用失败的优化处理
        console.error("API调用失败:", response.message);

        // 根据错误类型提供不同的处理方式
        if (response.message?.includes("网络")) {
          message.error({
            content: "网络连接异常，请检查网络后重试",
            duration: 5,
          });
        } else if (response.message?.includes("权限")) {
          message.error({
            content: "权限不足，请联系管理员",
            duration: 5,
          });
        } else {
          message.error({
            content: `加载虚拟机列表失败: ${response.message}`,
            duration: 5,
          });
        }

        // 设置空列表，避免显示旧数据
        setVmList([]);
      }
    } catch (error) {
      console.error("加载虚拟机数据失败:", error);

      // 异常情况的用户友好提示
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          message.error({
            content: "请求超时，请检查网络连接后重试",
            duration: 5,
          });
        } else if (error.message.includes("abort")) {
          message.warning({
            content: "请求已取消",
            duration: 3,
          });
        } else {
          message.error({
            content: "系统异常，请稍后重试或联系管理员",
            duration: 5,
          });
        }
      } else {
        message.error({
          content: "未知错误，请刷新页面后重试",
          duration: 5,
        });
      }

      // 异常时也要清空列表
      setVmList([]);
    } finally {
      setLoading(false);
    }
  }, [sidebarSelectedVM, sidebarSelectedHost, message]);

  // 数据加载effect - 在组件挂载和侧边栏选择状态变化时执行
  useEffect(() => {
    loadVmData();
  }, [loadVmData]); // 当loadVmData函数变化时（即侧边栏选择状态变化时）重新加载数据

  // 计算统计信息
  const vmStats: VMStats = useMemo(() => {
    const total = vmList.length;
    const running = vmList.filter((vm) => vm.status === "running").length;
    const stopped = vmList.filter(
      (vm) => vm.status === "stopped" || vm.status === "shutoff"
    ).length;
    const error = vmList.filter((vm) => vm.status === "error").length;
    const configuring = vmList.filter(
      (vm) => vm.status === "configuring"
    ).length;
    const paused = vmList.filter(
      (vm) => vm.status === "paused" || vm.status === "suspended"
    ).length;

    // 由于API只返回基础字段，没有使用率信息，这里设置为0
    const avgCpuUsage = 0;
    const avgMemoryUsage = 0;

    return {
      total,
      running,
      stopped,
      error: error + configuring, // 将配置中状态也归类为需要关注的状态
      cpuUsage: avgCpuUsage,
      memoryUsage: avgMemoryUsage,
      storageUsage: 0, // API暂无存储使用率信息
      paused, // 添加暂停状态统计
      configuring, // 添加配置中状态统计
    };
  }, [vmList]);

  // 筛选数据
  const filteredData = useMemo(() => {
    return vmList.filter((vm) => {
      const matchSearch =
        searchText === "" ||
        vm.vm_name.toLowerCase().includes(searchText.toLowerCase()) ||
        vm.uuid.toLowerCase().includes(searchText.toLowerCase()) ||
        vm.hostname.toLowerCase().includes(searchText.toLowerCase());

      return matchSearch;
    });
  }, [vmList, searchText]);

  // 刷新数据函数
  const handleRefresh = useCallback(async () => {
    try {
      await loadVmData();
      message.success("数据刷新成功");
    } catch (error) {
      console.error("刷新数据失败:", error);
      message.error("刷新数据失败");
    }
  }, [loadVmData, message]);

  // 自动刷新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        handleRefresh();
      }, 30000); // 30秒刷新一次
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, handleRefresh]);

  const fetchSnapshots = useCallback(async () => {
    if (!sidebarSelectedVM) return;
    setSnapshotLoading(true);
    try {
      const res = await vmService.getVMSnapshotList({
        hostname:
          (sidebarSelectedVM as unknown as { hostname: string }).hostname ||
          "unknown",
        vm_name: sidebarSelectedVM.name,
      });
      if (res.success && res.data?.snapshots) {
        // 直接使用接口返回的快照数据
        setSnapshotList(res.data.snapshots);
      } else {
        setSnapshotList([]);
        message.error(res.message || "获取快照列表失败");
      }
    } catch (error) {
      console.error("获取快照列表异常:", error);
      setSnapshotList([]);
      message.error("获取快照列表异常");
    } finally {
      setSnapshotLoading(false);
    }
  }, [sidebarSelectedVM, message]);

  // 监听虚拟机切换和tab切换，自动加载快照数据
  useEffect(() => {
    if (vmDetailActiveTab === "snapshots" && sidebarSelectedVM) {
      fetchSnapshots();
    }
  }, [sidebarSelectedVM, vmDetailActiveTab, fetchSnapshots]);



  // 虚拟机操作处理函数
  const handleVMAction = useCallback(
    async (
      action: string,
      vm: VirtualMachine | SidebarVM,
      fromSidebar: boolean = false
    ) => {
      try {
        let response;

        // 提取虚拟机名称和主机名，兼容两种数据格式
        const vmName =
          "vm_name" in vm ? vm.vm_name : "name" in vm ? vm.name : "unknown";
        const hostname =
          "hostname" in vm ? vm.hostname : "node" in vm ? vm.node : "unknown";

        switch (action) {
          case "start":
          case "启动":
            response = await vmService.startVM(vmName, hostname);
            if (response.success) {
              message.success(response.message || `启动虚拟机 ${vmName} 成功`);
              // 根据来源决定刷新方式
              if (fromSidebar) {
                await loadVmData(); // 重新加载数据而不刷新页面
              } else {
                window.location.reload();
              }
            } else {
              message.error(response.message || `启动虚拟机 ${vmName} 失败`);
            }
            break;

          case "stop":
          case "停止":
          case "shutdown":
            response = await vmService.stopVM(vmName, hostname);
            if (response.success) {
              message.success(response.message || `停止虚拟机 ${vmName} 成功`);
              // 根据来源决定刷新方式
              if (fromSidebar) {
                await loadVmData(); // 重新加载数据而不刷新页面
              } else {
                window.location.reload();
              }
            } else {
              message.error(response.message || `停止虚拟机 ${vmName} 失败`);
            }
            break;

          case "restart":
          case "重启":
            response = await vmService.restartVM(vmName, hostname);
            if (response.success) {
              message.success(response.message || `重启虚拟机 ${vmName} 成功`);
              // 根据来源决定刷新方式
              if (fromSidebar) {
                await loadVmData(); // 重新加载数据而不刷新页面
              } else {
                window.location.reload();
              }
            } else {
              message.error(response.message || `重启虚拟机 ${vmName} 失败`);
            }
            break;

          case "destroy":
          case "强制停止":
            response = await vmService.destroyVM(vmName, hostname);
            if (response.success) {
              message.success(
                response.message || `强制停止虚拟机 ${vmName} 成功`
              );
              // 根据来源决定刷新方式
              if (fromSidebar) {
                await loadVmData(); // 重新加载数据而不刷新页面
              } else {
                window.location.reload();
              }
            } else {
              message.error(
                response.message || `强制停止虚拟机 ${vmName} 失败`
              );
            }
            break;

          case "delete":
            // 删除前确认
            modal.confirm({
              title: "确认删除",
              content: `确定要删除虚拟机 "${vmName}" 吗？此操作不可逆。`,
              okText: "确认删除",
              okType: "danger",
              cancelText: "取消",
              onOk: async () => {
                const deleteResponse = await vmService.deleteVM(
                  vmName,
                  hostname,
                  true
                );
                if (deleteResponse.success) {
                  message.success(
                    deleteResponse.message || `删除虚拟机 ${vmName} 成功`
                  );
                  // 重新加载虚拟机列表
                  await loadVmData();
                } else {
                  message.error(
                    deleteResponse.message || `删除虚拟机 ${vmName} 失败`
                  );
                }
              },
            });
            return; // 提前返回，不执行后续代码

          case "pause":
          case "suspend":
          case "挂起":
            response = await vmService.pauseVM(vmName, hostname);
            if (response.success) {
              message.success(response.message || `挂起虚拟机 ${vmName} 成功`);
              // 根据来源决定刷新方式
              if (fromSidebar) {
                await loadVmData(); // 重新加载数据而不刷新页面
              } else {
                window.location.reload();
              }
            } else {
              message.error(response.message || `挂起虚拟机 ${vmName} 失败`);
            }
            break;

          case "resume":
          case "恢复":
            response = await vmService.resumeVM(vmName, hostname);
            if (response.success) {
              message.success(response.message || `恢复虚拟机 ${vmName} 成功`);
              // 根据来源决定刷新方式
              if (fromSidebar) {
                await loadVmData(); // 重新加载数据而不刷新页面
              } else {
                window.location.reload();
              }
            } else {
              message.error(response.message || `恢复虚拟机 ${vmName} 失败`);
            }
            break;

          case "clone":
            message.info(`克隆功能开发中，虚拟机: ${vmName}`);
            break;

          case "template":
            message.info(`模板转换功能开发中，虚拟机: ${vmName}`);
            break;
          case "break":
            modal.confirm({
              title: "确认重置",
              content: `确定要重置虚拟机 "${vmName}" 的配置吗？此操作将清除所有自定义配置。`,
              okText: "确认重置",
              okType: "danger",
              cancelText: "取消",
              onOk: async () => {
                const resetResponse = await vmService.resetVMConfig({
                  vm_name: vmName,
                  hostname: hostname,
                });
                if (resetResponse.success) {
                  message.success(
                    resetResponse.message || `重置虚拟机 ${vmName} 配置成功`
                  );
                  // 重新加载虚拟机列表
                  await loadVmData();
                } else {
                  message.error(
                    resetResponse.message || `重置虚拟机 ${vmName} 配置失败`
                  );
                }
              },
            });
            break;
          default:
            message.info(`${action} ${vmName} 操作功能开发中`);
            break;
        }
      } catch (error) {
        console.error(`虚拟机操作失败:`, error);
        message.error(`虚拟机操作失败，请检查网络连接`);
      }
    },
    [message, modal, loadVmData]
  );

  /**
   * 监听侧边栏虚拟机操作事件
   * 处理来自侧边栏右键菜单的虚拟机操作
   */
  useEffect(() => {
    const handleSidebarVMAction = async (event: CustomEvent) => {
      const { action, vmName, hostname, vmData } = event.detail;
      console.log("收到侧边栏虚拟机操作事件:", { action, vmName, hostname });

      // 调用虚拟机操作处理函数，标记为来自侧边栏的操作
      await handleVMAction(action, vmData, true);
    };

    // 添加事件监听器
    window.addEventListener(
      "hierarchical-sidebar-vm-action",
      handleSidebarVMAction as unknown as EventListener
    );

    // 清理函数
    return () => {
      window.removeEventListener(
        "hierarchical-sidebar-vm-action",
        handleSidebarVMAction as unknown as EventListener
      );
    };
  }, [handleVMAction]);

  // 批量操作
  const handleBatchAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning("请先选择要操作的虚拟机");
      return;
    }
    message.success(
      `批量${action}操作已执行，影响${selectedRowKeys.length}台虚拟机`
    );
    setSelectedRowKeys([]);
  };

  // 显示虚拟机详情
  const showVMDetail = (vm: VirtualMachine) => {
    setSelectedVM(vm);
    setDetailModal(true);
  };

  // 创建虚拟机
  const handleCreateVM = async (values: CreateVMRequest) => {
    const payload = {
      ...values,
      iso_file_path: values.iso_file_path?.trim() ? values.iso_file_path : null,
    };
    setLoading(true);

    try {
      const response = await vmService.createVM(payload);

      if (response.success) {
        message.success(response.message || "虚拟机创建成功");
        await loadVmData();
        setCreateVMModal(false);
      } else {
        message.error(response.message || "虚拟机创建失败");
      }
    } catch (error) {
      console.error("创建虚拟机失败:", error);
      message.error("虚拟机创建失败，请检查网络连接和参数配置");
    } finally {
      setLoading(false);
    }
  };

  // 创建快照处理函数
  const handleCreateSnapshot = useCallback(async (values: {
    snapshotName: string;
    description?: string;
    includeMemory?: boolean;
  }) => {
    if (!sidebarSelectedVM) {
      message.error("请先选择虚拟机");
      return;
    }

    setCreateSnapshotLoading(true);
    try {
      const hostname = (sidebarSelectedVM as unknown as { hostname: string }).hostname || "unknown";
      const res = await vmService.createVMSnapshot({
        hostname,
        vm_name: sidebarSelectedVM.name,
        snapshot_name: values.snapshotName,
        description: values.description,
        has_memory: values.includeMemory || false, // 确保传递boolean值
      });

      if (res.success) {
        message.success(res.message || "创建快照成功");
        setCreateSnapshotModal(false);
        // 重新加载快照列表
        fetchSnapshots();
      } else {
        message.error(res.message || "创建快照失败");
      }
    } catch (error) {
      console.error("创建快照异常:", error);
      message.error("创建快照异常");
    } finally {
      setCreateSnapshotLoading(false);
    }
  }, [sidebarSelectedVM, message, fetchSnapshots]);

  // 应用快照处理函数
  const handleRevertSnapshot = useCallback(async (snapshot: VMSnapshot) => {
    if (!sidebarSelectedVM) {
      message.error("请先选择虚拟机");
      return;
    }

    modal.confirm({
      title: "确认恢复快照",
      content: `确定要将虚拟机恢复到快照 "${snapshot.name}" 吗？此操作不可逆，当前状态将会丢失。`,
      okText: "确认恢复",
      cancelText: "取消",
      onOk: async () => {
        setSnapshotOperationLoading(true);
        try {
          const hostname = (sidebarSelectedVM as unknown as { hostname: string }).hostname || "unknown";
          const res = await vmService.revertVMSnapshot({
            hostname,
            vm_name: sidebarSelectedVM.name,
            snapshot_name: snapshot.name,
          });

          if (res.success) {
            message.success(res.message || "恢复快照成功");
            // 重新加载快照列表
            fetchSnapshots();
          } else {
            message.error(res.message || "恢复快照失败");
          }
        } catch (error) {
          console.error("恢复快照异常:", error);
          message.error("恢复快照异常");
        } finally {
          setSnapshotOperationLoading(false);
        }
      },
    });
  }, [sidebarSelectedVM, message, fetchSnapshots, modal]);

  // 删除快照处理函数
  const handleDeleteSnapshot = useCallback(async (snapshot: VMSnapshot) => {
    if (!sidebarSelectedVM) {
      message.error("请先选择虚拟机");
      return;
    }

    setSelectedSnapshotForDelete(snapshot);
    setDeleteSnapshotModal(true);
  }, [sidebarSelectedVM, message]);

  // 确认删除快照处理函数
  const handleConfirmDeleteSnapshot = useCallback(async (values: {
    deleteChildren: boolean;
  }) => {
    if (!sidebarSelectedVM || !selectedSnapshotForDelete) {
      message.error("删除快照时发生错误");
      return;
    }

    setSnapshotOperationLoading(true);
    try {
      const hostname = (sidebarSelectedVM as unknown as { hostname: string }).hostname || "unknown";
      const res = await vmService.deleteVMSnapshot({
        hostname,
        vm_name: sidebarSelectedVM.name,
        snapshot_name: selectedSnapshotForDelete.name,
        delete_children: values.deleteChildren,
      });

      if (res.success) {
        message.success(res.message || "删除快照成功");
        setDeleteSnapshotModal(false);
        setSelectedSnapshotForDelete(null);
        // 重新加载快照列表
        fetchSnapshots();
      } else {
        message.error(res.message || "删除快照失败");
      }
    } catch (error) {
      console.error("删除快照异常:", error);
      message.error("删除快照异常");
    } finally {
      setSnapshotOperationLoading(false);
    }
  }, [sidebarSelectedVM, selectedSnapshotForDelete, message, fetchSnapshots]);

  // 表格列定义
  const columns: ColumnsType<VirtualMachine> = [
    {
      title: "虚拟机名称",
      key: "name",
      width: 80,
      fixed: "left",
      render: (_, record) => (
        <div style={{ fontWeight: "bold", fontSize: "14px" }}>
          {record.vm_name}
        </div>
      ),
    },
    {
      title: "物理机",
      key: "hostname",
      width: 50,
      render: (_, record) => (
        <div style={{ fontSize: "12px" }}>{record.hostname || "N/A"}</div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 50,
      render: (status: string) => {
        const getStatusConfig = (status: string) => {
          switch (status) {
            case "running":
              return { color: "success", icon: <CheckCircleOutlined /> };
            case "stopped":
            case "shutoff":
              return { color: "error", icon: <StopOutlined /> };
            case "paused":
            case "suspended":
              return { color: "warning", icon: <PauseOutlined /> };
            case "configuring":
              return { color: "processing", icon: <SyncOutlined spin /> };
            case "error":
              return { color: "error", icon: <WarningOutlined /> };
            default:
              return { color: "default", icon: <QuestionCircleOutlined /> };
          }
        };

        const config = getStatusConfig(status);
        const statusText = (() => {
          switch (status) {
            case "running":
              return "运行中";
            case "stopped":
              return "已停止";
            case "shutoff":
              return "已关闭";
            case "paused":
              return "已挂起";
            case "suspended":
              return "已暂停";
            case "configuring":
              return "配置中";
            case "error":
              return "错误";
            default:
              return "未知状态";
          }
        })();

        return (
          <Tag color={config.color} icon={config.icon}>
            {statusText}
          </Tag>
        );
      },
    },
    {
      title: "UUID",
      dataIndex: "uuid",
      key: "uuid",
      width: 180,
      render: (uuid: string) => (
        <div style={{ fontSize: "12px", fontFamily: "monospace" }}>{uuid}</div>
      ),
    },
    {
      title: "规格配置",
      key: "spec",
      width: 150,
      render: (_, record) => (
        <div style={{ fontSize: "12px" }}>
          <div>
            <ThunderboltOutlined style={{ marginRight: 4 }} />
            CPU: {record.cpu_count}核
          </div>
          <div>
            <DatabaseOutlined style={{ marginRight: 4 }} />
            内存: {record.memory_gb}GB
          </div>
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      fixed: "right" as const,
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showVMDetail(record)}
            />
          </Tooltip>
          <Tooltip title="启动">
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleVMAction("启动", record)}
            />
          </Tooltip>
          <Tooltip title="停止">
            <Button
              danger
              size="small"
              icon={<PoweroffOutlined />}
              onClick={() => handleVMAction("停止", record)}
            />
          </Tooltip>
          <Tooltip title="重启">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleVMAction("重启", record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: "edit", icon: <EditOutlined />, label: "编辑" },
                { key: "clone", icon: <CopyOutlined />, label: "克隆" },
                { key: "snapshot", icon: <ApiOutlined />, label: "创建快照" },
                { key: "console", icon: <MonitorOutlined />, label: "控制台" },
                { type: "divider" },
                {
                  key: "destroy",
                  icon: <StopOutlined />,
                  label: "强制停止",
                  danger: true,
                },
                { key: "pause", icon: <PauseOutlined />, label: "挂起" },
                { key: "resume", icon: <CaretRightOutlined />, label: "恢复" },
                { type: "divider" },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "删除",
                  danger: true,
                },
              ],
              onClick: ({ key }) => handleVMAction(key, record),
            }}
          >
            <Button size="small" icon={<DownOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const menuItems: MenuProps["items"] = [
    { key: "start", icon: <PlayCircleOutlined />, label: "批量启动" },
    { key: "stop", icon: <PoweroffOutlined />, label: "批量停止" },
    { key: "restart", icon: <ReloadOutlined />, label: "批量重启" },
    { type: "divider" },
    { key: "clone", icon: <CopyOutlined />, label: "批量克隆" },
    { key: "snapshot", icon: <ApiOutlined />, label: "批量快照" },
    { type: "divider" },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "批量删除",
      danger: true,
    },
  ];

  const tabItems: TabsProps["items"] = [
    {
      key: "overview",
      label: "概览",
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="CPU使用率"
                value={vmStats.cpuUsage}
                precision={0}
                valueStyle={{
                  color: vmStats.cpuUsage > 80 ? "#ff4d4f" : "#3f8600",
                }}
                prefix={<ThunderboltOutlined />}
                suffix="%"
              />
              <Progress percent={vmStats.cpuUsage} size="small" />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="内存使用率"
                value={vmStats.memoryUsage}
                precision={0}
                valueStyle={{
                  color: vmStats.memoryUsage > 80 ? "#ff4d4f" : "#3f8600",
                }}
                prefix={<DatabaseOutlined />}
                suffix="%"
              />
              <Progress percent={vmStats.memoryUsage} size="small" />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="存储使用率"
                value={vmStats.storageUsage}
                precision={0}
                valueStyle={{
                  color: vmStats.storageUsage > 80 ? "#ff4d4f" : "#3f8600",
                }}
                prefix={<HddOutlined />}
                suffix="%"
              />
              <Progress percent={vmStats.storageUsage} size="small" />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: "performance",
      label: "性能监控",
      children: (
        <Alert
          message="性能监控"
          description="此功能将显示虚拟机的实时性能图表，包括CPU、内存、网络、存储的使用情况。"
          type="info"
          showIcon
          icon={<AreaChartOutlined />}
        />
      ),
    },
    {
      key: "events",
      label: "事件日志",
      children: (
        <Alert
          message="事件日志"
          description="此功能将显示虚拟机的操作日志和系统事件记录。"
          type="info"
          showIcon
        />
      ),
    },
  ];

  // 如果从侧边栏选中了物理机，显示物理机详情
  if (sidebarSelectedHost) {
    // 安全获取虚拟机列表 - 处理数据结构不匹配的问题
    const getHostVMs = (): unknown[] => {
      // 使用 unknown 作为中间类型来避免类型错误
      const hostData = sidebarSelectedHost as unknown as Record<
        string,
        unknown
      >;

      // 如果有 vms 字段，直接使用
      if (hostData.vms && Array.isArray(hostData.vms)) {
        return hostData.vms as unknown[];
      }

      // 如果有 data 字段且包含 vms，使用 data.vms
      if (
        hostData.data &&
        typeof hostData.data === "object" &&
        hostData.data !== null &&
        "vms" in hostData.data &&
        Array.isArray((hostData.data as Record<string, unknown>).vms)
      ) {
        return (hostData.data as Record<string, unknown>).vms as unknown[];
      }

      // 默认返回空数组
      return [];
    };

    const hostVMs = getHostVMs();

    const hostDetailTabs = [
      {
        key: "basic",
        label: "基本信息",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="主机配置" size="small">
                  <Row>
                    <Col span={12}>
                      <Statistic
                        title="CPU 使用率"
                        value={sidebarSelectedHost.cpu || 0}
                        suffix="%"
                        valueStyle={{
                          color:
                            (sidebarSelectedHost.cpu || 0) > 80
                              ? "#ff4d4f"
                              : "#3f8600",
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="内存使用率"
                        value={sidebarSelectedHost.memory || 0}
                        suffix="%"
                        valueStyle={{
                          color:
                            (sidebarSelectedHost.memory || 0) > 80
                              ? "#ff4d4f"
                              : "#3f8600",
                        }}
                      />
                    </Col>
                  </Row>
                  <div style={{ margin: "16px 0" }}>
                    <Row>
                      <Col span={24}>
                        <Statistic
                          title="虚拟机数量"
                          value={hostVMs.length}
                          suffix="台"
                        />
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="运行状态" size="small">
                  <div style={{ marginBottom: "16px" }}>
                    <strong>主机名:</strong>
                    <Tag style={{ marginLeft: "8px" }}>
                      {sidebarSelectedHost.name}
                    </Tag>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <strong>运行时间:</strong>
                    <span style={{ marginLeft: "8px", color: "#52c41a" }}>
                      {sidebarSelectedHost.uptime}
                    </span>
                  </div>
                  <div>
                    <strong>主机状态:</strong>
                    <Tag
                      color={
                        sidebarSelectedHost.status === "online"
                          ? "success"
                          : "error"
                      }
                      style={{ marginLeft: "8px" }}
                    >
                      {sidebarSelectedHost.status === "online"
                        ? "在线"
                        : "离线"}
                    </Tag>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 详细信息面板 */}
            <Card title="详细信息" style={{ marginTop: "16px" }} size="small">
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={8}>
                  <div>
                    <strong>主机ID:</strong>
                    <br />
                    <span>{sidebarSelectedHost.id}</span>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div>
                    <strong>状态:</strong>
                    <br />
                    <Tag
                      color={
                        sidebarSelectedHost.status === "online"
                          ? "success"
                          : "error"
                      }
                    >
                      {sidebarSelectedHost.status === "online"
                        ? "在线"
                        : "离线"}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div>
                    <strong>主机类型:</strong>
                    <br />
                    <span>{sidebarSelectedHost.type}</span>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        ),
      },
      {
        key: "performance",
        label: "性能监控",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="CPU 使用率"
                    value={sidebarSelectedHost.cpu}
                    precision={0}
                    valueStyle={{
                      color:
                        sidebarSelectedHost.cpu > 80 ? "#ff4d4f" : "#3f8600",
                    }}
                    prefix={<ThunderboltOutlined />}
                    suffix="%"
                  />
                  <Progress percent={sidebarSelectedHost.cpu} size="small" />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="内存使用率"
                    value={sidebarSelectedHost.memory}
                    precision={0}
                    valueStyle={{
                      color:
                        sidebarSelectedHost.memory > 80 ? "#ff4d4f" : "#3f8600",
                    }}
                    prefix={<DatabaseOutlined />}
                    suffix="%"
                  />
                  <Progress percent={sidebarSelectedHost.memory} size="small" />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="虚拟机数量"
                    value={hostVMs.length}
                    prefix={<DesktopOutlined />}
                    suffix="台"
                  />
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
      {
        key: "vms",
        label: "虚拟机列表",
        children: (
          <div>
            <Card
              title="该主机上的虚拟机"
              size="default"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateVMModal(true)}
                >
                  创建虚拟机
                </Button>
              }
            >
              <Table
                size="small"
                dataSource={vmList}
                columns={[
                  {
                    title: "虚拟机名称",
                    key: "vm_name",
                    render: (_, record: VirtualMachine) => (
                      <div>
                        <div style={{ fontWeight: "bold" }}>
                          {record.vm_name}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "状态",
                    dataIndex: "status",
                    key: "status",
                    render: (status: string) => {
                      const getStatusConfig = (status: string) => {
                        switch (status) {
                          case "running":
                            return { color: "success", text: "运行中" };
                          case "stopped":
                          case "shutoff":
                            return { color: "default", text: "已停止" };
                          case "paused":
                          case "suspended":
                            return { color: "warning", text: "已挂起" };
                          case "configuring":
                            return { color: "processing", text: "配置中" };
                          case "error":
                            return { color: "error", text: "错误" };
                          default:
                            return { color: "default", text: "未知" };
                        }
                      };

                      const config = getStatusConfig(status);
                      return <Tag color={config.color}>{config.text}</Tag>;
                    },
                  },
                  {
                    title: "配置",
                    key: "config",
                    render: (_, record: VirtualMachine) => {
                      // 从config对象中获取配置信息，如果没有则从根级字段获取
                      const cpuCount =
                        record.config?.cpu_num || record.cpu_count || 0;
                      const memoryGB =
                        record.config?.memory_gb || record.memory_gb || 0;
                      const diskCount =
                        record.config?.disk?.length ||
                        record.disk_info?.length ||
                        0;
                      return (
                        <div
                          style={{
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div>CPU: {cpuCount}核</div>
                          <div>内存: {memoryGB}GB</div>
                          <div>磁盘: {diskCount}个</div>
                        </div>
                      );
                    },
                  },
                  {
                    title: "配置状态",
                    key: "config_status",
                    render: (_, record: VirtualMachine) => (
                      <Tag color={record.config_status ? "success" : "warning"}>
                        {record.config_status ? "已配置" : "配置中"}
                      </Tag>
                    ),
                  },
                  {
                    title: "操作",
                    key: "actions",
                    render: (_, record: VirtualMachine) => (
                      <Space size="small">
                        <Tooltip title="查看详情">
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => showVMDetail(record)}
                          />
                        </Tooltip>
                        <Tooltip title="启动">
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleVMAction("start", record)}
                          />
                        </Tooltip>
                        <Tooltip title="停止">
                          <Button
                            danger
                            size="small"
                            icon={<PoweroffOutlined />}
                            onClick={() => handleVMAction("stop", record)}
                          />
                        </Tooltip>
                      </Space>
                    ),
                  },
                ]}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="该物理主机上暂无虚拟机"
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateVMModal(true)}
                      >
                        创建虚拟机
                      </Button>
                    </Empty>
                  ),
                }}
              />
            </Card>
          </div>
        ),
      },
      {
        key: "events",
        label: "事件日志",
        children: (
          <Alert
            message="主机事件日志"
            description="此功能将显示物理主机的操作日志和系统事件记录。"
            type="info"
            showIcon
          />
        ),
      },
    ];

    return (
      <div>
        {/* Modal contextHolder 必须在这里渲染，否则 modal.confirm 不会工作 */}
        {contextHolder}
        <Card
          title={
            <Space>
              <HddOutlined />
              <span>物理主机详情 - {sidebarSelectedHost.name}</span>
              <Tag
                color={
                  sidebarSelectedHost.status === "online" ? "success" : "error"
                }
              >
                {sidebarSelectedHost.status === "online" ? "在线" : "离线"}
              </Tag>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => message.info("正在刷新主机信息...")}
              >
                刷新
              </Button>
              <Button
                icon={<MonitorOutlined />}
                onClick={() => message.info("正在打开主机控制台...")}
              >
                控制台
              </Button>
            </Space>
          }
        >
          <Tabs items={hostDetailTabs} />
        </Card>

        {/* 创建虚拟机模态框 - 确保在物理主机详情页面也能使用 */}
        <CreateVMModal
          visible={createVMModal}
          onCancel={() => setCreateVMModal(false)}
          onFinish={handleCreateVM}
          loading={loading}
          defaultHostname={
            sidebarSelectedHost
              ? String(
                  (sidebarSelectedHost as unknown as Record<string, unknown>)
                    .name || ""
                )
              : undefined
          } // 传递选中的物理主机名
        />
      </div>
    );
  }

  // 如果从侧边栏选中了虚拟机，显示虚拟机详情
  if (sidebarSelectedVM) {
    // 根据选择情况决定如何获取虚拟机数据
    let selectedVMDataForDetail: VirtualMachine | undefined;

    if (sidebarSelectedHost) {
      // 选中物理机时，从该物理机的虚拟机列表中查找对应的虚拟机
      selectedVMDataForDetail = vmList.find(
        (vm) => vm.vm_name === sidebarSelectedVM.name
      );
      console.log("物理机模式 - 查找结果:", selectedVMDataForDetail?.vm_name);
    } else {
      // 选中虚拟机时，接口直接返回对应的虚拟机数据，直接使用第一个元素
      selectedVMDataForDetail = vmList.length > 0 ? vmList[0] : undefined;
      console.log("虚拟机模式 - 直接使用第一个:", selectedVMDataForDetail?.vm_name);
    }

    const vmDetailTabs = [
      {
        key: "basic",
        label: "基本信息",
        children: selectedVMDataForDetail ? (
          <div>
            {/* 基本配置信息 */}
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="虚拟机名称">
                {selectedVMDataForDetail.vm_name}
              </Descriptions.Item>
              <Descriptions.Item label="物理主机">
                {selectedVMDataForDetail.hostname}
              </Descriptions.Item>
              <Descriptions.Item label="配置状态">
                <Tag
                  color={selectedVMDataForDetail.config_status ? "success" : "warning"}
                >
                  {selectedVMDataForDetail.config_status ? "已配置" : "配置中"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="运行状态">
                <Tag
                  color={
                    sidebarSelectedVM.status === "running"
                      ? "success"
                      : sidebarSelectedVM.status === "stopped"
                      ? "default"
                      : "error"
                  }
                >
                  {(() => {
                    switch (sidebarSelectedVM.status) {
                      case "running":
                        return "运行中";
                      case "stopped":
                        return "已停止";
                      default:
                        return "已停止";
                    }
                  })()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="错误信息">
                {selectedVMDataForDetail.error ? (
                  <Tag color="error">{selectedVMDataForDetail.error}</Tag>
                ) : (
                  <Tag color="success">正常</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="虚拟机ID">
                {sidebarSelectedVM?.vmid || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="CPU核心数">
                {selectedVMDataForDetail.config?.cpu_num || selectedVMDataForDetail.cpu_count}核
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  size="small"
                  style={{ padding: 0, marginLeft: 8 }}
                  onClick={() => {
                    cpuForm.setFieldsValue({
                      cpu_num: selectedVMDataForDetail.config?.cpu_num || selectedVMDataForDetail.cpu_count || 1,
                    });
                    setCpuModalVisible(true);
                  }}
                  aria-label="修改CPU核心数"
                />
              </Descriptions.Item>
              <Descriptions.Item label="内存大小">
                {selectedVMDataForDetail.config?.memory_gb || selectedVMDataForDetail.memory_gb}GB
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  size="small"
                  style={{ padding: 0, marginLeft: 8 }}
                  onClick={() => {
                    memoryForm.setFieldsValue({
                      memory_gb: selectedVMDataForDetail.config?.memory_gb || selectedVMDataForDetail.memory_gb || 1,
                    });
                    setMemoryModalVisible(true);
                  }}
                  aria-label="修改内存大小"
                />
              </Descriptions.Item>
              <Descriptions.Item label="启动设备">
                {selectedVMDataForDetail.config?.boot?.join(" → ") ||
                  selectedVMDataForDetail.boot_order?.join(" → ") ||
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="虚拟机类型">
                <Tag color="blue">VM</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="磁盘数量">
                {selectedVMDataForDetail.config?.disk?.length ||
                  selectedVMDataForDetail.disk_info?.length ||
                  "N/A"}
                个
              </Descriptions.Item>
              <Descriptions.Item label="网络接口数量">
                {selectedVMDataForDetail.config?.net?.length ||
                  selectedVMDataForDetail.network_info?.length ||
                  "N/A"}
                个
              </Descriptions.Item>
              <Descriptions.Item label="主MAC地址">
                {selectedVMDataForDetail.config?.net?.[0]?.mac ||
                  selectedVMDataForDetail.network_info?.[0]?.mac ||
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="主网桥">
                {selectedVMDataForDetail.config?.net?.[0]?.bridge ||
                  selectedVMDataForDetail.network_info?.[0]?.bridge ||
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="配置摘要">
                {selectedVMDataForDetail.config?.metadata?.digested?.substring(0, 16) ||
                  selectedVMDataForDetail.metadata?.digested?.substring(0, 16) ||
                  "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="配置更新时间">
                {selectedVMDataForDetail.config?.metadata?.updated_at
                  ? new Date(
                      parseFloat(selectedVMDataForDetail.config.metadata.updated_at) *
                        1000
                    ).toLocaleString()
                  : selectedVMDataForDetail.metadata?.updated_at
                  ? new Date(
                      parseFloat(selectedVMDataForDetail.metadata.updated_at) * 1000
                    ).toLocaleString()
                  : "N/A"}
              </Descriptions.Item>
            </Descriptions>

            {/* 磁盘配置详情 */}
            <Card title="磁盘配置" size="small" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={
                  selectedVMDataForDetail.config?.disk || selectedVMDataForDetail.disk_info || []
                }
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无磁盘设备"
                    />
                  ),
                }}
                columns={[
                  {
                    title: "设备名",
                    dataIndex: "name",
                    key: "name",
                  },
                  {
                    title: "总线类型",
                    dataIndex: "bus_type",
                    key: "bus_type",
                  },
                  {
                    title: "格式",
                    dataIndex: "format",
                    key: "format",
                    render: (format: string) => (
                      <Tag color="blue">{format}</Tag>
                    ),
                  },
                  {
                    title: "路径",
                    dataIndex: "path",
                    key: "path",
                    ellipsis: true,
                  },
                ]}
              />
            </Card>

            {/* 网络配置详情 */}
            <Card title="网络配置" size="small" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={
                  selectedVMDataForDetail.config?.net ||
                  selectedVMDataForDetail.network_info ||
                  []
                }
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无网络设备"
                    />
                  ),
                }}
                columns={[
                  {
                    title: "网卡类型",
                    dataIndex: "name",
                    key: "name",
                  },
                  {
                    title: "MAC地址",
                    dataIndex: "mac",
                    key: "mac",
                    render: (mac: string) => (
                      <code style={{ fontSize: "12px" }}>{mac}</code>
                    ),
                  },
                  {
                    title: "网桥",
                    dataIndex: "bridge",
                    key: "bridge",
                    render: (bridge: string) => (
                      <Tag color="green">{bridge}</Tag>
                    ),
                  },
                ]}
              />
            </Card>

            {/* 光驱配置详情 */}
            <Card title="光驱配置" size="small" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={selectedVMDataForDetail.config?.cdrom || []}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无光驱设备"
                    />
                  ),
                }}
                columns={[
                  {
                    title: "设备名",
                    dataIndex: "name",
                    key: "name",
                  },
                  {
                    title: "ISO文件",
                    dataIndex: "file",
                    key: "file",
                  },
                  {
                    title: "总线类型",
                    dataIndex: "bus_type",
                    key: "bus_type",
                  },
                  {
                    title: "状态",
                    dataIndex: "mounted",
                    key: "mounted",
                    render: (mounted: boolean) => (
                      <Tag color={mounted ? "success" : "default"}>
                        {mounted ? "已挂载" : "未挂载"}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>

            {/* USB设备配置详情 */}
            <Card title="USB设备配置" size="small" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={selectedVMDataForDetail.config?.usb || []}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无USB设备"
                    />
                  ),
                }}
                columns={[
                  {
                    title: "设备名",
                    dataIndex: "name",
                    key: "name",
                  },
                  {
                    title: "设备类型",
                    dataIndex: "device_type",
                    key: "device_type",
                  },
                  {
                    title: "厂商ID",
                    dataIndex: "vendor_id",
                    key: "vendor_id",
                  },
                  {
                    title: "产品ID",
                    dataIndex: "product_id",
                    key: "product_id",
                  },
                  {
                    title: "连接状态",
                    dataIndex: "connected",
                    key: "connected",
                    render: (connected: boolean) => (
                      <Tag color={connected ? "success" : "default"}>
                        {connected ? "已连接" : "未连接"}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>

            {/* PCI设备配置详情 */}
            <Card title="PCI设备配置" size="small" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={selectedVMDataForDetail.config?.pci || []}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无PCI设备"
                    />
                  ),
                }}
                columns={[
                  {
                    title: "设备名",
                    dataIndex: "name",
                    key: "name",
                  },
                  {
                    title: "设备类型",
                    dataIndex: "device_type",
                    key: "device_type",
                  },
                  {
                    title: "PCI地址",
                    dataIndex: "address",
                    key: "address",
                  },
                  {
                    title: "厂商",
                    dataIndex: "vendor",
                    key: "vendor",
                  },
                  {
                    title: "状态",
                    dataIndex: "enabled",
                    key: "enabled",
                    render: (enabled: boolean) => (
                      <Tag color={enabled ? "success" : "default"}>
                        {enabled ? "启用" : "禁用"}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>

            {/* 运行时信息 */}
            {sidebarSelectedVM.uptime && (
              <Card title="运行时信息" size="small" style={{ marginTop: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="运行时间">
                    <span style={{ color: "#52c41a" }}>
                      {sidebarSelectedVM.uptime}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="磁盘使用">
                    {sidebarSelectedVM.diskSize}GB
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
            <div style={{ marginTop: "16px", color: "#666" }}>
              正在加载虚拟机详细信息...
            </div>
          </div>
        ),
      },
      {
        key: "performance",
        label: "性能监控",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card title="CPU使用率" size="small">
                  <Progress percent={0} />
                  <div
                    style={{
                      textAlign: "center",
                      color: "#999",
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    暂无数据
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="内存使用率" size="small">
                  <Progress percent={0} />
                  <div
                    style={{
                      textAlign: "center",
                      color: "#999",
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    暂无数据
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="磁盘I/O" size="small">
                  <Statistic
                    title="读写速度"
                    value={Math.floor(Math.random() * 100 + 10)}
                    precision={1}
                    valueStyle={{ color: "#722ed1" }}
                    prefix={<HddOutlined />}
                    suffix=" MB/s"
                  />
                </Card>
              </Col>
            </Row>
            <Card title="网络监控" style={{ marginTop: 16 }} size="small">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="网络流入"
                    value={Math.floor(Math.random() * 50 + 5)}
                    precision={1}
                    valueStyle={{ color: "#52c41a" }}
                    suffix=" MB/s"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="网络流出"
                    value={Math.floor(Math.random() * 30 + 2)}
                    precision={1}
                    valueStyle={{ color: "#fa8c16" }}
                    suffix=" MB/s"
                  />
                </Col>
              </Row>
            </Card>
            <Alert
              style={{ marginTop: 16 }}
              message="性能图表"
              description="此区域将显示实时性能图表，包括CPU、内存、网络、存储的历史使用情况趋势。"
              type="info"
              showIcon
            />
          </div>
        ),
      },
      {
        key: "console",
        label: "控制台",
        children: (
          <div>
            <Card>
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <DesktopOutlined
                  style={{
                    fontSize: "64px",
                    color: "#1890ff",
                    marginBottom: "16px",
                  }}
                />
                <h3>虚拟机控制台</h3>
                <p style={{ color: "#666", marginBottom: "24px" }}>
                  通过控制台可以直接访问虚拟机桌面，进行远程操作和管理。
                </p>
                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<MonitorOutlined />}
                    onClick={() => message.info("正在连接VNC控制台...")}
                  >
                    VNC控制台
                  </Button>
                  <Button
                    size="large"
                    icon={<CodeOutlined />}
                    onClick={() => message.info("正在连接SSH终端...")}
                  >
                    SSH终端
                  </Button>
                  <Button
                    size="large"
                    icon={<DesktopOutlined />}
                    onClick={() => message.info("正在连接RDP控制台...")}
                  >
                    RDP控制台
                  </Button>
                </Space>
              </div>
            </Card>
          </div>
        ),
      },
      {
        key: "devices",
        label: "设备管理",
        children: (
          <div>
            <Tabs
              defaultActiveKey="network"
              items={[
                {
                  key: "network",
                  label: "网卡",
                  children: sidebarSelectedVM ? (
                    <NetworkManagement
                      vmName={sidebarSelectedVM.name}
                      hostname={
                        (sidebarSelectedVM as unknown as { hostname?: string })
                          .hostname || "unknown"
                      }
                      networkDevices={
                        selectedVMDataForDetail?.config?.net?.map(
                          (netDevice, index) => ({
                            id: `net${index}`,
                            name: netDevice.name || `net${index}`,
                            model: netDevice.driver || "virtio",
                            bridge: netDevice.bridge || netDevice.name,
                            mac: netDevice.mac,
                            enabled: true,
                            type:
                              (netDevice.net_type as
                                | "bridge"
                                | "nat"
                                | "vlan") || "bridge",
                          })
                        ) || []
                      }
                      onNetworkChange={() => {
                        // 刷新虚拟机详情数据
                        loadVmData();
                      }}
                      message={message}
                      loading={loading}
                    />
                  ) : (
                    <Alert
                      message="请选择虚拟机"
                      description="请从侧边栏选择一个虚拟机以管理其网络设备"
                      type="info"
                      showIcon
                    />
                  ),
                },
                {
                  key: "gpu",
                  label: "GPU",
                  children: (
                    <Card
                      title="GPU设备"
                      extra={
                        <Button type="primary" size="small">
                          添加GPU
                        </Button>
                      }
                    >
                      <Empty description="暂无GPU设备" />
                    </Card>
                  ),
                },
                {
                  key: "usb",
                  label: "USB",
                  children: sidebarSelectedVM ? (
                    <USBManagement
                      vmName={sidebarSelectedVM.name}
                      hostname={
                        (sidebarSelectedVM as unknown as { hostname?: string })
                          .hostname || "unknown"
                      }
                      vmStatus={
                        selectedVMDataForDetail?.status ||
                        sidebarSelectedVM.status ||
                        "shutoff"
                      }
                      usbDevices={
                        selectedVMDataForDetail?.config?.usb?.map((usbDevice) => {
                          // 类型断言，转换为实际API返回的数据结构
                          const device = usbDevice as Record<string, unknown>;
                          return {
                            device_id: (device.device_id as string) || "1",
                            vendor_id: (device.vendor_id as string) || "0000",
                            product_id: (device.product_id as string) || "0000",
                            bus_id: (device.bus_id as string) || "1",
                          };
                        }) || []
                      }
                      onUSBChange={() => {
                        // 刷新虚拟机详情数据
                        loadVmData();
                      }}
                      message={message}
                      loading={loading}
                      error={null}
                    />
                  ) : (
                    <Alert
                      message="请选择虚拟机"
                      description="请从侧边栏选择一个虚拟机以管理其USB设备"
                      type="info"
                      showIcon
                    />
                  ),
                },
                {
                  key: "disk",
                  label: "磁盘管理",
                  children: sidebarSelectedVM ? (
                    <DiskManagement
                      vmName={sidebarSelectedVM.name}
                      hostname={
                        (sidebarSelectedVM as unknown as { hostname?: string })
                          .hostname || "unknown"
                      }
                      diskDevices={
                        selectedVMDataForDetail?.config?.disk ||
                        selectedVMDataForDetail?.disk_info ||
                        []
                      }
                      onDiskChange={() => {
                        // 刷新虚拟机详情数据
                        loadVmData();
                      }}
                      message={message}
                      loading={loading}
                    />
                  ) : (
                    <Alert
                      message="请选择虚拟机"
                      description="请从侧边栏选择一个虚拟机以管理其磁盘设备"
                      type="info"
                      showIcon
                    />
                  ),
                },
                {
                  key: "cdrom",
                  label: "虚拟光驱",
                  children: sidebarSelectedVM ? (
                    <CDRomManagement
                      vmName={sidebarSelectedVM.name}
                      hostname={
                        (sidebarSelectedVM as unknown as { hostname?: string })
                          .hostname || "unknown"
                      }
                      cdromDevices={
                        selectedVMDataForDetail?.config?.cdrom &&
                        selectedVMDataForDetail.config.cdrom.length > 0
                          ? selectedVMDataForDetail.config.cdrom.map(
                              (cdromDevice, index: number) => ({
                                id: cdromDevice.name || `cdrom${index}`,
                                name: cdromDevice.name || `光驱 ${index + 1}`,
                                iso_path: cdromDevice.path || null,
                                mounted: !!cdromDevice.path,
                                bus_type: cdromDevice.bus_type || "ide",
                                format: cdromDevice.format,
                              })
                            )
                          : [] // 如果没有光驱数据，显示空数组
                      }
                      onCDRomChange={() => {
                        // 刷新虚拟机详情数据
                        loadVmData();
                      }}
                      message={message}
                      loading={loading}
                    />
                  ) : (
                    <Alert
                      message="请选择虚拟机"
                      description="请从侧边栏选择一个虚拟机以管理其光驱设备"
                      type="info"
                      showIcon
                    />
                  ),
                },
              ]}
            />
          </div>
        ),
      },
      {
        key: "storage",
        label: "数据磁盘",
        children: (
          <div>
            <Card
              title="磁盘管理"
              extra={
                <Button type="primary" icon={<PlusOutlined />}>
                  添加磁盘
                </Button>
              }
            >
              <Table
                size="small"
                dataSource={[
                  {
                    id: 1,
                    name: "scsi0",
                    type: "系统盘",
                    size: sidebarSelectedVM.diskSize,
                    format: "qcow2",
                    storage: "local-lvm",
                    used: Math.floor(sidebarSelectedVM.diskSize * 0.6),
                    backup: true,
                    cache: "none",
                  },
                  {
                    id: 2,
                    name: "scsi1",
                    type: "数据盘",
                    size: 500,
                    format: "raw",
                    storage: "ceph-storage",
                    used: 320,
                    backup: false,
                    cache: "writeback",
                  },
                ]}
                columns={[
                  { title: "设备名", dataIndex: "name", key: "name" },
                  {
                    title: "类型",
                    dataIndex: "type",
                    key: "type",
                    render: (type: string) => (
                      <Tag color={type === "系统盘" ? "blue" : "green"}>
                        {type}
                      </Tag>
                    ),
                  },
                  {
                    title: "大小",
                    dataIndex: "size",
                    key: "size",
                    render: (size: number) => `${size} GB`,
                  },
                  {
                    title: "已使用",
                    dataIndex: "used",
                    key: "used",
                    render: (used: number, record: DataDisk) => {
                      const percent = Math.round((used / record.size) * 100);
                      return (
                        <div>
                          <div>
                            {used} GB ({percent}%)
                          </div>
                          <Progress percent={percent} size="small" />
                        </div>
                      );
                    },
                  },
                  { title: "格式", dataIndex: "format", key: "format" },
                  { title: "存储", dataIndex: "storage", key: "storage" },
                  {
                    title: "缓存",
                    dataIndex: "cache",
                    key: "cache",
                    render: (cache: string) => <Tag>{cache}</Tag>,
                  },
                  {
                    title: "备份",
                    dataIndex: "backup",
                    key: "backup",
                    render: (backup: boolean) => (
                      <Tag color={backup ? "success" : "default"}>
                        {backup ? "启用" : "禁用"}
                      </Tag>
                    ),
                  },
                  {
                    title: "操作",
                    key: "action",
                    render: (_, record: DataDisk) => (
                      <Space>
                        <Button size="small">扩容</Button>
                        <Button size="small">编辑</Button>
                        {record.type !== "系统盘" && (
                          <Button size="small" danger>
                            删除
                          </Button>
                        )}
                      </Space>
                    ),
                  },
                ]}
                pagination={false}
              />
            </Card>
          </div>
        ),
      },
      {
        key: "snapshots",
        label: "快照",
        children: (
          <div>
            <Card
              title="快照管理"
             
              extra={
                <Button 
                  type="primary" 
                  icon={<CameraOutlined />}
                  onClick={() => setCreateSnapshotModal(true)}
                  loading={createSnapshotLoading}
                >
                  创建快照
                </Button>
              }
            >
              <Table
                size="small"
                dataSource={snapshotList}
                loading={snapshotLoading}
                rowKey="name"
                columns={[
                  {
                    title: "快照名称",
                    dataIndex: "name",
                    key: "name",
                    render: (name: string, record: VMSnapshot) => (
                      <div>
                        <strong>{name}</strong>
                        {record.is_current && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            当前
                          </Tag>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: "状态",
                    dataIndex: "state",
                    key: "state",
                    render: (state: string) => (
                      <Tag color={state === "active" ? "success" : "default"}>
                        {state === "active" ? "活跃" : "非活跃"}
                      </Tag>
                    ),
                  },
                  {
                    title: "描述",
                    dataIndex: "describe",
                    key: "describe",
                    render: (describe: string) => describe || "无描述",
                  },
                  {
                    title: "创建时间",
                    dataIndex: "created_at",
                    key: "created_at",
                    render: (created_at: string) => {
                      try {
                        return new Date(created_at).toLocaleString();
                      } catch {
                        return created_at;
                      }
                    },
                  },
                  {
                    title: "内存状态",
                    dataIndex: "has_memory",
                    key: "has_memory",
                    render: (has_memory: boolean) => (
                      <Tag color={has_memory ? "success" : "default"}>
                        {has_memory ? "包含" : "不包含"}
                      </Tag>
                    ),
                  },
                  {
                    title: "父快照",
                    dataIndex: "parent",
                    key: "parent",
                    render: (parent: string) => parent || "无",
                  },
                  {
                    title: "操作",
                    key: "action",
                    render: (_, record: VMSnapshot) => (
                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          disabled={record.is_current || snapshotOperationLoading}
                          loading={snapshotOperationLoading}
                          onClick={() => handleRevertSnapshot(record)}
                        >
                          恢复
                        </Button>
                        {/* <Button
                          size="small"
                          onClick={() =>
                            message.info(`编辑快照功能开发中: ${record.name}`)
                          }
                        >
                          编辑
                        </Button> */}
                        <Button
                          size="small"
                          danger
                          disabled={record.is_current || snapshotOperationLoading}
                          loading={snapshotOperationLoading}
                          onClick={() => handleDeleteSnapshot(record)}
                        >
                          删除
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无快照"
                    />
                  ),
                }}
              />
              <Alert
                style={{ marginTop: 16 }}
                message="快照说明"
                description="快照是虚拟机在特定时间点的完整状态备份，可以快速恢复到该状态。创建快照前建议先关机。"
                type="info"
                showIcon
              />
            </Card>
          </div>
        ),
      },
      {
        key: "backup",
        label: "备份",
        children: (
          <div>
            <Card
              title="备份管理"
              extra={
                <Button type="primary" icon={<SaveOutlined />}>
                  创建备份
                </Button>
              }
            >
              <Table
                size="small"
                dataSource={[
                  {
                    id: 1,
                    name: "backup-daily-20250520",
                    type: "完整备份",
                    createTime: "2025-05-20 02:00:00",
                    size: "8.5 GB",
                    status: "完成",
                    retention: "30天",
                  },
                  {
                    id: 2,
                    name: "backup-daily-20250521",
                    type: "增量备份",
                    createTime: "2025-05-21 02:00:00",
                    size: "1.2 GB",
                    status: "完成",
                    retention: "30天",
                  },
                  {
                    id: 3,
                    name: "backup-manual-20250525",
                    type: "手动备份",
                    createTime: "2025-05-25 14:30:00",
                    size: "8.8 GB",
                    status: "进行中",
                    retention: "永久",
                  },
                ]}
                columns={[
                  { title: "备份名称", dataIndex: "name", key: "name" },
                  {
                    title: "类型",
                    dataIndex: "type",
                    key: "type",
                    render: (type: string) => {
                      const color =
                        type === "完整备份"
                          ? "blue"
                          : type === "增量备份"
                          ? "green"
                          : "orange";
                      return <Tag color={color}>{type}</Tag>;
                    },
                  },
                  {
                    title: "创建时间",
                    dataIndex: "createTime",
                    key: "createTime",
                  },
                  { title: "大小", dataIndex: "size", key: "size" },
                  {
                    title: "状态",
                    dataIndex: "status",
                    key: "status",
                    render: (status: string) => {
                      const color =
                        status === "完成"
                          ? "success"
                          : status === "进行中"
                          ? "processing"
                          : "error";
                      return <Tag color={color}>{status}</Tag>;
                    },
                  },
                  { title: "保留期", dataIndex: "retention", key: "retention" },
                  {
                    title: "操作",
                    key: "action",
                    render: (_, record: Backup) => (
                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          disabled={record.status === "进行中"}
                          onClick={() =>
                            message.success(`从备份 ${record.name} 恢复`)
                          }
                        >
                          恢复
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            message.info(`下载备份 ${record.name}`)
                          }
                        >
                          下载
                        </Button>
                        <Button
                          size="small"
                          danger
                          disabled={record.status === "进行中"}
                          onClick={() =>
                            message.success(`删除备份 ${record.name}`)
                          }
                        >
                          删除
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                pagination={false}
              />
              <Card title="自动备份设置" style={{ marginTop: 16 }} size="small">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <div>
                      <strong>备份策略:</strong>
                      <br />
                      <Tag color="blue">每日备份</Tag>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div>
                      <strong>备份时间:</strong>
                      <br />
                      <span>02:00</span>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div>
                      <strong>保留期:</strong>
                      <br />
                      <span>30天</span>
                    </div>
                  </Col>
                </Row>
                <Button
                  style={{ marginTop: 16 }}
                  onClick={() => message.info("配置自动备份")}
                >
                  配置自动备份
                </Button>
              </Card>
            </Card>
          </div>
        ),
      },
    ];

    return (
      <div>
        {/* Modal contextHolder 必须在这里渲染，否则 modal.confirm 不会工作 */}
        {contextHolder}
        <div style={{ marginBottom: "24px" }}>
          <h3
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: themeConfig.token.colorTextBase,
            }}
          >
            <DesktopOutlined />
            虚拟机详情 - {sidebarSelectedVM.name}
            <Tag
              color={
                sidebarSelectedVM.status === "running" ? "success" : "error"
              }
            >
              {sidebarSelectedVM.status}
            </Tag>
          </h3>
        </div>

        {/* 虚拟机操作区域 */}
        <Card
          title="虚拟机操作"
          extra={
            <div style={{ display: "flex", gap: "8px" }}>
              {/* 第一行：有接口的功能 */}
              <div>
                <Space wrap>
                  {sidebarSelectedVM.status === "running" ? (
                    <>
                      <Button
                        icon={<PoweroffOutlined />}
                        danger
                        onClick={() =>
                          handleVMAction("stop", sidebarSelectedVM)
                        }
                      >
                        关机
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() =>
                          handleVMAction("restart", sidebarSelectedVM)
                        }
                      >
                        重启
                      </Button>
                      <Button
                        icon={<PauseOutlined />}
                        onClick={() =>
                          handleVMAction("suspend", sidebarSelectedVM)
                        }
                      >
                        挂起
                      </Button>
                    </>
                  ) : sidebarSelectedVM.status === "stopped" ? (
                    <>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() =>
                          handleVMAction("start", sidebarSelectedVM)
                        }
                      >
                        开机
                      </Button>
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() =>
                          handleVMAction("clone", sidebarSelectedVM)
                        }
                      >
                        克隆
                      </Button>
                      <Button
                        icon={<FileImageOutlined />}
                        onClick={() =>
                          handleVMAction("template", sidebarSelectedVM)
                        }
                      >
                        转换为模板
                      </Button>
                    </>
                  ) : sidebarSelectedVM.status === "suspended" ? (
                    <>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() =>
                          handleVMAction("resume", sidebarSelectedVM)
                        }
                      >
                        继续
                      </Button>
                      <Button
                        icon={<PoweroffOutlined />}
                        danger
                        onClick={() =>
                          handleVMAction("stop", sidebarSelectedVM)
                        }
                      >
                        关机
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleVMAction("start", sidebarSelectedVM)}
                    >
                      开机
                    </Button>
                  )}
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleVMAction("delete", sidebarSelectedVM)}
                  >
                    删除
                  </Button>
                </Space>
              </div>

              {/* 第二行：没有接口的功能 */}
              <div>
                <Space wrap>
                  <Button
                    icon={<ThunderboltOutlined />}
                    onClick={() => message.info("高可用设置")}
                  >
                    高可用
                  </Button>
                  <Button
                    icon={<MenuOutlined />}
                    onClick={() => setBootManagementModal(true)}
                  >
                    引导设置
                  </Button>
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => handleVMAction("break", sidebarSelectedVM)}
                  >
                    重置配置
                  </Button>
                </Space>
              </div>
            </div>
          }
        >
          <Tabs
            activeKey={vmDetailActiveTab}
            onChange={(key) => {
              setVmDetailActiveTab(key);
              // 移除直接调用 fetchSnapshots()，依靠 useEffect 来处理
            }}
            items={vmDetailTabs}
          />
        </Card>

        {/* 创建快照模态框 */}
        <Modal
          title="创建快照"
          open={createSnapshotModal}
          onCancel={() => setCreateSnapshotModal(false)}
          footer={null}
          width={500}
          destroyOnHidden
        >
          <Form
            layout="vertical"
            onFinish={handleCreateSnapshot}
            initialValues={{
              includeMemory: false,
            }}
          >
            <Form.Item
              label="快照名称"
              name="snapshotName"
              rules={[
                { required: true, message: "请输入快照名称" },
                { max: 50, message: "快照名称不能超过50个字符" },
                {
                  pattern: /^[a-zA-Z0-9_-]+$/,
                  message: "快照名称只能包含字母、数字、下划线和连字符",
                },
              ]}
            >
              <Input placeholder="请输入快照名称" />
            </Form.Item>

            <Form.Item
              label="描述"
              name="description"
              rules={[{ max: 200, message: "描述不能超过200个字符" }]}
            >
              <Input.TextArea
                placeholder="请输入快照描述（可选）"
                rows={3}
              />
            </Form.Item>

            <Form.Item name="includeMemory" valuePropName="checked">
              <Checkbox>包含内存状态（推荐在虚拟机运行时勾选）</Checkbox>
            </Form.Item>

            <Alert
              message="注意事项"
              description="创建快照会占用额外的存储空间。如果虚拟机正在运行，建议勾选『包含内存状态』以保存当前的运行状态。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={() => setCreateSnapshotModal(false)}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createSnapshotLoading}
                  icon={<CameraOutlined />}
                >
                  创建快照
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 删除快照模态框 */}
        <Modal
          title="删除快照确认"
          open={deleteSnapshotModal}
          onCancel={() => {
            setDeleteSnapshotModal(false);
            setSelectedSnapshotForDelete(null);
          }}
          footer={null}
          width={600}
          destroyOnHidden
        >
          {selectedSnapshotForDelete && (
            <Form
              layout="vertical"
              onFinish={handleConfirmDeleteSnapshot}
              initialValues={{
                deleteChildren: false,
              }}
            >
              <Alert
                message={`确定要删除快照 "${selectedSnapshotForDelete.name}" 吗？`}
                description="此操作不可逆，请谨慎操作。"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <div style={{ marginBottom: 16 }}>
                <h4>快照信息：</h4>
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="快照名称">
                    {selectedSnapshotForDelete.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {selectedSnapshotForDelete.created_at}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={selectedSnapshotForDelete.is_current ? "green" : "default"}>
                      {selectedSnapshotForDelete.is_current ? "当前活跃" : "历史快照"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="包含内存">
                    <Tag color={selectedSnapshotForDelete.has_memory ? "blue" : "default"}>
                      {selectedSnapshotForDelete.has_memory ? "是" : "否"}
                    </Tag>
                  </Descriptions.Item>
                  {selectedSnapshotForDelete.describe && (
                    <Descriptions.Item label="描述">
                      {selectedSnapshotForDelete.describe}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>

              <Alert
                message="删除选项"
                description={
                  <div>
                    <div>• 删除快照操作不可逆，请确认后操作</div>
                    <div>• 如果该快照有子快照，您可以选择是否一并删除</div>
                    <div>• 删除当前活跃快照可能会影响虚拟机状态</div>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item name="deleteChildren" valuePropName="checked">
                <Checkbox>
                  同时删除此快照的所有子快照（谨慎操作）
                </Checkbox>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Space>
                  <Button 
                    onClick={() => {
                      setDeleteSnapshotModal(false);
                      setSelectedSnapshotForDelete(null);
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    loading={snapshotOperationLoading}
                    icon={<DeleteOutlined />}
                  >
                    确认删除
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </Modal>

        {/* 引导设置模态框 */}
        <BootManagement
          visible={bootManagementModal}
          onCancel={() => setBootManagementModal(false)}
          vmInfo={(() => {
            if (sidebarSelectedVM && 'name' in sidebarSelectedVM) {
              // 从当前vmList中找到对应的虚拟机详细信息
              const vmData = vmList.find(
                (vm) => vm.vm_name === (sidebarSelectedVM as { name: string }).name
              );
              return vmData;
            }
            return undefined;
          })()}
          onSuccess={() => {
            // 刷新虚拟机数据
            loadVmData();
          }}
        />

        {/* 修改CPU弹窗 */}
        <Modal
          title="修改CPU核心数"
          open={cpuModalVisible}
          onCancel={() => setCpuModalVisible(false)}
          onOk={async () => {
            try {
              const values = await cpuForm.validateFields();
              setCpuLoading(true);
              const res = await vmService.updateVMCpu({
                hostname: selectedVM?.hostname || '',
                vm_name: selectedVM?.vm_name || '',
                cpu_num: values.cpu_num,
              });
              message.success(res.data?.message || res.message);
              setCpuModalVisible(false);
              loadVmData();
            } catch (err:unknown) {
              message.error(err instanceof Error ? err.message : '未知错误');
            } finally {
              setCpuLoading(false);
            }
          }}
          confirmLoading={cpuLoading}
          destroyOnClose
        >
          <Form form={cpuForm} layout="vertical">
            <Form.Item
              name="cpu_num"
              label="CPU核心数"
              rules={[{ required: true, message: '请输入CPU核心数' }, { type: 'number', min: 1, message: '必须大于0' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 修改内存弹窗 */}
        <Modal
          title="修改内存大小(GB)"
          open={memoryModalVisible}
          onCancel={() => setMemoryModalVisible(false)}
          onOk={async () => {
            try {
              const values = await memoryForm.validateFields();
              setMemoryLoading(true);
              const res = await vmService.updateVMMemory({
                hostname: selectedVM?.hostname || '',
                vm_name: selectedVM?.vm_name || '',
                memory_gb: values.memory_gb,
              });
              message.success(res.data?.message || res.message);
              setMemoryModalVisible(false);
              loadVmData();
            } catch (err:unknown) {
              message.error(err instanceof Error ? err.message : '未知错误');
              // 校验失败或接口异常
            } finally {
              setMemoryLoading(false);
            }
          }}
          confirmLoading={memoryLoading}
          destroyOnClose
        >
          <Form form={memoryForm} layout="vertical">
            <Form.Item
              name="memory_gb"
              label="内存大小(GB)"
              rules={[{ required: true, message: '请输入内存大小' }, { type: 'number', min: 1, message: '必须大于0' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  return (
    <Spin spinning={loading} tip="加载虚拟机数据中...">
      {/* Modal contextHolder 必须在这里渲染，否则 modal.confirm 不会工作 */}
      {contextHolder}
      <div
        style={{
          width: "100%",
          minHeight: loading ? "400px" : "auto",
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
          <h3 style={{ color: themeConfig.token.colorTextBase, margin: 0 }}>
            虚拟机管理
          </h3>
          <Space>
            <span style={{ fontSize: "12px", color: "#666" }}>自动刷新</span>
            <Switch
              size="small"
              checked={autoRefresh}
              onChange={setAutoRefresh}
            />
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: "24px", width: "100%" }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总虚拟机数量"
                value={vmStats.total}
                prefix={<CloudServerOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="运行中"
                value={vmStats.running}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已停止"
                value={vmStats.stopped}
                valueStyle={{ color: "#ff4d4f" }}
                prefix={<StopOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="异常"
                value={vmStats.error}
                valueStyle={{ color: "#faad14" }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 主要内容区域 */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarExtraContent={
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateVMModal(true)}
                >
                  创建虚拟机
                </Button>
                <Button icon={<SyncOutlined />} onClick={handleRefresh}>
                  刷新
                </Button>
              </Space>
            }
            items={[
              {
                key: "list",
                label: "虚拟机列表",
                children: (
                  <>
                    {/* 筛选工具栏 */}
                    <div
                      style={{
                        marginBottom: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        <Input
                          placeholder="搜索虚拟机名称、ID或主机名"
                          prefix={<SearchOutlined />}
                          style={{ width: 280 }}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          allowClear
                        />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Tooltip title="导出">
                          <Button icon={<ExportOutlined />} />
                        </Tooltip>
                        <Dropdown
                          menu={{
                            items: menuItems,
                            onClick: ({ key }) => handleBatchAction(key),
                          }}
                          disabled={selectedRowKeys.length === 0}
                        >
                          <Button>
                            批量操作 <DownOutlined />
                          </Button>
                        </Dropdown>
                        <Tooltip title="表格列设置">
                          <Button icon={<SettingOutlined />} />
                        </Tooltip>
                      </div>
                    </div>

                    {/* 选中提示 */}
                    {selectedRowKeys.length > 0 && (
                      <Alert
                        message={`已选择 ${selectedRowKeys.length} 台虚拟机`}
                        type="info"
                        style={{ marginBottom: 16 }}
                        closable
                        onClose={() => setSelectedRowKeys([])}
                      />
                    )}

                    {/* 虚拟机表格 */}
                    <Table
                      columns={columns}
                      dataSource={filteredData}
                      rowKey="uuid"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                      }}
                      scroll={{ x: 1400 }}
                      bordered
                      size="middle"
                      style={{
                        fontSize: "14px",
                      }}
                      rowSelection={{
                        type: "checkbox",
                        columnWidth: 32,
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                      }}
                      locale={{
                        emptyText: (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                              <div>
                                <p>当前暂无虚拟机</p>
                                <p style={{ color: "#666", fontSize: "12px" }}>
                                  点击"创建虚拟机"按钮开始创建您的第一台虚拟机
                                </p>
                              </div>
                            }
                          >
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => setCreateVMModal(true)}
                            >
                              创建虚拟机
                            </Button>
                          </Empty>
                        ),
                      }}
                    />
                  </>
                ),
              },
              ...tabItems.map((item) => ({
                key: item.key,
                label: item.label,
                children: item.children,
              })),
            ]}
          ></Tabs>
        </Card>

        {/* 虚拟机详情模态框 */}
        <Modal
          title={`虚拟机详情 - ${selectedVM?.vm_name}`}
          open={detailModal}
          onCancel={() => setDetailModal(false)}
          footer={null}
          width={800}
        >
          {selectedVM && (
            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: "basic",
                  label: "基本信息",
                  children: (
                    <div>
                      <Descriptions column={2} bordered>
                        <Descriptions.Item label="虚拟机名称">
                          {selectedVM.vm_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="物理主机">
                          {selectedVM.hostname}
                        </Descriptions.Item>
                        <Descriptions.Item label="配置状态">
                          <Tag
                            color={
                              selectedVM.config_status ? "success" : "warning"
                            }
                          >
                            {selectedVM.config_status ? "已配置" : "配置中"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="运行状态">
                          <Tag
                            color={
                              selectedVM?.status === "running"
                                ? "success"
                                : selectedVM?.status === "stopped"
                                ? "default"
                                : "error"
                            }
                          >
                            {(() => {
                              switch (selectedVM?.status) {
                                case "running":
                                  return "运行中";
                                case "stopped":
                                  return "已停止";
                                default:
                                  return "已停止";
                              }
                            })()}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="错误信息">
                          {selectedVM?.error ? (
                            <Tag color="error">{selectedVM.error}</Tag>
                          ) : (
                            <Tag color="success">正常</Tag>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="虚拟机ID">
                          {selectedVM?.uuid || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="CPU核心数">
                          {selectedVM?.config?.cpu_num || selectedVM?.cpu_count}核
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ padding: 0, marginLeft: 8 }}
                            onClick={() => {
                              cpuForm.setFieldsValue({
                                cpu_num: selectedVM.config?.cpu_num || selectedVM.cpu_count || 1,
                              });
                              setCpuModalVisible(true);
                            }}
                            aria-label="修改CPU核心数"
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="内存大小">
                          {selectedVM?.config?.memory_gb || selectedVM?.memory_gb}GB
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            size="small"
                            style={{ padding: 0, marginLeft: 8 }}
                            onClick={() => {
                              memoryForm.setFieldsValue({
                                memory_gb: selectedVM.config?.memory_gb || selectedVM.memory_gb || 1,
                              });
                              setMemoryModalVisible(true);
                            }}
                            aria-label="修改内存大小"
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="启动设备">
                          {selectedVM?.config?.boot?.join(" → ") ||
                            selectedVM?.boot_order?.join(" → ") ||
                            "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="虚拟机类型">
                          <Tag color="blue">VM</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="磁盘数量">
                          {selectedVM?.config?.disk?.length ||
                            selectedVM?.disk_info?.length ||
                            "N/A"}
                          个
                        </Descriptions.Item>
                        <Descriptions.Item label="网络接口数量">
                          {selectedVM?.config?.net?.length ||
                            selectedVM?.network_info?.length ||
                            "N/A"}
                          个
                        </Descriptions.Item>
                        <Descriptions.Item label="主MAC地址">
                          {selectedVM?.config?.net?.[0]?.mac ||
                            selectedVM?.network_info?.[0]?.mac ||
                            "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="主网桥">
                          {selectedVM?.config?.net?.[0]?.bridge ||
                            selectedVM?.network_info?.[0]?.bridge ||
                            "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="配置摘要">
                          {selectedVM?.config?.metadata?.digested?.substring(0, 16) ||
                            selectedVM?.metadata?.digested?.substring(0, 16) ||
                            "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="配置更新时间">
                          {selectedVM?.config?.metadata?.updated_at
                            ? new Date(
                                parseFloat(selectedVM.config.metadata.updated_at) *
                                  1000
                              ).toLocaleString()
                            : selectedVM?.metadata?.updated_at
                            ? new Date(
                                parseFloat(selectedVM.metadata.updated_at) * 1000
                              ).toLocaleString()
                            : "N/A"}
                        </Descriptions.Item>
                      </Descriptions>

                      {/* 磁盘配置详情 */}
                      {selectedVM?.disk_info &&
                        selectedVM.disk_info.length > 0 && (
                          <Card
                            title="磁盘配置"
                            size="small"
                            style={{ marginTop: 16 }}
                          >
                            <Table
                              size="small"
                              dataSource={selectedVM?.config?.disk || selectedVM?.disk_info || []}
                              pagination={false}
                              columns={[
                                {
                                  title: "设备名",
                                  dataIndex: "name",
                                  key: "name",
                                },
                                {
                                  title: "总线类型",
                                  dataIndex: "bus_type",
                                  key: "bus_type",
                                },
                                {
                                  title: "格式",
                                  dataIndex: "format",
                                  key: "format",
                                  render: (format: string) => (
                                    <Tag color="blue">{format}</Tag>
                                  ),
                                },
                                {
                                  title: "路径",
                                  dataIndex: "path",
                                  key: "path",
                                  ellipsis: true,
                                },
                              ]}
                            />
                          </Card>
                        )}

                      {/* 网络配置详情 */}
                      {selectedVM?.network_info &&
                        selectedVM.network_info.length > 0 && (
                          <Card
                            title="网络配置"
                            size="small"
                            style={{ marginTop: 16 }}
                          >
                            <Table
                              size="small"
                              dataSource={selectedVM?.config?.net || selectedVM?.network_info || []}
                              pagination={false}
                              columns={[
                                {
                                  title: "网卡类型",
                                  dataIndex: "name",
                                  key: "name",
                                },
                                {
                                  title: "MAC地址",
                                  dataIndex: "mac",
                                  key: "mac",
                                  render: (mac: string) => (
                                    <code style={{ fontSize: "12px" }}>
                                      {mac}
                                    </code>
                                  ),
                                },
                                {
                                  title: "网桥",
                                  dataIndex: "bridge",
                                  key: "bridge",
                                  render: (bridge: string) => (
                                    <Tag color="green">{bridge}</Tag>
                                  ),
                                },
                              ]}
                            />
                          </Card>
                        )}

                      {/* 其他配置信息 - 使用接口字段 */}
                      <Card
                        title="其他配置"
                        size="small"
                        style={{ marginTop: 16 }}
                      >
                        <Descriptions column={3} size="small">
                          <Descriptions.Item label="光驱数量">
                            {selectedVM.config?.cdrom?.length || 0}个
                          </Descriptions.Item>
                          <Descriptions.Item label="USB设备">
                            {selectedVM.config?.usb?.length || 0}个
                          </Descriptions.Item>
                          <Descriptions.Item label="PCI设备">
                            {selectedVM.config?.pci?.length || 0}个
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </div>
                  ),
                },
                {
                  key: "performance",
                  label: "性能监控",
                  children: (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card title="CPU使用率" size="small">
                          <Progress percent={0} />
                          <div
                            style={{
                              textAlign: "center",
                              color: "#999",
                              fontSize: "12px",
                              marginTop: "8px",
                            }}
                          >
                            暂无数据
                          </div>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card title="内存使用率" size="small">
                          <Progress percent={0} />
                          <div
                            style={{
                              textAlign: "center",
                              color: "#999",
                              fontSize: "12px",
                              marginTop: "8px",
                            }}
                          >
                            暂无数据
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: "hardware",
                  label: "硬件配置",
                  children: (
                    <div>
                      <Descriptions
                        column={1}
                        bordered
                        style={{ marginBottom: 16 }}
                      >
                        <Descriptions.Item label="处理器">
                          {selectedVM.cpu_count} 核心
                        </Descriptions.Item>
                        <Descriptions.Item label="内存">
                          {selectedVM.memory_gb} GB
                        </Descriptions.Item>
                        <Descriptions.Item label="启动设备">
                          {selectedVM.boot_order?.join(" → ") || "N/A"}
                        </Descriptions.Item>
                      </Descriptions>

                      {/* 磁盘信息 */}
                      {selectedVM.disk_info &&
                        selectedVM.disk_info.length > 0 && (
                          <Card
                            title="磁盘配置"
                            size="small"
                            style={{ marginBottom: 16 }}
                          >
                            <Table
                              size="small"
                              dataSource={selectedVM.disk_info}
                              pagination={false}
                              columns={[
                                {
                                  title: "设备名",
                                  dataIndex: "name",
                                  key: "name",
                                },
                                {
                                  title: "总线类型",
                                  dataIndex: "bus_type",
                                  key: "bus_type",
                                },
                                {
                                  title: "格式",
                                  dataIndex: "format",
                                  key: "format",
                                  render: (format: string) => (
                                    <Tag color="blue">{format}</Tag>
                                  ),
                                },
                                {
                                  title: "路径",
                                  dataIndex: "path",
                                  key: "path",
                                  ellipsis: true,
                                },
                              ]}
                            />
                          </Card>
                        )}

                      {/* 网络配置 */}
                      {selectedVM.network_info &&
                        selectedVM.network_info.length > 0 && (
                          <Card title="网络配置" size="small">
                            <Table
                              size="small"
                              dataSource={selectedVM.network_info}
                              pagination={false}
                              columns={[
                                {
                                  title: "网卡类型",
                                  dataIndex: "name",
                                  key: "name",
                                },
                                {
                                  title: "MAC地址",
                                  dataIndex: "mac",
                                  key: "mac",
                                  render: (mac: string) => (
                                    <code style={{ fontSize: "12px" }}>
                                      {mac}
                                    </code>
                                  ),
                                },
                                {
                                  title: "网桥",
                                  dataIndex: "bridge",
                                  key: "bridge",
                                  render: (bridge: string) => (
                                    <Tag color="green">{bridge}</Tag>
                                  ),
                                },
                              ]}
                            />
                          </Card>
                        )}
                    </div>
                  ),
                },
                {
                  key: "hardware",
                  label: "硬件配置",
                  children: (
                    <div>
                      <Alert
                        message="硬件配置"
                        description="此功能将显示虚拟机的硬件配置信息。"
                        type="info"
                        showIcon
                      />
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Modal>

        {/* 创建虚拟机模态框 */}
        <CreateVMModal
          visible={createVMModal}
          onCancel={() => setCreateVMModal(false)}
          onFinish={handleCreateVM}
          loading={loading}
          defaultHostname={
            sidebarSelectedHost
              ? String(
                  (sidebarSelectedHost as Record<string, unknown>).name || ""
                )
              : undefined
          } // 传递选中的物理主机名
        />
      </div>
    </Spin>
  );
};

export default VirtualMachineManagement;
