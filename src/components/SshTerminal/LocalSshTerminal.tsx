/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-18 10:00:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-18 10:05:11
 * @FilePath: /KR-virt/src/components/SshTerminal/LocalSshTerminal.tsx
 * @Description: 基于本地SSH连接的终端组件
 */

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { Modal, Button, Space, Tooltip, Form, Input, InputNumber } from "antd";
import {
  SearchOutlined,
  CopyOutlined,
  ClearOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LinkOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState, useCallback } from "react";
import SshProxyStatus from "./SshProxyStatus";

interface LocalSshTerminalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  width?: string | number;
  height?: string | number;
  theme?: "dark" | "light";
}

interface SshConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export default function LocalSshTerminal({
  show,
  onClose,
  title = "SSH终端",
  width = "90%",
  height = "85vh",
  theme = "dark",
}: LocalSshTerminalProps) {
  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);

  // States
  const [, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  const [proxyServerRunning, setProxyServerRunning] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState<SshConnectionConfig>(
    () => {
      // 从localStorage加载保存的配置
      const savedConfig = localStorage.getItem("ssh-terminal-config");
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          return {
            host: parsed.host || "",
            port: parsed.port || 22,
            username: parsed.username || "",
            password: "", // 出于安全考虑，不保存密码
            privateKey: parsed.privateKey || "",
          };
        } catch {
          // 如果解析失败，使用默认配置
        }
      }
      return {
        host: "",
        port: 22,
        username: "",
        password: "",
      };
    }
  );

  const [form] = Form.useForm();

  // 主题配置
  const getTerminalTheme = useCallback(() => {
    if (theme === "light") {
      return {
        background: "#ffffff",
        foreground: "#000000",
        cursor: "#000000",
        selection: "#0078d4",
      };
    }
    return {
      background: "#1e1e1e",
      foreground: "#d4d4d4",
      cursor: "#d4d4d4",
      selection: "#264f78",
    };
  }, [theme]);

  // 创建终端实例
  const createTerminal = useCallback(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 10000,
      tabStopWidth: 8,
      fontSize: 14,
      fontFamily:
        '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", Monaco, Menlo, monospace',
      allowProposedApi: true,
      altClickMovesCursor: true,
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
      theme: getTerminalTheme(),
    });

    return term;
  }, [getTerminalTheme]);

  // 建立SSH连接
  const connectToSsh = useCallback(async (config: SshConnectionConfig) => {
    try {
      setConnectionStatus("connecting");

      // 创建WebSocket连接到SSH代理服务
      // 优先使用环境变量配置的服务器地址，否则使用本地地址
      const proxyHost = import.meta.env.VITE_SSH_PROXY_HOST || window.location.hostname;
      const proxyPort = import.meta.env.VITE_SSH_PROXY_PORT || '3001';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${proxyHost}:${proxyPort}/ssh`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        // 发送SSH连接配置
        socket.send(
          JSON.stringify({
            type: "connect",
            config: config,
          })
        );
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "connected") {
          setConnectionStatus("connected");
          setIsConnected(true);
          setShowConnectionForm(false);
          if (termRef.current) {
            termRef.current.write("\x1b[32m✓ SSH连接成功建立\x1b[0m\r\n");
          }
        } else if (message.type === "data") {
          if (termRef.current) {
            termRef.current.write(message.data);
          }
        } else if (message.type === "error") {
          setConnectionStatus("error");
          setIsConnected(false);
          if (termRef.current) {
            termRef.current.write(
              `\x1b[31m✗ 连接错误: ${message.message}\x1b[0m\r\n`
            );
          }
          // 显示错误提示
          setTimeout(() => {
            setShowConnectionForm(true);
          }, 2000);
        } else if (message.type === "disconnected") {
          setConnectionStatus("disconnected");
          setIsConnected(false);
          if (termRef.current) {
            termRef.current.write("\x1b[33m⚠ SSH连接已断开\x1b[0m\r\n");
          }
        }
      };

      socket.onerror = () => {
        setConnectionStatus("error");
        if (termRef.current) {
          termRef.current.write("\x1b[31m✗ 连接失败\x1b[0m\r\n");
        }
      };

      socket.onclose = () => {
        setConnectionStatus("disconnected");
        setIsConnected(false);
        if (termRef.current) {
          termRef.current.write("\x1b[33m⚠ 连接已断开\x1b[0m\r\n");
        }
      };

      socketRef.current = socket;
    } catch (error) {
      setConnectionStatus("error");
      console.error("SSH连接失败:", error);
    }
  }, []);

  // 初始化终端
  useEffect(() => {
    if (show && terminalRef.current && !showConnectionForm) {
      const term = createTerminal();

      // 创建并加载插件
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const unicode11Addon = new Unicode11Addon();
      const searchAddon = new SearchAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      term.loadAddon(unicode11Addon);
      term.loadAddon(searchAddon);

      term.unicode.activeVersion = "11";

      // 挂载终端到 DOM
      term.open(terminalRef.current);

      // 保存引用
      termRef.current = term;
      fitAddonRef.current = fitAddon;
      searchAddonRef.current = searchAddon;

      // 适配大小
      setTimeout(() => {
        fitAddon.fit();
      }, 100);

      // 终端数据处理
      term.onData((data) => {
        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "input",
              data: data,
            })
          );
        }
      });

      // 终端大小变化处理
      term.onResize(({ cols, rows }) => {
        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "resize",
              cols,
              rows,
            })
          );
        }
      });

      // 窗口大小调整处理
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      window.addEventListener("resize", handleResize);

      // 清理函数
      return () => {
        window.removeEventListener("resize", handleResize);

        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }

        if (termRef.current) {
          termRef.current.dispose();
          termRef.current = null;
        }

        fitAddonRef.current = null;
        searchAddonRef.current = null;
        setIsConnected(false);
        setConnectionStatus("disconnected");
      };
    }
  }, [show, showConnectionForm, createTerminal]);

  // 工具栏功能
  const handleCopy = useCallback(() => {
    if (termRef.current && termRef.current.hasSelection()) {
      const selection = termRef.current.getSelection();
      navigator.clipboard.writeText(selection);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (termRef.current) {
      termRef.current.clear();
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (searchAddonRef.current && termRef.current) {
      const searchTerm = prompt("请输入搜索内容:");
      if (searchTerm) {
        searchAddonRef.current.findNext(searchTerm);
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }, 100);
  }, [isFullscreen]);

  const handleConnect = () => {
    form
      .validateFields()
      .then((values) => {
        // 保存配置到localStorage（不包含密码）
        const configToSave = {
          host: values.host,
          port: values.port,
          username: values.username,
          privateKey: values.privateKey || "",
        };
        localStorage.setItem(
          "ssh-terminal-config",
          JSON.stringify(configToSave)
        );

        setConnectionConfig(values);
        connectToSsh(values);
      })
      .catch((error) => {
        console.error("表单验证失败:", error);
      });
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setShowConnectionForm(true);
  };

  if (!show) {
    return null;
  }

  return (
    <Modal
      open={show}
      onCancel={onClose}
      title={title}
      width={isFullscreen ? "100vw" : width}
      height={isFullscreen ? "100vh" : undefined}
      centered={!isFullscreen}
      styles={{
        body: {
          height: isFullscreen ? "calc(100vh - 110px)" : height,
          padding: showConnectionForm ? "24px" : 0,
          display: "flex",
          flexDirection: "column",
        },
      }}
      footer={null}
      closable={!isFullscreen}
      maskClosable={false}
    >
      {showConnectionForm ? (
        <div style={{ maxWidth: "500px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#1890ff" }}>
              SSH连接配置
            </h3>
            <p style={{ color: "#666", margin: 0 }}>
              配置SSH服务器连接信息，支持密码和密钥认证
            </p>
          </div>

          <SshProxyStatus onStatusChange={setProxyServerRunning} />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleConnect}
            initialValues={connectionConfig}
            autoComplete="off"
          >
            <Form.Item
              label="服务器地址"
              name="host"
              rules={[
                { required: true, message: "请输入服务器地址" },
                { pattern: /^[\w\.-]+$/, message: "请输入有效的服务器地址" },
              ]}
            >
              <Input
                placeholder="192.168.1.100 或 example.com"
                prefix={<LinkOutlined style={{ color: "#1890ff" }} />}
              />
            </Form.Item>

            <Form.Item
              label="端口"
              name="port"
              rules={[
                { required: true, message: "请输入端口号" },
                {
                  type: "number",
                  min: 1,
                  max: 65535,
                  message: "端口号范围: 1-65535",
                },
              ]}
            >
              <InputNumber
                min={1}
                max={65535}
                style={{ width: "100%" }}
                placeholder="22"
              />
            </Form.Item>

            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 1, max: 32, message: "用户名长度: 1-32字符" },
              ]}
            >
              <Input placeholder="root" autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ min: 1, message: "密码不能为空" }]}
            >
              <Input.Password
                placeholder="请输入SSH密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={connectionStatus === "connecting"}
                disabled={!proxyServerRunning}
                block
                size="large"
                style={{ height: "40px" }}
              >
                {connectionStatus === "connecting"
                  ? "正在连接..."
                  : !proxyServerRunning
                  ? "SSH代理服务器未运行"
                  : "连接SSH服务器"}
              </Button>
            </Form.Item>

            {connectionStatus === "error" && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#fff2f0",
                  border: "1px solid #ffccc7",
                  borderRadius: "6px",
                  color: "#a8071a",
                }}
              >
                <strong>连接失败</strong>
                <br />
                请检查服务器地址、端口、用户名和密码是否正确
              </div>
            )}
          </Form>
        </div>
      ) : (
        <>
          {/* 工具栏 */}
          <div
            style={{
              padding: "8px 16px",
              borderBottom: "1px solid #d9d9d9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: theme === "dark" ? "#2f2f2f" : "#fafafa",
            }}
          >
            <Space>
              <Tooltip title="复制选中文本">
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleCopy}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="清空终端">
                <Button
                  type="text"
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="搜索">
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  size="small"
                />
              </Tooltip>
            </Space>

            <Space>
              <Tooltip title="断开连接">
                <Button
                  type="text"
                  icon={<DisconnectOutlined />}
                  onClick={handleDisconnect}
                  size="small"
                />
              </Tooltip>
              <Tooltip title={isFullscreen ? "退出全屏" : "全屏显示"}>
                <Button
                  type="text"
                  icon={
                    isFullscreen ? (
                      <FullscreenExitOutlined />
                    ) : (
                      <FullscreenOutlined />
                    )
                  }
                  onClick={toggleFullscreen}
                  size="small"
                />
              </Tooltip>
            </Space>
          </div>

          {/* 终端容器 */}
          <div
            ref={terminalRef}
            style={{
              flex: 1,
              backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
              padding: "8px",
            }}
          />
        </>
      )}
    </Modal>
  );
}
