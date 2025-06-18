import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, Spin, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import {
  setCpuPerformanceData,
  setMemoryPerformanceData,
  setDiskPerformanceData,
  setNetworkPerformanceData,
} from "@/store";
import {
  getCpuMonitor,
  getMemoryMonitor,
  getDiskMonitor,
  getNetworkMonitor,
} from "@/services/cluster/performanceMonitor";

interface PerformanceChartProps {
  hostname: string;
  shouldFetch?: boolean; // 是否应该自动加载数据
}

// CPU性能图表组件
export const CpuPerformanceChart: React.FC<PerformanceChartProps> = ({
  hostname,
  shouldFetch = false,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const performanceData = useSelector(
    (state: RootState) => state.app.performanceData[hostname]?.cpu || []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCpuMonitor(hostname, 60);
      dispatch(setCpuPerformanceData({ hostname, data: data.value }));
    } catch (error) {
      console.error("Failed to fetch CPU performance data:", error);
    } finally {
      setLoading(false);
    }
  }, [hostname, dispatch]);

  // 处理图例点击切换显示/隐藏
  const handleLegendClick = useCallback((dataKey: string) => {
    setHiddenLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  }, []);

  // 只在shouldFetch为true时调用一次
  useEffect(() => {
    if (shouldFetch) {
      fetchData();
    }
  }, [shouldFetch, fetchData]);

  return (
    <Card
      title="CPU使用率"
      size="small"
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
          title="刷新数据"
        />
      }
      styles={{
        body: { padding: '12px' }
      }}
    >
      <Spin spinning={loading}>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{
                top: 10,
                right: 30,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) =>
                  new Date(time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
                width={50}
              />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                onClick={(e) => e.dataKey && handleLegendClick(String(e.dataKey))}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="used"
                stroke="#1890ff"
                strokeWidth={2}
                name="已使用"
                dot={false}
                activeDot={{ r: 4, stroke: '#1890ff', strokeWidth: 2 }}
                hide={hiddenLines.used}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#52c41a"
                strokeWidth={2}
                name="总量"
                dot={false}
                activeDot={{ r: 4, stroke: '#52c41a', strokeWidth: 2 }}
                hide={hiddenLines.total}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Spin>
    </Card>
  );
};

// 内存性能图表组件
export const MemoryPerformanceChart: React.FC<PerformanceChartProps> = ({
  hostname,
  shouldFetch = false,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const performanceData = useSelector(
    (state: RootState) => state.app.performanceData[hostname]?.memory || []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMemoryMonitor(hostname, 60);
      dispatch(setMemoryPerformanceData({ hostname, data: data.value }));
    } catch (error) {
      console.error("Failed to fetch memory performance data:", error);
    } finally {
      setLoading(false);
    }
  }, [hostname, dispatch]);

  // 处理图例点击切换显示/隐藏
  const handleLegendClick = useCallback((dataKey: string) => {
    setHiddenLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  }, []);

  // 只在shouldFetch为true时调用一次
  useEffect(() => {
    if (shouldFetch) {
      fetchData();
    }
  }, [shouldFetch, fetchData]);

  return (
    <Card
      title="内存使用率"
      size="small"
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
          title="刷新数据"
        />
      }
      styles={{
        body: { padding: '12px' }
      }}
    >
      <Spin spinning={loading}>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{
                top: 10,
                right: 30,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) =>
                  new Date(time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
              />
              <YAxis
                domain={[0, 'dataMax']}
                tickFormatter={(value) => {
                  if (value >= 1024) {
                    return `${(value / 1024).toFixed(1)}GB`;
                  }
                  return `${value.toFixed(0)}MB`;
                }}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
                width={60}
              />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => {
                  const formattedValue = value >= 1024 
                    ? `${(value / 1024).toFixed(2)}GB` 
                    : `${value.toFixed(0)}MB`;
                  return [formattedValue, ''];
                }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                onClick={(e) => e.dataKey && handleLegendClick(String(e.dataKey))}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="used"
                stroke="#ff7875"
                strokeWidth={2}
                name="已使用"
                dot={false}
                activeDot={{ r: 4, stroke: '#ff7875', strokeWidth: 2 }}
                hide={hiddenLines.used}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#73d13d"
                strokeWidth={2}
                name="总量"
                dot={false}
                activeDot={{ r: 4, stroke: '#73d13d', strokeWidth: 2 }}
                hide={hiddenLines.total}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Spin>
    </Card>
  );
};

// 磁盘性能图表组件
export const DiskPerformanceChart: React.FC<PerformanceChartProps> = ({
  hostname,
  shouldFetch = false,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const performanceData = useSelector(
    (state: RootState) => state.app.performanceData[hostname]?.disk || []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDiskMonitor(hostname, 60);
      dispatch(setDiskPerformanceData({ hostname, data: data.value }));
    } catch (error) {
      console.error("Failed to fetch disk performance data:", error);
    } finally {
      setLoading(false);
    }
  }, [hostname, dispatch]);

  // 处理图例点击切换显示/隐藏
  const handleLegendClick = useCallback((dataKey: string) => {
    setHiddenLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  }, []);

  // 只在 shouldFetch 为 true 时调用数据
  useEffect(() => {
    if (shouldFetch) {
      fetchData();
    }
  }, [shouldFetch, fetchData]);

  return (
    <Card
      title="磁盘使用率"
      size="small"
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
          title="刷新数据"
        />
      }
      styles={{
        body: { padding: '12px' }
      }}
    >
      <Spin spinning={loading}>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{
                top: 10,
                right: 30,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) =>
                  new Date(time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
              />
              <YAxis
                domain={[0, 'dataMax']}
                tickFormatter={(value) => {
                  if (value >= 1024) {
                    return `${(value / 1024).toFixed(1)}GB`;
                  }
                  return `${value.toFixed(0)}MB`;
                }}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
                width={60}
              />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => {
                  const formattedValue = value >= 1024 
                    ? `${(value / 1024).toFixed(2)}GB` 
                    : `${value.toFixed(0)}MB`;
                  return [formattedValue, ''];
                }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                onClick={(e) => e.dataKey && handleLegendClick(String(e.dataKey))}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="used"
                stroke="#fa8c16"
                strokeWidth={2}
                name="已使用"
                dot={false}
                activeDot={{ r: 4, stroke: '#fa8c16', strokeWidth: 2 }}
                hide={hiddenLines.used}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#13c2c2"
                strokeWidth={2}
                name="总量"
                dot={false}
                activeDot={{ r: 4, stroke: '#13c2c2', strokeWidth: 2 }}
                hide={hiddenLines.total}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Spin>
    </Card>
  );
};

// 网络性能图表组件
export const NetworkPerformanceChart: React.FC<PerformanceChartProps> = ({
  hostname,
  shouldFetch = false,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const performanceData = useSelector(
    (state: RootState) => state.app.performanceData[hostname]?.network || []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNetworkMonitor(hostname, 60);
      dispatch(setNetworkPerformanceData({ hostname, data: data.value }));
    } catch (error) {
      console.error("Failed to fetch network performance data:", error);
    } finally {
      setLoading(false);
    }
  }, [hostname, dispatch]);

  // 处理图例点击切换显示/隐藏
  const handleLegendClick = useCallback((dataKey: string) => {
    setHiddenLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  }, []);

  // 只在 shouldFetch 为 true 时调用数据
  useEffect(() => {
    if (shouldFetch) {
      fetchData();
    }
  }, [shouldFetch, fetchData]);

  return (
    <Card
      title="网络吞吐量"
      size="small"
      extra={
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
          title="刷新数据"
        />
      }
      styles={{
        body: { padding: '12px' }
      }}
    >
      <Spin spinning={loading}>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{
                top: 10,
                right: 30,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) =>
                  new Date(time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
              />
              <YAxis
                tickFormatter={(value) => `${value.toFixed(1)} MB/s`}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#d9d9d9' }}
                width={70}
              />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(2)} MB/s`, '']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                onClick={(e) => e.dataKey && handleLegendClick(String(e.dataKey))}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="net_in"
                stroke="#722ed1"
                strokeWidth={2}
                name="接收"
                dot={false}
                activeDot={{ r: 4, stroke: '#722ed1', strokeWidth: 2 }}
                hide={hiddenLines.net_in}
              />
              <Line
                type="monotone"
                dataKey="net_out"
                stroke="#eb2f96"
                strokeWidth={2}
                name="发送"
                dot={false}
                activeDot={{ r: 4, stroke: '#eb2f96', strokeWidth: 2 }}
                hide={hiddenLines.net_out}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Spin>
    </Card>
  );
};
