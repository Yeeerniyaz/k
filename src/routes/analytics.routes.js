import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller.js';
// 🔥 ИМПОРТ: Подключаем охранников нашего API для защиты коммерческой тайны
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// МАРШРУТЫ АНАЛИТИКИ (API ENDPOINTS: /api/analytics)
// ==========================================

// Маршрут: GET /api/analytics/dashboard
// Описание: Получить агрегированную статистику (выручка, статусы, последние заказы) для главного экрана
// Доступ: СТРОГО ЗАЩИЩЕННЫЙ (Только для ADMIN и MANAGER)
router.get(
    '/dashboard',
    protect,
    restrictTo('ADMIN', 'MANAGER'),
    getDashboardStats
);

export default router;