import express from 'express';
import {
    getExpenses,
    createExpense, // 🔥 SENIOR FIX: Приведено в строгое соответствие с нашим новым контроллером (ранее было addExpense)
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

// 🔥 SENIOR SECURITY BLOCK: Финансовый модуль — это коммерческая тайна ERP.
// Блокируем доступ всем зарегистрированным клиентам (роль CLIENT). 
// Доступ к роутам ниже имеют только сотрудники компании.
router.use(authorize('ADMIN', 'OWNER', 'MANAGER'));

// ==========================================
// 1. УПРАВЛЕНИЕ СПИСКОМ ТРАНЗАКЦИЙ
// Endpoint: /api/finance/expenses
// ==========================================
router.route('/expenses')
    // Получить историю расходов и сводку по прибыли (Net Profit)
    .get(getExpenses)

    // Зафиксировать новый расход (Транзакция будет записана в AuditLog)
    .post(createExpense);

// ==========================================
// 2. ОПЕРАЦИИ С КОНКРЕТНОЙ ТРАНЗАКЦИЕЙ
// Endpoint: /api/finance/expenses/:id
// ==========================================
router.route('/expenses/:id')
    // Редактировать транзакцию (например, если менеджер ошибся с суммой или категорией)
    // Любое изменение суммы будет зафиксировано в системе логирования.
    .put(updateExpense)

    // Удалить транзакцию из базы 
    // 🔥 СЕНЬОРСКАЯ ФИЧА: Менеджеры могут добавлять и менять, но удалять (скрывать следы) 
    // может ТОЛЬКО высшее руководство (ADMIN и OWNER).
    .delete(authorize('ADMIN', 'OWNER'), deleteExpense);

export default router;