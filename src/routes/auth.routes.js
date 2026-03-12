import express from 'express';
import {
    register,
    login,
    getMe,
    logout
} from '../controllers/auth.controller.js';

// Подключаем middleware для защиты роутов
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==========================================
// 1. ОТКРЫТЫЕ МАРШРУТЫ (Не требуют токена)
// ==========================================
// Регистрация нового пользователя

// Вход в систему (генерация токена)
router.post('/login', login);


// ==========================================
// 2. ЗАКРЫТЫЕ МАРШРУТЫ (Только с токеном)
// ==========================================
// Включаем обязательную проверку токена для маршрутов ниже
router.use(protect);

// Получить данные текущего пользователя (для Дашборда и проверки сессии)
router.get('/me', getMe);

// Выход из системы (с записью в AuditLog)
router.post('/logout', logout);

router.post('/register', register);


export default router;