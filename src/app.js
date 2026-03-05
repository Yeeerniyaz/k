import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import orderRoutes from './routes/order.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';

const app = express();

// Базовые Middleware (твои старые + защита от хакеров helmet)
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Твой старый Healthcheck роут (без изменений)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Royal Banners API is running smoothly',
        timestamp: new Date().toISOString()
    });
});

// --- ПОДКЛЮЧЕНИЕ РОУТОВ ---
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes); // Наше новое портфолио!

// Твой старый глобальный обработчик 404
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Маршрут ${req.originalUrl} не найден на сервере`
    });
});

// Твой старый глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Что-то пошло не так на сервере!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

export default app;