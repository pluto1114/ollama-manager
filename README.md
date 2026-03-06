# Ollama Manager

[中文](README_CN.md)

A professional Ollama model management tool with a modern, beautiful user interface.

## Features

- ✅ **Dashboard** - Overview of Ollama service and model status
- ✅ **Local Models** - View, manage, start, stop, and delete local models
- ✅ **Remote Models** - Browse, search, and download models from ollama.com
- ✅ **Model Details** - View model configurations, parameters, and logs
- ✅ **API Testing** - Built-in API testing tool for text generation, chat, and embeddings
- 🚧 **Metrics Monitoring** - In development
- 🚧 **Settings** - In development

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **State Management**: React Query
- **Routing**: React Router
- **External Services**: Ollama API, ollama.com/search

## Quick Start

### Prerequisites

- Node.js 18+
- Ollama service running (default port 11434)

### Installation

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend development server (port 5173).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
ollama-manager/
├── packages/
│   ├── server/          # Backend service
│   │   └── src/
│   │       ├── routes/  # API routes
│   │       ├── services/# Business logic
│   │       └── types/   # TypeScript types
│   └── client/          # Frontend application
│       └── src/
│           ├── components/
│           ├── pages/
│           └── services/
├── README.md
├── README_CN.md
└── package.json
```

## Usage Guide

### Dashboard

The dashboard provides a quick overview of your Ollama service:
- Ollama service connection status
- Number of installed models
- Total storage used
- System resources (coming soon)

### Local Models

Manage your locally installed models:
- View all installed models with details (parameter size, quantization, etc.)
- Start/stop models
- View model logs and configurations
- Delete unused models

### Remote Models

Browse and download models from ollama.com:
- Search and filter models
- View model details and descriptions
- Select different versions/tags
- Download with progress tracking

### API Testing

Test Ollama's API directly from the interface:
- Text generation
- Chat completions
- Embeddings generation

## Development

### Backend API

All API endpoints are prefixed with `/api`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check Ollama service status |
| `/api/logs` | GET | Get Ollama logs |
| `/api/models` | GET | Get local models list |
| `/api/models/remote` | GET | Get remote models from ollama.com |
| `/api/models/remote/:id` | GET | Get remote model details |
| `/api/models/pull` | POST | Download a model |
| `/api/models/:name` | DELETE | Delete a model |
| `/api/models/:name/info` | GET | Get model information |
| `/api/models/start` | POST | Start a model |
| `/api/models/stop` | POST | Stop a model |
| `/api/generate` | POST | Generate text |
| `/api/chat` | POST | Chat completion |
| `/api/embeddings` | POST | Get embeddings |

### Frontend Pages

| Path | Description |
|------|-------------|
| `/` | Dashboard |
| `/models` | Local models management |
| `/models/:modelName` | Model details page |
| `/remote-models` | Remote models browser |
| `/remote-models/:id` | Remote model details |
| `/api-test` | API testing tool |
| `/metrics` | Metrics monitoring (in development) |
| `/settings` | Settings (in development) |

## License

MIT
