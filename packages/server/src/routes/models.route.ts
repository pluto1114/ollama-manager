import { Router } from 'express';
import { OllamaService } from '../services/ollama.service.js';
import { RemoteModelService } from '../services/remote-model.service.js';

const router = Router();
const ollamaService = new OllamaService();
const remoteModelService = new RemoteModelService();

router.get('/health', async (req, res) => {
  try {
    const status = await ollamaService.checkOllamaStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check Ollama status' });
  }
});

router.get('/models', async (req, res) => {
  try {
    const models = await ollamaService.getModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get models' });
  }
});

router.post('/models/pull', async (req, res) => {
  try {
    console.log('Pull model request:', req.body);
    const response = await ollamaService.pullModel(req.body);
    console.log('Ollama response:', response.status, response.statusText);
    
    if (req.body.stream && response.data && typeof response.data.pipe === 'function') {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      response.data.pipe(res);
      
      response.data.on('error', (err: any) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });
      
      response.data.on('end', () => {
        console.log('Stream ended');
        res.end();
      });
    } else {
      res.json(response.data);
    }
  } catch (error) {
    console.error('Pull model error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to pull model', details: String(error) });
    }
  }
});

router.delete('/models/:name', async (req, res) => {
  try {
    const result = await ollamaService.deleteModel({ name: req.params.name });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const result = await ollamaService.generate(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const result = await ollamaService.chat(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to chat' });
  }
});

router.post('/embeddings', async (req, res) => {
  try {
    const result = await ollamaService.embeddings(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get embeddings' });
  }
});

router.post('/models/start', async (req, res) => {
  try {
    const { model } = req.body;
    const result = await ollamaService.startModel(model);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start model' });
  }
});

router.post('/models/stop', async (req, res) => {
  try {
    const { model } = req.body;
    const result = await ollamaService.stopModel(model);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop model' });
  }
});

router.get('/models/running', async (req, res) => {
  try {
    const result = await ollamaService.getRunningModels();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get running models' });
  }
});

router.post('/models/info', async (req, res) => {
  try {
    const { model } = req.body;
    const result = await ollamaService.getModelInfo(model);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get model info' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const result = await ollamaService.getLogs();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const result = await ollamaService.getMetrics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

router.get('/metrics/system', async (req, res) => {
  try {
    const result = await ollamaService.getSystemMetrics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

router.get('/metrics/ollama', async (req, res) => {
  try {
    const result = await ollamaService.getOllamaMetrics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Ollama metrics' });
  }
});

// 远程模型相关端点
router.get('/models/remote', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const result = await remoteModelService.getRemoteModels(
      q as string,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get remote models' });
  }
});

router.get('/models/remote/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await remoteModelService.getRemoteModelDetail(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get remote model detail' });
  }
});

export default router;
