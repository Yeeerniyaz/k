import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ ЗАКАЗОВ (С РАСХОДАМИ)
// ==========================================
export const getOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                expenses: true, // 🔥 Обязательно подтягиваем расходы (себестоимость) для фронтенда
                client: true    // Подтягиваем данные зарегистрированного B2B клиента, если есть
            }
        });

        // Адаптируем данные под интерфейс фронтенда (маппинг полей)
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
                serviceType: serviceType || 'BANNERS', // Дефолтное значение Enum, если фронт не передал
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

        // Формируем базовый объект обновления
        const updateData = {};
        if (status) updateData.status = status;
        if (price !== undefined) updateData.totalPrice = parseInt(price);

        // 🔥 Смарт-обновление расходов (Expenses)
        // Если фронтенд прислал массив расходов, мы используем транзакционный подход Prisma:
        // Удаляем старые расходы этого заказа и записываем новые (чтобы избежать дублей)
        if (expenses && Array.isArray(expenses)) {
            updateData.expenses = {
                deleteMany: {}, // Очищаем старые привязанные расходы
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
            include: { expenses: true } // Возвращаем обновленный заказ вместе с расходами
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

        // Благодаря onDelete: Cascade в schema.prisma, все связанные расходы (Expenses) 
        // удалятся автоматически вместе с заказом.
        await prisma.order.delete({
            where: { id }
        });

        res.status(200).json({ success: true, message: 'Заказ безвозвратно удален' });
    } catch (error) {
        next(error);
    }
};