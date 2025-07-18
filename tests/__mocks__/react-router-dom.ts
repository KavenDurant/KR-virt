/**
 * React Router DOM Mock
 * 用于模拟路由功能，简化组件测试
 */

import React from "react";

export const useNavigate = vi.fn(() => vi.fn());

export const useLocation = vi.fn(() => ({
  pathname: "/",
  search: "",
  hash: "",
  state: null,
  key: "default",
}));

export const useParams = vi.fn(() => ({}));

export const useSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()]);

export const Link = ({
  children,
  to,
  ...props
}: {
  children?: React.ReactNode;
  to: string;
}) => React.createElement("a", { href: to, ...props }, children);

export const NavLink = ({
  children,
  to,
  ...props
}: {
  children?: React.ReactNode;
  to: string;
}) => React.createElement("a", { href: to, ...props }, children);

export const BrowserRouter = ({ children }: { children?: React.ReactNode }) =>
  React.createElement("div", {}, children);

export const Routes = ({ children }: { children?: React.ReactNode }) =>
  React.createElement("div", {}, children);

export const Route = ({ element }: { element: React.ReactNode }) => element;

export const Navigate = () => null;
