import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';
import type { RemoteModel } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export function RemoteModelsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['remoteModels', searchQuery, page],
    queryFn: () => api.getRemoteModels(searchQuery, page, 20),
  });



  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleLoadMore = async () => {
    if (!isLoadingMore) {
      setIsLoadingMore(true);
      setPage(prevPage => prevPage + 1);
      await refetch();
      setIsLoadingMore(false);
    }
  };

  const models = data?.models || [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">无法获取远程模型</h3>
          <p className="text-muted-foreground">请检查网络连接</p>
        </div>
        <Button onClick={() => refetch()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">远程模型</h1>
          <p className="text-muted-foreground">从 Ollama 模型库浏览和下载模型</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          <Input
            placeholder="搜索模型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            搜索
          </Button>
        </div>
      </div>

      {isLoading && page === 1 ? (
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
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? '未找到匹配的模型' : '暂无远程模型'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model: RemoteModel) => (
              <RemoteModelCard
                key={model.id}
                model={model}
                onDetailsClick={(id) => navigate(`/remote-models/${id}`)}
              />
            ))}
          </div>
          {data && data.models.length === 20 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
              >
                {isLoadingMore ? '加载中...' : '加载更多'}
                {isLoadingMore ? <ChevronDown className="h-4 w-4 ml-2 animate-spin" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}



function RemoteModelCard({ model, onDetailsClick }: { model: RemoteModel; onDetailsClick: (id: string) => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onDetailsClick(model.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{model.name}</CardTitle>
            <CardDescription>
              {model.updated}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            {model.pulls.toLocaleString()} 下载
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {model.description || '暂无描述'}
        </p>
        <div className="flex flex-wrap gap-1">
          {model.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
          {model.tags.length > 3 && (
            <Badge variant="outline">+{model.tags.length - 3}</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onDetailsClick(model.id);
          }}
        >
          详情
          <ArrowUpRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
