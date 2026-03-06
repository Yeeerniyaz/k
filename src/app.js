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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// 1. ГЛОБАЛЬНЫЕ MIDDLEWARES
// ==========================================
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы бэкенда (загруженные картинки)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// 2. API ROUTES (БЭКЕНД ЛОГИКАСЫ)
// ==========================================
// ВАЖНО: Все API маршруты должны идти ПЕРЕД раздачей фронтенда
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);

// Тестовый эндпоинт
app.get('/api/status', (req, res) => {
    res.json({ message: 'Royal Banners API is running smoothly 🚀', version: '2.0.0' });
});

// ==========================================
// 3. 🔥 РАЗДАЧА ФРОНТЕНДА (REACT CLIENT)
// ==========================================
// Senior-стандарт: Фронтендті тарату бөлімі
const clientBuildPath = path.join(__dirname, '../client/dist');

// Статикалық файлдарды (js, css) клиент папкасынан оқимыз
app.use(express.static(clientBuildPath));

// Кез келген басқа сұранысқа (API-ге жатпайтын) index.html-ді қайтарамыз.
// Бұл React Router-дің браузерде дұрыс жұмыс істеуі үшін қажет.
app.get('*', (req, res) => {
    // Егер сұраныс /api-мен басталса, бірақ ол маршрут табылмаса - бұл 404
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ status: 'error', message: 'API эндпоинт не найден' });
    }
    // Қалған жағдайда фронтендті береміз
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ==========================================
// 4. ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК
// ==========================================
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    console.error('🔥 SERVER ERROR:', err);

    res.status(err.statusCode).json({
        status: 'error',
        message: err.message || 'Внутренняя ошибка сервера',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;