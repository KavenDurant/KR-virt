#!/bin/bash
###
 # @Author: KavenDurant luojiaxin888@gmail.com
 # @Date: 2025-07-18 09:48:56
 # @LastEditors: KavenDurant luojiaxin888@gmail.com
 # @LastEditTime: 2025-07-18 10:13:57
 # @FilePath: /KR-virt/server/start.sh
 # @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
### 

# SSH代理服务器启动脚本

echo "🚀 启动SSH代理服务器..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js未安装，请先安装Node.js 16+版本"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm未安装，请先安装npm"
    exit 1
fi

# 进入服务器目录
cd "$(dirname "$0")"

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: package.json文件不存在"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 检查安装是否成功
if [ $? -ne 0 ]; then
    echo "❌ 错误: 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 启动服务器
echo "🌟 启动SSH代理服务器..."
echo "📡 WebSocket服务: ws://localhost:3001"
echo "🔍 健康检查: http://localhost:3002/health"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

npm start
