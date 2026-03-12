import express from 'express';
import {
    getPortfolio,
    createPortfolioItem, // 🔥 SENIOR FIX: Приведено в строгое соответствие с названием функции в нашем новом контроллере
    updatePortfolioItem,
    deletePortfolioItem
} from '../controllers/portfolio.controller.js';

import { protect, authorize } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// ==========================================
// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (ОТКРЫТЫ ДЛЯ ВСЕХ)
// ==========================================
// Получение всех работ портфолио для витрины (с поддержкой фильтров и пагинации)
router.get('/', getPortfolio);

// ==========================================
// 2. ЗАЩИЩЕННЫЕ МАРШРУТЫ (ДЛЯ АДМИНКИ И ERP)
// ==========================================
// Все запросы ниже этой строки обязаны иметь валидный JWT токен
router.use(protect);

// 🔥 SENIOR UPDATE: Поддержка массивов файлов (до 10 штук).
// Используем createPortfolioItem. Защищаем маршрут: клиенты не могут добавлять портфолио, только персонал.
router.post(
    '/',
    authorize('ADMIN', 'OWNER', 'MANAGER'),
    upload.array('images', 10),
    createPortfolioItem
);

// ==========================================
// 3. ОПЕРАЦИИ С КОНКРЕТНОЙ РАБОТОЙ
// ==========================================
router.route('/:id')
    // 🔥 SENIOR UPDATE: Критический фикс. Добавлен upload.array в PUT-запрос.
    // Теперь при редактировании существующего кейса менеджер может дозагрузить новые фото!
    .put(
        authorize('ADMIN', 'OWNER', 'MANAGER'),
        upload.array('images', 10),
        updatePortfolioItem
    )

    // 🔥 SENIOR UPDATE: Права на удаление расширены для OWNER (владельца бизнеса), 
    // так как эта роль была добавлена в нашу новую Prisma схему.
    .delete(
        authorize('ADMIN', 'OWNER'),
        deletePortfolioItem
    );

export default router;