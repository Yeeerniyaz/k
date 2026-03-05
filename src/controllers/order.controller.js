import { prisma } from '../server.js';

// Экспортируем функцию createOrder
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
                // Важно: serviceType теперь должен строго соответствовать ServiceCategory из schema.prisma
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