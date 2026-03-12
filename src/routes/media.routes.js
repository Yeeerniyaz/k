import express from 'express';
import {
    getAllMedia,
    uploadMedia,
    deleteMedia
} from '../controllers/media.controller.js';

// Подключаем Enterprise-мидлвары для защиты роутов
import { protect, authorize } from '../middlewares/auth.middleware.js';

// 🔥 SENIOR IMPORT: Подключаем наш обновленный Multer, который поддерживает 
// локальное сохранение картинок, PDF и видео (до 50 МБ)
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// ==========================================
// ГЛОБАЛЬНАЯ ЗАЩИТА МАРШРУТОВ (ENTERPRISE ERP)
// ==========================================
// Медиабиблиотека — это административный раздел. 
// Включаем обязательную проверку JWT-токена для всех запросов.
router.use(protect);

// 🔥 SENIOR SECURITY: Доступ только для сотрудников компании.
// Обычным клиентам (CLIENT) или гостям запрещено просматривать 
// внутренние файлы, прайсы и коммерческие предложения.
router.use(authorize('OWNER', 'ADMIN', 'MANAGER'));

// ==========================================
// 1. ПОЛУЧЕНИЕ И ЗАГРУЗКА ФАЙЛОВ
// Endpoint: /api/media
// ==========================================
router.route('/')
    // Получить список всех файлов из папки /uploads (Для отображения галереи в админке)
    .get(getAllMedia)

    // Загрузить новые файлы на локальный диск сервера
    // 🔥 SENIOR FEATURE: Используем upload.array('files', 20), чтобы 
    // менеджер мог выделить мышкой сразу до 20 фотографий/документов и загрузить их за 1 клик.
    // Multer сам проверит их форматы и сохранит в папку /uploads.
    .post(upload.array('files', 20), uploadMedia);

// ==========================================
// 2. УДАЛЕНИЕ КОНКРЕТНОГО ФАЙЛА
// Endpoint: /api/media/:fileName
// ==========================================
// Удаляет файл физически с диска (Garbage Collection)
// Доступ разрешен всем сотрудникам (Менеджерам нужно удалять старые макеты)
router.delete('/:fileName', deleteMedia);

export default router;