import React, { useCallback, useMemo } from "react";
import { Spin } from "antd";
import ReactFlow, {
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Controls,
  MiniMap,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  type NetworkTopologyProps,
  type TopologyNode,
  type TopologyEdge,
} from "./types";
import {
  convertDevicesToNodes,
  convertNetworksToNodes,
  convertConnectionsToEdges,
  calculateAutoLayout,
  validateTopologyData,
  convertApiDataToReactFlowFormat,
} from "./utils";

/**
 * 网络拓扑图组件
 *
 * 功能特点：
 * - 支持API数据和传统数据格式
 * - 支持拖拽、缩放、连接等交互功能
 * - 自动布局算法
 * - 数据验证和错误处理
 * - 响应式设计
 */
const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  data,
  apiData,
  loading = false,
  onNodeClick,
  onEdgeClick,
  onNodesChange,
  height = 600,
  className,
}) => {
  // 计算节点和边数据
  const { initialNodes, initialEdges, hasValidData } = useMemo(() => {
    console.log('🎨 NetworkTopology 数据状态:', {
      hasApiData: !!apiData,
      hasTraditionalData: !!data,
      loading,
      apiDataContent: apiData
    });

    // 只有当API数据存在时才处理，不再使用默认假数据
    if (apiData) {
      try {
        console.log('✅ 使用API数据:', apiData);
        const reactFlowData = convertApiDataToReactFlowFormat(apiData);
        console.log('🔄 转换后的ReactFlow数据:', reactFlowData);
        return {
          initialNodes: reactFlowData.nodes,
          initialEdges: reactFlowData.edges,
          hasValidData: true,
        };
      } catch (error) {
        console.error("❌ API数据转换失败:", error);
        return {
          initialNodes: [],
          initialEdges: [],
          hasValidData: false,
        };
      }
    }

    // 只有当明确传入了传统数据格式时才使用
    if (data) {
      // 验证数据完整性
      const validation = validateTopologyData(
        data.devices,
        data.networks,
        data.connections
      );

      if (!validation.valid) {
        console.warn("拓扑数据验证失败:", validation.errors);
        return {
          initialNodes: [],
          initialEdges: [],
          hasValidData: false,
        };
      }

      // 计算自动布局位置
      const positions = calculateAutoLayout(
        data.devices,
        data.networks
      );

      // 转换设备和网络为节点
      const deviceNodes = convertDevicesToNodes(data.devices, positions);
      const networkNodes = convertNetworksToNodes(
        data.networks,
        positions
      );
      const nodes = [...deviceNodes, ...networkNodes];

      // 转换连接为边
      const edges = convertConnectionsToEdges(data.connections);

      return {
        initialNodes: nodes,
        initialEdges: edges,
        hasValidData: true,
      };
    }

    // 没有任何数据时，返回空状态，不使用默认假数据
    return {
      initialNodes: [],
      initialEdges: [],
      hasValidData: false,
    };
  }, [data, apiData]);

  // 使用 ReactFlow hooks 管理节点和边状态
  const [nodes, , onInternalNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 处理节点变化
  const handleNodesChange = useCallback(
    (changes: unknown[]) => {
      onInternalNodesChange(changes);
      if (onNodesChange) {
        onNodesChange(nodes);
      }
    },
    [onInternalNodesChange, onNodesChange, nodes]
  );

  // 处理连接创建
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: "default",
        style: { stroke: "#1890ff", strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // 处理节点点击
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: TopologyNode) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // 处理边点击
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: TopologyEdge) => {
      if (onEdgeClick) {
        onEdgeClick(edge);
      }
    },
    [onEdgeClick]
  );

  // 如果正在加载或者没有数据，显示加载状态
  if (loading || !hasValidData) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
        }}
        className={className}
      >
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px", color: "#666" }}>
            加载网络拓扑数据中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width: "100%" }} className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="top-right"
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 },
          type: "default",
        }}
        // 设置画布样式
        style={{
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* 控制按钮 */}
        <Controls position="top-left" showInteractive={false} />

        {/* 小地图 */}
        <MiniMap
          nodeStrokeColor="#333"
          nodeColor="#fff"
          nodeBorderRadius={2}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            border: "1px solid #d9d9d9",
          }}
        />

        {/* 网格背景 */}
        <Background gap={12} size={1} color="#e1e1e1" />
      </ReactFlow>
    </div>
  );
};

export default NetworkTopology;
