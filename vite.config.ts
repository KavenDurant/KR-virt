/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-22 16:33:12
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-16 16:35:15
 * @FilePath: /KR-virt/vite.config.ts
 * @Description: Vite配置 - 支持多环境配置
 */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log(`🚀 构建模式: ${mode}`);
  console.log(`📡 API地址: ${env.VITE_API_BASE_URL}`);
  console.log(`🎯 代理目标: ${env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL}`);
  console.log(`🎭 Mock数据: ${env.VITE_ENABLE_MOCK === 'true' ? '启用' : '禁用'}`);
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true, // 支持JavaScript表达式
          additionalData: '@import "@/styles/variables.less";', // 全局导入变量文件
        },
      },
    },
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      open: true,
      host: "0.0.0.0",
      proxy: {
        // 配置代理
        "/api": {
          target: env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || "http://192.168.1.187:8001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    build: {
      outDir: "dist",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            antd: ['antd'],
            router: ['react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '0.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __BUILD_MODE__: JSON.stringify(mode),
    },
  };
});
