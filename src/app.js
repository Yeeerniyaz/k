import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path'; // Для работы с путями папок
import { fileURLToPath } from 'url'; // Для правильного __dirname в модулях ESM

// --- ИМПОРТЫ МАРШРУТОВ API ---
import orderRoutes from './routes/order.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

import { errorHandler } from './middlewares/error.middleware.js';

// Настройка путей для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// 1. БАЗОВЫЕ MIDDLEWARE
// ==========================================
app.use(helmet({
    // Отключаем жесткий CSP, чтобы React мог грузить свои скрипты и картинки с Cloudinary
    contentSecurityPolicy: false, 
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ==========================================
// 2. HEALTHCHECK (ПРОВЕРКА ЖИЗНЕСПОСОБНОСТИ API)
// ==========================================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Royal Banners API is running smoothly'
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
// 4. ОБРАБОТЧИК ОШИБОК ДЛЯ API (404)
// ==========================================
// 🔥 СЕНЬОРСКИЙ ФИКС: Используем app.use('/api') вместо app.all('/api/*')
// Это совместимо со всеми версиями Express (включая v5)
app.use('/api', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `API маршрут ${req.originalUrl} не найден`
    });
});

// ==========================================
// 5. РАЗДАЧА ФРОНТЕНДА (REACT CLIENT)
// ==========================================
// Указываем путь к будущей папке dist
const clientBuildPath = path.join(__dirname, '../client/dist');

// Говорим Express раздавать статические файлы из этой папки
app.use(express.static(clientBuildPath));

// Для ЛЮБОГО другого запроса отдаем главный файл React — index.html
// 🔥 СЕНЬОРСКИЙ ФИКС 2: Также убираем звездочку из app.get('*') и используем app.use()
app.use((req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ==========================================
// 6. ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК (ENTERPRISE GRADE)
// ==========================================
app.use(errorHandler);

export default app;