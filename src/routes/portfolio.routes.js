import express from 'express';
import {
    getPortfolio,
    getPortfolioItem, // 🔥 SENIOR ВОССТАНОВЛЕНИЕ: Импортируем функцию для получения одной работы
    createPortfolioItem, 
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

// 🔥 SENIOR UPDATE: ВОССТАНОВЛЕНО. Получение ОДНОЙ работы по ID.
// Этот маршрут должен быть публичным (до router.use(protect)), 
// чтобы обычные клиенты могли открыть детальную страницу проекта.
router.get('/:id', getPortfolioItem);

// ==========================================
// 2. ЗАЩИЩЕННЫЕ МАРШРУТЫ (ДЛЯ АДМИНКИ И ERP)
// ==========================================
// Все запросы ниже этой строки обязаны иметь валидный JWT токен
router.use(protect);

// 🔥 SENIOR UPDATE: Поддержка массивов файлов (до 10 штук) на локальный диск.
// Защищаем маршрут: клиенты не могут добавлять портфолио, только персонал.
router.post(
    '/',
    authorize('ADMIN', 'OWNER', 'MANAGER'),
    upload.array('images', 10),
    createPortfolioItem
);

// ==========================================
// 3. ОПЕРАЦИИ С КОНКРЕТНОЙ РАБОТОЙ (РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ)
// ==========================================
router.route('/:id')
    // 🔥 SENIOR UPDATE: Критический фикс. Добавлен upload.array в PUT-запрос.
    // Теперь при редактировании существующего кейса менеджер может заменить/дозагрузить фото.
    .put(
        authorize('ADMIN', 'OWNER', 'MANAGER'),
        upload.array('images', 10),
        updatePortfolioItem
    )

    // 🔥 SENIOR UPDATE: Права на удаление расширены для OWNER (владельца бизнеса), 
    // так как эта роль была добавлена в нашу новую Enterprise Prisma схему.
    // Менеджерам удаление запрещено во избежание саботажа.
    .delete(
        authorize('ADMIN', 'OWNER'),
        deletePortfolioItem
    );

export default router;