/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-05 16:39:28
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-05 16:44:36
 * @FilePath: /KR-virt/src/test/test-utils.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

// 创建一个简单的测试包装器
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>{children}</ConfigProvider>
    </BrowserRouter>
  );
};

// 自定义渲染函数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: TestWrapper, ...options });

// 重新导出所有 testing-library 工具，但不包含组件
export {
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
  within,
  getByRole,
  getByText,
  getByLabelText,
  getByPlaceholderText,
  getByAltText,
  getByDisplayValue,
  getByTitle,
  getByTestId,
  getAllByRole,
  getAllByText,
  getAllByLabelText,
  getAllByPlaceholderText,
  getAllByAltText,
  getAllByDisplayValue,
  getAllByTitle,
  getAllByTestId,
  queryByRole,
  queryByText,
  queryByLabelText,
  queryByPlaceholderText,
  queryByAltText,
  queryByDisplayValue,
  queryByTitle,
  queryByTestId,
  queryAllByRole,
  queryAllByText,
  queryAllByLabelText,
  queryAllByPlaceholderText,
  queryAllByAltText,
  queryAllByDisplayValue,
  queryAllByTitle,
  queryAllByTestId,
  findByRole,
  findByText,
  findByLabelText,
  findByPlaceholderText,
  findByAltText,
  findByDisplayValue,
  findByTitle,
  findByTestId,
  findAllByRole,
  findAllByText,
  findAllByLabelText,
  findAllByPlaceholderText,
  findAllByAltText,
  findAllByDisplayValue,
  findAllByTitle,
  findAllByTestId,
} from "@testing-library/react";

export { customRender as render };
