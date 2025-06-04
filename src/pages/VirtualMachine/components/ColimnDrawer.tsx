import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Card,
  Badge,
  Row,
  Col,
  Statistic,
  Tooltip,
  Alert,
} from "antd";
import {
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
  UndoOutlined,
  SaveOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

// 列配置接口
export interface ColumnConfig {
  key: string;
  title: string;
  visible: boolean;
  fixed?: boolean; // 固定列不可隐藏
  group?: string; // 列分组
  description?: string; // 列描述
}

// 预定义的列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    key: "vm",
    title: "虚拟机",
    visible: true,
    fixed: true,
    group: "基本信息",
    description: "虚拟机名称、ID和标签信息",
  },
  {
    key: "status",
    title: "状态",
    visible: true,
    group: "基本信息",
    description: "虚拟机运行状态",
  },
  {
    key: "network",
    title: "网络",
    visible: true,
    group: "网络配置",
    description: "IP地址和网络类型",
  },
  {
    key: "spec",
    title: "规格配置",
    visible: true,
    group: "资源配置",
    description: "CPU、内存、存储配置信息",
  },
  {
    key: "os",
    title: "操作系统",
    visible: true,
    group: "基本信息",
    description: "操作系统类型和版本",
  },
  {
    key: "location",
    title: "位置信息",
    visible: true,
    group: "部署信息",
    description: "集群、主机、可用区信息",
  },
  {
    key: "createTime",
    title: "创建时间",
    visible: true,
    group: "时间信息",
    description: "虚拟机创建时间",
  },
  {
    key: "owner",
    title: "负责人",
    visible: true,
    group: "管理信息",
    description: "虚拟机负责人",
  },
  {
    key: "action",
    title: "操作",
    visible: true,
    fixed: true,
    group: "操作",
    description: "虚拟机操作按钮",
  },
];

// 组件属性接口
interface ColumnDrawerProps {
  visible: boolean;
  onClose: () => void;
  onColumnChange: (columns: ColumnConfig[]) => void;
  initialColumns?: ColumnConfig[];
}

const STORAGE_KEY = "vm_table_column_config";

const ColumnDrawer: React.FC<ColumnDrawerProps> = ({
  visible,
  onClose,
  onColumnChange,
  initialColumns = DEFAULT_COLUMNS,
}) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(initialColumns);
  const [originalColumns, setOriginalColumns] =
    useState<ColumnConfig[]>(initialColumns);
  const [hasChanges, setHasChanges] = useState(false);
  console.log(visible, onClose, onColumnChange, initialColumns, "--------");
  // 从本地存储加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        // 合并默认配置和保存的配置，确保新增的列也会显示
        const mergedConfig = DEFAULT_COLUMNS.map((defaultCol) => {
          const savedCol = parsedConfig.find(
            (col: ColumnConfig) => col.key === defaultCol.key,
          );
          return savedCol
            ? { ...defaultCol, visible: savedCol.visible }
            : defaultCol;
        });
        setColumns(mergedConfig);
        setOriginalColumns(mergedConfig);
      } catch (error) {
        console.error("Failed to parse saved column config:", error);
      }
    }
  }, []);

  // 检测是否有变更
  useEffect(() => {
    const hasChanged = columns.some(
      (col, index) => col.visible !== originalColumns[index]?.visible,
    );
    setHasChanges(hasChanged);
  }, [columns, originalColumns]);

  // 切换列显示状态
  const toggleColumnVisibility = (key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col,
      ),
    );
  };

  // 保存配置
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
      setOriginalColumns([...columns]);
      onColumnChange(columns);
      setHasChanges(false);
      message.success("列设置已保存");
    } catch {
      message.error("保存失败，请重试");
    }
  };

  // 重置为默认配置
  const handleReset = () => {
    setColumns([...DEFAULT_COLUMNS]);
    setHasChanges(true);
    message.info("已重置为默认配置");
  };

  // 撤销更改
  const handleUndo = () => {
    setColumns([...originalColumns]);
    setHasChanges(false);
    message.info("已撤销更改");
  };

  // 显示全部列
  const showAllColumns = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, visible: true })));
  };

  // 隐藏可选列（保留固定列）
  const hideOptionalColumns = () => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        visible: col.fixed || false,
      })),
    );
  };

  // 按分组组织列
  const groupedColumns = columns.reduce(
    (groups, column) => {
      const group = column.group || "其他";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(column);
      return groups;
    },
    {} as Record<string, ColumnConfig[]>,
  );

  // 统计信息
  const visibleCount = columns.filter((col) => col.visible).length;
  const totalCount = columns.length;
  const fixedCount = columns.filter((col) => col.fixed).length;

  return (
    <Drawer
      title={
        <Space>
          <SettingOutlined />
          <span>表格列设置</span>
        </Space>
      }
      placement="right"
      width={480}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          {hasChanges && (
            <Badge dot>
              <Button type="primary" size="small" onClick={handleSave}>
                <SaveOutlined /> 保存
              </Button>
            </Badge>
          )}
        </Space>
      }
      footer={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <Button onClick={handleUndo} disabled={!hasChanges}>
              <UndoOutlined /> 撤销
            </Button>
            <Button onClick={handleReset}>
              <ReloadOutlined /> 重置
            </Button>
          </Space>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleSave} disabled={!hasChanges}>
              <SaveOutlined /> 保存设置
            </Button>
          </Space>
        </Space>
      }
    >
      {/* 统计信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="显示列数"
              value={visibleCount}
              suffix={`/ ${totalCount}`}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="固定列"
              value={fixedCount}
              valueStyle={{ fontSize: 16, color: "#1890ff" }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="可选列"
              value={totalCount - fixedCount}
              valueStyle={{ fontSize: 16, color: "#52c41a" }}
            />
          </Col>
        </Row>
      </Card>

      {/* 快速操作 */}
      <Card size="small" title="快速操作" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button size="small" onClick={showAllColumns}>
            <EyeOutlined /> 显示全部
          </Button>
          <Button size="small" onClick={hideOptionalColumns}>
            <EyeInvisibleOutlined /> 隐藏可选
          </Button>
        </Space>
      </Card>

      {/* 使用说明 */}
      <Alert
        message="使用说明"
        description={
          <div>
            <p>• 可以通过开关控制列的显示和隐藏</p>
            <p>• 固定列（如虚拟机、操作）不可隐藏</p>
            <p>• 设置会自动保存到本地存储</p>
            <p>• 重置可恢复到默认配置</p>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
        showIcon
      />

      <Divider orientation="left">列配置</Divider>

      {/* 分组显示列配置 */}
      {Object.entries(groupedColumns).map(([groupName, groupColumns]) => (
        <Card
          key={groupName}
          size="small"
          title={groupName}
          style={{ marginBottom: 12 }}
          extra={
            <Text type="secondary">
              {groupColumns.filter((col) => col.visible).length}/
              {groupColumns.length}
            </Text>
          }
        >
          <List
            size="small"
            dataSource={groupColumns}
            renderItem={(column: ColumnConfig) => (
              <List.Item
                style={{
                  padding: "8px 0",
                  opacity: column.fixed ? 0.6 : 1,
                }}
              >
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {column.title}
                      {column.fixed && (
                        <Badge
                          count="固定"
                          style={{
                            backgroundColor: "#1890ff",
                            marginLeft: 8,
                            fontSize: 10,
                          }}
                        />
                      )}
                    </div>
                    {column.description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {column.description}
                      </Text>
                    )}
                  </div>
                  <Tooltip title={column.fixed ? "固定列不可隐藏" : undefined}>
                    <Switch
                      size="small"
                      checked={column.visible}
                      disabled={column.fixed}
                      onChange={() => toggleColumnVisibility(column.key)}
                    />
                  </Tooltip>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      ))}

      {/* 更改提示 */}
      {hasChanges && (
        <Alert
          message="有未保存的更改"
          description="请点击保存按钮以应用列设置更改"
          type="warning"
          style={{ marginTop: 16 }}
          showIcon
        />
      )}
    </Drawer>
  );
};

export default ColumnDrawer;
