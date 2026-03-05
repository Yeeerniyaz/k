import { Router } from 'express';
// Импортируем все три функции из контроллера
import { createOrder, getAllOrders, updateOrderStatus } from '../controllers/order.controller.js';
// Импортируем наших "охранников"
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// МАРШРУТЫ ЗАКАЗОВ (API ENDPOINTS: /api/orders)
// ==========================================

// 1. Маршрут: POST /api/orders
// Описание: Создать новый заказ (с калькулятора на сайте)
// Доступ: ПУБЛИЧНЫЙ (Любой посетитель может оставить заявку без регистрации)
router.post('/', createOrder);

// 2. Маршрут: GET /api/orders
// Описание: Получить список всех заказов (для таблицы в админке)
// Доступ: ЗАЩИЩЕННЫЙ (Только для авторизованных ADMIN и MANAGER)
router.get('/', protect, restrictTo('ADMIN', 'MANAGER'), getAllOrders);

// 3. Маршрут: PATCH /api/orders/:id/status
// Описание: Изменить статус заказа (например, перевести из NEW в IN_PROGRESS)
// Доступ: ЗАЩИЩЕННЫЙ (Только для авторизованных ADMIN и MANAGER)
router.patch('/:id/status', protect, restrictTo('ADMIN', 'MANAGER'), updateOrderStatus);

export default router;