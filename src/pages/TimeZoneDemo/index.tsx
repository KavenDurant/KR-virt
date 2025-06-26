/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-25 15:54:29
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-26 11:45:37
 * @FilePath: /KR-virt/src/pages/TimeZoneDemo/index.tsx
 * @Description: useTimeZone Hook 演示页面
 */

import React, { useState } from "react";
import {
  Card,
  Input,
  Table,
  Space,
  Typography,
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  Form,
  Select,
} from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useTimeZone, useTimeZoneBatch, useTimezoneInfo } from "@/hooks";
import { TimeDisplay, TimezoneInfoDisplay } from "@/components/TimeDisplay";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * useTimeZone Hook 演示页面
 */
const TimeZoneDemo: React.FC = () => {
  const [inputTime, setInputTime] = useState("2025-06-25T15:54:29+00:00");
  const [customFormat, setCustomFormat] = useState("YYYY-MM-DD HH:mm:ss");
  const [batchTimes, setBatchTimes] = useState(
    [
      "2025-06-25T15:54:29+00:00",
      "2025-06-26T10:30:00+08:00",
      "2025-06-27T08:15:45Z",
    ].join("\n"),
  );

  // 获取时区信息
  const timezoneInfo = useTimezoneInfo();

  // 单个时间转换演示
  const {
    localTime,
    isValid,
    error,
    timezoneInfo: convertInfo,
  } = useTimeZone(inputTime, {
    format: customFormat,
    debug: true,
  });

  // 批量时间转换演示
  const batchTimeArray = batchTimes.split("\n").filter((time) => time.trim());
  const batchResults = useTimeZoneBatch(batchTimeArray, {
    format: customFormat,
  });

  // 预设的示例时间
  const exampleTimes = [
    {
      label: "UTC时间",
      value: "2025-06-25T15:54:29Z",
    },
    {
      label: "北京时间",
      value: "2025-06-25T23:54:29+08:00",
    },
    {
      label: "纽约时间",
      value: "2025-06-25T11:54:29-04:00",
    },
    {
      label: "伦敦时间",
      value: "2025-06-25T16:54:29+01:00",
    },
  ];

  // 常用格式选项
  const formatOptions = [
    { label: "标准格式", value: "YYYY-MM-DD HH:mm:ss" },
    { label: "美式格式", value: "MM/DD/YYYY HH:mm" },
    { label: "简短格式", value: "MM-DD HH:mm" },
    { label: "详细格式", value: "YYYY年MM月DD日 HH:mm:ss" },
    { label: "ISO格式", value: "YYYY-MM-DDTHH:mm:ss" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>
        <ClockCircleOutlined /> useTimeZone Hook 演示
      </Title>

      <Paragraph>
        这个页面演示了 <Text code>useTimeZone</Text> Hook
        的各种功能，包括时区转换、格式化和错误处理。
      </Paragraph>

      {/* 当前时区信息 */}
      <Card title="当前时区信息" style={{ marginBottom: "24px" }}>
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical">
              <div>
                <Text strong>时区:</Text> {timezoneInfo.timezone}
              </div>
              <div>
                <Text strong>UTC偏移:</Text> {timezoneInfo.offsetString}
              </div>
              <div>
                <Text strong>本地时间:</Text> {timezoneInfo.localTime}
              </div>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical">
              <div>
                <Text strong>UTC时间:</Text> {timezoneInfo.utcTime}
              </div>
              <div>
                <Text strong>偏移分钟:</Text> {timezoneInfo.offset}
              </div>
              <TimezoneInfoDisplay />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 单个时间转换演示 */}
      <Card title="单个时间转换演示" style={{ marginBottom: "24px" }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="ISO时间字符串">
                <Input
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  placeholder="输入ISO 8601格式的时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="输出格式">
                <Select
                  value={customFormat}
                  onChange={setCustomFormat}
                  options={formatOptions}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>转换结果:</Text>
              {isValid ? (
                <Alert
                  type="success"
                  message={localTime}
                  description={`时区: ${convertInfo.userTimezone} (UTC${
                    convertInfo.offset >= 0 ? "+" : ""
                  }${Math.floor(convertInfo.offset / 60)}:${Math.abs(
                    convertInfo.offset % 60,
                  )
                    .toString()
                    .padStart(2, "0")})`}
                />
              ) : (
                <Alert type="error" message="转换失败" description={error} />
              )}
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>使用TimeDisplay组件:</Text>
              <TimeDisplay
                isoTime={inputTime}
                format={customFormat}
                showTimezone
                showRelative
              />
            </Space>
          </Col>
        </Row>

        <Divider />

        <Text strong>快速示例:</Text>
        <div style={{ marginTop: "8px" }}>
          {exampleTimes.map((example, index) => (
            <Tag
              key={index}
              style={{ margin: "4px", cursor: "pointer" }}
              onClick={() => setInputTime(example.value)}
            >
              {example.label}: {example.value}
            </Tag>
          ))}
        </div>
      </Card>

      {/* 批量时间转换演示 */}
      <Card title="批量时间转换演示" style={{ marginBottom: "24px" }}>
        <Form layout="vertical">
          <Form.Item label="时间列表 (每行一个ISO时间字符串)">
            <TextArea
              rows={4}
              value={batchTimes}
              onChange={(e) => setBatchTimes(e.target.value)}
              placeholder="每行输入一个ISO 8601格式的时间"
            />
          </Form.Item>
        </Form>

        <Table
          size="small"
          dataSource={batchResults.map((result, index) => ({
            key: index,
            original: batchTimeArray[index],
            converted: result.localTime,
            valid: result.isValid,
            error: result.error,
            timezone: result.timezoneInfo.userTimezone,
          }))}
          columns={[
            {
              title: "原始时间",
              dataIndex: "original",
              width: "30%",
              render: (text) => <Text code>{text}</Text>,
            },
            {
              title: "转换结果",
              dataIndex: "converted",
              width: "25%",
              render: (text, record) =>
                record.valid ? (
                  <Text strong>{text}</Text>
                ) : (
                  <Text type="danger">转换失败</Text>
                ),
            },
            {
              title: "状态",
              dataIndex: "valid",
              width: "15%",
              render: (valid) => (
                <Tag color={valid ? "success" : "error"}>
                  {valid ? "成功" : "失败"}
                </Tag>
              ),
            },
            {
              title: "错误信息",
              dataIndex: "error",
              width: "30%",
              render: (error) =>
                error ? <Text type="danger">{error}</Text> : "-",
            },
          ]}
          pagination={false}
        />
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明">
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>支持的时间格式:</Text>
            <ul>
              <li>
                <Text code>2025-06-25T15:54:29Z</Text> - UTC时间
              </li>
              <li>
                <Text code>2025-06-25T15:54:29+08:00</Text> - 带时区偏移
              </li>
              <li>
                <Text code>2025-06-25T15:54:29.123Z</Text> - 带毫秒
              </li>
              <li>
                <Text code>2025-06-25T15:54:29.123+08:00</Text> - 带毫秒和时区
              </li>
            </ul>
          </div>

          <div>
            <Text strong>主要功能:</Text>
            <ul>
              <li>自动检测用户本地时区</li>
              <li>支持自定义输出格式</li>
              <li>完善的错误处理和验证</li>
              <li>批量时间转换</li>
              <li>TypeScript类型支持</li>
            </ul>
          </div>

          <Alert
            type="info"
            message="开发提示"
            description="在浏览器控制台中可以看到详细的调试信息，包括时区转换的详细过程。"
          />
        </Space>
      </Card>
    </div>
  );
};

export default TimeZoneDemo;
