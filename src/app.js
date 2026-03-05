import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// Базовые middleware безопасности и парсинга
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Логирование запросов в консоль

// Тестовый роут (Healthcheck)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Royal Banners API is running 🚀' });
});

// Глобальный обработчик несуществующих роутов (404)
app.use('*path', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;