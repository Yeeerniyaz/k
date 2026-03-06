// 🔥 СЕНЬОРСКАЯ ПРАКТИКА №1: Загружаем переменные окружения ДО импорта Prisma.
// Это гарантирует, что Prisma увидит DATABASE_URL в процессе инициализации.
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ==========================================
// 1. ПРОВЕРКА КОНФИГУРАЦИИ
// ==========================================
if (!process.env.DATABASE_URL) {
    console.error('❌ ОШИБКА: DATABASE_URL не определена в файле .env');
    process.exit(1);
}

// ==========================================
// 2. PRISMA SINGLETON INSTANCE
// ==========================================
// Оставляем конструктор чистым. Prisma сама подхватит DATABASE_URL из env.
// Если нужно передать URL принудительно, в новых версиях используется 'datasourceUrl'.
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ==========================================
// 3. ПРОВЕРКА ПОДКЛЮЧЕНИЯ
// ==========================================
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully (Prisma Engine)');
    } catch (error) {
        console.error('❌ Critical Database error:', error.message);
        // Не падаем сразу, даем шанс на рестарт в Docker/PM2, но логгируем проблему
    }
}

connectDB();

// ==========================================
// 4. ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Senior Architect Server is running on port ${PORT}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
});

// ==========================================
// 5. ОБРАБОТКА КРИТИЧЕСКИХ СОБЫТИЙ
// ==========================================

// Обработка ошибок в асинхронных цепочках
process.on('unhandledRejection', (err) => {
    console.error('🔥 UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    server.close(() => process.exit(1));
});

// Обработка непредвиденных исключений
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err);
    process.exit(1);
});

// Мягкое завершение (SIGTERM)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully');
    server.close(() => {
        prisma.$disconnect();
        console.log('💥 Process terminated!');
    });
});