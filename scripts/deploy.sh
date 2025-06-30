#!/bin/bash

# KR-Virt 虚拟化管理系统 - 自动部署脚本
# Author: KavenDurant luojiaxin888@gmail.com
# Description: 一键部署到 GitHub Pages

set -e  # 遇到错误立即退出

echo "🚀 开始部署 KR-Virt 虚拟化管理系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Node.js 版本
check_node_version() {
    log_info "检查 Node.js 版本..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18 或更高版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js 版本过低，需要 $REQUIRED_VERSION 或更高版本，当前版本：$NODE_VERSION"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过：$NODE_VERSION"
}

# 检查 Git 状态
check_git_status() {
    log_info "检查 Git 状态..."
    
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "工作目录有未提交的更改"
        echo "未提交的文件："
        git status --porcelain
        
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    log_success "Git 状态检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    npm ci
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    if npm run test:run; then
        log_success "所有测试通过"
    else
        log_warning "测试失败，但继续部署"
    fi
}

# 运行代码检查
run_lint() {
    log_info "运行代码检查..."
    if npm run lint; then
        log_success "代码检查通过"
    else
        log_warning "代码检查发现问题，但继续部署"
    fi
}

# 构建项目
build_project() {
    log_info "构建生产版本..."
    
    # 设置环境变量
    export VITE_API_BASE_URL="/api"
    export VITE_APP_TITLE="KR虚拟化管理系统 - Demo"
    export VITE_ENABLE_MOCK="true"
    export VITE_ENABLE_DEV_TOOLS="false"
    
    npm run build:prod
    log_success "项目构建完成"
}

# 部署到 GitHub Pages
deploy_to_github_pages() {
    log_info "准备部署到 GitHub Pages..."
    
    # 检查是否在 GitHub Actions 环境中
    if [ "$GITHUB_ACTIONS" = "true" ]; then
        log_info "在 GitHub Actions 环境中，跳过手动部署"
        return 0
    fi
    
    # 手动部署逻辑（如果需要）
    log_info "手动部署需要配置 GitHub Pages"
    log_info "请在 GitHub 仓库设置中启用 GitHub Pages"
    log_info "选择 GitHub Actions 作为部署源"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        log_success "构建产物验证通过"
        echo "构建产物大小："
        du -sh dist/
        echo "主要文件："
        ls -la dist/
    else
        log_error "构建产物验证失败"
        exit 1
    fi
}

# 清理缓存
clean_cache() {
    log_info "清理缓存..."
    npm run format-all || true
    log_success "缓存清理完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "🎉 部署准备完成！"
    echo
    echo "📋 部署信息："
    echo "  - 项目名称：KR-Virt 虚拟化管理系统"
    echo "  - 构建时间：$(date)"
    echo "  - Node.js 版本：$(node -v)"
    echo "  - Git 提交：$(git rev-parse --short HEAD)"
    echo "  - Git 分支：$(git branch --show-current)"
    echo
    echo "🌐 访问地址："
    echo "  - GitHub Pages: https://your-username.github.io/kr-virt/"
    echo "  - 本地预览: npm run preview"
    echo
    echo "📦 Docker 部署："
    echo "  - 构建镜像: npm run docker:build"
    echo "  - 运行容器: npm run docker:run"
    echo
    echo "🔧 后续步骤："
    echo "  1. 提交代码到 GitHub"
    echo "  2. GitHub Actions 将自动部署"
    echo "  3. 在仓库设置中启用 GitHub Pages"
}

# 主函数
main() {
    echo "
    ╔══════════════════════════════════════════════════════════════╗
    ║                🚀 KR-Virt 部署脚本 v1.0.0                    ║
    ║                                                              ║
    ║  基于 React 19 + TypeScript 5.8 + Ant Design 5.25          ║
    ║  构建的现代化企业级虚拟化管理平台                              ║
    ╚══════════════════════════════════════════════════════════════╝
    "
    
    # 执行部署步骤
    check_node_version
    check_git_status
    install_dependencies
    run_tests
    run_lint
    clean_cache
    build_project
    verify_deployment
    deploy_to_github_pages
    show_deployment_info
    
    log_success "🎉 部署脚本执行完成！"
}

# 捕获错误
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@" 