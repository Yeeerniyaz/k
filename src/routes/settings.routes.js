import express from 'express';
import { 
    getCalculatorSettings, 
    updateCalculatorSettings,
    getAllSettings,
    getSettingByKey,
    upsertSettingByKey
} from '../controllers/settings.controller.js';

import { protect, authorize } from '../middlewares/auth.middleware.js'; 

const router = express.Router();

// ==========================================
// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (ОТКРЫТЫ ДЛЯ FRONTEND)
// ==========================================

// 🔥 ИЗОЛИРОВАННАЯ ЗОНА КАЛЬКУЛЯТОРА
// Фронтенд калькулятора стучится сюда, чтобы получить цены и формулы.
// Этот маршрут полностью отрезан от остальных настроек.
router.get('/calculator', getCalculatorSettings);

// ЗОНА HEADLESS CMS (ЧТЕНИЕ)
// Фронтенд стучится сюда, чтобы получить любые другие данные по ключу 
// (например: /api/settings/cms/site_theme или /api/settings/cms/contacts)
router.get('/cms/:key', getSettingByKey);

// ==========================================
// 2. ЗАЩИЩЕННЫЕ МАРШРУТЫ (УПРАВЛЕНИЕ ИЗ АДМИНКИ)
// ==========================================
// Включаем обязательную проверку токена для всех роутов ниже
router.use(protect);

// 🔥 ИЗОЛИРОВАННАЯ ЗОНА КАЛЬКУЛЯТОРА (ОБНОВЛЕНИЕ)
// Права на изменение цен и формул есть ТОЛЬКО у владельца и админа. 
// Менеджерам сюда доступ закрыт (защита от махинаций с ценами).
router.put(
    '/calculator', 
    authorize('ADMIN', 'OWNER'), 
    updateCalculatorSettings
);

// ==========================================
// 3. УПРАВЛЕНИЕ ДВИЖКОМ HEADLESS CMS (ДЛЯ АДМИНКИ)
// ==========================================

// Получить абсолютно все настройки списком (для дашборда разработчика/админа)
router.get(
    '/', 
    authorize('ADMIN', 'OWNER', 'MANAGER'), 
    getAllSettings
);

// Создать или обновить любую кастомную настройку (цвета, тексты, SEO)
router.put(
    '/cms/:key', 
    authorize('ADMIN', 'OWNER'), 
    upsertSettingByKey
);

export default router;