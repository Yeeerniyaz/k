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
import pageRoutes from './routes/page.routes.js';
import mediaRoutes from './routes/media.routes.js';
import auditRoutes from './routes/audit.routes.js';

// --- ИМПОРТ MIDDLEWARES ---
import { errorHandler } from './middlewares/error.middleware.js';
import { AppError } from './utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// 1. ГЛОБАЛЬНЫЕ MIDDLEWARES (БЕЗОПАСНОСТЬ И ЛОГИРОВАНИЕ)
// ==========================================

// Включаем CORS для связи React-фронтенда с нашим Node.js бэкендом
// 🔥 SENIOR FIX: Формируем массив и очищаем его от undefined / null
const allowedOrigins = [
    "https://ukb.yeee.kz",
    "https://admin.yeee.kz",
    "https://test.yeee.kz",
    process.env.DEV_HOST
].filter(Boolean);

app.use(cors({
    origin: ('*'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔥 SENIOR UPDATE: Настройка Helmet для локальных файлов.
// По умолчанию Helmet может блокировать загрузку картинок с чужих доменов (или даже со своего, если разные порты).
// Мы разрешаем отдавать медиа-ресурсы (Cross-Origin-Resource-Policy: cross-origin).
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Логирование HTTP-запросов в консоль (в режиме разработки)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Парсинг JSON в теле запроса. Увеличен лимит до 50MB для тяжелых настроек/текстов.
app.use(express.json({ limit: '50mb' }));
// Парсинг URL-encoded данных (например, при отправке обычных HTML-форм)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// 2. СТАТИЧЕСКИЕ ФАЙЛЫ (ЛОКАЛЬНОЕ ХРАНИЛИЩЕ) 🔥 НОВОЕ
// ==========================================
// Открываем папку "uploads" для публичного доступа. 
// Теперь, если перейти по ссылке http://ваш-сервер.com/uploads/имя-файла.jpg, 
// сервер отдаст картинку, минуя контроллеры и базы данных (экстремально быстро).
const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));


// ==========================================
// 3. ПОДКЛЮЧЕНИЕ МАРШРУТОВ API (ROUTES)
// ==========================================

// Базовые роуты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Финансы и аналитика (ERP Core)
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);

// Глобальные настройки и контент (Headless CMS Core)
app.use('/api/settings', settingsRoutes);
app.use('/api/pages', pageRoutes);

// Новые системные роуты
app.use('/api/media', mediaRoutes); // Централизованное управление загрузками
app.use('/api/audit', auditRoutes); // Журнал аудита для Владельца

// ==========================================
// 4. ОБРАБОТКА ОШИБОК И НЕСУЩЕСТВУЮЩИХ МАРШРУТОВ
// ==========================================

// Если запрос дошел до этой точки, значит ни один роут выше не сработал (Ошибка 404)
app.all('*path', (req, res, next) => {
    next(new AppError(`Маршрут ${req.originalUrl} не найден на этом сервере.`, 404));
});

// Подключаем наш мощный глобальный перехватчик ошибок (из error.middleware.js)
// Он перехватит ошибку 404 сверху или любую ошибку из базы данных Prisma
app.use(errorHandler);

export default app;