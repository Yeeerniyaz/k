import { prisma } from '../server.js';

// ==========================================
// 1. СОЗДАНИЕ ЗАКАЗА (ДЛЯ КЛИЕНТОВ НА САЙТЕ)
// ==========================================
// Твой старый код создания заказа полностью сохранен
export const createOrder = async (req, res, next) => {
    try {
        const { customerName, phone, serviceType, width, height, totalPrice } = req.body;

        if (!customerName || !phone || !serviceType || !totalPrice) {
            return res.status(400).json({
                status: 'error',
                message: 'Не заполнены обязательные поля (имя, телефон, тип услуги, цена)'
            });
        }

        const newOrder = await prisma.order.create({
            data: {
                customerName,
                phone,
                // Важно: serviceType должен строго соответствовать ServiceCategory из schema.prisma
                serviceType,
                width,
                height,
                totalPrice,
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Заказ успешно создан',
            data: newOrder
        });
    } catch (error) {
        next(error); 
    }
};

// ==========================================
// 2. ПОЛУЧЕНИЕ ВСЕХ ЗАКАЗОВ (ДЛЯ ERP / АДМИНКИ)
// ==========================================
// НОВЫЙ КОД: Позволяет менеджерам видеть всю базу клиентов
export const getAllOrders = async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: {
                createdAt: 'desc' // Самые свежие заявки всегда сверху
            }
        });

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. ОБНОВЛЕНИЕ СТАТУСА ЗАКАЗА (ДЛЯ ERP / АДМИНКИ)
// ==========================================
// НОВЫЙ КОД: Позволяет двигать заказ по воронке (NEW -> IN_PROGRESS -> COMPLETED)
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params; // Получаем ID заказа из URL (например: /api/orders/123)
        const { status } = req.body; // Получаем новый статус из тела запроса

        if (!status) {
            return res.status(400).json({
                status: 'error',
                message: 'Необходимо передать новый статус заказа'
            });
        }

        // Обновляем запись в базе данных
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status } // Должно совпадать с OrderStatus (NEW, IN_PROGRESS, READY, COMPLETED)
        });

        res.status(200).json({
            status: 'success',
            message: 'Статус заказа успешно обновлен',
            data: updatedOrder
        });
    } catch (error) {
        // Если передан неверный ID и Prisma ничего не нашла, ошибка улетит в глобальный обработчик
        next(error);
    }
};