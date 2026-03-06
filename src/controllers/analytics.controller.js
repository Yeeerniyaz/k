import { prisma } from '../server.js';
// 🔥 СЕНЬОРСКИЕ УТИЛИТЫ:
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ СТАТИСТИКИ ДЛЯ ДАШБОРДА (ERP)
// ==========================================
// Описание: Собирает ключевые метрики бизнеса для главного экрана админки,
// включая фильтрацию по датам, учет себестоимости и общих расходов.
export const getDashboardStats = catchAsync(async (req, res, next) => {
    // 🔥 СЕНЬОРСКАЯ ФИЧА: Фильтрация по дате (из запроса фронтенда)
    const { from, to } = req.query;

    // Объект фильтрации для моделей, использующих createdAt
    const dateFilter = {};
    // Объект фильтрации для модели Expense, использующей date
    const expenseDateFilter = {};

    if (from) {
        const fromDate = new Date(from);
        dateFilter.gte = fromDate;
        expenseDateFilter.gte = fromDate;
    }

    if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
        dateFilter.lte = toDate;
        expenseDateFilter.lte = toDate;
    }

    const whereOrder = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const whereExpense = Object.keys(expenseDateFilter).length > 0 ? { date: expenseDateFilter } : {};
    const whereUser = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const wherePortfolio = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // ==========================================
    // ПАРАЛЛЕЛЬНОЕ ВЫПОЛНЕНИЕ ЗАПРОСОВ (ДЛЯ СКОРОСТИ)
    // ==========================================
    const [
        totalOrders,
        revenueResult,
        ordersByStatus,
        recentOrders,
        orderExpResult,
        companyExpResult,
        totalUsers,
        totalPortfolio
    ] = await Promise.all([
        // 1. Общее количество заказов
        prisma.order.count({ where: whereOrder }),

        // 2. Общая выручка (только COMPLETED)
        prisma.order.aggregate({
            where: { status: 'COMPLETED', ...whereOrder },
            _sum: { totalPrice: true }
        }),

        // 3. Группировка заказов по статусам
        prisma.order.groupBy({
            by: ['status'],
            where: whereOrder,
            _count: { id: true }
        }),

        // 4. Последние 5 заказов
        prisma.order.findMany({
            where: whereOrder,
            take: 5,
            orderBy: { createdAt: 'desc' }
        }),

        // 5. Расходы по заказам (Себестоимость: orderId НЕ null)
        prisma.expense.aggregate({
            where: { orderId: { not: null }, ...whereExpense },
            _sum: { amount: true }
        }),

        // 6. Общие расходы компании (Аренда, ЗП: orderId IS null)
        prisma.expense.aggregate({
            where: { orderId: null, ...whereExpense },
            _sum: { amount: true }
        }),

        // 7. Количество сотрудников
        prisma.user.count({ where: whereUser }),

        // 8. Количество работ в портфолио
        prisma.portfolio.count({ where: wherePortfolio })
    ]);

    // ==========================================
    // ФИНАНСОВЫЕ ВЫЧИСЛЕНИЯ
    // ==========================================
    const totalRevenue = revenueResult._sum.totalPrice || 0;
    const orderExpenses = orderExpResult._sum.amount || 0;
    const companyExpenses = companyExpResult._sum.amount || 0;

    const totalExpenses = orderExpenses + companyExpenses;
    const netProfit = totalRevenue - totalExpenses; // Таза пайда (Чистая прибыль)

    // ==========================================
    // ФОРМИРОВАНИЕ ОТВЕТА
    // ==========================================
    res.status(200).json({
        status: 'success',
        data: {
            // Плоская структура для обновленного Dashboard.jsx
            totalOrders,
            totalRevenue,
            orderExpenses,
            companyExpenses,
            totalExpenses,
            netProfit,
            totalUsers,
            totalPortfolio,
            recentOrders,

            // Сохраняем старую структуру (обратная совместимость, чтобы ничего не сломать)
            metrics: {
                totalOrders,
                totalRevenue
            },
            distribution: ordersByStatus,
            recentActivity: recentOrders
        }
    });
});