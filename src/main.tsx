import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ConfigProvider, theme } from "antd";
import { store } from "./store";
import "./index.css";
import Router from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#007acc",
            colorBgContainer: "#1e1e1e",
            colorBgElevated: "#252526",
            colorText: "#cccccc",
            colorTextSecondary: "#9c9c9c",
            colorBorder: "#3c3c3c",
            colorBorderSecondary: "#2b2b2b",
          },
          components: {
            Table: {
              colorBgContainer: "#1e1e1e",
              colorText: "#cccccc",
              headerBg: "#252526",
            },
            Card: {
              colorBgContainer: "#252526",
              colorText: "#cccccc",
              headerBg: "#252526",
            },
            Button: {
              colorPrimary: "#0e639c",
              colorPrimaryHover: "#1177bb",
              defaultBg: "#313131",
              defaultColor: "#cccccc",
            },
            Menu: {
              darkItemBg: "#1c1c1c",
              darkItemColor: "#cccccc",
              darkItemSelectedBg: "#37373d",
              darkItemSelectedColor: "#ffffff",
              darkSubMenuItemBg: "#1c1c1c",
            },
            Layout: {
              bodyBg: "#1e1e1e",
              headerBg: "#252526",
              siderBg: "#1c1c1c",
            },
            Tag: {
              defaultBg: "#333333",
              defaultColor: "#ffffff",
            },
          },
        }}
      >
        <Router />
      </ConfigProvider>
    </Provider>
  </StrictMode>,
);
