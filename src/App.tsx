import { useState } from "react";
import { Layout, Menu, Tabs, Tree } from "antd";
import {
  FileOutlined,
  SearchOutlined,
  BugOutlined,
  BranchesOutlined,
  SettingOutlined,
  FolderOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import "./App.css";
// 引入Less样式文件
import "@/styles/theme.less";

const { DirectoryTree } = Tree;

// 示例文件树数据
const treeData = [
  {
    title: "src",
    key: "0-0",
    icon: <FolderOutlined />,
    children: [
      {
        title: "App.tsx",
        key: "0-0-0",
        icon: <FileTextOutlined />,
      },
      {
        title: "App.css",
        key: "0-0-1",
        icon: <FileTextOutlined />,
      },
      {
        title: "assets",
        key: "0-0-2",
        icon: <FolderOutlined />,
        children: [
          {
            title: "react.svg",
            key: "0-0-2-0",
            icon: <FileOutlined />,
          },
        ],
      },
      {
        title: "main.tsx",
        key: "0-0-3",
        icon: <FileTextOutlined />,
      },
    ],
  },
  {
    title: "public",
    key: "0-1",
    icon: <FolderOutlined />,
    children: [
      {
        title: "vite.svg",
        key: "0-1-0",
        icon: <FileOutlined />,
      },
    ],
  },
];

function App() {
  const [selectedActivityItem, setSelectedActivityItem] = useState("1");
  // 避免未使用变量警告
  const sampleData = useSelector((state: RootState) => state.app.sampleData);
  console.log("Sample data:", sampleData);

  return (
    <Layout
      className="app-layout"
      style={{ height: "100vh", display: "flex", flexDirection: "row" }}
    >
      {/* 活动栏 - VS Code左侧窄栏 */}
      <div className="activity-bar">
        <Menu
          className="activity-bar-menu"
          selectedKeys={[selectedActivityItem]}
          mode="vertical"
          theme="dark"
          onClick={(e) => setSelectedActivityItem(e.key)}
          items={[
            {
              key: "1",
              icon: <FileOutlined style={{ fontSize: "22px" }} />,
            },
            {
              key: "2",
              icon: <SearchOutlined style={{ fontSize: "22px" }} />,
            },
            {
              key: "3",
              icon: <BugOutlined style={{ fontSize: "22px" }} />,
            },
            {
              key: "4",
              icon: <BranchesOutlined style={{ fontSize: "22px" }} />,
            },
            {
              key: "5",
              icon: <SettingOutlined style={{ fontSize: "22px" }} />,
            },
          ]}
        />
      </div>

      {/* 侧边栏 - 文件浏览器、搜索等 */}
      <div className="sidebar" style={{ width: 250 }}>
        <div className="sidebar-header">资源管理器</div>
        <div
          style={{
            padding: "0 4px",
            height: "calc(100% - 35px)",
            overflow: "auto",
          }}
        >
          <DirectoryTree
            className="explorer-tree"
            defaultExpandAll
            treeData={treeData}
          />
        </div>
      </div>

      {/* 编辑器区域 */}
      <Layout style={{ flex: 1, height: "100vh", overflow: "hidden" }}>
        <div className="editor-area">
          <Tabs
            className="editor-tab"
            type="card"
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "App.tsx",
                children: (
                  <div
                    className="editor-content"
                    style={{
                      padding: "10px",
                      whiteSpace: "pre-line",
                      height: "calc(100vh - 58px)",
                      overflow: "auto",
                    }}
                  >
                    <pre
                      style={{
                        color: "#d4d4d4",
                        fontFamily: "Consolas, Monaco, monospace",
                      }}
                    >
                      {`import React from 'react';
import { Layout } from 'antd';

// VS Code风格界面
function App() {
  return (
    <Layout>
      {/* VS Code布局实现 */}
    </Layout>
  );
}

export default App;`}
                    </pre>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Layout>
    </Layout>
  );
}

export default App;
