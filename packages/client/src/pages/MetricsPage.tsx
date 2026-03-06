import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Cpu, HardDrive, Wifi, Monitor } from 'lucide-react';
import { api } from '@/services/api';
import type { MetricsResponse } from '@/types';

const MetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const data = await api.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('获取监控数据失败');
      console.error('Error fetching metrics:', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // 初始加载
    fetchMetrics(true);
    
    // 每 10 秒更新一次监控数据
    const interval = setInterval(() => fetchMetrics(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">指标监控</h1>
          <p className="text-muted-foreground">系统和 Ollama 服务的实时监控</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">加载中...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">指标监控</h1>
          <p className="text-muted-foreground">系统和 Ollama 服务的实时监控</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>错误</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error || '无法获取监控数据'}</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => fetchMetrics(true)}
            >
              重试
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">指标监控</h1>
        <p className="text-muted-foreground">系统和 Ollama 服务的实时监控</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU 监控 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.system.cpu.usage.toFixed(1)}%</div>
            <Progress value={metrics.system.cpu.usage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {metrics.system.cpu.cores} 核心
            </div>
          </CardContent>
        </Card>

        {/* 内存监控 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.system.memory.usage.toFixed(1)}%</div>
            <Progress value={metrics.system.memory.usage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {formatBytes(metrics.system.memory.used)} / {formatBytes(metrics.system.memory.total)}
            </div>
          </CardContent>
        </Card>

        {/* 磁盘监控 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">磁盘使用</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{metrics.system.disk.usage.toFixed(1)}%</div>
            <Progress value={metrics.system.disk.usage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {formatBytes(metrics.system.disk.used)} / {formatBytes(metrics.system.disk.total)}
            </div>
          </CardContent>
        </Card>

        {/* 网络监控 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">网络流量</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">发送</div>
                <div className="text-sm font-medium">{formatBytes(metrics.system.network.bytesSent)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">接收</div>
                <div className="text-sm font-medium">{formatBytes(metrics.system.network.bytesReceived)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPU 监控 */}
        {metrics.system.gpu.length > 0 && metrics.system.gpu.map((gpu, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GPU {index + 1} 使用率</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{gpu.usage.toFixed(1)}%</div>
              <Progress value={gpu.usage} className="h-2 mb-2" />
              <div className="text-xs text-muted-foreground">
                {gpu.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                内存: {formatBytes(gpu.memoryUsed)} / {formatBytes(gpu.memoryTotal)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 系统信息 */}
        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>系统资源和运行状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">运行时间</span>
              <span className="text-sm font-medium">{formatUptime(metrics.system.uptime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CPU 核心数</span>
              <span className="text-sm font-medium">{metrics.system.cpu.cores}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">总内存</span>
              <span className="text-sm font-medium">{formatBytes(metrics.system.memory.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">总磁盘空间</span>
              <span className="text-sm font-medium">{formatBytes(metrics.system.disk.total)}</span>
            </div>
            
            {/* 磁盘详情 */}
            {metrics.system.disks.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">磁盘详情</div>
                <div className="space-y-2">
                  {metrics.system.disks.map((disk, index) => (
                    <div key={index} className="border rounded-md p-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{disk.name}</span>
                        <span className="text-muted-foreground">{disk.mount}</span>
                      </div>
                      <div className="mt-1">
                        <Progress value={disk.usage} className="h-1.5" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>{formatBytes(disk.used)} / {formatBytes(disk.total)}</span>
                          <span>{disk.usage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ollama 服务监控 */}
        <Card>
          <CardHeader>
            <CardTitle>Ollama 服务</CardTitle>
            <CardDescription>Ollama 服务状态和模型信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">服务状态</span>
              <span className={`text-sm font-medium ${metrics.ollama.status === 'connected' ? 'text-green-500' : 'text-destructive'}`}>
                {metrics.ollama.status === 'connected' ? '已连接' : '未连接'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">响应时间</span>
              <span className="text-sm font-medium">{metrics.ollama.responseTime}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">总模型数</span>
              <span className="text-sm font-medium">{metrics.ollama.totalModels}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">运行中模型</span>
              <span className="text-sm font-medium">{metrics.ollama.runningModels}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        最后更新: {new Date(metrics.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default MetricsPage;