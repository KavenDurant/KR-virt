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
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";
import type { VMManagementData } from "../../services/mockData";
import { mockVMManagementData } from "../../services/mockData";
import { useTabSync } from "@/hooks/useTabSync";

// 使用统一的虚拟机数据类型
type VirtualMachine = VMManagementData;

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

const VirtualMachineOptimized: React.FC = () => {
  const { themeConfig } = useTheme();
  // 使用useTabSync Hook实现tab与URL同步
  const { activeTab, setActiveTab } = useTabSync({ defaultTab: "list" });
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
  }, []);

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
  }, []);

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

  // 虚拟机操作
  const handleVMAction = (action: string, vm: VirtualMachine) => {
    message.success(`${action} ${vm.name} 操作已执行`);
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

  // 表格列定义
  const columns: ColumnsType<VirtualMachine> = [
    {
      title: "虚拟机",
      key: "vm",
      width: 200,
      render: (_: unknown, record: VirtualMachine) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            {record.name}
          </div>
          <div style={{ color: "#666", fontSize: "12px" }}>{record.id}</div>
          <div style={{ fontSize: "12px" }}>
            <Tag>{record.platform}</Tag>
            {record.tags.map((tag: string) => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
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
      render: (_: unknown, record: VirtualMachine) => (
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
      render: (_: unknown, record: VirtualMachine) => (
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
      render: (_: unknown, record: VirtualMachine) => (
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
      render: (_: unknown, record: VirtualMachine) => (
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
              <Button type="primary" icon={<PlusOutlined />}>
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
                      selections: [
                        Table.SELECTION_ALL,
                        Table.SELECTION_INVERT,
                        Table.SELECTION_NONE,
                      ],
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
    </div>
  );
};

export default VirtualMachineOptimized;
