import { prisma } from '../server.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ СТАТИСТИКИ ДЛЯ ДАШБОРДА (ERP)
// ==========================================
// Описание: Собирает ключевые метрики бизнеса для главного экрана админки
export const getDashboardStats = async (req, res, next) => {
    try {
        // 1. Считаем общее количество всех заказов в базе
        const totalOrders = await prisma.order.count();

        // 2. Считаем общую выручку (только для успешно закрытых и оплаченных заказов)
        const revenueResult = await prisma.order.aggregate({
            where: {
                status: 'COMPLETED'
            },
            _sum: {
                totalPrice: true
            }
        });
        // Если закрытых заказов еще нет, возвращаем 0, а не null
        const totalRevenue = revenueResult._sum.totalPrice || 0;

        // 3. Группируем заказы по статусам (сколько NEW, сколько IN_PROGRESS и т.д.)
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        // 4. Получаем 5 самых свежих заказов для ленты "Последние активности"
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Отдаем всю собранную статистику красивым JSON-объектом
        res.status(200).json({
            status: 'success',
            data: {
                metrics: {
                    totalOrders,
                    totalRevenue
                },
                distribution: ordersByStatus,
                recentActivity: recentOrders
            }
        });
    } catch (error) {
        // Если что-то пошло не так, отдаем ошибку в глобальный обработчик
        next(error);
    }
};