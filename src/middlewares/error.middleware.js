import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// --- ИМПОРТЫ МАРШРУТОВ ---
import orderRoutes from './routes/order.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

// 🔥 НОВЫЙ ИМПОРТ: Наш умный перехватчик ошибок
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// ==========================================
// 1. БАЗОВЫЕ MIDDLEWARE (ЗАЩИТА И ПАРСИНГ)
// ==========================================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ==========================================
// 2. HEALTHCHECK (ПРОВЕРКА ЖИЗНЕСПОСОБНОСТИ)
// ==========================================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Royal Banners API is running smoothly',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// 3. ПОДКЛЮЧЕНИЕ РОУТОВ (API ENDPOINTS)
// ==========================================
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// ==========================================
// 4. ОБРАБОТЧИК НЕСУЩЕСТВУЮЩИХ МАРШРУТОВ (404)
// ==========================================
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Маршрут ${req.originalUrl} не найден на сервере`
    });
});

// ==========================================
// 5. ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК (ENTERPRISE GRADE)
// ==========================================
// 🔥 НОВЫЙ КОД: Передаем управление нашему error.middleware.js
app.use(errorHandler);

export default app;