/*
 * SSH代理服务器
 * 提供WebSocket接口，在后端建立SSH连接
 */

const WebSocket = require("ws");
const { Client } = require("ssh2");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: 3001 });

console.log("SSH代理服务器启动在端口 3001");

wss.on("connection", (ws) => {
  console.log("新的WebSocket连接");

  let sshClient = null;
  let sshStream = null;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "connect") {
        // 建立SSH连接
        const { config } = data;

        sshClient = new Client();

        sshClient.on("ready", () => {
          console.log("SSH连接已建立");

          // 创建shell会话
          sshClient.shell(
            {
              term: "xterm-256color",
              cols: 80,
              rows: 24,
            },
            (err, stream) => {
              if (err) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    message: "创建shell会话失败: " + err.message,
                  })
                );
                return;
              }

              sshStream = stream;

              // 通知前端连接成功
              ws.send(
                JSON.stringify({
                  type: "connected",
                })
              );

              // 将SSH输出转发到WebSocket
              stream.on("data", (data) => {
                ws.send(
                  JSON.stringify({
                    type: "data",
                    data: data.toString(),
                  })
                );
              });

              stream.on("close", () => {
                console.log("SSH会话已关闭");
                ws.send(
                  JSON.stringify({
                    type: "disconnected",
                  })
                );
              });

              stream.stderr.on("data", (data) => {
                ws.send(
                  JSON.stringify({
                    type: "data",
                    data: data.toString(),
                  })
                );
              });
            }
          );
        });

        sshClient.on("error", (err) => {
          console.error("SSH连接错误:", err);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "SSH连接失败: " + err.message,
            })
          );
        });

        sshClient.on("close", () => {
          console.log("SSH连接已关闭");
          ws.send(
            JSON.stringify({
              type: "disconnected",
            })
          );
        });

        // 连接SSH服务器
        const connectionConfig = {
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          readyTimeout: 20000,
          keepaliveInterval: 30000,
        };

        if (config.privateKey) {
          connectionConfig.privateKey = config.privateKey;
          delete connectionConfig.password;
        }

        sshClient.connect(connectionConfig);
      } else if (data.type === "input") {
        // 转发用户输入到SSH会话
        if (sshStream) {
          sshStream.write(data.data);
        }
      } else if (data.type === "resize") {
        // 调整终端大小
        if (sshStream) {
          sshStream.setWindow(data.rows, data.cols);
        }
      }
    } catch (error) {
      console.error("处理消息错误:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "服务器内部错误: " + error.message,
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("WebSocket连接已关闭");

    // 清理SSH连接
    if (sshStream) {
      sshStream.end();
    }
    if (sshClient) {
      sshClient.end();
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket错误:", error);
  });
});

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "SSH代理服务器运行正常" });
});

// 启动HTTP服务器（可选，用于健康检查）
const httpServer = app.listen(3002, () => {
  console.log("HTTP健康检查服务器启动在端口 3002");
});

// 优雅关闭
process.on("SIGTERM", () => {
  console.log("收到SIGTERM信号，正在关闭服务器...");
  wss.close(() => {
    httpServer.close(() => {
      console.log("服务器已关闭");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("收到SIGINT信号，正在关闭服务器...");
  wss.close(() => {
    httpServer.close(() => {
      console.log("服务器已关闭");
      process.exit(0);
    });
  });
});
