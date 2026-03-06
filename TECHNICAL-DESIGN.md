# 技术设计文档

## 1. 功能概述

本设计旨在完善Ollama Manager的模型下载功能，通过集成`https://ollama.com/search`的模型信息，提供更丰富的模型选择和下载体验。

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

## 8. 预期效果

1. 用户可以浏览和搜索 `https://ollama.com/search` 上的所有模型
2. 用户可以查看模型详情和版本信息
3. 用户可以直接从界面下载模型
4. 系统性能和用户体验得到提升
