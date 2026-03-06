import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import modelsRoute from './routes/models.route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', modelsRoute);

const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Ollama Manager Server is running on http://localhost:${PORT}`);
});
