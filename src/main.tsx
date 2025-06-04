import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";
import Router from "./router";
import { App } from "antd";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App>
          <Router />
        </App>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
