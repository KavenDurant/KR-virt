import { configureStore, createSlice } from "@reduxjs/toolkit";

// 性能监控数据类型定义
export interface PerformanceDataPoint {
  time: string;
  total?: number;
  used?: number;
  net_in?: number;
  net_out?: number;
}

export interface NodePerformanceData {
  hostname: string;
  cpu: PerformanceDataPoint[];
  memory: PerformanceDataPoint[];
  disk: PerformanceDataPoint[];
  network: PerformanceDataPoint[];
  lastUpdate: string;
}

// 初始状态
interface AppState {
  sampleData: string;
  selectedHostname: string | null;
  performanceData: Record<string, NodePerformanceData>;
}

const initialState: AppState = {
  sampleData: "示例数据",
  selectedHostname: null,
  performanceData: {},
};

// 使用 createSlice 创建 reducer 和 actions
const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSampleData: (state, action) => {
      state.sampleData = action.payload;
    },
    setSelectedHostname: (state, action) => {
      state.selectedHostname = action.payload;
    },
    setCpuPerformanceData: (state, action) => {
      const { hostname, data } = action.payload;
      if (!state.performanceData[hostname]) {
        state.performanceData[hostname] = {
          hostname,
          cpu: [],
          memory: [],
          disk: [],
          network: [],
          lastUpdate: new Date().toISOString(),
        };
      }
      state.performanceData[hostname].cpu = data;
      state.performanceData[hostname].lastUpdate = new Date().toISOString();
    },
    setMemoryPerformanceData: (state, action) => {
      const { hostname, data } = action.payload;
      if (!state.performanceData[hostname]) {
        state.performanceData[hostname] = {
          hostname,
          cpu: [],
          memory: [],
          disk: [],
          network: [],
          lastUpdate: new Date().toISOString(),
        };
      }
      state.performanceData[hostname].memory = data;
      state.performanceData[hostname].lastUpdate = new Date().toISOString();
    },
    setDiskPerformanceData: (state, action) => {
      const { hostname, data } = action.payload;
      if (!state.performanceData[hostname]) {
        state.performanceData[hostname] = {
          hostname,
          cpu: [],
          memory: [],
          disk: [],
          network: [],
          lastUpdate: new Date().toISOString(),
        };
      }
      state.performanceData[hostname].disk = data;
      state.performanceData[hostname].lastUpdate = new Date().toISOString();
    },
    setNetworkPerformanceData: (state, action) => {
      const { hostname, data } = action.payload;
      if (!state.performanceData[hostname]) {
        state.performanceData[hostname] = {
          hostname,
          cpu: [],
          memory: [],
          disk: [],
          network: [],
          lastUpdate: new Date().toISOString(),
        };
      }
      state.performanceData[hostname].network = data;
      state.performanceData[hostname].lastUpdate = new Date().toISOString();
    },
    clearPerformanceData: (state, action) => {
      const hostname = action.payload;
      if (hostname) {
        delete state.performanceData[hostname];
      } else {
        state.performanceData = {};
      }
    },
  },
});

// 导出 actions
export const {
  setSampleData,
  setSelectedHostname,
  setCpuPerformanceData,
  setMemoryPerformanceData,
  setDiskPerformanceData,
  setNetworkPerformanceData,
  clearPerformanceData,
} = appSlice.actions;

// 配置 Store
export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

// 从 store 本身推断出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
