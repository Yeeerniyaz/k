import express from 'express';
import {
    getExpenses,
    addExpense,
    updateExpense,
    deleteExpense
} from '../controllers/finance.controller.js';

// Подключаем middleware для защиты маршрутов (Enterprise стандарт)
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==========================================
// ГЛОБАЛЬНАЯ ЗАЩИТА МАРШРУТА
// ==========================================
// Все запросы, начинающиеся с /api/finance, обязаны иметь валидный JWT токен.
// (Если токена нет, система автоматически вернет 401 Unauthorized)
router.use(protect);

// ==========================================
// 1. УПРАВЛЕНИЕ СПИСКОМ ТРАНЗАКЦИЙ
// Endpoint: /api/finance/expenses
// ==========================================
router.route('/expenses')
    // Получить историю расходов (доступно всем авторизованным: ADMIN и MANAGER)
    .get(getExpenses)

    // Зафиксировать новый расход (доступно всем авторизованным: ADMIN и MANAGER)
    .post(addExpense);

// ==========================================
// 2. ОПЕРАЦИИ С КОНКРЕТНОЙ ТРАНЗАКЦИЕЙ
// Endpoint: /api/finance/expenses/:id
// ==========================================
router.route('/expenses/:id')
    // Редактировать транзакцию (ошиблись суммой или категорией)
    .put(updateExpense)

    // Удалить транзакцию из базы 
    // 🔥 СЕНЬОРСКАЯ ФИЧА: Финансы может удалять ТОЛЬКО администратор
    .delete(authorize('ADMIN'), deleteExpense);

export default router;