import express from 'express';
import {
    getPortfolio,
    createPortfolio, // 🔥 SENIOR FIX: Строгое соответствие названиям функций из нашего нового контроллера
    updatePortfolio,
    deletePortfolio
} from '../controllers/portfolio.controller.js';

// Подключаем наши Enterprise-мидлвары
import { protect, authorize } from '../middlewares/auth.middleware.js';
// 🔥 Подключаем наш мощный загрузчик файлов (без Cloudinary)
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// ==========================================
// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (ОТКРЫТЫ ДЛЯ FRONTEND)
// ==========================================
// Получение портфолио для витрины сайта.
// Этот маршрут доступен всем гостям без проверки токена.
router.get('/', getPortfolio);

// ==========================================
// 2. ЗАЩИЩЕННЫЕ МАРШРУТЫ (УПРАВЛЕНИЕ ИЗ АДМИНКИ)
// ==========================================
// Включаем обязательную проверку JWT-токена для всех маршрутов ниже этой строки.
router.use(protect);

// 🔥 SENIOR UPDATE: Локальная многопоточная загрузка.
// Фронтенд может отправить до 10 фотографий в поле 'images'.
// Multer проверит их, сохранит в папку /uploads и передаст в контроллер.
// Доступ только для сотрудников (менеджеры, админы, владелец).
router.post(
    '/',
    authorize('ADMIN', 'OWNER', 'MANAGER'),
    upload.array('images', 10),
    createPortfolio
);

// ==========================================
// 3. ОПЕРАЦИИ С КОНКРЕТНОЙ РАБОТОЙ (РЕДАКТИРОВАНИЕ)
// Endpoint: /api/portfolio/:id
// ==========================================
router.route('/:id')
    // Обновить информацию о работе (или заменить фотографии)
    // 🔥 СЕНЬОРСКАЯ СВЯЗКА: Если переданы новые файлы, Multer их загрузит, 
    // а наш контроллер (написанный ранее) автоматически удалит старые файлы с жесткого диска.
    .put(
        authorize('ADMIN', 'OWNER', 'MANAGER'),
        upload.array('images', 10),
        updatePortfolio
    )
    
    // Безвозвратно удалить проект из портфолио
    // (Действие запишется в AuditLog, а файлы будут стерты с сервера)
    .delete(
        authorize('ADMIN', 'OWNER', 'MANAGER'),
        deletePortfolio
    );

export default router;