import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ИМПОРТ МАРШРУТОВ (ROUTES) ---
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import priceRoutes from './routes/price.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import financeRoutes from './routes/finance.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import pageRoutes from './routes/page.routes.js'; // 🔥 Добавлен роут для конструктора страниц (CMS)

// Импортируем наш глобальный перехватчик ошибок
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// 1. ГЛОБАЛЬНЫЕ MIDDLEWARES (SENIOR LEVEL)
// ==========================================

// 🔥 SENIOR FIX: Настраиваем Content Security Policy (CSP)
// Разрешаем загрузку картинок с Cloudinary и скриптов от Cloudflare
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Разрешаем наши внутренние скрипты и аналитику Cloudflare
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://static.cloudflareinsights.com"],
            // Разрешаем загружать картинки с Cloudinary и заглушки placehold.co
            imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://placehold.co"],
            // Разрешаем гугл-шрифты
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            // Разрешаем запросы к API Cloudinary (если нужно)
            connectSrc: ["'self'", "https://api.cloudinary.com", "https://res.cloudinary.com"],
        },
    },
}));

// CORS для связи с React
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Логгирование запросов
app.use(morgan('dev'));

// Парсинг JSON и URL-encoded данных
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы (загруженные фото портфолио)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// 2. API ENDPOINTS (МАРШРУТЫ БЭКЕНДА)
// ==========================================

// Статус API
app.get('/api/status', (req, res) => {
    res.json({ message: 'Royal Banners API is running smoothly 🚀', version: '2.0.0' });
});

// Модули ERP системы
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pages', pageRoutes); // 🔥 Подключили роуты конструктора страниц (Headless CMS)

// ==========================================
// 3. РАЗДАЧА FRONTEND (REACT CLIENT)
// ==========================================
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Если маршрут не начинается с /api, отдаем React-приложение
app.get('*path', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        return next(); // Пропускаем дальше к обработчику 404 для API
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ==========================================
// 4. ОБРАБОТКА ОШИБОК (ERROR HANDLING)
// ==========================================

// Ошибка 404 (Для неверных API маршрутов)
app.use((req, res, next) => {
    // Формируем ошибку и передаем её в глобальный обработчик
    const err = new Error(`Маршрут ${req.originalUrl} не найден на этом сервере.`);
    err.status = 'error';
    err.statusCode = 404;
    next(err);
});

// Подключаем централизованный обработчик ошибок
app.use(errorHandler);

export default app;