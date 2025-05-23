import { configureStore, createSlice } from "@reduxjs/toolkit";

// 初始状态
interface AppState {
  sampleData: string;
}

const initialState: AppState = {
  sampleData: "示例数据",
};

// 使用 createSlice 创建 reducer 和 actions
const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSampleData: (state, action) => {
      state.sampleData = action.payload;
    },
  },
});

// 导出 actions
export const { setSampleData } = appSlice.actions;

// 配置 Store
export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

// 从 store 本身推断出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
