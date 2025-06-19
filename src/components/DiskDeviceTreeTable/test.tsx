import React from "react";
import { Card } from "antd";
import DiskDeviceTreeTable from "./index";
import type { NodeDiskDeviceActual } from "@/services/cluster/types";

// 测试数据 - 模拟真实的磁盘设备层次结构
const testDevices: NodeDiskDeviceActual[] = [
  // 主磁盘 sda
  {
    name: "sda",
    major_minor: "8:0",
    removable: false,
    size_gb: 500,
    read_only: false,
    device_type: "disk",
    mount_point: "",
    parent: "",
    filesystem: "",
    total_size_gb: 500,
    used_size_gb: 250,
    available_size_gb: 250,
    percentage_value: 50,
  },
  // sda的分区
  {
    name: "sda1",
    major_minor: "8:1",
    removable: false,
    size_gb: 0.5859375,
    read_only: false,
    device_type: "part",
    mount_point: "/boot/efi",
    parent: "sda",
    filesystem: "/dev/sda1",
    total_size_gb: 0.627901,
    used_size_gb: 0.017056,
    available_size_gb: 0.610845,
    percentage_value: 3.0,
  },
  {
    name: "sda2",
    major_minor: "8:2",
    removable: false,
    size_gb: 1,
    read_only: false,
    device_type: "part",
    mount_point: "/boot",
    parent: "sda",
    filesystem: "ext4",
    total_size_gb: 1,
    used_size_gb: 0.2,
    available_size_gb: 0.8,
    percentage_value: 20,
  },
  {
    name: "sda3",
    major_minor: "8:3",
    removable: false,
    size_gb: 498.4,
    read_only: false,
    device_type: "part",
    mount_point: "",
    parent: "sda",
    filesystem: "LVM2_member",
    total_size_gb: 498.4,
    used_size_gb: 0,
    available_size_gb: 498.4,
    percentage_value: 0,
  },
  // LVM逻辑卷（sda3的子设备）
  {
    name: "uos-root",
    major_minor: "253:0",
    removable: false,
    size_gb: 450,
    read_only: false,
    device_type: "part",
    mount_point: "/",
    parent: "sda3",
    filesystem: "ext4",
    total_size_gb: 450,
    used_size_gb: 225,
    available_size_gb: 225,
    percentage_value: 50,
  },
  {
    name: "uos-swap",
    major_minor: "253:1",
    removable: false,
    size_gb: 48,
    read_only: false,
    device_type: "part",
    mount_point: "[SWAP]",
    parent: "sda3",
    filesystem: "swap",
    total_size_gb: 48,
    used_size_gb: 0,
    available_size_gb: 48,
    percentage_value: 0,
  },
  // 第二块磁盘 sdb
  {
    name: "sdb",
    major_minor: "8:16",
    removable: false,
    size_gb: 1000,
    read_only: false,
    device_type: "disk",
    mount_point: "/var/lib/virt",
    parent: "",
    filesystem: "ext4",
    total_size_gb: 1000,
    used_size_gb: 300,
    available_size_gb: 700,
    percentage_value: 30,
  },
  // 光驱设备
  {
    name: "sr0",
    major_minor: "11:0",
    removable: true,
    size_gb: 0,
    read_only: true,
    device_type: "rom",
    mount_point: "",
    parent: "",
    filesystem: "",
    total_size_gb: 0,
    used_size_gb: 0,
    available_size_gb: 0,
    percentage_value: 0,
  },
];

/**
 * 磁盘设备树表组件测试页面
 */
const DiskDeviceTreeTableTest: React.FC = () => {
  return (
    <div style={{ padding: "24px" }}>
      <Card title="磁盘设备分层树表测试" style={{ marginBottom: "24px" }}>
        <p>
          此测试展示了磁盘设备的分层结构：
        </p>
        <ul>
          <li>sda (主磁盘) → sda1, sda2, sda3 (分区)</li>
          <li>sda3 (LVM分区) → uos-root, uos-swap (逻辑卷)</li>
          <li>sdb (数据磁盘)</li>
          <li>sr0 (光驱设备)</li>
        </ul>
      </Card>
      
      <Card title="磁盘设备树表">
        <DiskDeviceTreeTable devices={testDevices} loading={false} />
      </Card>
    </div>
  );
};

export default DiskDeviceTreeTableTest;
