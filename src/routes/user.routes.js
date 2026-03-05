import { Router } from 'express';
import { getMe, getAllUsers } from '../controllers/user.controller.js';
// 🔥 ИМПОРТ: Подключаем охранников нашего API
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// МАРШРУТЫ ПОЛЬЗОВАТЕЛЕЙ (API ENDPOINTS: /api/users)
// ==========================================

// 1. Маршрут: GET /api/users/me
// Описание: Получить профиль текущего пользователя (для отображения в админке/личном кабинете)
// Доступ: ЗАЩИЩЕННЫЙ (Доступно всем, у кого есть валидный токен)
router.get('/me', protect, getMe);

// 2. Маршрут: GET /api/users
// Описание: Получить список всех пользователей системы
// Доступ: СТРОГО ЗАЩИЩЕННЫЙ (Только для роли ADMIN)
router.get('/', protect, restrictTo('ADMIN'), getAllUsers);

export default router;