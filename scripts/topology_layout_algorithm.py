#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网络拓扑图自动布局算法
基于分层布局和力导向算法的混合方案
"""

import math
import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class DeviceType(Enum):
    """设备类型枚举"""
    ROUTER = "router"
    SWITCH_CORE = "switch_core"
    SWITCH_ACCESS = "switch_access"
    FIREWALL = "firewall"
    VIRTUAL_MACHINE = "vm"
    PHYSICAL_HOST = "host"
    LOAD_BALANCER = "lb"


class EntityType(Enum):
    """实体类型枚举"""
    DEVICE = "device"
    NETWORK = "network"


@dataclass
class Position:
    """位置坐标"""
    x: float
    y: float


@dataclass
class Device:
    """设备信息"""
    id: str
    name: str
    type: DeviceType
    position: Optional[Position] = None


@dataclass
class Network:
    """网络信息"""
    id: str
    name: str
    position: Optional[Position] = None


@dataclass
class Connection:
    """连接关系"""
    source_id: str
    target_id: str
    source_type: EntityType
    target_type: EntityType


class TopologyLayoutAlgorithm:
    """拓扑图布局算法类"""
    
    def __init__(self, canvas_width: int = 1200, canvas_height: int = 800):
        """
        初始化算法参数
        
        Args:
            canvas_width: 画布宽度
            canvas_height: 画布高度
        """
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        
        # 布局参数
        self.layer_configs = {
            "network": {"y_position": 0.15, "types": [DeviceType.ROUTER, DeviceType.FIREWALL]},
            "switch": {"y_position": 0.45, "types": [DeviceType.SWITCH_CORE, DeviceType.SWITCH_ACCESS, DeviceType.LOAD_BALANCER]},
            "application": {"y_position": 0.75, "types": [DeviceType.VIRTUAL_MACHINE, DeviceType.PHYSICAL_HOST]}
        }
        
        # 间距配置
        self.horizontal_spacing = 180
        self.vertical_spacing = 150
        self.margin = 80
        self.min_distance = 120
        
        # 力导向算法参数
        self.iterations = 100
        self.cooling_factor = 0.95
        self.initial_temperature = 100.0
        self.attraction_strength = 0.5
        self.repulsion_strength = 800.0
    
    def calculate_layout(self, devices: List[Device], networks: List[Network], 
                        connections: List[Connection]) -> Dict[str, Position]:
        """
        计算完整的拓扑图布局
        
        Args:
            devices: 设备列表
            networks: 网络列表
            connections: 连接关系列表
            
        Returns:
            包含所有实体位置的字典
        """
        # 1. 分层布局
        positions = self._hierarchical_layout(devices, networks)
        
        # 2. 力导向优化
        positions = self._force_directed_optimization(devices, networks, connections, positions)
        
        # 3. 边界检查和调整
        positions = self._adjust_boundaries(positions)
        
        return positions
    
    def _hierarchical_layout(self, devices: List[Device], networks: List[Network]) -> Dict[str, Position]:
        """
        分层布局算法
        根据设备类型将设备安排在不同层级
        """
        positions = {}
        
        # 按层级分组设备
        layers = {}
        for layer_name, config in self.layer_configs.items():
            layers[layer_name] = [d for d in devices if d.type in config["types"]]
        
        # 为每一层计算位置
        for layer_name, layer_devices in layers.items():
            if not layer_devices:
                continue
                
            y_pos = self.layer_configs[layer_name]["y_position"] * self.canvas_height
            
            # 计算该层设备的x坐标
            layer_positions = self._calculate_layer_positions(layer_devices, y_pos)
            positions.update(layer_positions)
        
        # 计算网络节点位置（通常放在中间层）
        if networks:
            network_y = self.layer_configs["switch"]["y_position"] * self.canvas_height + 50
            network_positions = self._calculate_network_positions(networks, network_y)
            positions.update(network_positions)
        
        return positions
    
    def _calculate_layer_positions(self, devices: List[Device], y_position: float) -> Dict[str, Position]:
        """计算单层设备的位置"""
        positions = {}
        
        if not devices:
            return positions
        
        # 计算总宽度和起始x坐标
        total_width = (len(devices) - 1) * self.horizontal_spacing
        start_x = (self.canvas_width - total_width) / 2
        
        # 确保不超出边界
        start_x = max(self.margin, start_x)
        
        for i, device in enumerate(devices):
            x = start_x + i * self.horizontal_spacing
            # 添加少量随机偏移避免重叠
            x += random.uniform(-20, 20)
            y = y_position + random.uniform(-10, 10)
            
            positions[device.id] = Position(x, y)
        
        return positions
    
    def _calculate_network_positions(self, networks: List[Network], y_position: float) -> Dict[str, Position]:
        """计算网络节点位置"""
        positions = {}
        
        if not networks:
            return positions
        
        # 网络节点通常较少，可以更紧密排列
        spacing = self.horizontal_spacing * 0.8
        total_width = (len(networks) - 1) * spacing
        start_x = (self.canvas_width - total_width) / 2
        start_x = max(self.margin, start_x)
        
        for i, network in enumerate(networks):
            x = start_x + i * spacing
            positions[network.id] = Position(x, y_position)
        
        return positions
    
    def _force_directed_optimization(self, devices: List[Device], networks: List[Network], 
                                   connections: List[Connection], 
                                   initial_positions: Dict[str, Position]) -> Dict[str, Position]:
        """
        力导向算法优化位置
        基于连接关系调整设备位置，使连接更加合理
        """
        positions = initial_positions.copy()
        all_entities = [d.id for d in devices] + [n.id for n in networks]
        
        temperature = self.initial_temperature
        
        for iteration in range(self.iterations):
            forces = {entity_id: Position(0, 0) for entity_id in all_entities}
            
            # 计算排斥力（所有节点之间）
            for i, entity1 in enumerate(all_entities):
                for entity2 in all_entities[i+1:]:
                    if entity1 == entity2:
                        continue
                    
                    force = self._calculate_repulsion_force(
                        positions[entity1], positions[entity2]
                    )
                    forces[entity1].x += force.x
                    forces[entity1].y += force.y
                    forces[entity2].x -= force.x
                    forces[entity2].y -= force.y
            
            # 计算吸引力（有连接的节点之间）
            for connection in connections:
                source_pos = positions[connection.source_id]
                target_pos = positions[connection.target_id]
                
                force = self._calculate_attraction_force(source_pos, target_pos)
                forces[connection.source_id].x += force.x
                forces[connection.source_id].y += force.y
                forces[connection.target_id].x -= force.x
                forces[connection.target_id].y -= force.y
            
            # 应用力并更新位置
            for entity_id in all_entities:
                force = forces[entity_id]
                displacement = min(temperature, math.sqrt(force.x**2 + force.y**2))
                
                if displacement > 0:
                    positions[entity_id].x += (force.x / displacement) * min(displacement, temperature)
                    positions[entity_id].y += (force.y / displacement) * min(displacement, temperature)
            
            # 降低温度
            temperature *= self.cooling_factor
            
            if temperature < 0.1:
                break
        
        return positions
    
    def _calculate_repulsion_force(self, pos1: Position, pos2: Position) -> Position:
        """计算排斥力"""
        dx = pos1.x - pos2.x
        dy = pos1.y - pos2.y
        distance = math.sqrt(dx**2 + dy**2)
        
        if distance < 1:
            distance = 1
        
        force_magnitude = self.repulsion_strength / (distance**2)
        
        return Position(
            (dx / distance) * force_magnitude,
            (dy / distance) * force_magnitude
        )
    
    def _calculate_attraction_force(self, pos1: Position, pos2: Position) -> Position:
        """计算吸引力"""
        dx = pos2.x - pos1.x
        dy = pos2.y - pos1.y
        distance = math.sqrt(dx**2 + dy**2)
        
        if distance < 1:
            return Position(0, 0)
        
        force_magnitude = distance * self.attraction_strength
        
        return Position(
            (dx / distance) * force_magnitude,
            (dy / distance) * force_magnitude
        )
    
    def _adjust_boundaries(self, positions: Dict[str, Position]) -> Dict[str, Position]:
        """调整边界，确保所有节点都在画布内"""
        adjusted_positions = {}
        
        for entity_id, pos in positions.items():
            # 确保在画布边界内
            x = max(self.margin, min(self.canvas_width - self.margin, pos.x))
            y = max(self.margin, min(self.canvas_height - self.margin, pos.y))
            
            adjusted_positions[entity_id] = Position(x, y)
        
        return adjusted_positions
    
    def detect_overlaps(self, positions: Dict[str, Position]) -> List[Tuple[str, str]]:
        """检测重叠的节点"""
        overlaps = []
        entity_ids = list(positions.keys())
        
        for i, entity1 in enumerate(entity_ids):
            for entity2 in entity_ids[i+1:]:
                pos1 = positions[entity1]
                pos2 = positions[entity2]
                
                distance = math.sqrt((pos1.x - pos2.x)**2 + (pos1.y - pos2.y)**2)
                if distance < self.min_distance:
                    overlaps.append((entity1, entity2))
        
        return overlaps
    
    def resolve_overlaps(self, positions: Dict[str, Position]) -> Dict[str, Position]:
        """解决节点重叠问题"""
        overlaps = self.detect_overlaps(positions)
        
        for entity1, entity2 in overlaps:
            pos1 = positions[entity1]
            pos2 = positions[entity2]
            
            # 计算需要移动的距离
            dx = pos2.x - pos1.x
            dy = pos2.y - pos1.y
            distance = math.sqrt(dx**2 + dy**2)
            
            if distance < 1:
                # 如果位置完全重叠，添加随机偏移
                dx = random.uniform(-50, 50)
                dy = random.uniform(-50, 50)
                distance = math.sqrt(dx**2 + dy**2)
            
            # 计算移动方向
            move_distance = (self.min_distance - distance) / 2
            move_x = (dx / distance) * move_distance
            move_y = (dy / distance) * move_distance
            
            # 移动两个节点
            positions[entity1].x -= move_x
            positions[entity1].y -= move_y
            positions[entity2].x += move_x
            positions[entity2].y += move_y
        
        # 再次调整边界
        return self._adjust_boundaries(positions)


class TopologyLayoutService:
    """拓扑图布局服务类"""
    
    def __init__(self):
        self.algorithm = TopologyLayoutAlgorithm()
    
    def generate_layout(self, topology_data: Dict) -> Dict:
        """
        为拓扑图数据生成布局信息
        
        Args:
            topology_data: 包含devices、networks、connections的字典
            
        Returns:
            包含位置信息的拓扑数据
        """
        # 解析输入数据
        devices = self._parse_devices(topology_data.get('devices', []))
        networks = self._parse_networks(topology_data.get('networks', []))
        connections = self._parse_connections(topology_data.get('connections', []))
        
        # 计算布局
        positions = self.algorithm.calculate_layout(devices, networks, connections)
        
        # 解决重叠问题
        positions = self.algorithm.resolve_overlaps(positions)
        
        # 更新原始数据中的位置信息
        return self._update_positions_in_data(topology_data, positions)
    
    def _parse_devices(self, devices_data: List[Dict]) -> List[Device]:
        """解析设备数据"""
        devices = []
        for device_data in devices_data:
            try:
                device_type = DeviceType(device_data['type'])
                device = Device(
                    id=device_data['id'],
                    name=device_data['name'],
                    type=device_type
                )
                devices.append(device)
            except (KeyError, ValueError) as e:
                print(f"警告：跳过无效的设备数据 {device_data}: {e}")
                continue
        return devices
    
    def _parse_networks(self, networks_data: List[Dict]) -> List[Network]:
        """解析网络数据"""
        networks = []
        for network_data in networks_data:
            try:
                network = Network(
                    id=network_data['id'],
                    name=network_data['name']
                )
                networks.append(network)
            except KeyError as e:
                print(f"警告：跳过无效的网络数据 {network_data}: {e}")
                continue
        return networks
    
    def _parse_connections(self, connections_data: List[Dict]) -> List[Connection]:
        """解析连接数据"""
        connections = []
        for conn_data in connections_data:
            try:
                connection = Connection(
                    source_id=conn_data['source_id'],
                    target_id=conn_data['target_id'],
                    source_type=EntityType(conn_data['source_type']),
                    target_type=EntityType(conn_data['target_type'])
                )
                connections.append(connection)
            except (KeyError, ValueError) as e:
                print(f"警告：跳过无效的连接数据 {conn_data}: {e}")
                continue
        return connections
    
    def _update_positions_in_data(self, topology_data: Dict, positions: Dict[str, Position]) -> Dict:
        """更新原始数据中的位置信息"""
        updated_data = topology_data.copy()
        
        # 更新设备位置
        for device in updated_data.get('devices', []):
            if device['id'] in positions:
                pos = positions[device['id']]
                if 'location' not in device:
                    device['location'] = {}
                device['location']['x'] = round(pos.x)
                device['location']['y'] = round(pos.y)
        
        # 更新网络位置
        for network in updated_data.get('networks', []):
            if network['id'] in positions:
                pos = positions[network['id']]
                if 'location' not in network:
                    network['location'] = {}
                network['location']['x'] = round(pos.x)
                network['location']['y'] = round(pos.y)
        
        return updated_data


def main():
    """示例使用"""
    # 示例数据
    sample_data = {
        "devices": [
            {"id": "router-001", "name": "主路由器", "type": "router"},
            {"id": "switch-core-001", "name": "核心交换机", "type": "switch_core"},
            {"id": "switch-access-001", "name": "接入交换机", "type": "switch_access"},
            {"id": "vm-web-001", "name": "Web服务器-01", "type": "vm"},
            {"id": "vm-web-002", "name": "Web服务器-02", "type": "vm"},
            {"id": "vm-db-001", "name": "数据库服务器", "type": "vm"},
            {"id": "host-001", "name": "物理主机-01", "type": "host"},
        ],
        "networks": [
            {"id": "network-nat-001", "name": "默认NAT网络"},
            {"id": "network-prod-001", "name": "生产桥接网络"},
        ],
        "connections": [
            {"source_id": "router-001", "target_id": "switch-core-001", "source_type": "device", "target_type": "device"},
            {"source_id": "switch-core-001", "target_id": "switch-access-001", "source_type": "device", "target_type": "device"},
            {"source_id": "switch-access-001", "target_id": "network-nat-001", "source_type": "device", "target_type": "network"},
            {"source_id": "network-nat-001", "target_id": "vm-web-001", "source_type": "network", "target_type": "device"},
            {"source_id": "network-nat-001", "target_id": "vm-web-002", "source_type": "network", "target_type": "device"},
            {"source_id": "network-prod-001", "target_id": "vm-db-001", "source_type": "network", "target_type": "device"},
            {"source_id": "host-001", "target_id": "vm-web-001", "source_type": "device", "target_type": "device"},
        ]
    }
    
    # 创建布局服务并生成布局
    layout_service = TopologyLayoutService()
    result = layout_service.generate_layout(sample_data)
    
    # 打印结果
    print("生成的拓扑图布局：")
    for device in result.get('devices', []):
        if 'location' in device:
            print(f"设备 {device['name']}: ({device['location']['x']}, {device['location']['y']})")
    
    for network in result.get('networks', []):
        if 'location' in network:
            print(f"网络 {network['name']}: ({network['location']['x']}, {network['location']['y']})")


if __name__ == "__main__":
    main() 