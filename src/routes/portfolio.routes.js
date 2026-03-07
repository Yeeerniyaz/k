import express from 'express';
import {
    getPortfolio,
    addPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem
} from '../controllers/portfolio.controller.js';

import { protect, authorize } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// ==========================================
// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (ОТКРЫТЫ ДЛЯ ВСЕХ)
// ==========================================
// Получение всех работ портфолио для витрины
router.get('/', getPortfolio);

// ==========================================
// 2. ЗАЩИЩЕННЫЕ МАРШРУТЫ (ДЛЯ АДМИНКИ)
// ==========================================
// Все запросы ниже этой строки обязаны иметь валидный JWT токен
router.use(protect);

// 🔥 SENIOR UPDATE: Теперь мы принимаем МАССИВ файлов с ключом 'images' (максимум 10 штук за раз)
router.post('/', upload.array('images', 10), addPortfolioItem);

// ==========================================
// 3. ОПЕРАЦИИ С КОНКРЕТНОЙ РАБОТОЙ
// ==========================================
router.route('/:id')
    .put(updatePortfolioItem)
    // Только администратор имеет право удалять работы
    .delete(authorize('ADMIN'), deletePortfolioItem);

export default router;