import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import app from './app.js';

// 1. Инициализация конфигурации окружения
dotenv.config();

// ==========================================
// 2. PRISMA SINGLETON INSTANCE
// ==========================================
// Создаем один экземпляр PrismaClient для всего приложения.
// Это предотвращает утечки памяти и лимиты по количеству соединений с БД (PostgreSQL/MySQL).
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ==========================================
// 3. ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ
// ==========================================
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully (Prisma)');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1); // Завершаем процесс, если база недоступна
    }
}

// Запускаем проверку соединения
connectDB();

// ==========================================
// 4. ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Senior Architect Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ==========================================
// 5. ОБРАБОТКА КРИТИЧЕСКИХ ОШИБОК (SAFETY FIRST)
// ==========================================

// Обработка ошибок вне Express (например, ошибки в асинхронных функциях)
process.on('unhandledRejection', (err) => {
    console.log('🔥 UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    // Даем серверу время корректно закрыть текущие запросы перед выходом
    server.close(() => {
        process.exit(1);
    });
});

// Обработка необработанных исключений
process.on('uncaughtException', (err) => {
    console.log('🔥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// SIGTERM - сигнал на завершение (например, от хостинга или Docker)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully');
    server.close(() => {
        prisma.$disconnect();
        console.log('💥 Process terminated!');
    });
});