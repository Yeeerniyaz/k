import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ ЗАКАЗОВ (CRM)
// ==========================================
export const getOrders = catchAsync(async (req, res, next) => {
    // Получаем все заказы вместе со связанными расходами и клиентом
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            expenses: true,
            client: true
        }
    });

    // 🔥 SENIOR FIX: Адаптируем данные для фронтенда, чтобы старые компоненты не сломались
    const formattedOrders = orders.map(order => ({
        ...order,
        clientName: order.customerName, // Маппинг для старого фронта
        clientPhone: order.phone,
        price: order.totalPrice
    }));

    res.status(200).json({
        success: true,
        results: formattedOrders.length,
        data: formattedOrders
    });
});

// ==========================================
// 2. СОЗДАНИЕ НОВОГО ЗАКАЗА (С САЙТА ИЛИ ВРУЧНУЮ)
// ==========================================
export const createOrder = catchAsync(async (req, res, next) => {
    // Принимаем как старые ключи (clientName), так и новые (customerName)
    const {
        customerName, clientName,
        phone, clientPhone,
        description,
        totalPrice, price,
        status,
        serviceType,
        clientId // Если заказ делает авторизованный юзер
    } = req.body;

    const finalPhone = phone || clientPhone;
    const finalName = customerName || clientName || 'Неизвестный клиент';
    const finalPrice = totalPrice !== undefined ? parseInt(totalPrice) : (price ? parseInt(price) : 0);
    const finalServiceType = serviceType || 'BANNERS';

    // Строгая валидация: номер телефона обязателен всегда
    if (!finalPhone) {
        return next(new AppError('Номер телефона обязателен для оформления заказа', 400));
    }

    const newOrder = await prisma.order.create({
        data: {
            customerName: finalName,
            phone: finalPhone,
            description: description || '',
            totalPrice: finalPrice,
            status: status || 'NEW',
            serviceType: finalServiceType,
            // Если передан ID клиента (из базы), связываем заказ с ним
            ...(clientId && { client: { connect: { id: clientId } } })
        }
    });

    res.status(201).json({
        success: true,
        message: 'Заказ успешно создан',
        data: newOrder
    });
});

// ==========================================
// 3. ОБНОВЛЕНИЕ ЗАКАЗА (СТАТУС И РАСХОДЫ)
// ==========================================
export const updateOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, price, totalPrice, expenses } = req.body;

    // Проверяем существует ли заказ
    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
        return next(new AppError('Заказ с таким ID не найден', 404));
    }

    const updateData = {};

    if (status) updateData.status = status;

    const finalPrice = totalPrice !== undefined ? totalPrice : price;
    if (finalPrice !== undefined) updateData.totalPrice = parseInt(finalPrice);

    // 🔥 SENIOR PATTERN: Вложенная транзакция для расходов. 
    // Мы удаляем старые расходы этого заказа и перезаписываем новыми с фронтенда.
    // Это избавляет от сложной логики сравнения ID каждого отдельного расхода.
    if (expenses && Array.isArray(expenses)) {
        updateData.expenses = {
            deleteMany: {}, // Удалить все текущие расходы, привязанные к этому заказу
            create: expenses.map(exp => ({
                category: exp.category || 'Прочее',
                amount: parseInt(exp.amount) || 0,
                comment: exp.comment || 'Без комментария',
                // Сохраняем оригинальную дату расхода, если она есть
                date: exp.date ? new Date(exp.date) : new Date()
            }))
        };
    }

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData,
        include: { expenses: true } // Возвращаем заказ с уже обновленными расходами
    });

    res.status(200).json({
        success: true,
        message: 'Данные заказа успешно обновлены',
        data: updatedOrder
    });
});

// ==========================================
// 4. УДАЛЕНИЕ ЗАКАЗА
// ==========================================
export const deleteOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
        return next(new AppError('Заказ не найден или уже удален', 404));
    }

    // Благодаря onDelete: Cascade в Prisma, связанные расходы удалятся автоматически
    await prisma.order.delete({
        where: { id }
    });

    res.status(200).json({
        success: true,
        message: 'Заказ безвозвратно удален из системы'
    });
});