import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ ЗАКАЗОВ
// ==========================================
// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Никаких try/catch. catchAsync сделает всё за нас!
export const getOrders = catchAsync(async (req, res, next) => {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            expenses: true,
            client: true
        }
    });

    const formattedOrders = orders.map(order => ({
        ...order,
        clientName: order.customerName,
        clientPhone: order.phone,
        price: order.totalPrice
    }));

    res.status(200).json({ success: true, data: formattedOrders });
});

// ==========================================
// 2. СОЗДАНИЕ НОВОГО ЗАКАЗА
// ==========================================
export const createOrder = catchAsync(async (req, res, next) => {
    const { clientName, clientPhone, description, price, status, serviceType } = req.body;

    // Пример использования AppError вместо ручного res.status.json
    if (!clientPhone) {
        return next(new AppError('Номер телефона обязателен для оформления заказа', 400));
    }

    const newOrder = await prisma.order.create({
        data: {
            customerName: clientName || 'Неизвестный лид',
            phone: clientPhone,
            description: description || '',
            totalPrice: price ? parseInt(price) : 0,
            status: status || 'NEW',
            serviceType: serviceType || 'BANNERS',
        }
    });

    res.status(201).json({ success: true, data: newOrder, message: 'Заказ успешно создан' });
});

// ==========================================
// 3. ОБНОВЛЕНИЕ ЗАКАЗА
// ==========================================
export const updateOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, price, expenses } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (price !== undefined) updateData.totalPrice = parseInt(price);

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

    if (!updatedOrder) {
        return next(new AppError('Заказ с таким ID не найден', 404));
    }

    res.status(200).json({ success: true, data: updatedOrder, message: 'Заказ обновлен' });
});

// ==========================================
// 4. УДАЛЕНИЕ ЗАКАЗА
// ==========================================
export const deleteOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // В Prisma 7+ если запись не найдена, она сама выкинет ошибку (которую поймает наш error.middleware)
    await prisma.order.delete({
        where: { id }
    });

    res.status(200).json({ success: true, message: 'Заказ безвозвратно удален' });
});