/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-22 10:00:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-11 11:08:30
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
  Divider,
} from "antd";
import {
  DatabaseOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  HddOutlined,
  CloudServerOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { useTheme } from "../../../hooks/useTheme";
import { systemSettingService } from "../../../services/systemSetting";
import type {
  StoragePolicy,
  StorageThresholdUpdateRequest,
} from "../../../services/systemSetting/types";
import storageService from "../../../services/storage";
import type { StorageInfo } from "../../../services/storage/types";
import { formatStorageSize } from "../../../utils/format";

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
  const { message, modal } = App.useApp();
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
        // 使用 setFieldsValue 更新表单值
        form.setFieldsValue({
          system_storage_id: response.data.system_storage_id,
          storage_threshold: response.data.storage_threshold,
          system_storage_threshold: response.data.system_storage_threshold,
        });
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

  // 保存存储阈值配置
  const handleSaveThresholds = async (
    values: StorageThresholdUpdateRequest
  ) => {
    setSaving(true);
    try {
      const response = await systemSettingService.setStorageThreshold({
        storage_threshold: values.storage_threshold,
        system_storage_threshold: values.system_storage_threshold,
      });
      if (response.success) {
        message.success(response.data?.message || "存储阈值设置成功");
        // 更新本地存储策略状态
        if (storagePolicy) {
          setStoragePolicy({
            ...storagePolicy,
            storage_threshold: values.storage_threshold,
            system_storage_threshold: values.system_storage_threshold,
          });
        }
      } else {
        message.error(
          response.data?.message || response.message || "存储阈值设置失败"
        );
      }
    } catch (error) {
      console.error("保存存储阈值失败:", error);
      message.error("保存存储阈值失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  // 保存系统存储设置
  const handleSystemStorageChange = async (systemStorageId: number) => {
    // 检查所选存储设备状态
    const selectedStorage = storageList.find(
      (storage) => storage.id === systemStorageId
    );
    const currentStorage = storageList.find(
      (storage) => storage.id === storagePolicy?.system_storage_id
    );

    if (!selectedStorage) {
      message.error("所选存储设备不存在");
      return;
    }

    // 验证存储设备状态
    if (selectedStorage.status !== "normal") {
      message.error("所选存储设备状态异常，无法设置为系统存储");
      return;
    }

    if (currentStorage && currentStorage.status !== "normal") {
      message.error("当前系统存储设备状态异常，无法进行迁移");
      return;
    }

    // 使用App的modal方法代替Modal.confirm以支持动态主题
    modal.confirm({
      title: "确认更改系统存储设备",
      icon: <ExclamationCircleFilled />,
      width: 610,
      content: (
        <div>
          <p>
            您即将将系统存储从 <b>{currentStorage?.name || "当前存储"}</b>{" "}
            迁移至 <b>{selectedStorage.name}</b>。
          </p>
          <Alert
            message="迁移风险提示"
            description={
              <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
                <li>系统文件较大，迁移过程可能需要较长时间，请耐心等待。</li>
                <li>迁移期间请勿执行其他操作，以免导致数据异常或丢失。</li>
                <li>
                  迁移过程中请保持页面打开，不要关闭浏览器或切换到其他页面。
                </li>
                <li>
                  如迁移失败，请联系技术支持进行处理，切勿重复尝试迁移操作。
                </li>
              </ul>
            }
            type="warning"
            showIcon
          />
        </div>
      ),
      okText: "确认迁移",
      cancelText: "取消",
      onOk: async () => {
        setSaving(true);
        try {
          const response = await systemSettingService.setSystemStorage({
            system_storage_id: systemStorageId,
          });
          if (response.success) {
            message.success(response.data?.message || "系统存储设置成功");
            // 更新本地存储策略状态
            if (storagePolicy) {
              setStoragePolicy({
                ...storagePolicy,
                system_storage_id: systemStorageId,
              });
            }
          } else {
            message.error(
              response.data?.message || response.message || "系统存储设置失败"
            );
            // 重置表单中的系统存储ID
            form.setFieldsValue({
              system_storage_id: storagePolicy?.system_storage_id,
            });
          }
        } catch (error) {
          console.error("设置系统存储失败:", error);
          message.error("设置系统存储失败，请稍后重试");
          // 重置表单中的系统存储ID
          form.setFieldsValue({
            system_storage_id: storagePolicy?.system_storage_id,
          });
        } finally {
          setSaving(false);
        }
      },
      onCancel: () => {
        // 重置表单中的系统存储ID
        form.setFieldsValue({
          system_storage_id: storagePolicy?.system_storage_id,
        });
      },
    });
  };

  // 重置表单
  const handleReset = () => {
    if (storagePolicy) {
      form.setFieldsValue({
        system_storage_id: storagePolicy.system_storage_id,
        storage_threshold: storagePolicy.storage_threshold,
        system_storage_threshold: storagePolicy.system_storage_threshold,
      });
    } else {
      // 如果没有存储策略数据，设置默认值
      form.setFieldsValue({
        system_storage_id: 1,
        storage_threshold: 80,
        system_storage_threshold: 90,
      });
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadStoragePolicy();
    loadStorageList();
  }, [loadStoragePolicy, loadStorageList]);

  // 设置默认表单值
  useEffect(() => {
    // 如果没有存储策略数据，设置默认值
    if (!storagePolicy) {
      form.setFieldsValue({
        system_storage_id: 1,
        storage_threshold: 80,
        system_storage_threshold: 90,
      });
    }
  }, [form, storagePolicy]);

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
          <Form form={form} layout="vertical">
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
                      notFoundContent={
                        storageLoading ? "加载中..." : "暂无存储设备"
                      }
                      onChange={handleSystemStorageChange}
                    >
                      {storageList.map((storage) => (
                        <Select.Option
                          key={storage.id}
                          value={storage.id}
                          disabled={storage.status !== "normal"}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <Space>
                                <CloudServerOutlined />
                                <span style={{ fontWeight: 500 }}>
                                  {storage.name}
                                </span>
                                <Tag color="blue">
                                  {storage.fstype.toUpperCase()}
                                </Tag>
                                <Tag
                                  color={
                                    storage.status === "normal"
                                      ? "success"
                                      : "error"
                                  }
                                >
                                  {storage.status === "normal"
                                    ? "正常"
                                    : "异常"}
                                </Tag>
                              </Space>
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {formatStorageSize(storage.total)}
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Divider
                dashed={true}
                style={{ margin: "16px 0", backgroundColor: "#91caff" }}
              />
              {/* 使用div替代嵌套的form标签 */}
              <div>
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
                          min: 0,
                          max: 100,
                          message: "阈值范围为 0-100%",
                        },
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        max={100}
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
                          min: 0,
                          max: 100,
                          message: "阈值范围为 0-100%",
                        },
                      ]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        max={100}
                        suffix="%"
                        placeholder="请输入系统存储阈值"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      onClick={() => {
                        form
                          .validateFields([
                            "storage_threshold",
                            "system_storage_threshold",
                          ])
                          .then((values) => {
                            handleSaveThresholds({
                              storage_threshold: values.storage_threshold,
                              system_storage_threshold:
                                values.system_storage_threshold,
                            });
                          })
                          .catch((errorInfo) => {
                            console.log("验证失败:", errorInfo);
                          });
                      }}
                      loading={saving}
                    >
                      保存阈值配置
                    </Button>
                    <Button onClick={handleReset}>重置</Button>
                    <Button onClick={loadStoragePolicy}>刷新</Button>
                  </Space>
                </Form.Item>
              </div>
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
                  value={formatStorageSize(mockStorageInfo.total)}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ fontSize: "16px" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="可用空间"
                  value={formatStorageSize(mockStorageInfo.available)}
                  valueStyle={{ color: "#52c41a", fontSize: "16px" }}
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
                  value={formatStorageSize(mockStorageInfo.systemUsed)}
                  valueStyle={{ color: "#1890ff", fontSize: "16px" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="用户数据"
                  value={formatStorageSize(mockStorageInfo.userUsed)}
                  valueStyle={{ color: "#52c41a", fontSize: "16px" }}
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
