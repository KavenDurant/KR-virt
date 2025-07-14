import { describe, it, expect, vi, beforeEach } from "vitest";
import * as storageService from "../../../services/storage";
import type { StorageItem } from "../../../services/storage/types";
import request from "../../../utils/request";

// Mock request module
vi.mock("../../../utils/request", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRequest = request as any;

describe("Storage Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStorageList", () => {
    it("应该正确获取存储列表", async () => {
      const mockResponse = {
        storage_list: [
          {
            id: 1,
            name: "测试存储",
            fstype: "ext4",
            device: "/dev/sdb1",
            directory: "/mnt/test",
            options: "defaults",
            status: "healthy",
            total: 100.0,
            used: 50.0,
          } as StorageItem,
        ],
      };

      mockRequest.get.mockResolvedValue(mockResponse);

      const result = await storageService.getStorageList();

      expect(mockRequest.get).toHaveBeenCalledWith("/storage");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("addStorage", () => {
    it("应该正确添加存储", async () => {
      const addRequest = {
        name: "新存储",
        fstype: "smb",
        device: "//192.168.1.100/share",
        directory: "/mnt/new",
        set_options: "username=krvirt,password=-p0-p0-p0",
      };

      const mockResponse = {
        id: 2,
        name: "新存储",
      };

      mockRequest.post.mockResolvedValue(mockResponse);

      const result = await storageService.addStorage(addRequest);

      expect(mockRequest.post).toHaveBeenCalledWith("/storage/add", addRequest);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("removeStorage", () => {
    it("应该正确删除存储", async () => {
      const removeRequest = {
        storage_id: 1,
      };

      const mockResponse = {
        id: 1,
        name: "已删除存储",
        fstype: "ext4",
        device: "/dev/sdb1",
        directory: "/mnt/deleted",
        set_options: "defaults",
      };

      mockRequest.post.mockResolvedValue(mockResponse);

      const result = await storageService.removeStorage(removeRequest);

      expect(mockRequest.post).toHaveBeenCalledWith(
        "/storage/remove",
        removeRequest,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("transformStorageData", () => {
    it("应该正确转换存储数据", () => {
      const storageItem: StorageItem = {
        id: 1,
        name: "测试存储",
        fstype: "ext4",
        device: "/dev/sdb1",
        directory: "/mnt/test",
        options: "defaults",
        status: "healthy",
        total: 100.0,
        used: 30.0,
      };

      const result = storageService.transformStorageData(storageItem);

      expect(result).toMatchObject({
        ...storageItem,
        available: 70.0,
        usagePercent: 30,
        createTime: "N/A",
      });
      expect(result.lastCheck).toBeDefined();
    });

    it("应该正确处理零容量情况", () => {
      const storageItem: StorageItem = {
        id: 2,
        name: "空存储",
        fstype: "ext4",
        device: "/dev/sdd1",
        directory: "/mnt/empty",
        options: "defaults",
        status: "offline",
        total: 0,
        used: 0,
      };

      const result = storageService.transformStorageData(storageItem);

      expect(result.available).toBe(0);
      expect(result.usagePercent).toBe(0);
    });
  });

  describe("getFormattedStorageList", () => {
    it("应该返回格式化的存储列表", async () => {
      const mockResponse = {
        storage_list: [
          {
            id: 1,
            name: "存储1",
            fstype: "ext4",
            device: "/dev/sdb1",
            directory: "/mnt/storage1",
            options: "defaults",
            status: "healthy",
            total: 100.0,
            used: 25.0,
          } as StorageItem,
          {
            id: 2,
            name: "存储2",
            fstype: "xfs",
            device: "/dev/sdc1",
            directory: "/mnt/storage2",
            options: "noatime",
            status: "warning",
            total: 200.0,
            used: 180.0,
          } as StorageItem,
        ],
      };

      mockRequest.get.mockResolvedValue(mockResponse);

      const result = await storageService.getFormattedStorageList();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: "存储1",
        usagePercent: 25,
        available: 75.0,
      });
      expect(result[1]).toMatchObject({
        id: 2,
        name: "存储2",
        usagePercent: 90,
        available: 20.0,
      });
    });
  });

  describe("getStatusText", () => {
    it("应该返回正确的状态文本", () => {
      expect(storageService.getStatusText("fake")).toBe("模拟");
      expect(storageService.getStatusText("healthy")).toBe("健康");
      expect(storageService.getStatusText("warning")).toBe("警告");
      expect(storageService.getStatusText("error")).toBe("错误");
      expect(storageService.getStatusText("offline")).toBe("离线");
      expect(storageService.getStatusText("unknown")).toBe("未知");
    });
  });

  describe("getFsTypeText", () => {
    it("应该返回正确的文件系统类型文本", () => {
      expect(storageService.getFsTypeText("smb")).toBe("SMB/CIFS");
      expect(storageService.getFsTypeText("ext4")).toBe("EXT4");
      expect(storageService.getFsTypeText("xfs")).toBe("XFS");
      expect(storageService.getFsTypeText("nfs")).toBe("NFS");
      expect(storageService.getFsTypeText("btrfs")).toBe("Btrfs");
      expect(storageService.getFsTypeText("unknown")).toBe("UNKNOWN");
    });
  });
});
