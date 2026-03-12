import express from "express";
import * as pageController from "../controllers/page.controller.js";
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==========================================
// 1. ПУБЛИЧНЫЕ РОУТЫ (Доступны всем, без токена)
// ==========================================
// Фронтенд (Home.jsx и новые динамические страницы) будет стучаться сюда, чтобы отрисовать сайт
router.get("/public", pageController.getPublicBlocks);

// ==========================================
// 🛡 ЗАЩИЩЕННЫЕ РОУТЫ (MIDDLEWARES)
// ==========================================
// Включаем проверку токена для всех роутов ниже
router.use(protect);

// 🔥 SENIOR SECURITY CHECK: Ограничиваем доступ
// Только создатель (OWNER) имеет право ломать и строить архитектуру страницы
router.use(authorize("OWNER"));

// ==========================================
// 2. УПРАВЛЕНИЕ ДИНАМИЧЕСКИМИ СТРАНИЦАМИ (CMS PAGES) 🔥 НОВОЕ
// ==========================================
// Роуты для создания и настройки самих страниц (URL slug, Meta-теги, статус публикации)
router
    .route("/manage")
    .get(pageController.getAllPages)      // Получить список всех созданных страниц
    .post(pageController.createPage);     // Создать новую страницу (например: /promo-2024)

router
    .route("/manage/:id")
    .patch(pageController.updatePage)     // Обновить SEO или URL страницы
    .delete(pageController.deletePage);   // Удалить страницу (каскадно удалит и её блоки)

// ==========================================
// 3. УПРАВЛЕНИЕ КОНТЕНТОМ (PAGE BLOCKS) 🔥 ОБНОВЛЕНО
// ==========================================
// CRUD для блоков (Сохранена 100% обратная совместимость со старым кодом)
router
    .route("/")
    .get(pageController.getAllBlocks)     // Админка получает все блоки (включая скрытые)
    .post(pageController.createBlock);    // Создание нового компонента (с поддержкой стилей и мобильной видимости)

// Специальный роут для сохранения порядка компонентов (Drag & Drop)
router.post("/reorder", pageController.reorderBlocks);

// ==========================================
// ⚠️ DYNAMIC ID ROUTE (ДОЛЖЕН БЫТЬ В САМОМ НИЗУ)
// ==========================================
// Операции с конкретным блоком по ID. 
// Архитектурное правило: роуты с параметрами (/:id) всегда ставятся последними, 
// чтобы не перекрыть статические маршруты вроде /reorder или /manage
router
    .route("/:id")
    .patch(pageController.updateBlock)    // Обновление контента (JSON), статуса, видимости или порядка
    .delete(pageController.deleteBlock);  // Полное удаление блока из базы

export default router;