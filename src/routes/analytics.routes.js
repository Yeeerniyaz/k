import express from 'express';
import {
    getDashboardStats,
    getAnalyticsChart
} from '../controllers/analytics.controller.js';

// Подключаем Enterprise-мидлвары для защиты роутов
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==========================================
// ГЛОБАЛЬНАЯ ЗАЩИТА МАРШРУТОВ (ENTERPRISE ERP)
// ==========================================
// Аналитика — это сердце бизнеса. Никаких публичных запросов.
// Включаем обязательную проверку JWT-токена для всех роутов ниже.
router.use(protect);

// 🔥 SENIOR SECURITY: Ограничиваем доступ по ролям.
// Обычные клиенты (CLIENT) не имеют права видеть доходы компании.
// Доступ разрешен только Владельцу, Админу и Менеджерам.
router.use(authorize('ADMIN', 'OWNER', 'MANAGER'));

// ==========================================
// 1. СВОДНАЯ СТАТИСТИКА (ДЛЯ ГЛАВНОГО ДАШБОРДА)
// Endpoint: GET /api/analytics/
// ==========================================
// Возвращает общее количество заказов, доходы, конверсию.
// Старый фронтенд продолжит работать с этим эндпоинтом как и раньше.
router.get('/', getDashboardStats);

// ==========================================
// 2. ДАННЫЕ ДЛЯ ГРАФИКОВ (CHART DATA) 🔥 НОВОЕ
// Endpoint: GET /api/analytics/chart
// ==========================================
// Возвращает массив данных, сгруппированных по дням, для построения 
// красивых графиков в React (например, через Recharts или Chart.js).
// Мы вынесли это в отдельный роут, чтобы не перегружать основной запрос дашборда.
router.get('/chart', getAnalyticsChart);

export default router;