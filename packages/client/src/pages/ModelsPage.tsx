import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Settings,
  Terminal,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { api } from '../services/api';
import type { OllamaModel, RunningModel } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ModelsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: models = [], isLoading, error } = useQuery({
    queryKey: ['models'],
    queryFn: api.getModels,
  });

  const { data: runningModels = { models: [] as RunningModel[] } } = useQuery({
    queryKey: ['runningModels'],
    queryFn: api.getRunningModels,
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['runningModels'] });
    },
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

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <XCircle className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">{t('common.cannotConnect')}</h3>
          <p className="text-muted-foreground">{t('common.ensureRunning')}</p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('models.title')}</h1>
          <p className="text-muted-foreground">{t('models.subtitle')}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('models.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="opacity-50">
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? t('models.searchNoMatch') : t('models.noModels')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => {
            const isRunning = runningModels.models.some((runningModel: RunningModel) => 
              runningModel.name === model.name
            );
            return (
              <ModelCard
                key={model.name}
                model={model}
                onDelete={(name) => deleteMutation.mutate(name)}
                onStart={(name) => startMutation.mutate(name)}
                onStop={(name) => stopMutation.mutate(name)}
                onLogsClick={(name) => navigate(`/models/${encodeURIComponent(name)}`)}
                onConfigClick={(name) => navigate(`/models/${encodeURIComponent(name)}?tab=config`)}
                isDeleting={deleteMutation.isPending}
                isStarting={startMutation.isPending}
                isStopping={stopMutation.isPending}
                isRunning={isRunning}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ModelCardProps {
  model: OllamaModel;
  onDelete: (name: string) => void;
  onStart: (name: string) => void;
  onStop: (name: string) => void;
  onLogsClick: (name: string) => void;
  onConfigClick: (name: string) => void;
  isDeleting: boolean;
  isStarting: boolean;
  isStopping: boolean;
  isRunning: boolean;
}

function ModelCard({ model, onDelete, onStart, onStop, onLogsClick, onConfigClick, isDeleting, isStarting, isStopping, isRunning }: ModelCardProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{model.name}</CardTitle>
            <CardDescription>
              {t('models.updatedAt')} {formatDate(model.modified_at)}
            </CardDescription>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center gap-1">
            {isRunning ? (
              <>
                <Play className="h-3 w-3" />
                {t('models.running')}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                {t('models.installed')}
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cpu className="h-4 w-4" />
            <span>{model.details.parameter_size}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span>{formatBytes(model.size)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{model.details.family}</Badge>
          <Badge variant="outline">{model.details.quantization_level}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2 pt-3">
        <div className="flex gap-2">
          {!isRunning && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStart(model.name)}
              disabled={isStarting}
            >
              <Play className="h-4 w-4 mr-1" />
              {isStarting ? t('models.starting') : t('models.start')}
            </Button>
          )}
          {isRunning && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStop(model.name)}
              disabled={isStopping}
            >
              <Pause className="h-4 w-4 mr-1" />
              {isStopping ? t('models.stopping') : t('models.stop')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onLogsClick(model.name)}>
            <Terminal className="h-4 w-4 mr-1" />
            {t('models.logs')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onConfigClick(model.name)}>
            <Settings className="h-4 w-4 mr-1" />
            {t('models.config')}
          </Button>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(model.name)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
