import express from 'express';
import { 
    getCalculatorSettings, 
    updateCalculatorSettings,
    getSettingByKey,
    deleteSetting
} from '../controllers/settings.controller.js';

// 🔥 FIX: restrictTo орнына authorize деп импорттаймыз
import { protect, authorize } from '../middlewares/auth.middleware.js'; 

const router = express.Router();

// ==========================================
// ПУБЛИЧНЫЕ МАРШРУТЫ (Открыты для всех клиентов)
// ==========================================
// Получение конфигурации калькулятора для работы витрины
router.get('/calculator', getCalculatorSettings);

// ==========================================
// ЗАЩИЩЕННЫЕ МАРШРУТЫ (Только для Super Admin)
// ==========================================
// Включаем защиту: нужен токен и роль ADMIN
router.use(protect);
router.use(authorize('ADMIN')); // 🔥 FIX: restrictTo орнына authorize қолданамыз

// Сохранение / Обновление калькулятора
router.post('/calculator', updateCalculatorSettings);

// Универсальные CRUD-методы для любых других настроек по ключу (например: /api/settings/contacts)
router.route('/:key')
    .get(getSettingByKey)
    .delete(deleteSetting);

export default router;