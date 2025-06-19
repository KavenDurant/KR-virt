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
  Select,
  Dropdown,
  Tooltip,
  Progress,
  Descriptions,
  Tabs,
  Modal,
  Alert,
  message,
  Switch,
  Empty,
} from "antd";
import type { MenuProps, TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PoweroffOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
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
  WifiOutlined,
  DesktopOutlined,
  ClusterOutlined,
  UserOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PauseOutlined,
  FileImageOutlined,
  TagOutlined,
  MenuOutlined,
  CodeOutlined,
  CameraOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";
import { useSidebarSelection } from "../../hooks";
import type {
  VirtualMachine as VMData,
  VMManagementData,
  Node,
} from "../../services/mockData";
import { mockVMManagementData } from "../../services/mockData";
import { CreateVMModal } from "./components";

// 使用统一的虚拟机数据类型
type VirtualMachine = VMManagementData;

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

// 快照接口
interface Snapshot {
  id: number;
  name: string;
  description: string;
  createTime: string;
  size: string;
  parent: string | null;
  current?: boolean;
}

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

// 统计信息类型
interface VMStats {
  total: number;
  running: number;
  stopped: number;
  error: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
}

/**
 * 虚拟机管理主组件
 *
 * 重构说明：
 * - 使用 useSidebarSelection Hook 统一管理侧边栏选择状态
 * - 移除了重复的事件监听逻辑
 * - 简化了状态管理，提高了代码复用性
 */
const VirtualMachineManagement: React.FC = () => {
  const { themeConfig } = useTheme();

  /**
   * 侧边栏选择状态管理
   *
   * 重构优势：
   * - 复用了集群管理模块的相同逻辑
   * - 自动处理事件监听和清理
   * - 类型安全的状态访问
   * - 统一的状态清理接口
   */
  const {
    selectedHost: sidebarSelectedHost,
    selectedVM: sidebarSelectedVM,
    clearSelection,
  } = useSidebarSelection();

  const [activeTab, setActiveTab] = useState("list");
  const [loading, setLoading] = useState(false);
  const [vmList, setVmList] = useState<VirtualMachine[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [zoneFilter, setZoneFilter] = useState("全部");
  const [platformFilter, setPlatformFilter] = useState("全部");
  const [ownerFilter, setOwnerFilter] = useState("全部");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VirtualMachine | null>(null);
  const [createVMModal, setCreateVMModal] = useState(false);

  /**
   * 侧边栏选择事件处理
   *
   * 重构前：需要手动监听 hierarchical-sidebar-select 事件
   * 重构后：useSidebarSelection Hook 自动处理所有事件监听
   *
   * 移除的代码：
   * - 30+ 行的事件监听逻辑
   * - 手动状态清理
   * - 复杂的条件判断
   *
   * 现在只需要使用 Hook 返回的状态即可
   */

  // 数据加载effect
  useEffect(() => {
    const loadVmData = () => {
      setLoading(true);
      setTimeout(() => {
        setVmList(mockVMManagementData);
        setLoading(false);
      }, 500);
    };

    loadVmData();
  }, []); // 使用统一的数据源

  // 计算统计信息
  const vmStats: VMStats = useMemo(() => {
    const total = vmList.length;
    const running = vmList.filter((vm) => vm.status === "运行中").length;
    const stopped = vmList.filter((vm) => vm.status === "已停止").length;
    const error = vmList.filter((vm) => vm.status === "异常").length;

    const avgCpuUsage =
      vmList.reduce((acc, vm) => {
        return acc + parseInt(vm.cpuUsage.replace("%", ""));
      }, 0) / total;

    const avgMemoryUsage =
      vmList.reduce((acc, vm) => {
        return acc + parseInt(vm.memoryUsage.replace("%", ""));
      }, 0) / total;

    return {
      total,
      running,
      stopped,
      error,
      cpuUsage: Math.round(avgCpuUsage),
      memoryUsage: Math.round(avgMemoryUsage),
      storageUsage: 65, // 模拟存储使用率
    };
  }, [vmList]);

  // 筛选数据
  const filteredData = useMemo(() => {
    return vmList.filter((vm) => {
      const matchSearch =
        searchText === "" ||
        vm.name.toLowerCase().includes(searchText.toLowerCase()) ||
        vm.id.toLowerCase().includes(searchText.toLowerCase()) ||
        (vm.ip && vm.ip.includes(searchText)) ||
        vm.hostName.toLowerCase().includes(searchText.toLowerCase());

      const matchStatus = statusFilter === "全部" || vm.status === statusFilter;
      const matchZone = zoneFilter === "全部" || vm.zone === zoneFilter;
      const matchPlatform =
        platformFilter === "全部" || vm.platform === platformFilter;
      const matchOwner = ownerFilter === "全部" || vm.owner === ownerFilter;

      return (
        matchSearch && matchStatus && matchZone && matchPlatform && matchOwner
      );
    });
  }, [
    vmList,
    searchText,
    statusFilter,
    zoneFilter,
    platformFilter,
    ownerFilter,
  ]);

  // 刷新数据函数
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      // 模拟数据变化
      const updatedData = mockVMManagementData.map((vm) => ({
        ...vm,
        cpuUsage: `${Math.floor(Math.random() * 100)}%`,
        memoryUsage: `${Math.floor(Math.random() * 100)}%`,
      }));
      setVmList(updatedData);
      setLoading(false);
      message.success("数据刷新成功");
    }, 800);
  }, []); // 移除mockVmData依赖，因为它是组件外部的常量

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

  // 虚拟机操作处理函数
  const handleVMAction = (action: string, vm?: VirtualMachine) => {
    const targetVM = vm || sidebarSelectedVM;
    if (!targetVM) return;

    switch (action) {
      case "start":
      case "启动":
        message.success(`启动虚拟机 ${targetVM.name} 成功`);
        break;
      case "stop":
      case "停止":
        message.success(`停止虚拟机 ${targetVM.name} 成功`);
        break;
      case "restart":
      case "重启":
        message.success(`重启虚拟机 ${targetVM.name} 成功`);
        break;
      case "suspend":
        message.success(`挂起虚拟机 ${targetVM.name} 成功`);
        break;
      case "resume":
        message.success(`恢复虚拟机 ${targetVM.name} 成功`);
        break;
      case "clone":
        message.success(`克隆虚拟机 ${targetVM.name} 成功`);
        break;
      case "template":
        message.success(`转换虚拟机 ${targetVM.name} 为模板成功`);
        break;
      case "delete":
        message.success(`删除虚拟机 ${targetVM.name} 成功`);
        break;
      default:
        message.success(`${action} ${targetVM.name} 操作已执行`);
        break;
    }
  };

  // 批量操作
  const handleBatchAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning("请先选择要操作的虚拟机");
      return;
    }
    message.success(
      `批量${action}操作已执行，影响${selectedRowKeys.length}台虚拟机`,
    );
    setSelectedRowKeys([]);
  };

  // 显示虚拟机详情
  const showVMDetail = (vm: VirtualMachine) => {
    setSelectedVM(vm);
    setDetailModal(true);
  };

  // 创建虚拟机
  const handleCreateVM = (values: Record<string, unknown>) => {
    console.log("创建虚拟机:", values);
    setCreateVMModal(false);
    // 这里可以调用API创建虚拟机
  };

  // 表格列定义
  const columns: ColumnsType<VirtualMachine> = [
    {
      title: "虚拟机",
      key: "vm",
      width: 200,
      fixed: "left",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            {record.name}
          </div>
          <div style={{ color: "#666", fontSize: "12px" }}>{record.id}</div>
          <div style={{ fontSize: "12px", marginBottom: "4px" }}>
            <Tag>{record.platform}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const getStatusConfig = (status: string) => {
          switch (status) {
            case "运行中":
              return { color: "success", icon: <CheckCircleOutlined /> };
            case "已停止":
              return { color: "error", icon: <StopOutlined /> };
            case "异常":
              return { color: "warning", icon: <WarningOutlined /> };
            default:
              return { color: "default", icon: <CheckCircleOutlined /> };
          }
        };

        const config = getStatusConfig(status);
        return (
          <Tag color={config.color} icon={config.icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "网络",
      key: "network",
      width: 130,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: "12px" }}>
            <WifiOutlined style={{ marginRight: 4 }} />
            {record.ip}
          </div>
          <div style={{ color: "#666", fontSize: "11px" }}>
            {record.networkType}
          </div>
        </div>
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
            CPU: {record.cpu} ({record.cpuUsage})
          </div>
          <div>
            <DatabaseOutlined style={{ marginRight: 4 }} />
            内存: {record.memory} ({record.memoryUsage})
          </div>
          <div>
            <HddOutlined style={{ marginRight: 4 }} />
            存储: {record.storage}
          </div>
        </div>
      ),
    },
    {
      title: "标签",
      key: "tags",
      width: 160,
      render: (_, record) => (
        <div>
          <div
            style={{ fontSize: "12px", display: "flex", flexWrap: "nowrap" }}
          >
            {record.tags.map((tag) => (
              <Tag key={tag} color="blue" style={{ marginBottom: "2px" }}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "操作系统",
      dataIndex: "os",
      key: "os",
      width: 140,
      render: (os: string) => (
        <div>
          <DesktopOutlined style={{ marginRight: 4 }} />
          {os}
        </div>
      ),
    },
    {
      title: "位置信息",
      key: "location",
      width: 140,
      render: (_, record) => (
        <div style={{ fontSize: "12px" }}>
          <div>
            <ClusterOutlined style={{ marginRight: 4 }} />
            {record.cluster}
          </div>
          <div style={{ color: "#666" }}>
            <CloudServerOutlined style={{ marginRight: 4 }} />
            {record.host}
          </div>
          <div style={{ color: "#666" }}>{record.zone}</div>
        </div>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 120,
      render: (time: string) => (
        <div style={{ fontSize: "12px" }}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {time}
        </div>
      ),
    },
    {
      title: "负责人",
      dataIndex: "owner",
      key: "owner",
      width: 100,
      render: (owner: string) => (
        <div style={{ fontSize: "12px" }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {owner}
        </div>
      ),
    },
    {
      title: "操作",
      key: "action",
      fixed: "right" as const,
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showVMDetail(record)}
            />
          </Tooltip>
          {record.status === "已停止" ? (
            <Tooltip title="启动">
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleVMAction("启动", record)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="停止">
              <Button
                danger
                size="small"
                icon={<PoweroffOutlined />}
                onClick={() => handleVMAction("停止", record)}
              />
            </Tooltip>
          )}
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
                        value={sidebarSelectedHost.cpu}
                        suffix="%"
                        valueStyle={{
                          color:
                            sidebarSelectedHost.cpu > 80
                              ? "#ff4d4f"
                              : "#3f8600",
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="内存使用率"
                        value={sidebarSelectedHost.memory}
                        suffix="%"
                        valueStyle={{
                          color:
                            sidebarSelectedHost.memory > 80
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
                          value={sidebarSelectedHost.vms.length}
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
                    value={sidebarSelectedHost.vms.length}
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
            <Card title="该主机上的虚拟机" size="small">
              <Table
                size="small"
                dataSource={sidebarSelectedHost.vms}
                columns={[
                  {
                    title: "虚拟机名称",
                    dataIndex: "name",
                    key: "name",
                    render: (name: string, record: VMData) => (
                      <div>
                        <div style={{ fontWeight: "bold" }}>{name}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          ID: {record.vmid}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "状态",
                    dataIndex: "status",
                    key: "status",
                    render: (status: string) => (
                      <Tag
                        color={
                          status === "running"
                            ? "success"
                            : status === "stopped"
                              ? "default"
                              : "error"
                        }
                      >
                        {status === "running"
                          ? "运行中"
                          : status === "stopped"
                            ? "已停止"
                            : status}
                      </Tag>
                    ),
                  },
                  {
                    title: "配置",
                    key: "config",
                    render: (_, record: VMData) => (
                      <div style={{ fontSize: "12px" }}>
                        <div>CPU: {record.cpu}核</div>
                        <div>内存: {record.memory}GB</div>
                        <div>磁盘: {record.diskSize}GB</div>
                      </div>
                    ),
                  },
                  {
                    title: "运行时间",
                    dataIndex: "uptime",
                    key: "uptime",
                    render: (uptime: string) => uptime || "未运行",
                  },
                ]}
                pagination={false}
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
                  <Row>
                    <Col span={12}>
                      <Statistic
                        title="CPU 核心数"
                        value={sidebarSelectedVM.cpu}
                        suffix="核"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="内存大小"
                        value={sidebarSelectedVM.memory}
                        suffix="GB"
                      />
                    </Col>
                  </Row>
                  <div style={{ margin: "16px 0" }}>
                    <Row>
                      <Col span={24}>
                        <Statistic
                          title="磁盘大小"
                          value={sidebarSelectedVM.diskSize}
                          suffix="GB"
                        />
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="运行状态" size="small">
                  <div style={{ marginBottom: "16px" }}>
                    <strong>物理节点:</strong>
                    <Tag style={{ marginLeft: "8px" }}>
                      {sidebarSelectedVM.node}
                    </Tag>
                  </div>
                  {sidebarSelectedVM.uptime && (
                    <div style={{ marginBottom: "16px" }}>
                      <strong>运行时间:</strong>
                      <span style={{ marginLeft: "8px", color: "#52c41a" }}>
                        {sidebarSelectedVM.uptime}
                      </span>
                    </div>
                  )}
                  <div>
                    <strong>虚拟机类型:</strong>
                    <Tag color="blue" style={{ marginLeft: "8px" }}>
                      {sidebarSelectedVM.type.toUpperCase()}
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
                    <strong>虚拟机ID:</strong>
                    <br />
                    <span>{sidebarSelectedVM.vmid}</span>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div>
                    <strong>状态:</strong>
                    <br />
                    <Tag
                      color={
                        sidebarSelectedVM.status === "running"
                          ? "success"
                          : "error"
                      }
                    >
                      {sidebarSelectedVM.status}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div>
                    <strong>物理节点:</strong>
                    <br />
                    <span>{sidebarSelectedVM.node}</span>
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
                <Card title="CPU使用率" size="small">
                  <Statistic
                    title="当前使用率"
                    value={Math.floor(Math.random() * 80 + 10)}
                    precision={1}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<ThunderboltOutlined />}
                    suffix="%"
                  />
                  <Progress
                    percent={Math.floor(Math.random() * 80 + 10)}
                    size="small"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="内存使用率" size="small">
                  <Statistic
                    title="当前使用率"
                    value={Math.floor(Math.random() * 80 + 10)}
                    precision={1}
                    valueStyle={{ color: "#1890ff" }}
                    prefix={<DatabaseOutlined />}
                    suffix="%"
                  />
                  <Progress
                    percent={Math.floor(Math.random() * 80 + 10)}
                    size="small"
                  />
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
                  children: (
                    <Card
                      title="网络适配器"
                      extra={
                        <Button type="primary" size="small">
                          添加网卡
                        </Button>
                      }
                    >
                      <Table
                        size="small"
                        dataSource={[
                          {
                            id: 1,
                            name: "net0",
                            model: "virtio",
                            bridge: "vmbr0",
                            mac: "02:00:00:00:00:01",
                            enabled: true,
                          },
                          {
                            id: 2,
                            name: "net1",
                            model: "e1000",
                            bridge: "vmbr1",
                            mac: "02:00:00:00:00:02",
                            enabled: false,
                          },
                        ]}
                        columns={[
                          { title: "设备名", dataIndex: "name", key: "name" },
                          { title: "型号", dataIndex: "model", key: "model" },
                          { title: "网桥", dataIndex: "bridge", key: "bridge" },
                          { title: "MAC地址", dataIndex: "mac", key: "mac" },
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
                          {
                            title: "操作",
                            key: "action",
                            render: () => (
                              <Space>
                                <Button size="small">编辑</Button>
                                <Button size="small" danger>
                                  删除
                                </Button>
                              </Space>
                            ),
                          },
                        ]}
                        pagination={false}
                      />
                    </Card>
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
                  children: (
                    <Card
                      title="USB设备"
                      extra={
                        <Button type="primary" size="small">
                          添加USB
                        </Button>
                      }
                    >
                      <Table
                        size="small"
                        dataSource={[
                          {
                            id: 1,
                            name: "usb0",
                            device: "USB键盘",
                            vendor: "046d",
                            product: "c534",
                            connected: true,
                          },
                        ]}
                        columns={[
                          { title: "设备名", dataIndex: "name", key: "name" },
                          { title: "设备", dataIndex: "device", key: "device" },
                          {
                            title: "Vendor ID",
                            dataIndex: "vendor",
                            key: "vendor",
                          },
                          {
                            title: "Product ID",
                            dataIndex: "product",
                            key: "product",
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
                          {
                            title: "操作",
                            key: "action",
                            render: () => (
                              <Space>
                                <Button size="small">编辑</Button>
                                <Button size="small" danger>
                                  删除
                                </Button>
                              </Space>
                            ),
                          },
                        ]}
                        pagination={false}
                      />
                    </Card>
                  ),
                },
                {
                  key: "cdrom",
                  label: "虚拟光驱",
                  children: (
                    <Card
                      title="光驱设备"
                      extra={
                        <Button type="primary" size="small">
                          挂载ISO
                        </Button>
                      }
                    >
                      <Table
                        size="small"
                        dataSource={[
                          {
                            id: 1,
                            name: "ide2",
                            file: "CentOS-8.iso",
                            size: "8.5 GB",
                            mounted: true,
                          },
                        ]}
                        columns={[
                          { title: "设备名", dataIndex: "name", key: "name" },
                          { title: "ISO文件", dataIndex: "file", key: "file" },
                          { title: "大小", dataIndex: "size", key: "size" },
                          {
                            title: "挂载状态",
                            dataIndex: "mounted",
                            key: "mounted",
                            render: (mounted: boolean) => (
                              <Tag color={mounted ? "success" : "default"}>
                                {mounted ? "已挂载" : "未挂载"}
                              </Tag>
                            ),
                          },
                          {
                            title: "操作",
                            key: "action",
                            render: () => (
                              <Space>
                                <Button size="small">卸载</Button>
                                <Button size="small">更换</Button>
                              </Space>
                            ),
                          },
                        ]}
                        pagination={false}
                      />
                    </Card>
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
                <Button type="primary" icon={<CameraOutlined />}>
                  创建快照
                </Button>
              }
            >
              <Table
                size="small"
                dataSource={[
                  {
                    id: 1,
                    name: "snap-001",
                    description: "安装完成后的快照",
                    createTime: "2025-05-20 14:30:00",
                    size: "2.1 GB",
                    parent: null,
                    current: false,
                  },
                  {
                    id: 2,
                    name: "snap-002",
                    description: "软件配置完成",
                    createTime: "2025-05-22 09:15:00",
                    size: "2.8 GB",
                    parent: "snap-001",
                    current: false,
                  },
                  {
                    id: 3,
                    name: "snap-003",
                    description: "数据迁移前备份",
                    createTime: "2025-05-25 16:45:00",
                    size: "3.2 GB",
                    parent: "snap-002",
                    current: true,
                  },
                ]}
                columns={[
                  {
                    title: "快照名称",
                    dataIndex: "name",
                    key: "name",
                    render: (
                      name: string,
                      record: Snapshot & { current?: boolean },
                    ) => (
                      <div>
                        <strong>{name}</strong>
                        {record.current && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            当前
                          </Tag>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: "描述",
                    dataIndex: "description",
                    key: "description",
                  },
                  {
                    title: "创建时间",
                    dataIndex: "createTime",
                    key: "createTime",
                  },
                  { title: "大小", dataIndex: "size", key: "size" },
                  { title: "父快照", dataIndex: "parent", key: "parent" },
                  {
                    title: "操作",
                    key: "action",
                    render: (_, record: Snapshot) => (
                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          disabled={record.current}
                          onClick={() =>
                            message.success(`恢复到快照 ${record.name}`)
                          }
                        >
                          恢复
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            message.info(`编辑快照 ${record.name}`)
                          }
                        >
                          编辑
                        </Button>
                        <Button
                          size="small"
                          danger
                          disabled={record.current}
                          onClick={() =>
                            message.success(`删除快照 ${record.name}`)
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
      <div style={{ padding: "20px" }}>
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
            虚拟机详情 - {sidebarSelectedVM.name} ({sidebarSelectedVM.vmid})
            <Tag
              color={
                sidebarSelectedVM.status === "running" ? "success" : "error"
              }
            >
              {sidebarSelectedVM.status}
            </Tag>
          </h3>
          <Button
            style={{ marginTop: "8px" }}
            onClick={() => clearSelection()}
          >
            返回列表
          </Button>
        </div>

        {/* 虚拟机操作区域 */}
        <Card
          title="虚拟机操作"
          style={{
            marginBottom: "16px",
          }}
        >
          <Space wrap>
            {sidebarSelectedVM.status === "running" ? (
              <>
                <Button
                  icon={<PoweroffOutlined />}
                  danger
                  onClick={() => handleVMAction("stop")}
                >
                  关机
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => handleVMAction("restart")}
                >
                  重启
                </Button>
                <Button
                  icon={<PauseOutlined />}
                  onClick={() => handleVMAction("suspend")}
                >
                  挂起
                </Button>
              </>
            ) : sidebarSelectedVM.status === "stopped" ? (
              <>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleVMAction("start")}
                >
                  开机
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleVMAction("clone")}
                >
                  克隆
                </Button>
                <Button
                  icon={<FileImageOutlined />}
                  onClick={() => handleVMAction("template")}
                >
                  转换为模板
                </Button>
              </>
            ) : sidebarSelectedVM.status === "suspended" ? (
              <>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleVMAction("resume")}
                >
                  继续
                </Button>
                <Button
                  icon={<PoweroffOutlined />}
                  danger
                  onClick={() => handleVMAction("stop")}
                >
                  关机
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => handleVMAction("start")}
              >
                开机
              </Button>
            )}
            <Button
              icon={<SettingOutlined />}
              onClick={() => message.info("修改计算规格")}
            >
              修改规格
            </Button>
            <Button
              icon={<WifiOutlined />}
              onClick={() => message.info("修改IP地址")}
            >
              修改IP
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={() => message.info("更新操作系统")}
            >
              更新系统
            </Button>
            <Button
              icon={<TagOutlined />}
              onClick={() => message.info("标签配置")}
            >
              标签配置
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => message.info("高可用设置")}
            >
              高可用
            </Button>
            <Button
              icon={<MenuOutlined />}
              onClick={() => message.info("引导项设置")}
            >
              引导设置
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleVMAction("delete")}
            >
              删除
            </Button>
          </Space>
        </Card>

        <Card>
          <Tabs defaultActiveKey="basic" items={vmDetailTabs} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Input
                        placeholder="搜索虚拟机名称、IP、ID或主机名"
                        prefix={<SearchOutlined />}
                        style={{ width: 280 }}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                      />
                      <Select
                        style={{ width: 120 }}
                        placeholder="状态"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                          { value: "全部", label: "全部状态" },
                          { value: "运行中", label: "运行中" },
                          { value: "已停止", label: "已停止" },
                          { value: "异常", label: "异常" },
                        ]}
                      />
                      <Select
                        style={{ width: 140 }}
                        placeholder="可用区"
                        value={zoneFilter}
                        onChange={setZoneFilter}
                        options={[
                          { value: "全部", label: "全部可用区" },
                          { value: "可用区A", label: "可用区A" },
                          { value: "可用区B", label: "可用区B" },
                        ]}
                      />
                      <Select
                        style={{ width: 120 }}
                        placeholder="平台"
                        value={platformFilter}
                        onChange={setPlatformFilter}
                        options={[
                          { value: "全部", label: "全部平台" },
                          { value: "Linux", label: "Linux" },
                          { value: "Windows", label: "Windows" },
                        ]}
                      />
                      <Select
                        style={{ width: 120 }}
                        placeholder="负责人"
                        value={ownerFilter}
                        onChange={setOwnerFilter}
                        options={[
                          { value: "全部", label: "全部负责人" },
                          { value: "系统管理员", label: "系统管理员" },
                          { value: "DBA团队", label: "DBA团队" },
                          { value: "开发团队", label: "开发团队" },
                          { value: "运维团队", label: "运维团队" },
                        ]}
                      />
                      <Tooltip title="更多筛选条件">
                        <Button icon={<FilterOutlined />} />
                      </Tooltip>
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
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    }}
                    loading={loading}
                    scroll={{ x: 1400 }}
                    bordered
                    size="middle"
                    rowSelection={{
                      type: "checkbox",
                      columnWidth: 48,
                      selectedRowKeys,
                      onChange: setSelectedRowKeys,
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
        title={`虚拟机详情 - ${selectedVM?.name}`}
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
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="虚拟机ID">
                      {selectedVM.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="名称">
                      {selectedVM.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag
                        color={
                          selectedVM.status === "运行中" ? "success" : "error"
                        }
                      >
                        {selectedVM.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="开机时间">
                      {selectedVM.uptime}
                    </Descriptions.Item>
                    <Descriptions.Item label="IP地址">
                      {selectedVM.ip}
                    </Descriptions.Item>
                    <Descriptions.Item label="主机名">
                      {selectedVM.hostName}
                    </Descriptions.Item>
                    <Descriptions.Item label="操作系统">
                      {selectedVM.os}
                    </Descriptions.Item>
                    <Descriptions.Item label="虚拟化工具">
                      {selectedVM.tools}
                    </Descriptions.Item>
                    <Descriptions.Item label="CPU">
                      {selectedVM.cpu}
                    </Descriptions.Item>
                    <Descriptions.Item label="内存">
                      {selectedVM.memory}
                    </Descriptions.Item>
                    <Descriptions.Item label="存储">
                      {selectedVM.storage}
                    </Descriptions.Item>
                    <Descriptions.Item label="快照数量">
                      {selectedVM.snapshots}
                    </Descriptions.Item>
                    <Descriptions.Item label="集群">
                      {selectedVM.cluster}
                    </Descriptions.Item>
                    <Descriptions.Item label="物理主机">
                      {selectedVM.host}
                    </Descriptions.Item>
                    <Descriptions.Item label="可用区">
                      {selectedVM.zone}
                    </Descriptions.Item>
                    <Descriptions.Item label="网络类型">
                      {selectedVM.networkType}
                    </Descriptions.Item>
                    <Descriptions.Item label="安全组">
                      {selectedVM.securityGroup}
                    </Descriptions.Item>
                    <Descriptions.Item label="负责人">
                      {selectedVM.owner}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {selectedVM.createTime}
                    </Descriptions.Item>
                    <Descriptions.Item label="到期时间">
                      {selectedVM.expireTime}
                    </Descriptions.Item>
                    <Descriptions.Item label="标签" span={2}>
                      {selectedVM.tags.map((tag) => (
                        <Tag key={tag} color="blue">
                          {tag}
                        </Tag>
                      ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="描述" span={2}>
                      {selectedVM.description}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "performance",
                label: "性能监控",
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card title="CPU使用率" size="small">
                        <Progress percent={parseInt(selectedVM.cpuUsage)} />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="内存使用率" size="small">
                        <Progress percent={parseInt(selectedVM.memoryUsage)} />
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: "hardware",
                label: "硬件配置",
                children: (
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="处理器">
                      {selectedVM.cpu}
                    </Descriptions.Item>
                    <Descriptions.Item label="内存">
                      {selectedVM.memory}
                    </Descriptions.Item>
                    <Descriptions.Item label="系统盘">
                      {selectedVM.rootDisk}
                    </Descriptions.Item>
                    <Descriptions.Item label="数据盘">
                      {selectedVM.dataDisk}
                    </Descriptions.Item>
                    <Descriptions.Item label="网络适配器">
                      {selectedVM.networkType}
                    </Descriptions.Item>
                    <Descriptions.Item label="虚拟化平台">
                      {selectedVM.hypervisor}
                    </Descriptions.Item>
                  </Descriptions>
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
      />
    </div>
  );
};

export default VirtualMachineManagement;
