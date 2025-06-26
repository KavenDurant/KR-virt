# useTimeZone Hook 使用指南

## 📋 概述

`useTimeZone` 是为 KR-virt 项目专门开发的时区处理和时间格式转换自定义Hook，用于将后端返回的ISO 8601格式时间字符串自动转换为用户本地时区的时间。

## 🚀 核心功能

- ✅ **ISO 8601时间解析**：支持各种ISO格式的时间字符串
- ✅ **自动时区转换**：自动检测用户本地时区并转换
- ✅ **自定义格式输出**：支持灵活的时间格式配置
- ✅ **错误处理**：完善的输入验证和错误提示
- ✅ **批量处理**：支持多个时间字符串的批量转换
- ✅ **TypeScript支持**：完整的类型定义和类型安全

## 📦 安装和导入

Hook已集成到项目的hooks系统中，可以直接导入使用：

```typescript
import { useTimeZone, useTimeZoneBatch, useTimezoneInfo } from "@/hooks";
```

## 🔧 API 参考

### useTimeZone

主要的时区转换Hook。

```typescript
function useTimeZone(
  isoTimeString: string,
  options?: UseTimeZoneOptions,
): UseTimeZoneResult;
```

#### 参数

- `isoTimeString`: ISO 8601格式的时间字符串
- `options`: 可选配置项
  - `format?: string` - 输出格式，默认为 `'YYYY-MM-DD HH:mm:ss'`
  - `targetTimezone?: string` - 目标时区，默认为用户本地时区
  - `debug?: boolean` - 是否启用调试模式

#### 返回值

```typescript
interface UseTimeZoneResult {
  localTime: string; // 转换后的本地时间字符串
  isValid: boolean; // 时间是否有效
  error?: string; // 错误信息（如果有）
  originalTime?: dayjs.Dayjs; // 原始时间对象
  convertedTime?: dayjs.Dayjs; // 转换后的时间对象
  timezoneInfo: {
    // 时区信息
    userTimezone: string; // 用户本地时区
    targetTimezone: string; // 目标时区
    offset: number; // 时区偏移量（分钟）
  };
}
```

### useTimeZoneBatch

批量时间转换Hook。

```typescript
function useTimeZoneBatch(
  timeStrings: string[],
  options?: UseTimeZoneOptions,
): UseTimeZoneResult[];
```

### useTimezoneInfo

获取当前用户时区信息的Hook。

```typescript
function useTimezoneInfo(): {
  timezone: string; // 用户时区标识
  offset: number; // UTC偏移量（分钟）
  offsetString: string; // 格式化的偏移量字符串
  localTime: string; // 当前本地时间
  utcTime: string; // 当前UTC时间
};
```

## 💡 使用示例

### 基本使用

```typescript
import React from 'react';
import { useTimeZone } from '@/hooks';

const UserCreatedTime: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const { localTime, isValid, error } = useTimeZone(createdAt);

  if (!isValid) {
    return <span>时间格式错误: {error}</span>;
  }

  return <span>创建时间: {localTime}</span>;
};

// 使用示例
<UserCreatedTime createdAt="2025-06-25T15:54:29+00:00" />
// 输出: 创建时间: 2025-06-25 23:54:29 (假设用户在UTC+8时区)
```

### 自定义格式

```typescript
const CustomFormatTime: React.FC<{ isoTime: string }> = ({ isoTime }) => {
  const { localTime } = useTimeZone(isoTime, {
    format: 'MM/DD/YYYY HH:mm'
  });

  return <span>{localTime}</span>;
};

// 输出: 06/25/2025 23:54
```

### 在表格中使用

```typescript
import { Table } from 'antd';
import { useTimeZone } from '@/hooks';

const TimeCell: React.FC<{ isoTime: string }> = ({ isoTime }) => {
  const { localTime, isValid } = useTimeZone(isoTime);
  return <span>{isValid ? localTime : '无效时间'}</span>;
};

const columns = [
  {
    title: '创建时间',
    dataIndex: 'created_at',
    render: (isoTime: string) => <TimeCell isoTime={isoTime} />
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    render: (isoTime: string) => <TimeCell isoTime={isoTime} />
  }
];
```

### 批量处理

```typescript
const BatchTimeDisplay: React.FC<{ events: Event[] }> = ({ events }) => {
  const timeStrings = events.map(event => event.timestamp);
  const timeResults = useTimeZoneBatch(timeStrings);

  return (
    <div>
      {events.map((event, index) => (
        <div key={event.id}>
          {event.name}: {timeResults[index].localTime}
        </div>
      ))}
    </div>
  );
};
```

### 显示时区信息

```typescript
const TimezoneDisplay: React.FC = () => {
  const timezoneInfo = useTimezoneInfo();

  return (
    <div>
      <p>当前时区: {timezoneInfo.timezone}</p>
      <p>UTC偏移: {timezoneInfo.offsetString}</p>
      <p>本地时间: {timezoneInfo.localTime}</p>
    </div>
  );
};
```

## 🎯 实际应用场景

### 1. 用户管理页面

```typescript
// 在用户列表中显示创建时间和最后登录时间
const UserTable: React.FC = () => {
  const columns = [
    {
      title: '用户名',
      dataIndex: 'login_name',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (isoTime: string) => {
        const { localTime } = useTimeZone(isoTime);
        return localTime;
      }
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      render: (isoTime: string) => {
        const { localTime, isValid } = useTimeZone(isoTime);
        return isValid ? localTime : '从未登录';
      }
    }
  ];

  return <Table columns={columns} dataSource={users} />;
};
```

### 2. 集群管理页面

```typescript
// 显示节点的启动时间和最后更新时间
const NodeInfo: React.FC<{ node: Node }> = ({ node }) => {
  const { localTime: bootTime } = useTimeZone(node.boot_time);
  const { localTime: updateTime } = useTimeZone(node.updated_at);

  return (
    <Descriptions>
      <Descriptions.Item label="启动时间">
        {bootTime}
      </Descriptions.Item>
      <Descriptions.Item label="最后更新">
        {updateTime}
      </Descriptions.Item>
    </Descriptions>
  );
};
```

### 3. 系统设置页面

```typescript
// 显示许可证到期时间
const LicenseInfo: React.FC<{ license: License }> = ({ license }) => {
  const { localTime, convertedTime } = useTimeZone(license.expiry_date);
  const isExpired = convertedTime?.isBefore(dayjs());

  return (
    <Alert
      type={isExpired ? 'error' : 'info'}
      message={`许可证${isExpired ? '已' : '将'}于 ${localTime} ${isExpired ? '过期' : '到期'}`}
    />
  );
};
```

## 🔍 调试和故障排除

### 启用调试模式

```typescript
const { localTime } = useTimeZone(isoTime, { debug: true });
// 控制台将输出详细的转换信息
```

### 常见问题

1. **时间显示不正确**
   - 检查输入的ISO字符串格式是否正确
   - 确认服务器返回的时间包含时区信息

2. **时区检测错误**
   - 浏览器时区设置可能不正确
   - 可以手动指定目标时区

3. **性能问题**
   - 对于大量数据，使用 `useTimeZoneBatch` 而不是多次调用 `useTimeZone`
   - 考虑在服务端进行时区转换

## 📝 最佳实践

1. **统一使用**: 在整个项目中统一使用此Hook处理时间显示
2. **错误处理**: 始终检查 `isValid` 字段并处理错误情况
3. **格式一致**: 在同一页面中保持时间格式的一致性
4. **性能优化**: 对于静态时间数据，考虑使用 `useMemo` 缓存结果
5. **用户体验**: 在时间旁边提供Tooltip显示完整的时区信息

## 🧪 测试

Hook包含完整的单元测试，覆盖以下场景：

- ✅ 正常时间转换
- ✅ 自定义格式
- ✅ 错误处理
- ✅ 边界情况
- ✅ 批量处理
- ✅ 时区信息获取

运行测试：

```bash
npm test src/hooks/__tests__/useTimeZone.test.ts
```

---

_本Hook为KR-virt项目量身定制，确保了时间显示的一致性和用户体验的优化。_
