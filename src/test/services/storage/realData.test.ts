/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-07 10:40:58
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 10:54:47
 * @FilePath: /KR-virt/src/test/services/storage/realData.test.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { describe, it, expect } from "vitest";
import {
  transformStorageData,
  getStatusText,
  getFsTypeText,
} from "@/services/storage";
import type { StorageItem } from "@/services/storage/types";

describe("真实数据处理测试", () => {
  const realStorageData: StorageItem = {
    id: 1,
    name: "ljx_test",
    fstype: "smb",
    device: "//192.168.1.112/krvirt2",
    directory: "/mnt/krvirt2",
    options: "username=krvirt,password=-p0-p0-p0",
    status: "fake",
    total: 10.24,
    used: 5.12,
  };

  it("应该正确转换真实的存储数据", () => {
    const result = transformStorageData(realStorageData);

    // 验证基本数据保持不变
    expect(result.id).toBe(1);
    expect(result.name).toBe("ljx_test");
    expect(result.fstype).toBe("smb");
    expect(result.device).toBe("//192.168.1.112/krvirt2");
    expect(result.directory).toBe("/mnt/krvirt2");
    expect(result.options).toBe("username=krvirt,password=-p0-p0-p0");
    expect(result.status).toBe("fake");
    expect(result.total).toBe(10.24);
    expect(result.used).toBe(5.12);

    // 验证计算的字段
    expect(result.available).toBe(5.12); // 10.24 - 5.12
    expect(result.usagePercent).toBe(50); // (5.12 / 10.24) * 100 = 50%

    // 验证占位字段
    expect(result.createTime).toBe("N/A");
    expect(result.lastCheck).toBeDefined();
  });

  it("应该正确显示SMB文件系统类型", () => {
    const fsTypeText = getFsTypeText(realStorageData.fstype);
    expect(fsTypeText).toBe("SMB/CIFS");
  });

  it("应该正确显示fake状态", () => {
    const statusText = getStatusText(realStorageData.status);
    expect(statusText).toBe("模拟");
  });

  it("应该正确格式化容量显示", () => {
    const result = transformStorageData(realStorageData);

    // 模拟前端显示逻辑
    const capacityDisplay = `${result.used.toFixed(
      2
    )}GB / ${result.total.toFixed(2)}GB`;
    expect(capacityDisplay).toBe("5.12GB / 10.24GB");

    const usageColor =
      result.usagePercent >= 90
        ? "#ff4d4f"
        : result.usagePercent >= 75
        ? "#faad14"
        : "#52c41a";
    expect(usageColor).toBe("#52c41a"); // 绿色，因为使用率为50%
  });

  it("验证完整的API响应处理", () => {
    const mockApiResponse = {
      storage_list: [realStorageData],
    };

    // 模拟处理过程
    const processedData =
      mockApiResponse.storage_list.map(transformStorageData);

    expect(processedData).toHaveLength(1);
    expect(processedData[0].name).toBe("ljx_test");
    expect(processedData[0].usagePercent).toBe(50);
  });
});
