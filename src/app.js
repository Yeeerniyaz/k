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
import financeRoutes from './routes/finance.routes.js'; // Наш новый финансовый хаб

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// ГЛОБАЛЬНЫЕ MIDDLEWARES (СЕНЬОР-УРОВЕНЬ)
// ==========================================

// 1. Защита заголовков (Helmet помогает от XSS и других атак)
app.use(helmet({
    crossOriginResourcePolicy: false, // Чтобы картинки с Cloudinary/Local грузились корректно
}));

// 2. CORS (Разрешаем нашему фронтенду на React общаться с бэкендом)
app.use(cors({
    origin: '*', // В продакшене здесь будет твой домен (например, royal-banners.kz)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Логгирование запросов (Morgan - полезно для дебага в терминале)
app.use(morgan('dev'));

// 4. Парсинг данных (Чтобы понимать JSON и данные из форм)
app.use(express.json({ limit: '10mb' })); // Увеличили лимит для тяжелых JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Статические файлы (Для хранения локальных ассетов, если нужно)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// РЕГИСТРАЦИЯ МАРШРУТОВ (API ENDPOINTS)
// ==========================================

// Приветственный маршрут для проверки работоспособности API
app.get('/', (req, res) => {
    res.json({ message: 'Royal Banners API is running smoothly 🚀', version: '2.0.0' });
});

// Авторизация (Вход)
app.use('/api/auth', authRoutes);

// Управление пользователями и персоналом
app.use('/api/users', userRoutes);

// Основная работа с заказами
app.use('/api/orders', orderRoutes);

// Прайс-лист и услуги
app.use('/api/prices', priceRoutes);

// Портфолио выполненных работ
app.use('/api/portfolio', portfolioRoutes);

// Финансовый учет (Общие расходы компании)
app.use('/api/finance', financeRoutes);

// ==========================================
// ОБРАБОТКА ОШИБОК (ERROR HANDLING)
// ==========================================

/
const clientBuildPath = path.join(__dirname, '../client/dist');

// Говорим Express раздавать статические файлы из этой папки
app.use(express.static(clientBuildPath));

// Для ЛЮБОГО другого запроса отдаем главный файл React — index.html
// Также убираем звездочку из app.get('*') и используем app.use()
app.use((req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Глобальный обработчик всех ошибок (Middleware)
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('🔥 SERVER ERROR:', err);

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message || 'Внутренняя ошибка сервера',
        // В режиме разработки показываем стек ошибок для Ернияза
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;