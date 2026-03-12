import express from 'express';
import {
    getAllLogs,
    getEntityHistory,
    rotateLogs
} from '../controllers/audit.controller.js';

// Подключаем Enterprise-мидлвары для защиты роутов
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==========================================
// ГЛОБАЛЬНАЯ ЗАЩИТА МАРШРУТОВ (TOP SECRET)
// ==========================================
// Журнал аудита — это самая защищенная часть системы.
// Включаем обязательную проверку JWT-токена.
router.use(protect);

// 🔥 SENIOR SECURITY: Принцип "Owner Only".
// В крупных ERP-системах только владелец бизнеса имеет доступ к истории действий персонала.
// Мы ограничиваем доступ ролями OWNER и ADMIN (для техподдержки), 
// но функции очистки логов ниже будут доступны только OWNER.
router.use(authorize('OWNER', 'ADMIN'));

// ==========================================
// 1. ПОЛУЧЕНИЕ ОБЩЕГО ЖУРНАЛА (ДЛЯ МОНИТОРИНГА)
// Endpoint: GET /api/audit/
// ==========================================
// Позволяет просматривать всю активность: входы, удаления, изменения цен.
// Поддерживает фильтры по дате, пользователю и типу действия.
router.get('/', getAllLogs);

// ==========================================
// 2. ИСТОРИЯ КОНКРЕТНОЙ СУЩНОСТИ
// Endpoint: GET /api/audit/history/:entityType/:entityId
// ==========================================
// Позволяет узнать "судьбу" конкретного заказа или пользователя.
// Пример: /api/audit/history/Order/uuid-заказа
router.get('/history/:entityType/:entityId', getEntityHistory);

// ==========================================
// 3. ОБСЛУЖИВАНИЕ БАЗЫ ДАННЫХ (MAINTENANCE)
// Endpoint: POST /api/audit/rotate
// ==========================================
// 🔥 SENIOR SECURITY UPDATE: Только Владелец (OWNER) может очищать логи.
// Это предотвращает ситуацию, когда админ удаляет записи и "заметает следы", удаляя логи об этом.
router.post('/rotate', authorize('OWNER'), rotateLogs);

export default router;