# 多阶段构建 - 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 npm ci 确保一致性）
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build:prod

# 生产阶段 - 运行阶段
FROM nginx:alpine

# 安装必要工具
RUN apk add --no-cache tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 创建 nginx 用户组和用户
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S nginx-user -u 1001

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 设置正确的权限
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    chown -R nginx-user:nginx-group /etc/nginx/conf.d

# 创建 nginx 运行需要的目录
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R nginx-user:nginx-group /var/cache/nginx

# 创建健康检查脚本
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'curl -f http://localhost:80/ || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# 切换到非 root 用户
USER nginx-user

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"] 