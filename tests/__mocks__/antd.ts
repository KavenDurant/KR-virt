/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-24 16:47:39
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-01 18:14:30
 * @FilePath: /KR-virt/tests/__mocks__/antd.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * Ant Design组件Mock
 * 用于模拟Ant Design组件，简化测试环境
 */

import React from "react";

// Mock常用的Ant Design组件
export const Button = ({
  children,
  onClick,
  ...props
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  [key: string]: unknown;
}) => React.createElement("button", { onClick, ...props }, children);

export const Input = ({ onChange, ...props }: unknown) =>
  React.createElement("input", { onChange, ...props });

export const Form = ({ children, onFinish, ...props }: unknown) =>
  React.createElement("form", { onSubmit: onFinish, ...props }, children);

export const Table = ({
  dataSource,
  columns,
  ...props
}: {
  dataSource?: unknown[];
  columns?: { dataIndex: string }[];
}) =>
  React.createElement(
    "table",
    props,
    React.createElement(
      "tbody",
      {},
      dataSource?.map((item: Record<string, unknown>, index: number) =>
        React.createElement(
          "tr",
          { key: index },
          columns?.map((col: { dataIndex: string }, colIndex: number) =>
            React.createElement("td", { key: colIndex }, item[col.dataIndex])
          )
        )
      )
    )
  );

export const Modal = ({
  children,
  visible,
  open,
  ...props
}: {
  children?: React.ReactNode;
  visible?: boolean;
  open?: boolean;
}) => (visible || open ? React.createElement("div", props, children) : null);

export const message = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
};

export const notification = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};
