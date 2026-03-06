import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Card, CardContent } from '../components/ui/Card';

type DownloadStatus = 'idle' | 'downloading' | 'success' | 'error';

interface DownloadProgress {
  status: string;
  completed?: number;
  total?: number;
  digest?: string;
}

export function RemoteModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showAlreadyInstalled, setShowAlreadyInstalled] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 获取本地模型列表
  const { data: localModels = [] } = useQuery({
    queryKey: ['models'],
    queryFn: api.getModels,
  });

  // 模拟模型版本数据
  const modelVersions = [
    { name: 'qwen2.5:latest', size: '4.7GB', context: '32K', input: 'Text' },
    { name: 'qwen2.5:0.5b', size: '398MB', context: '32K', input: 'Text' },
    { name: 'qwen2.5:1.5b', size: '986MB', context: '32K', input: 'Text' },
    { name: 'qwen2.5:3b', size: '1.9GB', context: '32K', input: 'Text' },
    { name: 'qwen2.5:7b', size: '4.7GB', context: '32K', input: 'Text' },
    { name: 'qwen2.5:14b', size: '9.0GB', context: '32K', input: 'Text' },
    { name: 'qwen2.5:32b', size: '20GB', context: '32K', input: 'Text' },
    { name: 'qwen2.5:72b', size: '47GB', context: '32K', input: 'Text' },
  ];

  const { data: model, isLoading, error } = useQuery({
    queryKey: ['remoteModel', id],
    queryFn: () => api.getRemoteModelDetail(id!),
    enabled: !!id,
  });

  // 初始化选中的版本
  useEffect(() => {
    if (model) {
      setSelectedVersion(model.name);
    }
  }, [model]);

  // 清理EventSource
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleDownload = async () => {
    if (!selectedVersion) return;

    // 检查模型是否已经安装
    const isAlreadyInstalled = localModels.some((model: any) => model.name === selectedVersion);
    
    if (isAlreadyInstalled) {
      setShowAlreadyInstalled(true);
      // 3秒后自动隐藏提示
      setTimeout(() => {
        setShowAlreadyInstalled(false);
      }, 3000);
      return;
    }

    setDownloadStatus('downloading');
    setDownloadProgress(null);
    setDownloadError(null);

    try {
      await api.pullModel(selectedVersion, (progressData: any) => {
        console.log('Download progress:', progressData);
        
        setDownloadProgress({
          status: progressData.status || 'downloading',
          completed: progressData.completed,
          total: progressData.total,
          digest: progressData.digest,
        });
        
        if (progressData.status === 'success') {
          setDownloadStatus('success');
          queryClient.invalidateQueries({ queryKey: ['models'] });
        }
      });
      
      if (downloadStatus !== 'error') {
        setDownloadStatus('success');
        queryClient.invalidateQueries({ queryKey: ['models'] });
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(err instanceof Error ? err.message : '下载失败');
      setDownloadStatus('error');
    }
  };

  const progressPercent = downloadProgress?.completed && downloadProgress?.total 
    ? Math.min(100, Math.round((downloadProgress.completed / downloadProgress.total) * 100))
    : 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">无法获取模型详情</h3>
          <p className="text-muted-foreground">请检查网络连接</p>
        </div>
        <Button onClick={() => navigate('/remote-models')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-80 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">模型不存在</h3>
          <p className="text-muted-foreground">请检查模型ID是否正确</p>
        </div>
        <Button onClick={() => navigate('/remote-models')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/remote-models')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回远程模型列表
        </Button>
      </div>

      {/* 模型已安装提示 */}
      {showAlreadyInstalled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 animate-pulse">
          <Info className="h-5 w-5 text-blue-500" />
          <div>
            <p className="font-medium text-blue-800">模型已安装</p>
            <p className="text-sm text-blue-600">{selectedVersion} 已经在您的本地模型库中了</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{model.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{model.updated}</span>
            <span>•</span>
            <span>{model.pulls.toLocaleString()} 次下载</span>
          </div>
        </div>

        <div className="prose max-w-none">
          <p className="text-lg">{model.description || '暂无描述'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {model.tags.map((tag: string) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>

        {downloadStatus !== 'idle' && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {downloadStatus === 'downloading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {downloadStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {downloadStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  <span className="font-medium">
                    {downloadStatus === 'downloading' && '正在下载模型...'}
                    {downloadStatus === 'success' && '模型下载成功！'}
                    {downloadStatus === 'error' && '下载失败'}
                  </span>
                </div>

                {downloadProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{downloadProgress.status}</span>
                      {downloadProgress.completed && downloadProgress.total && (
                        <span>{progressPercent}%</span>
                      )}
                    </div>
                    <Progress value={progressPercent} />
                  </div>
                )}

                {downloadError && (
                  <p className="text-sm text-red-500">{downloadError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-4">Models</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="border p-3 text-left">Name</th>
                  <th className="border p-3 text-left">Size</th>
                  <th className="border p-3 text-left">Context</th>
                  <th className="border p-3 text-left">Input</th>
                </tr>
              </thead>
              <tbody>
                {modelVersions.map((version) => {
                  const isInstalled = localModels.some((model: any) => model.name === version.name);
                  return (
                    <tr 
                      key={version.name} 
                      className={`cursor-pointer hover:bg-muted ${selectedVersion === version.name ? 'bg-muted/50' : ''} ${isInstalled ? 'bg-green-50/50' : ''}`}
                      onClick={() => downloadStatus === 'idle' && setSelectedVersion(version.name)}
                    >
                      <td className="border p-3">
                        <div className="flex items-center gap-2">
                          {version.name}
                          {version.name.includes('latest') && (
                            <Badge variant="secondary" className="ml-2">latest</Badge>
                          )}
                          {isInstalled && (
                            <Badge variant="default" className="ml-2 bg-green-600">已安装</Badge>
                          )}
                        </div>
                      </td>
                      <td className="border p-3">{version.size}</td>
                      <td className="border p-3">{version.context}</td>
                      <td className="border p-3">{version.input}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleDownload}
            disabled={downloadStatus === 'downloading' || !selectedVersion}
            className="w-full text-lg py-6"
          >
            <Download className="h-5 w-5 mr-2" />
            {downloadStatus === 'downloading' && '正在下载...'}
            {downloadStatus === 'success' && '下载成功！'}
            {downloadStatus === 'error' && '重试下载'}
            {downloadStatus === 'idle' && `下载 ${selectedVersion}`}
          </Button>
        </div>

        {model.versions && model.versions.length > 0 && (
          <div className="space-y-4 pt-8">
            <h2 className="text-2xl font-bold">版本</h2>
            <div className="space-y-4">
              {model.versions.map((version: any) => (
                <div key={version.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">{version.name}</h3>
                    <Badge variant="secondary">{version.quantization}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-muted-foreground">
                    <div>参数: {version.parameters}</div>
                    <div>大小: {version.size}</div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedVersion(`${model.name}:${version.name}`);
                      handleDownload();
                    }}
                    disabled={downloadStatus === 'downloading'}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载此版本
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
