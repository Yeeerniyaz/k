import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ ЗАКАЗОВ (CRM)
// ==========================================
export const getOrders = catchAsync(async (req, res, next) => {
    const { status, clientId } = req.query;

    const whereCondition = {};
    if (status) whereCondition.status = status;
    if (clientId) whereCondition.clientId = clientId;

    // Получаем все заказы вместе со связанными расходами и клиентом
    const orders = await prisma.order.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        include: {
            expenses: true,
            client: true
        }
    });

    // 🔥 SENIOR FIX: Адаптируем данные для фронтенда, чтобы старые React-компоненты не сломались
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
// 2. ПОЛУЧЕНИЕ ОДНОГО ЗАКАЗА ПО ID
// ==========================================
export const getOrderById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            expenses: true,
            client: true
        }
    });

    if (!order) {
        return next(new AppError('Заказ не найден', 404));
    }

    res.status(200).json({
        success: true,
        data: {
            ...order,
            clientName: order.customerName,
            clientPhone: order.phone,
            price: order.totalPrice
        }
    });
});

// ==========================================
// 3. СОЗДАНИЕ НОВОГО ЗАКАЗА (С САЙТА ИЛИ ВРУЧНУЮ ИЗ CRM)
// 🔥 SENIOR UPDATE: Добавлен AuditLog для фиксации заявки
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
        width, height, material, hasEyelets, needsMount,
        clientId // Если заказ делает авторизованный юзер
    } = req.body;

    const finalPhone = phone || clientPhone;
    const finalName = customerName || clientName || 'Неизвестный клиент';
    const finalPrice = totalPrice !== undefined ? parseInt(totalPrice) : (price ? parseInt(price) : 0);
    const finalServiceType = serviceType || 'DESIGN_PRINT'; // Значение по умолчанию

    if (!finalPhone) {
        return next(new AppError('Поле phone (или clientPhone) обязательно', 400));
    }

    // Создаем заказ в базе данных
    const newOrder = await prisma.order.create({
        data: {
            customerName: finalName,
            phone: finalPhone,
            description,
            totalPrice: finalPrice,
            status: status || 'NEW',
            serviceType: finalServiceType,
            width: width ? parseFloat(width) : null,
            height: height ? parseFloat(height) : null,
            material,
            hasEyelets: hasEyelets === true || hasEyelets === 'true',
            needsMount: needsMount === true || needsMount === 'true',
            ...(clientId && { clientId }) // Привязка к юзеру, если он залогинен
        },
        include: { expenses: true }
    });

    // 🔥 SENIOR SECURITY: Фиксируем создание заказа (если создает менеджер из админки)
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "CREATE_ORDER",
                entityType: "Order",
                entityId: newOrder.id,
                details: { customerName: finalName, price: finalPrice, status: newOrder.status }
            }
        }).catch(console.error);
    }

    res.status(201).json({
        success: true,
        data: {
            ...newOrder,
            clientName: newOrder.customerName,
            clientPhone: newOrder.phone,
            price: newOrder.totalPrice
        }
    });
});

// ==========================================
// 4. ОБНОВЛЕНИЕ ЗАКАЗА (СМЕНА СТАТУСА, ЦЕНЫ ИЛИ РАСХОДОВ)
// 🔥 SENIOR UPDATE: Вложена транзакция для расходов + Аудит изменений
// ==========================================
export const updateOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const {
        customerName, clientName,
        phone, clientPhone,
        description,
        totalPrice, price,
        status,
        serviceType,
        width, height, material, hasEyelets, needsMount,
        expenses
    } = req.body;

    const existingOrder = await prisma.order.findUnique({ where: { id } });

    if (!existingOrder) {
        return next(new AppError('Заказ не найден', 404));
    }

    const finalName = customerName || clientName;
    const finalPhone = phone || clientPhone;
    const finalPrice = totalPrice !== undefined ? totalPrice : price;

    // Формируем объект обновления только из переданных полей
    const updateData = {};
    if (finalName) updateData.customerName = finalName;
    if (finalPhone) updateData.phone = finalPhone;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (serviceType) updateData.serviceType = serviceType;
    if (width !== undefined) updateData.width = width ? parseFloat(width) : null;
    if (height !== undefined) updateData.height = height ? parseFloat(height) : null;
    if (material !== undefined) updateData.material = material;
    if (hasEyelets !== undefined) updateData.hasEyelets = hasEyelets === true || hasEyelets === 'true';
    if (needsMount !== undefined) updateData.needsMount = needsMount === true || needsMount === 'true';
    if (finalPrice !== undefined) updateData.totalPrice = parseInt(finalPrice);

    // 🔥 SENIOR PATTERN: Вложенная транзакция для расходов. 
    // Мы удаляем старые расходы этого заказа и перезаписываем новыми с фронтенда. 
    // Это избавляет от сложной логики сравнения ID каждого отдельного расхода.
    if (expenses && Array.isArray(expenses)) {
        updateData.expenses = {
            deleteMany: {}, // Удаляем старые привязанные расходы
            create: expenses.map(exp => ({
                category: exp.category || 'Общие материалы',
                amount: parseInt(exp.amount),
                comment: exp.comment || '',
                date: exp.date ? new Date(exp.date) : new Date()
            }))
        };
    }

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData,
        include: { expenses: true }
    });

    // 🔥 SENIOR SECURITY: Фиксируем изменения в ERP. Кто поменял статус или цену?
    if (req.user && req.user.id) {
        // Записываем в лог только если статус или цена изменились
        const detailsLog = {};
        if (updateData.status && updateData.status !== existingOrder.status) {
            detailsLog.oldStatus = existingOrder.status;
            detailsLog.newStatus = updateData.status;
        }
        if (updateData.totalPrice !== undefined && updateData.totalPrice !== existingOrder.totalPrice) {
            detailsLog.oldPrice = existingOrder.totalPrice;
            detailsLog.newPrice = updateData.totalPrice;
        }

        if (Object.keys(detailsLog).length > 0) {
            prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: "UPDATE_ORDER",
                    entityType: "Order",
                    entityId: updatedOrder.id,
                    details: detailsLog
                }
            }).catch(console.error);
        }
    }

    res.status(200).json({
        success: true,
        data: {
            ...updatedOrder,
            clientName: updatedOrder.customerName,
            clientPhone: updatedOrder.phone,
            price: updatedOrder.totalPrice
        }
    });
});

// ==========================================
// 5. УДАЛЕНИЕ ЗАКАЗА
// 🔥 SENIOR UPDATE: Аудит безвозвратного удаления
// ==========================================
export const deleteOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
        where: { id }
    });

    if (!order) {
        return next(new AppError('Заказ не найден', 404));
    }

    // Расходы (Expenses) удалятся автоматически благодаря onDelete: Cascade в схеме Prisma
    await prisma.order.delete({
        where: { id }
    });

    // 🔥 SENIOR SECURITY: Фиксируем удаление (критически важно для бизнеса)
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_ORDER",
                entityType: "Order",
                entityId: id,
                details: { deletedCustomer: order.customerName, deletedPrice: order.totalPrice }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});