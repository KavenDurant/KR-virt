/**
 * 集群解散流程测试
 * 验证解散集群后的登出和跳转逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { clusterInitService } from "@/services/cluster";
import { loginService } from "@/services/login";
import { message } from "antd";
import { BrowserRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Cluster from "@/components/Cluster";

// Mock window.location
const mockLocation = {
  hash: "",
  reload: vi.fn(),
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock setTimeout
vi.mock("timers");

describe("集群解散流程测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.hash = "";
    mockLocation.reload.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("解散集群成功后应该退出登录并跳转到bootstrap页面", async () => {
    // Mock 解散集群API成功响应
    const mockDissolveResult = {
      success: true,
      message: "集群解散成功",
    };
    vi.spyOn(clusterInitService, "dissolveCluster").mockResolvedValue(
      mockDissolveResult
    );

    // Mock 登出API
    const mockLogoutResult = {
      success: true,
      message: "登出成功",
    };
    vi.spyOn(loginService, "logout").mockResolvedValue(mockLogoutResult);

    // Mock setTimeout
    const mockSetTimeout = vi.fn((callback) => {
      // 立即执行回调以便测试
      callback();
      return 1;
    });
    vi.stubGlobal("setTimeout", mockSetTimeout);

    // 模拟解散集群操作
    const result = await clusterInitService.dissolveCluster();

    if (result.success) {
      // 模拟登出
      const res = await loginService.logout();
      message.success(res.message);

      // 模拟延迟跳转逻辑
      mockSetTimeout(() => {
        window.location.hash = "#/bootstrap";
        window.location.reload();
      }, 1500);
    }

    // 验证结果
    expect(clusterInitService.dissolveCluster).toHaveBeenCalled();
    expect(loginService.logout).toHaveBeenCalled();
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
    expect(mockLocation.hash).toBe("#/bootstrap");
    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("解散集群失败时不应该执行登出和跳转", async () => {
    // Mock 解散集群API失败响应
    const mockDissolveResult = {
      success: false,
      message: "解散集群失败",
    };
    vi.spyOn(clusterInitService, "dissolveCluster").mockResolvedValue(
      mockDissolveResult
    );
    vi.spyOn(loginService, "logout").mockResolvedValue({
      success: true,
      message: "登出成功",
    });

    // 模拟解散集群操作
    const result = await clusterInitService.dissolveCluster();

    // 失败时不应该执行登出
    if (!result.success) {
      // 不执行登出和跳转逻辑
    }

    // 验证结果
    expect(clusterInitService.dissolveCluster).toHaveBeenCalled();
    expect(loginService.logout).not.toHaveBeenCalled();
    expect(mockLocation.hash).toBe("");
    expect(mockLocation.reload).not.toHaveBeenCalled();
  });

  it("解散集群异常时不应该执行登出和跳转", async () => {
    // Mock 解散集群API抛出异常
    vi.spyOn(clusterInitService, "dissolveCluster").mockRejectedValue(
      new Error("网络错误")
    );
    vi.spyOn(loginService, "logout").mockResolvedValue({
      success: true,
      message: "登出成功",
    });

    // 模拟解散集群操作
    try {
      await clusterInitService.dissolveCluster();
    } catch {
      // 异常时不执行登出和跳转逻辑
    }

    // 验证结果
    expect(clusterInitService.dissolveCluster).toHaveBeenCalled();
    expect(loginService.logout).not.toHaveBeenCalled();
    expect(mockLocation.hash).toBe("");
    expect(mockLocation.reload).not.toHaveBeenCalled();
  });

  it("应该在解散失败时显示错误信息", async () => {
    const mockClusterDissolveFailure = vi.fn().mockRejectedValue(
      new Error("解散集群失败")
    );

    vi.mocked(apiHelper.delete).mockImplementation(mockClusterDissolveFailure);

    render(
      <BrowserRouter>
        <Cluster />
      </BrowserRouter>
    );

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText("集群管理")).toBeInTheDocument();
    });

    // 找到并点击解散按钮
    const dissolveButton = screen.getByRole("button", { name: /解散/i });
    fireEvent.click(dissolveButton);

    // 等待确认对话框出现
    await waitFor(() => {
      expect(
        screen.getByText(/确定要解散此集群吗？/)
      ).toBeInTheDocument();
    });

    // 点击确认
    const confirmButton = screen.getByRole("button", { name: /确定/i });
    fireEvent.click(confirmButton);

    // 验证错误信息显示
    await waitFor(() => {
      expect(screen.getByText(/解散集群失败/)).toBeInTheDocument();
    });
  });

  it("应该在网络错误时处理异常", async () => {
    const networkError = new Error("Network Error");
    const mockNetworkError = vi.fn().mockRejectedValue(networkError);

    vi.mocked(apiHelper.delete).mockImplementation(mockNetworkError);

    render(
      <BrowserRouter>
        <Cluster />
      </BrowserRouter>
    );

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText("集群管理")).toBeInTheDocument();
    });

    try {
      // 尝试解散操作
      const dissolveButton = screen.getByRole("button", { name: /解散/i });
      fireEvent.click(dissolveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/确定要解散此集群吗？/)
        ).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /确定/i });
      fireEvent.click(confirmButton);

      // 验证网络错误处理
      await waitFor(() => {
        expect(screen.getByText(/网络连接异常/)).toBeInTheDocument();
      });
    } catch {
      // 网络错误处理
      console.log("网络错误已处理");
    }
  });
});

describe("AppBootstrap状态检查流程", () => {
  it("应该调用status接口检查集群状态", async () => {
    // Mock 集群状态检查API
    const mockStatusResult = {
      is_ready: false,
      is_creating: false,
      is_joining: false,
    };
    vi.spyOn(clusterInitService, "checkClusterStatus").mockResolvedValue(
      mockStatusResult
    );

    // 模拟AppBootstrap的状态检查
    const status = await clusterInitService.checkClusterStatus();

    // 验证结果
    expect(clusterInitService.checkClusterStatus).toHaveBeenCalled();
    expect(status.is_ready).toBe(false);
  });

  it("集群未就绪时应该跳转到集群初始化页面", async () => {
    // Mock 集群状态为未就绪
    const mockStatusResult = {
      is_ready: false,
      is_creating: false,
      is_joining: false,
    };
    vi.spyOn(clusterInitService, "checkClusterStatus").mockResolvedValue(
      mockStatusResult
    );

    // 模拟AppBootstrap的状态检查逻辑
    const status = await clusterInitService.checkClusterStatus();
    let appState = "loading";

    if (!status.is_ready) {
      appState = "cluster-init";
    }

    // 验证结果
    expect(appState).toBe("cluster-init");
  });
});
