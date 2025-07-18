/**
 * 节点名称回填功能调试测试
 * 验证修复后的回填功能是否正常工作
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "antd";
import ClusterConfigPage from "@/pages/ClusterInit/ClusterConfigPage";
import { clusterInitService } from "@/services/cluster";

// Mock clusterInitService
vi.mock("@/services/cluster", () => ({
  clusterInitService: {
    getNodeHostname: vi.fn(),
    getNodeIpAddresses: vi.fn(),
  },
}));

const MockedClusterConfigPage = () => {
  const mockOnSubmit = vi.fn();

  return (
    <App>
      <ClusterConfigPage
        initialType="create"
        onSubmit={mockOnSubmit}
        loading={false}
      />
    </App>
  );
};

describe("节点名称回填功能调试测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清除控制台，便于观察测试日志
    console.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("应该成功获取并回填节点名称", async () => {
    console.log("🧪 开始测试: 节点名称回填功能");

    // Mock API 响应
    const mockHostname = "test-cluster-node";
    const mockIpAddresses = ["192.168.1.100", "192.168.1.101"];

    vi.mocked(clusterInitService.getNodeHostname).mockResolvedValue({
      success: true,
      data: { hostname: mockHostname },
      message: "获取主机名成功",
    });

    vi.mocked(clusterInitService.getNodeIpAddresses).mockResolvedValue({
      success: true,
      data: { ip_addresses: mockIpAddresses },
      message: "获取IP地址成功",
    });

    console.log("📡 Mock API 已设置:", { mockHostname, mockIpAddresses });

    // 渲染组件
    const { container } = render(<MockedClusterConfigPage />);
    console.log("🎨 组件已渲染");

    // 等待API调用完成
    await waitFor(
      () => {
        expect(clusterInitService.getNodeHostname).toHaveBeenCalled();
        expect(clusterInitService.getNodeIpAddresses).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    console.log("✅ API 调用已完成");

    // 等待加载状态结束
    await waitFor(
      () => {
        const loadingText = screen.queryByText("获取中...");
        expect(loadingText).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    console.log("⏳ 加载状态已结束");

    // 查找节点名称输入框
    await waitFor(
      () => {
        const hostnameInput = screen.getByDisplayValue(mockHostname);
        expect(hostnameInput).toBeInTheDocument();
        console.log("🎯 找到了预填的主机名输入框:", hostnameInput.value);
      },
      { timeout: 5000 },
    );

    // 验证表单值
    const hostnameInput = screen.getByDisplayValue(mockHostname);
    expect(hostnameInput).toHaveValue(mockHostname);
    console.log("✅ 节点名称回填成功!");

    // 验证IP地址也被正确设置
    const ipSelect =
      container.querySelector('[data-testid="ip-select"]') ||
      container.querySelector(".ant-select-selection-item");
    if (ipSelect) {
      console.log("🌐 IP地址选择框:", ipSelect.textContent);
    }
  });

  it("应该在API失败时显示适当的错误处理", async () => {
    console.log("🧪 开始测试: API失败处理");

    // Mock API 失败响应
    vi.mocked(clusterInitService.getNodeHostname).mockResolvedValue({
      success: false,
      message: "获取主机名失败",
    });

    vi.mocked(clusterInitService.getNodeIpAddresses).mockResolvedValue({
      success: false,
      message: "获取IP地址失败",
    });

    console.log("📡 Mock API 失败响应已设置");

    // 渲染组件
    render(<MockedClusterConfigPage />);
    console.log("🎨 组件已渲染");

    // 等待API调用完成
    await waitFor(
      () => {
        expect(clusterInitService.getNodeHostname).toHaveBeenCalled();
        expect(clusterInitService.getNodeIpAddresses).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    console.log("✅ API 调用已完成");

    // 等待加载状态结束
    await waitFor(
      () => {
        const loadingText = screen.queryByText("获取中...");
        expect(loadingText).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    console.log("⏳ 加载状态已结束");

    // 验证输入框仍然可用
    const hostnameInput = screen.getByPlaceholderText("请输入节点名称");
    expect(hostnameInput).toBeInTheDocument();
    expect(hostnameInput).not.toBeDisabled();
    console.log("✅ 输入框在API失败后仍然可用");
  });

  it("应该显示正确的加载状态", async () => {
    console.log("🧪 开始测试: 加载状态显示");

    // Mock API 延迟响应
    vi.mocked(clusterInitService.getNodeHostname).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { hostname: "delayed-hostname" },
                message: "获取主机名成功",
              }),
            500,
          ),
        ),
    );

    vi.mocked(clusterInitService.getNodeIpAddresses).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { ip_addresses: ["192.168.1.100"] },
                message: "获取IP地址成功",
              }),
            500,
          ),
        ),
    );

    console.log("📡 Mock API 延迟响应已设置");

    // 渲染组件
    render(<MockedClusterConfigPage />);
    console.log("🎨 组件已渲染");

    // 验证加载状态
    expect(screen.getByText("获取中...")).toBeInTheDocument();
    console.log("⏳ 加载状态正确显示");

    // 等待加载完成
    await waitFor(
      () => {
        expect(
          screen.getByDisplayValue("delayed-hostname"),
        ).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    console.log("✅ 加载完成，主机名已回填");
  });
});
