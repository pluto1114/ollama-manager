import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Bot, User, Code, Terminal } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function ApiTestPage() {
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: api.getModels,
  });

  const generateMutation = useMutation({
    mutationFn: api.generate,
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (data) => {
      setResponse(data);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    if (!selectedModel || !prompt) return;
    generateMutation.mutate({
      model: selectedModel,
      prompt,
      stream: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API 测试</h1>
        <p className="text-muted-foreground">测试 Ollama API 功能</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              请求
            </CardTitle>
            <CardDescription>配置并发送 API 请求</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">选择模型</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">请选择模型...</option>
                {models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">提示词</label>
              <textarea
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                placeholder="输入您的提示词..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedModel || !prompt || isGenerating}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isGenerating ? '生成中...' : '发送请求'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              响应
            </CardTitle>
            <CardDescription>查看 API 响应结果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] rounded-md border border-input bg-background p-4">
              {!response ? (
                <div className="text-muted-foreground text-center py-12">
                  发送请求后将在此显示响应
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      提示词
                    </div>
                    <p className="text-muted-foreground text-sm">{prompt}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Bot className="h-4 w-4" />
                      响应
                    </div>
                    <p className="whitespace-pre-wrap">{response.response}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Code className="h-4 w-4" />
                      原始数据
                    </div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
