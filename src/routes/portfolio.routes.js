import { Router } from 'express';
import { getPortfolio, addPortfolioItem } from '../controllers/portfolio.controller.js';
// 🔥 НОВЫЙ ИМПОРТ: Подключаем охранников нашего API
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// МАРШРУТЫ ПОРТФОЛИО (API ENDPOINTS: /api/portfolio)
// ==========================================

// Маршрут: GET /api/portfolio
// Описание: Получить все работы для красивой витрины
// Доступ: ПУБЛИЧНЫЙ (Любой посетитель сайта может видеть портфолио)
router.get('/', getPortfolio);

// Маршрут: POST /api/portfolio
// Описание: Добавить новую работу (вызовешь это из админки)
// Доступ: ЗАЩИЩЕННЫЙ (Только авторизованные пользователи с ролью ADMIN или MANAGER)
// Как это работает: Сначала protect проверяет токен, затем restrictTo проверяет права, и только потом срабатывает addPortfolioItem
router.post('/', protect, restrictTo('ADMIN', 'MANAGER'), addPortfolioItem);

export default router;