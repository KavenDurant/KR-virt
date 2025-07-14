/**
 * 节点名称回填功能测试
 * 验证从node/hostname接口获取的名称能够正确回填到表单中并允许修改
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

describe("节点名称回填功能测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("应该从接口获取主机名并回填到表单中", async () => {
    // Mock API 响应
    const mockHostname = "auto-generated-hostname";
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

    // 渲染组件
    render(<MockedClusterConfigPage />);

    // 等待API调用完成
    await waitFor(() => {
      expect(clusterInitService.getNodeHostname).toHaveBeenCalled();
      expect(clusterInitService.getNodeIpAddresses).toHaveBeenCalled();
    });

    // 等待表单字段出现并验证回填的值
    await waitFor(() => {
      const hostnameInput = screen.getByDisplayValue(mockHostname);
      expect(hostnameInput).toBeInTheDocument();
    });
  });

  it("应该允许用户修改回填的主机名", async () => {
    // Mock API 响应
    const mockHostname = "original-hostname";
    const mockIpAddresses = ["192.168.1.100"];

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

    // 渲染组件
    render(<MockedClusterConfigPage />);

    // 等待表单字段出现
    await waitFor(() => {
      const hostnameInput = screen.getByDisplayValue(mockHostname);
      expect(hostnameInput).toBeInTheDocument();
    });

    // 获取主机名输入框
    const hostnameInput = screen.getByDisplayValue(mockHostname);

    // 清空并输入新的主机名
    fireEvent.change(hostnameInput, { target: { value: "" } });
    fireEvent.change(hostnameInput, {
      target: { value: "user-modified-hostname" },
    });

    // 验证输入框的值已经改变
    expect(hostnameInput).toHaveValue("user-modified-hostname");
  });

  it("在加载期间应该显示加载状态", async () => {
    // Mock API 响应为延迟
    vi.mocked(clusterInitService.getNodeHostname).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { hostname: "test-hostname" },
                message: "获取主机名成功",
              }),
            100,
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
            100,
          ),
        ),
    );

    // 渲染组件
    render(<MockedClusterConfigPage />);

    // 验证加载状态
    expect(screen.getByText("获取中...")).toBeInTheDocument();

    // 等待加载完成
    await waitFor(
      () => {
        expect(screen.getByDisplayValue("test-hostname")).toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });

  it("API失败时应该显示错误信息但仍允许用户输入", async () => {
    // Mock API 失败响应
    vi.mocked(clusterInitService.getNodeHostname).mockResolvedValue({
      success: false,
      message: "获取主机名失败",
    });

    vi.mocked(clusterInitService.getNodeIpAddresses).mockResolvedValue({
      success: false,
      message: "获取IP地址失败",
    });

    // 渲染组件
    render(<MockedClusterConfigPage />);

    // 等待API调用完成
    await waitFor(() => {
      expect(clusterInitService.getNodeHostname).toHaveBeenCalled();
      expect(clusterInitService.getNodeIpAddresses).toHaveBeenCalled();
    });

    // 验证输入框仍然可用（虽然没有预填值）
    const hostnameInput = screen.getByPlaceholderText("请输入节点名称");
    expect(hostnameInput).toBeInTheDocument();
    expect(hostnameInput).not.toBeDisabled();

    // 验证用户仍然可以输入
    fireEvent.change(hostnameInput, { target: { value: "manual-hostname" } });
    expect(hostnameInput).toHaveValue("manual-hostname");
  });

  it("应该验证主机名格式", async () => {
    // Mock API 响应
    vi.mocked(clusterInitService.getNodeHostname).mockResolvedValue({
      success: true,
      data: { hostname: "valid-hostname" },
      message: "获取主机名成功",
    });

    vi.mocked(clusterInitService.getNodeIpAddresses).mockResolvedValue({
      success: true,
      data: { ip_addresses: ["192.168.1.100"] },
      message: "获取IP地址成功",
    });

    // 渲染组件
    render(<MockedClusterConfigPage />);

    // 等待表单字段出现
    await waitFor(() => {
      const hostnameInput = screen.getByDisplayValue("valid-hostname");
      expect(hostnameInput).toBeInTheDocument();
    });

    // 获取主机名输入框
    const hostnameInput = screen.getByDisplayValue("valid-hostname");

    // 测试无效的主机名格式
    fireEvent.change(hostnameInput, { target: { value: "-invalid" } });
    fireEvent.blur(hostnameInput);

    // 验证错误信息出现
    await waitFor(() => {
      expect(
        screen.getByText(/节点名称只能包含字母、数字和连字符/),
      ).toBeInTheDocument();
    });
  });
});
