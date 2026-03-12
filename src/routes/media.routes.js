// src/routes/media.routes.js
import express from 'express';
import { 
    getAllMedia, 
    uploadMedia, 
    deleteMedia 
} from '../controllers/media.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

// Импортируем настроенный Multer для перехвата form-data
// Предполагается, что он экспортируется по умолчанию из твоего middleware
import upload from '../middlewares/upload.middleware.js'; 

const router = express.Router();

// ==========================================
// ГЛОБАЛЬНАЯ ЗАЩИТА МАРШРУТА (MIDDLEWARE)
// ==========================================
// 1. Проверяем, что пользователь авторизован (имеет валидный JWT токен)
router.use(protect);

// 2. Блокируем доступ обычным клиентам (B2B). 
// Медиабиблиотека — это внутренняя кухня (Headless CMS), туда ходят только сотрудники.
router.use(authorize('OWNER', 'ADMIN', 'MANAGER'));

// ==========================================
// ENDPOINTS (ТОЧКИ ВХОДА API)
// ==========================================

// GET /api/media 
// Получить список всех медиафайлов (работает с пагинацией и фильтрами из контроллера)
router.route('/')
    .get(getAllMedia);

// POST /api/media/upload
// Загрузить один файл. Multer перехватывает поле 'file', сохраняет во временную папку,
// а дальше контроллер отправляет его в Cloudinary на сжатие (WebP) и пишет в Prisma.
router.route('/upload')
    .post(upload.single('file'), uploadMedia);

// DELETE /api/media/:id
// Удалить файл из облака и стереть запись о нем из базы данных
router.route('/:id')
    .delete(deleteMedia);

export default router;