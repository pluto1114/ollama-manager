# 技术设计文档

## 1. 功能概述

本设计旨在完善Ollama Manager的仪表盘模块和模型下载功能，通过集成`https://ollama.com/search`的模型信息，提供更丰富的模型选择和下载体验，同时增强仪表盘的系统监控和数据展示能力。

### 1.1 仪表盘模块功能增强

本次更新将重点完善以下仪表盘功能：
1. **运行中模型统计** - 实时显示正在运行的模型数量
2. **最近使用模型** - 记录并展示用户最近使用的模型
3. **系统资源监控** - 展示CPU、内存、GPU、磁盘等系统资源使用情况
4. **实时数据刷新** - 所有监控数据自动刷新，提供实时体验

## 2. 技术架构

### 2.1 系统架构

```
前端 (React + TypeScript) <-> 后端 API (Express + TypeScript) <-> Ollama API
                          <-> ollama.com/search (模型信息源)
```

### 2.2 核心组件

1. **前端组件**
   - 模型搜索与浏览界面
   - 模型详情展示
   - 模型下载功能（含进度显示）

2. **后端服务**
   - 模型信息获取服务
   - 模型下载代理服务（支持流式响应）

3. **数据模型**
   - 远程模型信息
   - 本地模型信息
   - 下载进度信息

## 3. 详细设计

### 3.1 后端设计

#### 3.1.1 新增API端点

| 端点 | 方法 | 功能 | 请求参数 | 响应 |
|------|------|------|----------|------|
| `/api/models/remote` | GET | 获取远程模型列表 | `q` (可选): 搜索关键词<br>`page` (可选): 页码<br>`limit` (可选): 每页数量 | `{ models: [{ id, name, description, tags, pulls, updated }] }` |
| `/api/models/remote/:id` | GET | 获取远程模型详情 | 无 | `{ id, name, description, tags, pulls, updated, versions }` |
| `/api/models/pull` | POST | 下载模型（支持流式响应） | `name`: 模型名称<br>`stream`: 是否流式响应（默认true） | 流式返回：`{ status, completed?, total?, digest? }`<br>非流式：标准JSON响应 |

#### 3.1.2 模型信息服务

创建新的服务类 `RemoteModelService`，负责：
- 从 `https://ollama.com/search` 获取模型信息
- 解析和格式化模型数据
- 缓存模型信息以提高性能

### 3.2 前端设计

#### 3.2.1 新增页面组件

- **RemoteModelsPage**: 远程模型浏览页面
  - 模型搜索功能
  - 模型列表展示
  - 模型筛选功能
  - 点击卡片跳转详情页

- **RemoteModelDetailPage**: 远程模型详情页面
  - 模型详细信息展示
  - 版本/标签选择表格
  - 下载状态和进度显示
  - 下载按钮
  - 实时进度条和百分比显示

#### 3.2.2 增强现有组件

- **ModelsPage**: 添加远程模型入口
- **ApiService**: 添加远程模型相关API调用

### 3.3 数据模型设计

#### 3.3.1 远程模型信息

```typescript
interface RemoteModel {
  id: string;           // 模型ID
  name: string;         // 模型名称
  description: string;  // 模型描述
  tags: string[];       // 模型标签
  pulls: number;        // 下载次数
  updated: string;      // 更新时间
  versions?: ModelVersion[]; // 模型版本
}

interface ModelVersion {
  id: string;           // 版本ID
  name: string;         // 版本名称
  size: string;         // 模型大小
  parameters: string;   // 参数数量
  quantization: string; // 量化级别
}
```

#### 3.3.2 下载进度信息

```typescript
type DownloadStatus = 'idle' | 'downloading' | 'success' | 'error';

interface DownloadProgress {
  status: string;       // 下载状态
  completed?: number;   // 已完成字节数
  total?: number;       // 总字节数
  digest?: string;      // 文件摘要
}
```

## 4. 实现计划

### 4.1 后端实现

1. ✅ 创建 `RemoteModelService` 类
2. ✅ 实现从 `https://ollama.com/search` 获取模型信息的功能
3. ✅ 添加新的API端点
4. ✅ 实现流式下载响应功能
5. 🔄 实现模型信息缓存机制

### 4.2 前端实现

1. ✅ 创建 `RemoteModelsPage` 组件
2. ✅ 创建 `RemoteModelDetailPage` 组件
3. ✅ 增强 `ModelsPage` 组件
4. ✅ 添加远程模型相关API调用
5. ✅ 实现模型下载功能（含进度显示）

### 4.3 测试计划

1. ✅ 测试远程模型列表获取
2. ✅ 测试远程模型详情获取
3. 🔄 测试模型下载功能（含进度显示）
4. ✅ 测试搜索和筛选功能
5. ⏳ 测试缓存机制

## 5. 技术栈

- **前端**: React 18, TypeScript, Tailwind CSS, React Query
- **后端**: Express, TypeScript, Axios
- **外部服务**: Ollama API, ollama.com/search

## 6. 风险评估

1. **网络依赖**: 依赖于 `https://ollama.com/search` 的可用性
2. **数据一致性**: 远程模型信息可能与实际Ollama API支持的模型存在差异
3. **性能影响**: 频繁请求远程模型信息可能影响系统性能
4. **API变更风险**: `https://ollama.com/search` 的API结构可能发生变化

## 7. 解决方案

1. **网络依赖**: 实现缓存机制，减少对远程服务的依赖
2. **数据一致性**: 在下载前验证模型是否可通过Ollama API获取
3. **性能影响**: 实现客户端和服务器端缓存
4. **API变更风险**: 实现错误处理和降级机制

## 3. 仪表盘模块详细设计

### 3.1 前端设计

#### 3.1.1 组件结构

```
DashboardPage
├── StatsCards (统计卡片区域)
│   ├── OllamaServiceCard
│   ├── InstalledModelsCard
│   ├── TotalStorageCard
│   └── RunningModelsCard
├── RecentModelsSection (最近使用模型)
└── SystemResourcesSection (系统资源监控)
    ├── CpuUsageCard
    ├── MemoryUsageCard
    ├── DiskUsageCard
    └── GpuUsageCard
```

#### 3.1.2 状态管理

- 使用 React Query 进行数据获取和缓存
- 使用 localStorage 存储最近使用模型记录
- 关键数据每 5 秒自动刷新

#### 3.1.3 最近使用模型实现

```typescript
interface RecentModel {
  name: string;
  lastUsed: number; // timestamp
  useCount: number;
}

// 记录模型使用
function recordModelUsage(modelName: string) {
  const recentModels = getRecentModels();
  const existing = recentModels.find(m => m.name === modelName);
  
  if (existing) {
    existing.lastUsed = Date.now();
    existing.useCount++;
  } else {
    recentModels.unshift({
      name: modelName,
      lastUsed: Date.now(),
      useCount: 1
    });
  }
  
  // 只保留最近10个
  localStorage.setItem('recentModels', JSON.stringify(recentModels.slice(0, 10)));
}
```

### 3.2 系统资源监控

#### 3.2.1 后端 API 端点

| 端点 | 方法 | 功能 | 响应 |
|------|------|------|------|
| `/api/metrics` | GET | 获取完整指标数据 | `{ system: SystemMetrics, ollama: OllamaMetrics, timestamp }` |
| `/api/metrics/system` | GET | 仅获取系统指标 | `SystemMetrics` |
| `/api/metrics/ollama` | GET | 仅获取 Ollama 指标 | `OllamaMetrics` |

#### 3.2.2 数据类型

```typescript
interface SystemMetrics {
  cpu: { usage: number; cores: number };
  memory: { total: number; used: number; free: number; usage: number };
  disk: { total: number; used: number; free: number; usage: number };
  disks: DiskInfo[];
  network: { bytesSent: number; bytesReceived: number };
  gpu: GpuInfo[];
  uptime: number;
}

interface DiskInfo {
  name: string;
  mount: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}

interface GpuInfo {
  name: string;
  usage: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryUsage: number;
}

interface OllamaMetrics {
  runningModels: number;
  totalModels: number;
  status: string;
  responseTime: number;
}
```

### 3.3 国际化支持

新增翻译键：
- `dashboard.cpuUsage`: CPU 使用率
- `dashboard.memoryUsage`: 内存使用率
- `dashboard.diskUsage`: 磁盘使用率
- `dashboard.gpuUsage`: GPU 使用率
- `dashboard.cores`: 核心
- `dashboard.used`: 已使用
- `dashboard.free`: 空闲
- `dashboard.total`: 总计
- `dashboard.uptime`: 运行时间
- `dashboard.lastUsed`: 最后使用
- `dashboard.useCount`: 使用次数
- `dashboard.noRecentModels`: 暂无最近使用的模型

## 4. 实现计划

### 4.1 仪表盘模块实现

1. ✅ 后端已实现 metrics 相关 API
2. 🔄 前端实现运行中模型统计
3. 🔄 前端实现最近使用模型功能
4. 🔄 前端实现系统资源监控展示
5. 🔄 更新国际化文件
6. 🔄 完整功能测试

## 5. 预期效果

### 5.1 模型下载功能
1. 用户可以浏览和搜索 `https://ollama.com/search` 上的所有模型
2. 用户可以查看模型详情和版本信息
3. 用户可以直接从界面下载模型
4. 系统性能和用户体验得到提升

### 5.2 仪表盘功能
1. 用户可以实时查看 Ollama 服务状态和运行中模型数量
2. 用户可以快速访问最近使用的模型
3. 用户可以监控系统资源使用情况（CPU、内存、GPU、磁盘）
4. 所有数据自动刷新，提供流畅的用户体验
