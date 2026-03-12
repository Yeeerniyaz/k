import express from "express";
import * as pageController from "../controllers/page.controller.js";
import { protect, authorize } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js'; // 🔥 SENIOR UPDATE: Добавлена поддержка локальных картинок

const router = express.Router();

// ==========================================
// 1. ПУБЛИЧНЫЕ РОУТЫ (Доступны всем, без токена)
// ==========================================
// Фронтенд (твои компоненты React) будет стучаться сюда, чтобы отрисовать сайт
router.get("/public", pageController.getPublicBlocks);

// ==========================================
// 🛡 ЗАЩИЩЕННЫЕ РОУТЫ (MIDDLEWARES)
// ==========================================
// Включаем обязательную проверку токена авторизации для всех роутов ниже
router.use(protect);

// 🔥 SENIOR SECURITY CHECK: Ограничиваем доступ
// Page Builder — это сердце сайта (его внешний вид и SEO).
// Только создатель (OWNER) и Администратор (ADMIN) имеют право ломать и строить сайт. 
// Менеджерам тут делать нечего, их задача — продавать.
router.use(authorize('OWNER', 'ADMIN'));

// ==========================================
// 2. УПРАВЛЕНИЕ СТРАНИЦАМИ (НАВИГАЦИЯ / SEO)
// ==========================================
// Получить список страниц для меню в админке
router.get("/all", pageController.getAllPages);

// Создать новую страницу ("О нас", "Контакты")
router.post("/create", pageController.createPage);

// Обновить SEO-данные или название конкретной страницы
router.put("/update/:slug", pageController.updatePage);

// ==========================================
// 3. PAGE BUILDER: УПРАВЛЕНИЕ БЛОКАМИ
// ==========================================
// Получить все блоки для режима редактирования (включая скрытые)
router.get("/admin/blocks", pageController.getAdminBlocks);

// Сохранить новый порядок блоков (Drag & Drop)
// 🔥 SENIOR NOTE: Транзакция выполнится в контроллере
router.post("/blocks/reorder", pageController.updateBlocksOrder);

// Добавить новый блок
// 🔥 SENIOR UPDATE: Добавлено upload.single('image') 
// Теперь в блок (например, в HERO) можно локально загрузить фоновую картинку
router.post(
    "/blocks", 
    upload.single('image'), 
    pageController.createBlock
);

// Редактировать конкретный существующий блок
// 🔥 SENIOR UPDATE: Также добавлена поддержка загрузки новой картинки 
// (контроллер сам удалит старую с жесткого диска)
router.put(
    "/blocks/:id", 
    upload.single('image'), 
    pageController.updateBlock
);

// Безвозвратно удалить блок (и связанные с ним локальные картинки)
router.delete("/blocks/:id", pageController.deleteBlock);

export default router;