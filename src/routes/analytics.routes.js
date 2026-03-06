import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller.js';

// 🔥 ИСПРАВЛЕНИЕ: Используем 'authorize' вместо 'restrictTo', 
// чтобы соответствовать экспортам из auth.middleware.js
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// МАРШРУТЫ АНАЛИТИКИ (API ENDPOINTS: /api/analytics)
// ==========================================

// Маршрут: GET /api/analytics/dashboard
// Описание: Получить агрегированную статистику (выручка, статусы, последние заказы) 
// для главного экрана Dashboard.
// Доступ: СТРОГО ЗАЩИЩЕННЫЙ (Только для ADMIN и MANAGER)

router.get(
    '/dashboard',
    protect, // Проверка, что пользователь вошел в систему
    authorize('ADMIN', 'MANAGER'), // Проверка, что у пользователя есть права доступа
    getDashboardStats // Выполнение самой логики сбора данных
);

export default router;