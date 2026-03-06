import axios from 'axios';
import type {
  OllamaModel,
  ModelsResponse,
  PullModelRequest,
  DeleteModelRequest,
  GenerateRequest,
  ChatRequest,
  EmbeddingsRequest,
} from '../types/index.js';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import si from 'systeminformation';

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

const OLLAMA_BASE_URL = 'http://localhost:11434/api';

export class OllamaService {
  private client = axios.create({
    baseURL: OLLAMA_BASE_URL,
    timeout: 300000,
  });

  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.client.get<ModelsResponse>('/tags');
      return response.data.models;
    } catch (error) {
      throw new Error('Failed to fetch models');
    }
  }

  async pullModel(request: PullModelRequest) {
    try {
      const response = await this.client.post('/pull', request, {
        responseType: request.stream ? 'stream' : 'json',
      });
      return response;
    } catch (error) {
      throw new Error('Failed to pull model');
    }
  }

  async deleteModel(request: DeleteModelRequest) {
    try {
      const response = await this.client.delete('/delete', {
        data: request,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete model');
    }
  }

  async generate(request: GenerateRequest) {
    try {
      const response = await this.client.post('/generate', request, {
        responseType: request.stream ? 'stream' : 'json',
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to generate');
    }
  }

  async chat(request: ChatRequest) {
    try {
      const response = await this.client.post('/chat', request, {
        responseType: request.stream ? 'stream' : 'json',
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to chat');
    }
  }

  async embeddings(request: EmbeddingsRequest) {
    try {
      const response = await this.client.post('/embeddings', request);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get embeddings');
    }
  }

  async startModel(modelName: string) {
    try {
      const response = await this.client.post('/generate', {
        model: modelName,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to start model');
    }
  }

  async stopModel(modelName: string) {
    try {
      const response = await this.client.post('/generate', {
        model: modelName,
        keep_alive: 0,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to stop model');
    }
  }

  async getRunningModels() {
    try {
      const response = await this.client.get('/ps');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get running models');
    }
  }

  async getModelInfo(modelName: string) {
    try {
      const response = await this.client.post('/show', {
        model: modelName,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get model info');
    }
  }

  async getLogs() {
    try {
      console.log('Getting logs...');
      
      let logPath;
      if (os.platform() === 'win32') {
        logPath = path.join(process.env.LOCALAPPDATA || '', 'Ollama');
        console.log(`Windows log path: ${logPath}`);
      } else if (os.platform() === 'darwin') {
        logPath = path.join(os.homedir(), 'Library', 'Application Support', 'Ollama');
        console.log(`macOS log path: ${logPath}`);
      } else {
        logPath = path.join(os.homedir(), '.ollama');
        console.log(`Linux log path: ${logPath}`);
      }
      
      // 检查目录是否存在
      try {
        await fs.access(logPath);
        console.log(`Log directory exists: ${logPath}`);
      } catch (error) {
        console.error(`Log directory does not exist: ${logPath}`);
        return { logs: `Log directory not found: ${logPath}` };
      }
      
      const logFiles = await fs.readdir(logPath);
      console.log(`Found files in log directory: ${logFiles.join(', ')}`);
      
      // 优先选择server.log，这通常是Ollama服务器的主要日志文件
      let logFile: string | undefined = logFiles.find((file: string) => file === 'server.log');
      
      // 如果没有server.log，选择最新的.log文件
      if (!logFile) {
        const logFilesList = logFiles.filter((file: string) => file.endsWith('.log'));
        if (logFilesList.length > 0) {
          // 按文件名排序，假设文件名中包含数字（如app-1.log, app-2.log）
          logFilesList.sort((a, b) => {
            // 提取文件名中的数字部分进行比较
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numB - numA; // 降序排列，最新的在前面
          });
          logFile = logFilesList[0];
          console.log(`Selected latest log file: ${logFile}`);
        }
      } else {
        console.log(`Selected server.log file`);
      }
      
      if (!logFile) {
        console.log('No log files found');
        return { logs: 'No log files found' };
      }
      
      const logFilePath = path.join(logPath, logFile);
      console.log(`Reading log file: ${logFilePath}`);
      
      const content = await fs.readFile(logFilePath, 'utf8');
      console.log(`Log file size: ${content.length} bytes`);
      
      // 只返回最后1000行，避免日志过大
      const lines = content.split('\n');
      const recentLines = lines.slice(-1000).join('\n');
      
      return { 
        logs: recentLines,
        logFile: logFile
      };
    } catch (error) {
      console.error('Error getting logs:', error);
      throw new Error(`Failed to get logs: ${(error as Error).message}`);
    }
  }

  async checkOllamaStatus() {
    try {
      await this.client.get('/tags');
      return {
        connected: true,
      };
    } catch (error) {
      return {
        connected: false,
        url: OLLAMA_BASE_URL,
      };
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // 收集 CPU 信息
      const cpuData = await si.cpu();
      const cpuUsage = await si.currentLoad();
      
      // 收集内存信息
      const memoryData = await si.mem();
      
      // 收集磁盘信息
      const diskData = await si.fsSize();
      
      // 计算总体磁盘使用情况
      let totalDiskTotal = 0;
      let totalDiskUsed = 0;
      let totalDiskFree = 0;
      
      const disks: DiskInfo[] = diskData.map((disk: any) => {
        // 跳过虚拟文件系统和空磁盘
        if (disk.size === 0 || disk.mount.startsWith('\\') || disk.mount.startsWith('proc') || disk.mount.startsWith('sys')) {
          return null;
        }
        
        const diskInfo: DiskInfo = {
          name: disk.fs || disk.mount,
          mount: disk.mount,
          total: disk.size || 0,
          used: disk.used || 0,
          free: disk.available || 0,
          usage: disk.size ? (disk.used / disk.size * 100) : 0,
        };
        
        // 累加总体磁盘使用情况
        totalDiskTotal += diskInfo.total;
        totalDiskUsed += diskInfo.used;
        totalDiskFree += diskInfo.free;
        
        return diskInfo;
      }).filter((disk): disk is DiskInfo => disk !== null);
      
      // 计算总体磁盘使用率
      const totalDiskUsage = totalDiskTotal ? (totalDiskUsed / totalDiskTotal * 100) : 0;
      
      // 收集网络信息
      const networkData = await si.networkStats();
      const network = networkData[0] || { tx_bytes: 0, rx_bytes: 0 };
      
      // 收集 GPU 信息
      const gpuData = await si.graphics();
      
      const gpus: GpuInfo[] = gpuData.controllers.map((controller: any) => {
        // 过滤掉虚拟显示适配器等非实际 GPU
        if (controller.vram === 0 && !controller.memoryTotal) {
          return null;
        }
        
        return {
          name: controller.model || controller.name || 'Unknown GPU',
          usage: controller.utilizationGpu || controller.load || 0,
          memoryTotal: (controller.memoryTotal || controller.vram || 0) * 1024 * 1024, // 转换为字节
          memoryUsed: (controller.memoryUsed || 0) * 1024 * 1024, // 转换为字节
          memoryUsage: controller.utilizationMemory || (controller.memoryTotal ? (controller.memoryUsed / controller.memoryTotal * 100) : 0),
        };
      }).filter((gpu): gpu is GpuInfo => gpu !== null);
      
      return {
        cpu: {
          usage: cpuUsage.currentLoad || 0,
          cores: cpuData.cores || 0,
        },
        memory: {
          total: memoryData.total || 0,
          used: memoryData.used || 0,
          free: memoryData.free || 0,
          usage: memoryData.used / memoryData.total * 100 || 0,
        },
        disk: {
          total: totalDiskTotal,
          used: totalDiskUsed,
          free: totalDiskFree,
          usage: totalDiskUsage,
        },
        disks: disks,
        network: {
          bytesSent: network.tx_bytes || 0,
          bytesReceived: network.rx_bytes || 0,
        },
        gpu: gpus,
        uptime: os.uptime(),
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      // 返回默认值
      return {
        cpu: {
          usage: 0,
          cores: os.cpus().length,
        },
        memory: {
          total: os.totalmem(),
          used: os.totalmem() - os.freemem(),
          free: os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100),
        },
        disk: {
          total: 0,
          used: 0,
          free: 0,
          usage: 0,
        },
        disks: [],
        network: {
          bytesSent: 0,
          bytesReceived: 0,
        },
        gpu: [],
        uptime: os.uptime(),
      };
    }
  }

  async getOllamaMetrics(): Promise<OllamaMetrics> {
    try {
      const startTime = Date.now();
      
      // 检查 Ollama 服务状态
      const status = await this.checkOllamaStatus();
      
      let runningModels = 0;
      let totalModels = 0;
      
      if (status.connected) {
        // 获取运行中的模型
        const running = await this.getRunningModels();
        runningModels = running.models?.length || 0;
        
        // 获取所有模型
        const models = await this.getModels();
        totalModels = models.length;
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        runningModels,
        totalModels,
        status: status.connected ? 'connected' : 'disconnected',
        responseTime,
      };
    } catch (error) {
      console.error('Error getting Ollama metrics:', error);
      return {
        runningModels: 0,
        totalModels: 0,
        status: 'error',
        responseTime: 0,
      };
    }
  }

  async getMetrics(): Promise<MetricsResponse> {
    try {
      const [systemMetrics, ollamaMetrics] = await Promise.all([
        this.getSystemMetrics(),
        this.getOllamaMetrics(),
      ]);
      
      return {
        system: systemMetrics,
        ollama: ollamaMetrics,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw new Error('Failed to get metrics');
    }
  }
}
