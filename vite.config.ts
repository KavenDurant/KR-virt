/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-22 16:33:12
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-05-23 14:50:17
 * @FilePath: /KR-virt/vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig({
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
    port: 3000,
    open: true,
    host: "0.0.0.0",
    proxy: {
      // 配置代理
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
