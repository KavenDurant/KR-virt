/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-22 10:00:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-08 18:30:45
 * @FilePath: /KR-virt/src/pages/System/components/StoragePolicy.tsx
 * @Description: 存储策略配置组件
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Space,
  Alert,
  Tooltip,
  Progress,
  Statistic,
  Typography,
  Spin,
  App,
  Select,
  Tag,
} from "antd";
import {
  DatabaseOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  HddOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../hooks/useTheme";
import { systemSettingService } from "../../../services/systemSetting";
import type { StoragePolicy } from "../../../services/systemSetting/types";
import storageService from "../../../services/storage";
import type { StorageInfo } from "../../../services/storage/types";

const { Text } = Typography;

// 组件Props类型
interface StoragePolicyProps {
  // 可以预留一些Props，用于未来扩展
  className?: string;
}

// 模拟存储使用情况数据
const mockStorageInfo = {
  total: 10240, // 10TB，单位GB
  used: 6144, // 6TB
  available: 4096, // 4TB
  systemUsed: 1024, // 1TB 系统使用
  userUsed: 5120, // 5TB 用户数据
};

const StoragePolicy: React.FC<StoragePolicyProps> = () => {
  const { themeConfig } = useTheme();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storagePolicy, setStoragePolicy] = useState<StoragePolicy | null>(
    null
  );
  const [storageList, setStorageList] = useState<StorageInfo[]>([]);
  const [storageLoading, setStorageLoading] = useState(false);

  // 加载存储设备列表
  const loadStorageList = useCallback(async () => {
    setStorageLoading(true);
    try {
      const response = await storageService.getStorageList();
      if (response.success && response.data?.storage_list) {
        setStorageList(response.data.storage_list);
      } else {
        message.error(response.message || "获取存储设备列表失败");
      }
    } catch (error) {
      console.error("获取存储设备列表失败:", error);
      message.error("获取存储设备列表失败，请稍后重试");
    } finally {
      setStorageLoading(false);
    }
  }, [message]);

  // 加载存储策略配置
  const loadStoragePolicy = useCallback(async () => {
    setLoading(true);
    try {
      const response = await systemSettingService.getStoragePolicy();
      if (response.success && response.data) {
        setStoragePolicy(response.data);
        form.setFieldsValue(response.data);
      } else {
        message.error(response.message || "获取存储策略失败");
      }
    } catch (error) {
      console.error("获取存储策略失败:", error);
      message.error("获取存储策略失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [form, message]);

  // 保存存储策略配置
  const handleSave = async (values: StoragePolicy) => {
    setSaving(true);
    try {
      const response = await systemSettingService.setStoragePolicy(values);
      if (response.success) {
        message.success(response.data?.message || "存储策略保存成功");
        setStoragePolicy(values);
      } else {
        message.error(response.data?.message || response.message || "存储策略保存失败");
      }
    } catch (error) {
      console.error("保存存储策略失败:", error);
      message.error("保存存储策略失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    if (storagePolicy) {
      form.setFieldsValue(storagePolicy);
    } else {
      form.resetFields();
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadStoragePolicy();
    loadStorageList();
  }, [loadStoragePolicy, loadStorageList]);

  // 计算存储使用率和阈值状态
  const storageUsagePercent = Math.round(
    (mockStorageInfo.used / mockStorageInfo.total) * 100
  );
  const systemUsagePercent = Math.round(
    (mockStorageInfo.systemUsed / mockStorageInfo.total) * 100
  );

  // 获取阈值警告状态
  const getThresholdStatus = (currentUsage: number, threshold: number) => {
    if (currentUsage >= threshold) {
      return {
        type: "danger" as const,
        icon: <WarningOutlined />,
        text: "已超过阈值",
      };
    } else if (currentUsage >= threshold * 0.9) {
      return {
        type: "warning" as const,
        icon: <WarningOutlined />,
        text: "接近阈值",
      };
    }
    return {
      type: "success" as const,
      icon: <CheckCircleOutlined />,
      text: "正常",
    };
  };

  const storageStatus = storagePolicy
    ? getThresholdStatus(storageUsagePercent, storagePolicy.storage_threshold)
    : null;
  const systemStorageStatus = storagePolicy
    ? getThresholdStatus(
        systemUsagePercent,
        storagePolicy.system_storage_threshold
      )
    : null;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "16px",
          padding: "50px",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
        <div style={{ color: themeConfig.token.colorTextBase, opacity: 0.65 }}>
          加载存储策略配置中...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "8px",
        backgroundColor: themeConfig.token.colorBgContainer,
        minHeight: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Row gutter={[24, 24]}>
        {/* 左侧：配置表单 */}
        <Col span={14}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              system_storage_id: 1,
              storage_threshold: 80,
              system_storage_threshold: 90,
            }}
          >
            <Card
              title={
                <Space>
                  <DatabaseOutlined />
                  <span>存储策略配置</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Alert
                message="存储策略说明"
                description="设置存储使用阈值，当存储使用率达到设定阈值时，系统将发出警告通知。合理的阈值设置可以帮助您及时管理存储空间，避免系统因存储空间不足而出现问题。"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="system_storage_id"
                    label={
                      <Space>
                        <span>系统存储设备</span>
                        <Tooltip title="选择要监控的系统存储设备">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: "请选择系统存储设备" }]}
                  >
                    <Select
                      style={{ width: "100%" }}
                      placeholder="请选择系统存储设备"
                      loading={storageLoading}
                      showSearch
                      optionFilterProp="children"
                      notFoundContent={storageLoading ? "加载中..." : "暂无存储设备"}
                    >
                      {storageList.map((storage) => (
                        <Select.Option key={storage.id} value={storage.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <Space>
                                <CloudServerOutlined />
                                <span style={{ fontWeight: 500 }}>{storage.name}</span>
                                <Tag color="blue">{storage.fstype.toUpperCase()}</Tag>
                                <Tag color={storage.status === "normal" ? "success" : "error"}>
                                  {storage.status === "normal" ? "正常" : "异常"}
                                </Tag>
                              </Space>
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {(storage.total).toFixed(1)}GB
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="storage_threshold"
                    label={
                      <Space>
                        <span>存储使用阈值 (%)</span>
                        <Tooltip title="当整体存储使用率达到此阈值时发出警告，建议设置为 70-85%">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "请输入存储使用阈值" },
                      {
                        type: "number",
                        min: 1,
                        max: 99,
                        message: "阈值范围为 1-99%",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={1}
                      max={99}
                      suffix="%"
                      placeholder="请输入存储使用阈值"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="system_storage_threshold"
                    label={
                      <Space>
                        <span>系统存储阈值 (%)</span>
                        <Tooltip title="当系统存储使用率达到此阈值时发出警告，建议设置为 85-95%">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[
                      { required: true, message: "请输入系统存储阈值" },
                      {
                        type: "number",
                        min: 1,
                        max: 99,
                        message: "阈值范围为 1-99%",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={1}
                      max={99}
                      suffix="%"
                      placeholder="请输入系统存储阈值"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saving}>
                    保存配置
                  </Button>
                  <Button onClick={handleReset}>重置</Button>
                  <Button onClick={loadStoragePolicy}>刷新</Button>
                </Space>
              </Form.Item>
            </Card>

            {/* 建议配置 */}
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  <span>配置建议</span>
                </Space>
              }
              size="small"
            >
              <div style={{ lineHeight: "1.8" }}>
                <div>
                  <strong>存储使用阈值建议：</strong>
                </div>
                <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
                  <li>
                    <Text type="success">保守配置：70%</Text> -
                    提前预警，给管理员充足时间处理
                  </li>
                  <li>
                    <Text type="warning">标准配置：80%</Text> -
                    平衡预警时机和存储利用率
                  </li>
                  <li>
                    <Text type="danger">激进配置：90%</Text> -
                    最大化存储利用率，但留给处理的时间较少
                  </li>
                </ul>
                <div>
                  <strong>系统存储阈值建议：</strong>
                </div>
                <ul style={{ paddingLeft: 20 }}>
                  <li>
                    <Text type="success">保守配置：85%</Text> - 确保系统稳定运行
                  </li>
                  <li>
                    <Text type="warning">标准配置：90%</Text> -
                    平衡系统安全和存储利用率
                  </li>
                  <li>
                    <Text type="danger">激进配置：95%</Text> -
                    需要严格监控和及时处理
                  </li>
                </ul>
              </div>
            </Card>
          </Form>
        </Col>

        {/* 右侧：存储使用情况 */}
        <Col span={10}>
          <Card
            title={
              <Space>
                <HddOutlined />
                <span>TODO-系统存储状态</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="总存储容量"
                  value={mockStorageInfo.total / 1024}
                  precision={1}
                  suffix="TB"
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="可用空间"
                  value={mockStorageInfo.available / 1024}
                  precision={1}
                  suffix="TB"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>整体存储使用率</span>
                  <Space>
                    {storageStatus && (
                      <>
                        {storageStatus.icon}
                        <Text type={storageStatus.type}>
                          {storageStatus.text}
                        </Text>
                      </>
                    )}
                    <span>{storageUsagePercent}%</span>
                  </Space>
                </div>
                <Progress
                  percent={storageUsagePercent}
                  status={
                    storageUsagePercent >=
                    (storagePolicy?.storage_threshold || 80)
                      ? "exception"
                      : "active"
                  }
                  strokeColor={
                    storageUsagePercent >=
                    (storagePolicy?.storage_threshold || 80)
                      ? "#ff4d4f"
                      : storageUsagePercent >=
                        (storagePolicy?.storage_threshold || 80) * 0.9
                      ? "#faad14"
                      : "#52c41a"
                  }
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>系统存储使用率</span>
                  <Space>
                    {systemStorageStatus && (
                      <>
                        {systemStorageStatus.icon}
                        <Text type={systemStorageStatus.type}>
                          {systemStorageStatus.text}
                        </Text>
                      </>
                    )}
                    <span>{systemUsagePercent}%</span>
                  </Space>
                </div>
                <Progress
                  percent={systemUsagePercent}
                  status={
                    systemUsagePercent >=
                    (storagePolicy?.system_storage_threshold || 90)
                      ? "exception"
                      : "active"
                  }
                  strokeColor={
                    systemUsagePercent >=
                    (storagePolicy?.system_storage_threshold || 90)
                      ? "#ff4d4f"
                      : systemUsagePercent >=
                        (storagePolicy?.system_storage_threshold || 90) * 0.9
                      ? "#faad14"
                      : "#52c41a"
                  }
                />
              </div>
            </div>

            {/* 阈值线提示 */}
            {storagePolicy && (
              <Alert
                message="阈值状态"
                description={
                  <div>
                    <div>
                      存储阈值：{storagePolicy.storage_threshold}% (
                      {storageStatus?.text})
                    </div>
                    <div>
                      系统阈值：{storagePolicy.system_storage_threshold}% (
                      {systemStorageStatus?.text})
                    </div>
                  </div>
                }
                type={
                  storageUsagePercent >= storagePolicy.storage_threshold ||
                  systemUsagePercent >= storagePolicy.system_storage_threshold
                    ? "error"
                    : "info"
                }
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Card>

          <Card title="存储分布" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="系统数据"
                  value={mockStorageInfo.systemUsed / 1024}
                  precision={1}
                  suffix="TB"
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="用户数据"
                  value={mockStorageInfo.userUsed / 1024}
                  precision={1}
                  suffix="TB"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StoragePolicy;
