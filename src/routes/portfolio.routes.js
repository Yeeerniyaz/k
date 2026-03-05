import { Router } from 'express';
import { getPortfolio, addPortfolioItem } from '../controllers/portfolio.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

// 🔥 НОВЫЙ ИМПОРТ: Подключаем наш перехватчик файлов (Multer)
import { uploadPhoto } from '../middlewares/upload.middleware.js';

const router = Router();

// ==========================================
// МАРШРУТЫ ПОРТФОЛИО (API ENDPOINTS: /api/portfolio)
// ==========================================

// Маршрут: GET /api/portfolio
// Описание: Получить все работы для красивой витрины
// Доступ: ПУБЛИЧНЫЙ (Любой посетитель сайта может видеть портфолио)
router.get('/', getPortfolio);

// Маршрут: POST /api/portfolio
// Описание: Добавить новую работу (с поддержкой загрузки реальных фото)
// Доступ: ЗАЩИЩЕННЫЙ (Только авторизованные пользователи с ролью ADMIN или MANAGER)
// Как это работает:
// 1. protect -> проверяет токен
// 2. restrictTo -> проверяет права админа
// 3. uploadPhoto.single('image') -> ловит файл с ключом 'image' и кладет его в оперативную память (req.file)
// 4. addPortfolioItem -> сохраняет данные в базу и отправляет фото в Cloudinary
router.post(
    '/',
    protect,
    restrictTo('ADMIN', 'MANAGER'),
    uploadPhoto.single('image'), // Внедряем обработку файла
    addPortfolioItem
);

export default router;