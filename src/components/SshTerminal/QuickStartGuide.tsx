/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-18 10:45:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-18 11:16:15
 * @FilePath: /KR-virt/src/components/SshTerminal/QuickStartGuide.tsx
 * @Description: SSH终端2快速启动指南
 */

import { Modal, Steps, Typography, Alert, Button } from "antd";
import {
  TeamOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";

const { Paragraph, Text } = Typography;

interface QuickStartGuideProps {
  visible: boolean;
  onClose: () => void;
}

export default function QuickStartGuide({
  visible,
  onClose,
}: QuickStartGuideProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("命令已复制到剪贴板");
    });
  };

  const steps = [
    {
      title: "打开终端",
      description: (
        <div>
          <Paragraph>在您的系统中打开终端应用程序：</Paragraph>
          <ul>
            <li>
              <strong>Windows:</strong> 打开 PowerShell 或 CMD
            </li>
            <li>
              <strong>macOS:</strong> 打开 Terminal.app
            </li>
            <li>
              <strong>Linux:</strong> 打开终端模拟器
            </li>
          </ul>
        </div>
      ),
      icon: <TeamOutlined />,
    },
    {
      title: "进入服务器目录",
      description: (
        <div>
          <Paragraph>导航到项目的 server 目录：</Paragraph>
          <div
            style={{
              background: "#f6f8fa",
              padding: "12px",
              borderRadius: "6px",
              fontFamily: "monospace",
              position: "relative",
            }}
          >   
            <Text code style={{'color':"#888"}}>cd /path/to/KR-virt/server</Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              style={{ position: "absolute", right: "8px", top: "8px" }}
              onClick={() => copyToClipboard("cd /path/to/KR-virt/server")}
            />
          </div>
          <Alert
            message="提示"
            description="请将 /path/to/KR-virt 替换为您的实际项目路径"
            type="info"
            showIcon
            style={{ marginTop: "8px" }}
          />
        </div>
      ),
      icon: <PlayCircleOutlined />,
    },
    {
      title: "安装依赖",
      description: (
        <div>
          <Paragraph>安装SSH代理服务器所需的依赖包：</Paragraph>
          <div
            style={{
              background: "#f6f8fa",
              padding: "12px",
              borderRadius: "6px",
              fontFamily: "monospace",
              position: "relative",
            }}
          >
            <Text code style={{'color':"#888"}}>npm install</Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              style={{ position: "absolute", right: "8px", top: "8px" }}
              onClick={() => copyToClipboard("npm install")}
            />
          </div>
          <Paragraph
            style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
          >
            这将安装 ssh2、ws、express 等必要的依赖包
          </Paragraph>
        </div>
      ),
      icon: <PlayCircleOutlined />,
    },
    {
      title: "启动服务器",
      description: (
        <div>
          <Paragraph>启动SSH代理服务器，选择以下任一方式：</Paragraph>

          <div style={{ marginBottom: "16px" }}>
            <Text strong  style={{'color':"#888"}}>方式一：使用npm命令</Text>
            <div
              style={{
                background: "#f6f8fa",
                padding: "12px",
                borderRadius: "6px",
                fontFamily: "monospace",
                position: "relative",
                marginTop: "8px",
              }}
            >
              <Text code  style={{'color':"#888"}}>npm start</Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                style={{ position: "absolute", right: "8px", top: "8px" }}
                onClick={() => copyToClipboard("npm start")}
              />
            </div>
          </div>

          <div>
            <Text strong  style={{'color':"#888"}}>方式二：使用启动脚本</Text>
            <div
              style={{
                background: "#f6f8fa",
                padding: "12px",
                borderRadius: "6px",
                fontFamily: "monospace",
                position: "relative",
                marginTop: "8px",
              }}
            >
              <Text code  style={{'color':"#888"}}>./start.sh</Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                style={{ position: "absolute", right: "8px", top: "8px" }}
                onClick={() => copyToClipboard("./start.sh")}
              />
            </div>
          </div>

          <Alert
            message="成功启动标志"
            description={
              <div>
                看到以下信息表示服务器启动成功：
                <div
                  style={{
                    marginTop: "8px",
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                >
                  🚀 SSH代理服务器启动在端口 3001
                  <br />
                  📡 WebSocket服务: ws://localhost:3001
                  <br />
                  🔍 健康检查: http://localhost:3002/health
                </div>
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: "12px" }}
          />
        </div>
      ),
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TeamOutlined style={{ color: "#1890ff" }} />
          <span>SSH终端2 - 快速启动指南</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          我知道了
        </Button>
      }
      width={700}
      styles={{
        body: { maxHeight: "70vh", overflowY: "auto" },
      }}
    >
      <Alert
        message="关于SSH终端2"
        description="SSH终端2使用本地Node.js代理服务器建立SSH连接，提供更稳定和安全的SSH体验。首次使用需要启动代理服务器。"
        type="info"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <Steps
        direction="vertical"
        current={-1}
        items={steps}
        style={{ marginBottom: "24px" }}
      />

      <Alert
        message="需要帮助？"
        description={
          <div>
            <div>如果遇到问题，请检查：</div>
            <ul style={{ marginTop: "8px", marginBottom: 0 }}>
              <li>
                Node.js 版本是否为 16+ (运行 <code>node --version</code> 检查)
              </li>
              <li>端口 3001 和 3002 是否被其他程序占用</li>
              <li>防火墙是否阻止了本地连接</li>
              <li>项目目录权限是否正确</li>
            </ul>
          </div>
        }
        type="warning"
        showIcon
      />
    </Modal>
  );
}
