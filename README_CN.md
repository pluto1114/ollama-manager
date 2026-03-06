# Ollama Manager

[English](README.md)

一个专业的 Ollama 模型管理工具，提供现代化、美观的用户界面。

## 功能特性

- ✅ **仪表盘** - Ollama 服务和模型状态概览
- ✅ **本地模型** - 查看、管理、启动、停止和删除本地模型
- ✅ **远程模型** - 从 ollama.com 浏览、搜索和下载模型
- ✅ **模型详情** - 查看模型配置、参数和日志
- ✅ **API 测试** - 内置 API 测试工具，支持文本生成、对话和向量嵌入
- 🚧 **指标监控** - 开发中
- 🚧 **设置** - 开发中

## 技术栈

- **前端**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **状态管理**: React Query
- **路由**: React Router
- **外部服务**: Ollama API, ollama.com/search

## 快速开始

### 前置要求

- Node.js 18+
- Ollama 服务正在运行 (默认端口 11434)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这将同时启动后端服务器 (端口 3001) 和前端开发服务器 (端口 5173)。

### 生产构建

```bash
npm run build
npm start
```

## 项目结构

```
ollama-manager/
├── packages/
│   ├── server/          # 后端服务
│   │   └── src/
│   │       ├── routes/  # API 路由
│   │       ├── services/# 业务逻辑
│   │       └── types/   # TypeScript 类型
│   └── client/          # 前端应用
│       └── src/
│           ├── components/
│           ├── pages/
│           └── services/
├── README.md
├── README_CN.md
└── package.json
```

## 使用指南

### 仪表盘

仪表盘提供 Ollama 服务的快速概览：
- Ollama 服务连接状态
- 已安装模型数量
- 总存储空间使用
- 系统资源（即将推出）

### 本地模型

管理本地已安装的模型：
- 查看所有已安装模型及其详细信息（参数大小、量化级别等）
- 启动/停止模型
- 查看模型日志和配置
- 删除未使用的模型

### 远程模型

从 ollama.com 浏览和下载模型：
- 搜索和筛选模型
- 查看模型详情和描述
- 选择不同的版本/标签
- 带进度跟踪的下载功能

### API 测试

直接在界面中测试 Ollama 的 API：
- 文本生成
- 对话补全
- 向量嵌入生成

## 开发说明

### 后端 API

所有 API 端点都以 `/api` 开头：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 检查 Ollama 服务状态 |
| `/api/logs` | GET | 获取 Ollama 日志 |
| `/api/models` | GET | 获取本地模型列表 |
| `/api/models/remote` | GET | 从 ollama.com 获取远程模型 |
| `/api/models/remote/:id` | GET | 获取远程模型详情 |
| `/api/models/pull` | POST | 下载模型 |
| `/api/models/:name` | DELETE | 删除模型 |
| `/api/models/:name/info` | GET | 获取模型信息 |
| `/api/models/start` | POST | 启动模型 |
| `/api/models/stop` | POST | 停止模型 |
| `/api/generate` | POST | 生成文本 |
| `/api/chat` | POST | 对话补全 |
| `/api/embeddings` | POST | 获取向量嵌入 |

### 前端页面

| 路径 | 描述 |
|------|------|
| `/` | 仪表盘 |
| `/models` | 本地模型管理 |
| `/models/:modelName` | 模型详情页面 |
| `/remote-models` | 远程模型浏览器 |
| `/remote-models/:id` | 远程模型详情 |
| `/api-test` | API 测试工具 |
| `/metrics` | 指标监控（开发中） |
| `/settings` | 设置（开发中） |

## 许可证

MIT
