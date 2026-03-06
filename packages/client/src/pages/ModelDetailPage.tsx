import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Terminal, Settings, Play, Pause, Trash2, Cpu, HardDrive } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { recordModelUsage } from './DashboardPage';

export function ModelDetailPage() {
  const { t } = useTranslation();
  const { modelName } = useParams<{ modelName: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'logs' | 'config'>('logs');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'config') {
      setActiveTab('config');
    }
  }, [searchParams]);

  useEffect(() => {
    if (modelName) {
      recordModelUsage(modelName);
    }
  }, [modelName]);

  if (!modelName) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Model name not found</p>
      </div>
    );
  }

  const { data: modelInfo, isLoading: infoLoading, error: infoError } = useQuery({
    queryKey: ['modelInfo', modelName],
    queryFn: () => api.getModelInfo(modelName),
  });

  const { data: runningModels = { models: [] } } = useQuery({
    queryKey: ['runningModels'],
    queryFn: api.getRunningModels,
    refetchInterval: 5000,
  });

  const { data: logs, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useQuery({
    queryKey: ['logs'],
    queryFn: api.getLogs,
    refetchInterval: 5000,
  });

  const isRunning = runningModels.models.some((model: any) => model.name === modelName);

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

  const deleteMutation = useMutation({
    mutationFn: api.deleteModel,
    onSuccess: () => {
      navigate('/models');
    },
  });

  if (infoError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">Failed to get model info</p>
        <Button onClick={() => navigate('/models')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('modelDetail.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/models')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('modelDetail.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{modelName}</h1>
          <p className="text-muted-foreground">{t('modelDetail.title')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Model Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('modelDetail.status')}</span>
              <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center gap-1">
                {isRunning ? (
                  <>
                    <Play className="h-3 w-3" />
                    {t('models.running')}
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3" />
                    {t('modelDetail.stopped')}
                  </>
                )}
              </Badge>
            </div>
            
            {infoLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            ) : modelInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span>{t('models.parameterSize')}: {modelInfo.details?.parameter_size || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>{t('models.quantizationLevel')}: {modelInfo.details?.quantization_level || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>{t('models.modelFamily')}: {modelInfo.details?.family || 'Unknown'}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {!isRunning ? (
              <Button
                onClick={() => startMutation.mutate(modelName)}
                disabled={startMutation.isPending}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {startMutation.isPending ? t('models.starting') : t('modelDetail.startModel')}
              </Button>
            ) : (
              <Button
                onClick={() => stopMutation.mutate(modelName)}
                disabled={stopMutation.isPending}
                className="w-full"
              >
                <Pause className="h-4 w-4 mr-2" />
                {stopMutation.isPending ? t('models.stopping') : t('modelDetail.stopModel')}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(modelName)}
              disabled={deleteMutation.isPending}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? t('modelDetail.deleting') : t('modelDetail.deleteModel')}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('modelDetail.details')}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('logs')}
                className={activeTab === 'logs' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Terminal className="h-4 w-4 mr-1" />
                {t('models.logs')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('config')}
                className={activeTab === 'config' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Settings className="h-4 w-4 mr-1" />
                {t('models.config')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {activeTab === 'logs' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{t('modelDetail.ollamaLogs')}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchLogs()}
                    disabled={logsLoading}
                  >
                    {t('modelDetail.refresh')}
                  </Button>
                </div>
                {logsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  </div>
                ) : logsError ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-destructive">Failed to get logs</p>
                  </div>
                ) : logs ? (
                  <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-80 font-mono text-xs">
                    {logs.logs || t('modelDetail.noLogs')}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">{t('common.loading')}</p>
                  </div>
                )}
              </div>
            ) : (
              infoLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                </div>
              ) : modelInfo ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">{t('modelDetail.modelfile')}</h3>
                    <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-60">
                      {modelInfo.modelfile || t('modelDetail.no')}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">{t('modelDetail.parameters')}</h3>
                    <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-60">
                      {modelInfo.parameters || t('modelDetail.no')}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
