// src/routes/audit.routes.js
import express from 'express';
import { 
    getAuditLogs, 
    getAuditLogById 
} from '../controllers/audit.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==========================================
// ГЛОБАЛЬНАЯ ЗАЩИТА МАРШРУТА (MIDDLEWARE)
// ==========================================
// 1. Проверяем наличие валидного токена (пользователь в системе)
router.use(protect);

// 2. Строгий контроль доступа (RBAC). 
// Ни менеджеры, ни клиенты не должны видеть, кто, когда и что менял в базе.
// Доступ имеет только владелец бизнеса (OWNER) и системный администратор (ADMIN).
router.use(authorize('OWNER', 'ADMIN'));

// ==========================================
// ENDPOINTS (ТОЧКИ ВХОДА API)
// ==========================================
// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Здесь принципиально отсутствуют методы POST, PUT и DELETE.
// Аудит должен быть "write-only" на уровне контроллеров и "read-only" на уровне API,
// чтобы предотвратить сокрытие следов взлома или мошенничества персонала.

// GET /api/audit
// Получить список логов с поддержкой пагинации, сортировки и фильтрации 
// (например, фильтр по конкретному userId или entityType="Order")
router.route('/')
    .get(getAuditLogs);

// GET /api/audit/:id
// Получить детали конкретного лога (полезно для просмотра старого и нового состояния JSON)
router.route('/:id')
    .get(getAuditLogById);

export default router;