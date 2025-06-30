// 扩展 ImportMetaEnv 接口
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENV: "development" | "production";
  readonly VITE_API_BASE_URL: string;
  readonly VITE_PROXY_TARGET: string;
  readonly VITE_PORT: string;
  readonly VITE_ENABLE_MOCK: string;
  readonly VITE_ENABLE_DEV_TOOLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 全局变量声明
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
declare const __BUILD_MODE__: string;
