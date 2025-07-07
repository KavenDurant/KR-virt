#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
拓扑图API使用示例
展示如何在Flask后端中集成布局算法
"""

from flask import Flask, jsonify, request
from topology_layout_algorithm import TopologyLayoutService
import json

app = Flask(__name__)
layout_service = TopologyLayoutService()


@app.route('/api/network/topology', methods=['GET'])
def get_network_topology():
    """获取网络拓扑数据（包含自动计算的坐标）"""
    try:
        # 模拟从数据库获取的原始数据
        raw_topology_data = get_topology_from_database()
        
        # 使用布局算法计算坐标
        topology_with_layout = layout_service.generate_layout(raw_topology_data)
        
        # 返回标准响应格式
        return jsonify({
            "success": True,
            "message": "获取拓扑数据成功",
            "data": topology_with_layout
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"获取拓扑数据失败: {str(e)}",
            "data": None
        }), 500


@app.route('/api/network/topology/layout', methods=['POST'])
def save_topology_layout():
    """保存用户自定义的拓扑图布局"""
    try:
        layout_data = request.json
        
        # 保存布局到数据库
        save_layout_to_database(layout_data)
        
        return jsonify({
            "success": True,
            "message": "布局保存成功",
            "data": None
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"保存布局失败: {str(e)}",
            "data": None
        }), 500


def get_topology_from_database():
    """
    模拟从数据库获取拓扑数据
    在实际项目中，这里应该连接数据库获取真实数据
    """
    return {
        "devices": [
            {
                "id": "router-001",
                "name": "主路由器",
                "type": "router",
                "status": "online",
                "ip_address": "192.168.1.1",
                "mac_address": "00:11:22:33:44:55",
                "description": "核心路由设备",
                "properties": {
                    "router": {
                        "routing_table_size": 1024,
                        "wan_interfaces": ["eth0"],
                        "lan_interfaces": ["eth1", "eth2"]
                    }
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-07T14:30:00Z"
            },
            {
                "id": "switch-core-001",
                "name": "核心交换机",
                "type": "switch_core",
                "status": "online",
                "ip_address": "192.168.1.10",
                "description": "核心网络交换设备",
                "properties": {
                    "switch": {
                        "port_count": 48,
                        "vlan_support": True,
                        "used_ports": 12
                    }
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-07T14:30:00Z"
            },
            {
                "id": "vm-web-001",
                "name": "Web服务器-01",
                "type": "vm",
                "status": "online",
                "ip_address": "192.168.122.101",
                "description": "前端Web服务器",
                "properties": {
                    "vm": {
                        "host_id": "host-001",
                        "cpu_cores": 4,
                        "memory_mb": 8192,
                        "disk_gb": 100,
                        "os_type": "Ubuntu 22.04"
                    }
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-07T14:30:00Z"
            },
            {
                "id": "vm-web-002",
                "name": "Web服务器-02",
                "type": "vm",
                "status": "online",
                "ip_address": "192.168.122.102",
                "description": "前端Web服务器备份",
                "properties": {
                    "vm": {
                        "host_id": "host-001",
                        "cpu_cores": 2,
                        "memory_mb": 4096,
                        "disk_gb": 80,
                        "os_type": "Ubuntu 22.04"
                    }
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-07T14:30:00Z"
            }
        ],
        "networks": [
            {
                "id": "network-nat-001",
                "name": "默认NAT网络",
                "type": "nat",
                "cidr": "192.168.122.0/24",
                "gateway": "192.168.122.1",
                "dhcp_enabled": True,
                "dns_servers": ["8.8.8.8", "114.114.114.114"],
                "status": "active",
                "ip_usage": {
                    "total_ips": 254,
                    "used_ips": 45,
                    "reserved_ips": 10,
                    "usage_percent": 18
                },
                "description": "默认NAT网络段",
                "properties": {
                    "nat": {
                        "external_interface": "eth0",
                        "port_range": {
                            "start": 1024,
                            "end": 65535
                        }
                    }
                }
            }
        ],
        "connections": [
            {
                "id": "conn-router-switch",
                "source_id": "router-001",
                "target_id": "switch-core-001",
                "source_type": "device",
                "target_type": "device",
                "connection_type": "physical",
                "status": "up",
                "bandwidth": 1000,
                "latency": 1,
                "properties": {
                    "interface_name": "eth1",
                    "port_number": 1,
                    "protocol": "ethernet"
                }
            },
            {
                "id": "conn-switch-network",
                "source_id": "switch-core-001",
                "target_id": "network-nat-001",
                "source_type": "device",
                "target_type": "network",
                "connection_type": "logical",
                "status": "up",
                "properties": {
                    "interface_name": "vlan100"
                }
            },
            {
                "id": "conn-network-vm1",
                "source_id": "network-nat-001",
                "target_id": "vm-web-001",
                "source_type": "network",
                "target_type": "device",
                "connection_type": "virtual",
                "status": "up",
                "properties": {
                    "interface_name": "vnet0"
                }
            },
            {
                "id": "conn-network-vm2",
                "source_id": "network-nat-001",
                "target_id": "vm-web-002",
                "source_type": "network",
                "target_type": "device",
                "connection_type": "virtual",
                "status": "up",
                "properties": {
                    "interface_name": "vnet1"
                }
            }
        ],
        "metadata": {
            "total_devices": 4,
            "total_networks": 1,
            "total_connections": 4,
            "last_updated": "2024-01-07T14:30:00Z",
            "health_status": {
                "overall": "healthy",
                "details": {
                    "devices_online": 4,
                    "devices_offline": 0,
                    "networks_active": 1,
                    "connections_up": 4
                }
            }
        }
    }


def save_layout_to_database(layout_data):
    """
    保存布局数据到数据库
    在实际项目中，这里应该将布局信息保存到数据库
    """
    print("保存布局数据:", json.dumps(layout_data, indent=2, ensure_ascii=False))
    # 实际实现：
    # for device in layout_data.get('devices', []):
    #     db.update_device_position(device['device_id'], device['position'])


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 