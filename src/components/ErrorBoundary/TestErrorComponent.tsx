/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-07 14:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 14:18:31
 * @FilePath: /KR-virt/src/components/ErrorBoundary/TestErrorComponent.tsx
 * @Description: 测试ErrorBoundary的组件
 */

import React, { useState } from "react";
import { Button, Card, Space, Alert } from "antd";
import { BugOutlined } from "@ant-design/icons";

interface TestErrorComponentProps {
  /** 是否显示测试按钮（仅开发环境建议使用） */
  showTestButtons?: boolean;
}

/**
 * 错误测试组件
 * 仅用于开发环境测试ErrorBoundary功能
 */
const TestErrorComponent: React.FC<TestErrorComponentProps> = ({
  showTestButtons = process.env.NODE_ENV === "development",
}) => {
  const [shouldThrowError, setShouldThrowError] = useState(false);

  // 如果不显示测试按钮，返回null
  if (!showTestButtons) {
    return null;
  }

  // 渲染时抛出错误
  if (shouldThrowError) {
    throw new Error("这是一个测试错误：ErrorBoundary测试组件故意抛出的错误");
  }

  const handleRenderError = () => {
    setShouldThrowError(true);
  };

  const handleUndefinedError = () => {
    // 这会在渲染时抛出错误
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const undefinedObj = undefined as any;
    return undefinedObj.someProperty;
  };

  const handleTypeError = () => {
    // 这会抛出类型错误
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nullObj = null as any;
    return nullObj.someMethod();
  };

  const handleAsyncError = () => {
    // 异步错误不会被ErrorBoundary捕获
    setTimeout(() => {
      throw new Error("异步错误（不会被ErrorBoundary捕获）");
    }, 100);
  };

  const handlePromiseError = () => {
    // Promise错误不会被ErrorBoundary捕获，但会被全局错误处理器捕获
    Promise.reject(new Error("Promise错误（会被全局错误处理器捕获）"));
  };

  return (
    <Card
      title={
        <Space>
          <BugOutlined />
          <span>ErrorBoundary测试工具</span>
        </Space>
      }
      style={{
        marginBottom: 16,
        border: "2px dashed #ff4d4f",
        background: "#fff2f0",
      }}
    >
      <Alert
        message="开发环境专用"
        description="这些按钮仅用于测试ErrorBoundary功能，生产环境不会显示"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space wrap>
        <Button danger onClick={handleRenderError} icon={<BugOutlined />}>
          测试渲染错误
        </Button>

        <Button danger onClick={handleUndefinedError} icon={<BugOutlined />}>
          测试undefined错误
        </Button>

        <Button danger onClick={handleTypeError} icon={<BugOutlined />}>
          测试类型错误
        </Button>

        <Button onClick={handleAsyncError} icon={<BugOutlined />}>
          测试异步错误（不会被捕获）
        </Button>

        <Button onClick={handlePromiseError} icon={<BugOutlined />}>
          测试Promise错误
        </Button>
      </Space>
    </Card>
  );
};

export default TestErrorComponent;
