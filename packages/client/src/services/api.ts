import axios from 'axios';
import type {
  OllamaModel,
  OllamaStatus,
  GenerateRequest,
  ChatRequest,
  EmbeddingsRequest,
  MetricsResponse,
  SystemMetrics,
  OllamaMetrics,
} from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getOllamaStatus: async (): Promise<OllamaStatus> => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  getModels: async (): Promise<OllamaModel[]> => {
    const response = await apiClient.get('/models');
    return response.data;
  },

  pullModel: async (name: string, onProgress?: (progress: any) => void) => {
    console.log('Starting download for:', name);
    
    const response = await fetch('/api/models/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        stream: true,
      }),
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Download failed:', response.status, errorText);
      throw new Error(`下载失败: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            console.log('Progress data:', data);
            if (onProgress) {
              onProgress(data);
            }
          } catch (e) {
            console.error('解析进度数据失败:', e, 'Line:', line);
          }
        }
      }
    }

    console.log('Download completed successfully');
    return { success: true };
  },

  deleteModel: async (name: string) => {
    const response = await apiClient.delete(`/models/${encodeURIComponent(name)}`);
    return response.data;
  },

  generate: async (request: GenerateRequest) => {
    const response = await apiClient.post('/generate', request);
    return response.data;
  },

  chat: async (request: ChatRequest) => {
    const response = await apiClient.post('/chat', request);
    return response.data;
  },

  embeddings: async (request: EmbeddingsRequest) => {
    const response = await apiClient.post('/embeddings', request);
    return response.data;
  },

  startModel: async (model: string) => {
    const response = await apiClient.post('/models/start', { model });
    return response.data;
  },

  stopModel: async (model: string) => {
    const response = await apiClient.post('/models/stop', { model });
    return response.data;
  },

  getRunningModels: async () => {
    const response = await apiClient.get('/models/running');
    return response.data;
  },

  getModelInfo: async (model: string) => {
    const response = await apiClient.post('/models/info', { model });
    return response.data;
  },

  getLogs: async () => {
    const response = await apiClient.get('/logs');
    return response.data;
  },

  getMetrics: async (): Promise<MetricsResponse> => {
    const response = await apiClient.get('/metrics');
    return response.data;
  },

  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const response = await apiClient.get('/metrics/system');
    return response.data;
  },

  getOllamaMetrics: async (): Promise<OllamaMetrics> => {
    const response = await apiClient.get('/metrics/ollama');
    return response.data;
  },

  // 远程模型相关API
  getRemoteModels: async (query?: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get('/models/remote', {
      params: { q: query, page, limit },
    });
    return response.data;
  },

  getRemoteModelDetail: async (id: string) => {
    const response = await apiClient.get(`/models/remote/${id}`);
    return response.data;
  },
};
