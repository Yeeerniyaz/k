import express from "express";
import * as pageController from "../controllers/page.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ==========================================
// ПУБЛИЧНЫЕ РОУТЫ (Доступны всем, без токена)
// ==========================================
// Фронтенд (Home.jsx) будет стучаться сюда, чтобы отрисовать сайт
router.get("/public", pageController.getPublicBlocks);

// ==========================================
// ЗАЩИЩЕННЫЕ РОУТЫ (Только для OWNER)
// ==========================================
// Включаем проверку токена для всех роутов ниже
router.use(protect);

// 🔥 SENIOR SECURITY CHECK: Ограничиваем доступ
// Только создатель (OWNER) имеет право ломать и строить архитектуру страницы
router.use(restrictTo("OWNER"));

// CRUD для блоков
router
    .route("/")
    .get(pageController.getAllBlocks)  // Админка получает все блоки (включая скрытые)
    .post(pageController.createBlock); // Создание нового компонента

// Специальный роут для сохранения порядка компонентов (Drag & Drop)
router.post("/reorder", pageController.reorderBlocks);

// Операции с конкретным блоком по ID
router
    .route("/:id")
    .patch(pageController.updateBlock) // Обновление контента (JSON), статуса или порядка
    .delete(pageController.deleteBlock); // Полное удаление из базы

export default router;