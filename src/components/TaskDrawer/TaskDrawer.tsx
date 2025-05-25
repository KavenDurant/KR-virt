import React, { useRef } from "react";
import { Tabs, Badge, List, Avatar, Tag } from "antd";
import {
  ClockCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import "./TaskDrawer.less";

interface TaskDrawerProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}
// test commit
// 模拟数据
const taskQueueData = [
  {
    id: "task-1",
    title: "创建虚拟机",
    status: "processing",
    time: "2025-05-23 14:30:45",
    percent: 35,
  },
  {
    id: "task-2",
    title: "备份数据库服务器",
    status: "completed",
    time: "2025-05-23 13:15:22",
    percent: 100,
  },
  {
    id: "task-3",
    title: "部署新应用",
    status: "failed",
    time: "2025-05-23 12:45:10",
    percent: 68,
  },
  {
    id: "task-4",
    title: "更新系统参数",
    status: "completed",
    time: "2025-05-23 11:30:05",
    percent: 100,
  },
];

const alertsData = [
  {
    id: "alert-1",
    title: "虚拟机CPU使用率过高",
    level: "error",
    time: "2025-05-23 14:25:33",
    resource: "vm-001",
  },
  {
    id: "alert-2",
    title: "存储空间不足",
    level: "warning",
    time: "2025-05-23 13:42:15",
    resource: "storage-pool-01",
  },
  {
    id: "alert-3",
    title: "网络连接不稳定",
    level: "warning",
    time: "2025-05-23 12:38:22",
    resource: "network-001",
  },
  {
    id: "alert-4",
    title: "安全更新可用",
    level: "info",
    time: "2025-05-23 11:15:45",
    resource: "system",
  },
];

const logsData = [
  {
    id: "log-1",
    action: "用户登录",
    user: "系统管理员",
    time: "2025-05-23 15:02:12",
    details: "IP: 192.168.1.100",
  },
  {
    id: "log-2",
    action: "创建虚拟机",
    user: "开发团队",
    time: "2025-05-23 14:38:05",
    details: "VM: web-server-02",
  },
  {
    id: "log-3",
    action: "修改安全组规则",
    user: "网络管理员",
    time: "2025-05-23 13:50:18",
    details: "SG: default",
  },
  {
    id: "log-4",
    action: "备份还原",
    user: "DBA团队",
    time: "2025-05-23 12:25:33",
    details: "VM: db-server-01",
  },
];

const TaskDrawer: React.FC<TaskDrawerProps> = ({
  visible,
  onClose,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // 渲染任务状态图标
  const renderTaskStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "failed":
        return <CloseCircleOutlined style={{ color: "#f5222d" }} />;
      case "processing":
        return <SyncOutlined spin style={{ color: "#1890ff" }} />;
      default:
        return <InfoCircleOutlined style={{ color: "#1890ff" }} />;
    }
  };

  // 渲染告警等级图标和标签
  const renderAlertLevel = (level: string) => {
    let color;
    let icon;

    switch (level) {
      case "error":
        color = "#f5222d";
        icon = <WarningOutlined />;
        break;
      case "warning":
        color = "#faad14";
        icon = <WarningOutlined />;
        break;
      case "info":
        color = "#1890ff";
        icon = <InfoCircleOutlined />;
        break;
      default:
        color = "#1890ff";
        icon = <InfoCircleOutlined />;
    }

    return (
      <Tag color={color} icon={icon}>
        {level.toUpperCase()}
      </Tag>
    );
  };

  const items = [
    {
      key: "1",
      label: (
        <span>
          <ClockCircleOutlined />
          任务队列
          <Badge
            count={
              taskQueueData.filter((t) => t.status === "processing").length
            }
            offset={[5, -3]}
            showZero={false}
          />
        </span>
      ),
      children: (
        <List
          className="task-list"
          itemLayout="horizontal"
          dataSource={taskQueueData}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[<span className="task-time">{item.time}</span>]}
            >
              <List.Item.Meta
                avatar={renderTaskStatusIcon(item.status)}
                title={<span className="task-title">{item.title}</span>}
                description={
                  <div className="task-progress-wrapper">
                    <div
                      className={`task-progress task-progress-${item.status}`}
                      style={{ width: `${item.percent}%` }}
                    />
                    <span className="task-percent">{item.percent}%</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <WarningOutlined />
          告警信息
          <Badge
            count={alertsData.filter((a) => a.level === "error").length}
            offset={[5, -3]}
            showZero={false}
          />
        </span>
      ),
      children: (
        <List
          className="alert-list"
          itemLayout="horizontal"
          dataSource={alertsData}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[<span className="alert-time">{item.time}</span>]}
            >
              <List.Item.Meta
                avatar={renderAlertLevel(item.level)}
                title={<span className="alert-title">{item.title}</span>}
                description={
                  <span className="alert-resource">资源: {item.resource}</span>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "3",
      label: (
        <span>
          <HistoryOutlined />
          操作日志
        </span>
      ),
      children: (
        <List
          className="log-list"
          itemLayout="horizontal"
          dataSource={logsData}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[<span className="log-time">{item.time}</span>]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<FileTextOutlined />}
                    style={{ backgroundColor: "#87d068" }}
                  />
                }
                title={<span className="log-title">{item.action}</span>}
                description={
                  <div className="log-details">
                    <span className="log-user">用户: {item.user}</span>
                    <span className="log-detail">{item.details}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div className="task-drawer-container" ref={panelRef}>
      {visible ? (
        <PanelGroup autoSaveId="task-panel" direction="vertical">
          <Panel defaultSize={70} minSize={30} className="main-content-panel">
            <div className="editor-content">{children}</div>
          </Panel>
          <PanelResizeHandle className="resize-handle">
            <div className="handle-bar">
              <div className="handle-icon" />
            </div>
          </PanelResizeHandle>
          <Panel
            defaultSize={30}
            minSize={15}
            maxSize={70}
            className="drawer-panel"
            style={{ overflow: "hidden" }}
          >
            <div className="drawer-header">
              <h3>消息中心</h3>
              <span className="close-button" onClick={onClose}>
                ✕
              </span>
            </div>
            <div className="drawer-content">
              <Tabs
                defaultActiveKey="1"
                items={items}
                className="drawer-tabs"
              />
            </div>
          </Panel>
        </PanelGroup>
      ) : (
        <div className="main-content-panel">
          <div className="editor-content">{children}</div>
        </div>
      )}
    </div>
  );
};

export default TaskDrawer;
