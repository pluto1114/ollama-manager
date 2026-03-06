import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  Box, HardDrive, Activity, CheckCircle2, XCircle, Zap, Cpu, MemoryStick, 
  Gauge, Clock, Play, Pause, Trash2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { OllamaModel, RunningModel } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';

interface RecentModel {
  name: string;
  lastUsed: number;
  useCount: number;
}

function getRecentModels(): RecentModel[] {
  try {
    const stored = localStorage.getItem('recentModels');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentModels(models: RecentModel[]) {
  localStorage.setItem('recentModels', JSON.stringify(models.slice(0, 10)));
}

export function recordModelUsage(modelName: string) {
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
  
  saveRecentModels(recentModels);
}

function removeRecentModel(modelName: string) {
  const recentModels = getRecentModels().filter(m => m.name !== modelName);
  saveRecentModels(recentModels);
}

function clearAllRecentModels() {
  localStorage.removeItem('recentModels');
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function formatRelativeTime(timestamp: number, t: any) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) {
    return `${days} ${t('dashboard.daysAgo') || 'days ago'}`;
  } else if (hours > 0) {
    return `${hours} ${t('dashboard.hoursAgo') || 'hours ago'}`;
  } else if (minutes > 0) {
    return `${minutes} ${t('dashboard.minutesAgo') || 'minutes ago'}`;
  } else {
    return t('dashboard.justNow') || 'just now';
  }
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: api.getModels,
  });

  const { data: ollamaStatus } = useQuery({
    queryKey: ['ollamaStatus'],
    queryFn: api.getOllamaStatus,
    refetchInterval: 5000,
  });

  const { data: runningModelsData = { models: [] as RunningModel[] } } = useQuery({
    queryKey: ['runningModels'],
    queryFn: api.getRunningModels,
    refetchInterval: 5000,
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: api.getMetrics,
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: api.startModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runningModels'] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: api.stopModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runningModels'] });
    },
  });

  const totalSize = models.reduce((acc, model) => acc + model.size, 0);
  const runningModelsCount = runningModelsData?.models?.length || 0;

  const handleModelClick = (modelName: string) => {
    recordModelUsage(modelName);
    navigate(`/models/${encodeURIComponent(modelName)}`);
  };

  const handleRemoveRecent = (e: React.MouseEvent, modelName: string) => {
    e.stopPropagation();
    removeRecentModel(modelName);
  };

  const handleClearAllRecent = () => {
    clearAllRecentModels();
  };

  const handleStartModel = (e: React.MouseEvent, modelName: string) => {
    e.stopPropagation();
    recordModelUsage(modelName);
    startMutation.mutate(modelName);
  };

  const handleStopModel = (e: React.MouseEvent, modelName: string) => {
    e.stopPropagation();
    stopMutation.mutate(modelName);
  };

  const getModelInfo = (modelName: string): OllamaModel | undefined => {
    return models.find(m => m.name === modelName);
  };

  const isModelRunning = (modelName: string): boolean => {
    return runningModelsData.models.some((m: RunningModel) => m.name === modelName);
  };

  const getCombinedRecentModels = (): RecentModel[] => {
    const storedRecent = getRecentModels();
    const runningModelNames = runningModelsData.models.map((m: RunningModel) => m.name);
    
    const combinedMap = new Map<string, RecentModel>();
    
    storedRecent.forEach(model => {
      combinedMap.set(model.name, model);
    });
    
    runningModelNames.forEach((name: string) => {
      if (!combinedMap.has(name)) {
        combinedMap.set(name, {
          name,
          lastUsed: Date.now(),
          useCount: 0
        });
      }
    });
    
    const combined = Array.from(combinedMap.values());
    combined.sort((a, b) => {
      const aRunning = runningModelNames.includes(a.name);
      const bRunning = runningModelNames.includes(b.name);
      
      if (aRunning && !bRunning) return -1;
      if (!aRunning && bRunning) return 1;
      
      return b.lastUsed - a.lastUsed;
    });
    
    return combined.slice(0, 10);
  };

  const combinedRecentModels = getCombinedRecentModels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.ollamaService')}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {ollamaStatus?.connected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    {t('dashboard.connected')}
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <Badge variant="outline" className="text-destructive border-destructive">
                    {t('dashboard.disconnected')}
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.installedModels')}</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modelsLoading ? '...' : models.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalStorage')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modelsLoading ? '...' : formatBytes(totalSize)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.runningModels')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningModelsCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recentModels')}</CardTitle>
              <CardDescription>{t('dashboard.recentModelsDesc')}</CardDescription>
            </div>
            {combinedRecentModels.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAllRecent}
                className="h-8 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t('dashboard.clearAll') || 'Clear All'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {combinedRecentModels.length > 0 ? (
              <div className="space-y-3">
                {combinedRecentModels.map((recentModel) => {
                  const modelInfo = getModelInfo(recentModel.name);
                  const isRunning = isModelRunning(recentModel.name);
                  const isInstalled = !!modelInfo;
                  
                  return (
                    <div
                      key={recentModel.name}
                      className={`p-4 rounded-lg border transition-all ${
                        isInstalled 
                          ? 'hover:bg-muted/50 cursor-pointer' 
                          : 'opacity-60 bg-muted/30'
                      }`}
                      onClick={() => isInstalled && handleModelClick(recentModel.name)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`mt-0.5 p-2 rounded-lg ${isRunning ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-muted'}`}>
                            {isRunning ? (
                              <Activity className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{recentModel.name}</p>
                              {isRunning && (
                                <Badge variant="default" className="text-xs">
                                  {t('models.running')}
                                </Badge>
                              )}
                              {!isInstalled && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('dashboard.notInstalled') || 'Not Installed'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatRelativeTime(recentModel.lastUsed, t)}</span>
                              <span>·</span>
                              <span>{recentModel.useCount} {t('dashboard.timesUsed') || 'times used'}</span>
                              {modelInfo && (
                                <>
                                  <span>·</span>
                                  <span>{modelInfo.details.parameter_size}</span>
                                  <span>·</span>
                                  <span>{formatBytes(modelInfo.size)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isInstalled && (
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {isRunning ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={(e) => handleStopModel(e, recentModel.name)}
                                disabled={stopMutation.isPending}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                {t('models.stop')}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={(e) => handleStartModel(e, recentModel.name)}
                                disabled={startMutation.isPending}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                {t('models.start')}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => handleRemoveRecent(e, recentModel.name)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <div>
                    <p className="font-medium">{t('dashboard.noRecentModels') || t('dashboard.noData')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('dashboard.noRecentModelsHint') || 'Models you use will appear here'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.systemResources')}</CardTitle>
            <CardDescription>{t('dashboard.systemResourcesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span>{t('dashboard.cpuUsage') || 'CPU'}</span>
                    </div>
                    <span className="font-medium">
                      {metrics.system.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.system.cpu.usage} />
                  <p className="text-xs text-muted-foreground">
                    {metrics.system.cpu.cores} {t('dashboard.cores') || 'cores'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-4 w-4" />
                      <span>{t('dashboard.memoryUsage') || 'Memory'}</span>
                    </div>
                    <span className="font-medium">
                      {metrics.system.memory.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.system.memory.usage} />
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(metrics.system.memory.used)} / {formatBytes(metrics.system.memory.total)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>{t('dashboard.diskUsage') || 'Disk'}</span>
                    </div>
                    <span className="font-medium">
                      {metrics.system.disk.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metrics.system.disk.usage} />
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(metrics.system.disk.used)} / {formatBytes(metrics.system.disk.total)}
                  </p>
                </div>

                {metrics.system.gpu.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        <span>{t('dashboard.gpuUsage') || 'GPU'}</span>
                      </div>
                      <span className="font-medium">
                        {metrics.system.gpu[0].usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metrics.system.gpu[0].usage} />
                    <p className="text-xs text-muted-foreground">
                      {metrics.system.gpu[0].name}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{t('dashboard.uptime') || 'Uptime'}: {formatUptime(metrics.system.uptime)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                {t('dashboard.resourceMonitoring')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
