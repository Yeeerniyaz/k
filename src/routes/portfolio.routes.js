import express from 'express';
import {
    getPortfolio,
    addPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem
} from '../controllers/portfolio.controller.js';

// Импортируем наши сеньорские middleware
import { protect, authorize } from '../middlewares/auth.middleware.js';

// Импортируем middleware для загрузки файлов (Multer)
// Ожидается, что у тебя есть файл upload.middleware.js, который обрабатывает form-data
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// ==========================================
// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (ОТКРЫТЫ ДЛЯ ВСЕХ)
// ==========================================
// Получение всех работ портфолио для витрины (Home.jsx и PublicPortfolio.jsx)
router.get('/', getPortfolio);

// ==========================================
// 2. ЗАЩИЩЕННЫЕ МАРШРУТЫ (ДЛЯ АДМИНКИ)
// ==========================================
// Все запросы ниже этой строки обязаны иметь валидный JWT токен
router.use(protect);

// Добавление новой работы в портфолио.
// 🔥 Смарт-цепочка: Сначала Multer ловит файл (upload.single('image')), затем срабатывает контроллер.
router.post('/', upload.single('image'), addPortfolioItem);

// ==========================================
// 3. ОПЕРАЦИИ С КОНКРЕТНОЙ РАБОТОЙ
// ==========================================
router.route('/:id')
    // Обновление информации о работе (название, категория, описание, видимость)
    .put(updatePortfolioItem)
    
    // Удаление работы из портфолио
    // 🔥 СЕНЬОРСКАЯ ФИЧА: Только администратор имеет право удалять работы
    .delete(authorize('ADMIN'), deletePortfolioItem);

export default router;