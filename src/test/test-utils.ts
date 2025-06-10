/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-05 16:39:28
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-05 16:44:36
 * @FilePath: /KR-virt/src/test/test-utils.ts
 * @Description: 测试工具函数，重新导出 testing-library 功能
 */

// 重新导出 testing-library 的所有功能
export {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
  within,
  createEvent,
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

// 重新导出 user-event
export { default as userEvent } from "@testing-library/user-event";
