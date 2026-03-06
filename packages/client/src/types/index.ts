export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaStatus {
  connected: boolean;
  url?: string;
}

export interface GenerateRequest {
  model: string;
  prompt: string;
  images?: string[];
  options?: Record<string, unknown>;
  stream?: boolean;
}

export interface ChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: string[];
  }>;
  options?: Record<string, unknown>;
  stream?: boolean;
}

export interface EmbeddingsRequest {
  model: string;
  prompt: string;
  options?: Record<string, unknown>;
}

export interface RunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
}

export interface RunningModelsResponse {
  models: RunningModel[];
}

// 监控数据类型
export interface GpuInfo {
  name: string;
  usage: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryUsage: number;
}

export interface DiskInfo {
  name: string;
  mount: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disks: DiskInfo[];
  network: {
    bytesSent: number;
    bytesReceived: number;
  };
  gpu: GpuInfo[];
  uptime: number;
}

export interface OllamaMetrics {
  runningModels: number;
  totalModels: number;
  status: string;
  responseTime: number;
}

export interface MetricsResponse {
  system: SystemMetrics;
  ollama: OllamaMetrics;
  timestamp: number;
}

// 远程模型相关类型
export interface RemoteModel {
  id: string;
  name: string;
  description: string;
  tags: string[];
  pulls: number;
  updated: string;
  versions?: ModelVersion[];
}

export interface ModelVersion {
  id: string;
  name: string;
  size: string;
  parameters: string;
  quantization: string;
}

export interface RemoteModelResponse {
  models: RemoteModel[];
  total: number;
  page: number;
  limit: number;
}
