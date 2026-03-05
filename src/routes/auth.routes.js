import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

// ==========================================
// МАРШРУТЫ АУТЕНТИФИКАЦИИ (POST /api/auth)
// ==========================================

// Маршрут: POST /api/auth/register
// Описание: Создание нового пользователя (Админ, Менеджер или Клиент)
router.post('/register', register);

// Маршрут: POST /api/auth/login
// Описание: Вход в систему и получение JWT токена
router.post('/login', login);

export default router;