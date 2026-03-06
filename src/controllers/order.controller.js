// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Импортируем готовый инстанс Prisma из server.js
// Это предотвращает PrismaClientInitializationError и лимиты соединений.
import { prisma } from '../server.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ ЗАКАЗОВ (С РАСХОДАМИ)
// ==========================================
export const getOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                expenses: true, // Подтягиваем расходы (себестоимость)
                client: true    // Подтягиваем данные клиента
            }
        });

        // Маппинг полей для совместимости с фронтендом
        const formattedOrders = orders.map(order => ({
            ...order,
            clientName: order.customerName,
            clientPhone: order.phone,
            price: order.totalPrice
        }));

        res.status(200).json({ success: true, data: formattedOrders });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. СОЗДАНИЕ НОВОГО ЗАКАЗА (ЛИДЫ С САЙТА)
// ==========================================
export const createOrder = async (req, res, next) => {
    try {
        const { clientName, clientPhone, description, price, status, serviceType } = req.body;

        const newOrder = await prisma.order.create({
            data: {
                customerName: clientName || 'Неизвестный лид',
                phone: clientPhone || 'Не указан',
                description: description || '',
                totalPrice: price ? parseInt(price) : 0,
                status: status || 'NEW',
                serviceType: serviceType || 'BANNERS',
            }
        });

        res.status(201).json({ success: true, data: newOrder, message: 'Заказ успешно создан' });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. ОБНОВЛЕНИЕ ЗАКАЗА (СТАТУС, ЦЕНА, РАСХОДЫ)
// ==========================================
export const updateOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, price, expenses } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (price !== undefined) updateData.totalPrice = parseInt(price);

        // Смарт-обновление расходов: удаляем старые, создаем новые
        if (expenses && Array.isArray(expenses)) {
            updateData.expenses = {
                deleteMany: {},
                create: expenses.map(exp => ({
                    category: exp.category || 'Прочее',
                    amount: parseInt(exp.amount) || 0,
                    comment: exp.comment || 'Без комментария',
                    date: exp.date ? new Date(exp.date) : new Date()
                }))
            };
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: updateData,
            include: { expenses: true }
        });

        res.status(200).json({ success: true, data: updatedOrder, message: 'Заказ и финансы обновлены' });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. ПОЛНОЕ УДАЛЕНИЕ ЗАКАЗА
// ==========================================
export const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Благодаря каскадному удалению в Prisma, связанные расходы удалятся сами
        await prisma.order.delete({
            where: { id }
        });

        res.status(200).json({ success: true, message: 'Заказ безвозвратно удален' });
    } catch (error) {
        next(error);
    }
};