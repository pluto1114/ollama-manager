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

export interface ModelsResponse {
  models: OllamaModel[];
}

export interface PullModelRequest {
  name: string;
  stream?: boolean;
}

export interface DeleteModelRequest {
  name: string;
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
