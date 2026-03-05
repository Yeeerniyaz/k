import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Инициализация окружения
dotenv.config();

// Инициализация приложения и БД
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Базовые Middleware
app.use(cors());
app.use(express.json()); // Парсинг JSON в теле запроса
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded данных

// --- API ROUTES ---

// Healthcheck роут (чтобы проверять, жив ли сервер)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Royal Banners API is running smoothly',
        timestamp: new Date().toISOString()
    });
});

// Тестовый роут для создания заказа (Позже вынесем в отдельные контроллеры)
app.post('/api/orders', async (req, res) => {
    try {
        const { customerName, phone, serviceType, width, height, totalPrice } = req.body;

        // Валидация базовых полей
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
        console.error('Ошибка при создании заказа:', error);
        res.status(500).json({
            status: 'error',
            message: 'Внутренняя ошибка сервера',
            error: error.message
        });
    }
});

// Глобальный обработчик несуществующих маршрутов (404)
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Маршрут ${req.originalUrl} не найден на сервере`
    });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Что-то пошло не так на сервере!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Запуск сервера с обработкой завершения (Graceful shutdown)
const server = app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту: ${PORT}`);
    console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
});

// Правильное закрытие соединения с БД при остановке сервера
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    server.close(() => {
        console.log('🛑 Сервер остановлен, соединение с БД закрыто.');
        process.exit(0);
    });
});