import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ModelsPage } from './pages/ModelsPage';
import { ModelDetailPage } from './pages/ModelDetailPage';
import { RemoteModelsPage } from './pages/RemoteModelsPage';
import { RemoteModelDetailPage } from './pages/RemoteModelDetailPage';
import { ApiTestPage } from './pages/ApiTestPage';
import MetricsPage from './pages/MetricsPage';
import { Card, CardContent } from './components/ui/Card';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">该功能正在开发中...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="flex-1 p-8 overflow-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/models/:modelName" element={<ModelDetailPage />} />
              <Route path="/remote-models" element={<RemoteModelsPage />} />
              <Route path="/remote-models/:id" element={<RemoteModelDetailPage />} />
              <Route path="/api-test" element={<ApiTestPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route
                path="/settings"
                element={
                  <PlaceholderPage
                    title="设置"
                    description="配置应用程序和 Ollama 设置"
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
