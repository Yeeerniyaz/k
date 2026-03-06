// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: dotenv должен быть самым первым импортом, 
// чтобы переменные окружения пробросились во все последующие модули.
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ==========================================
// 1. ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ПЕРЕМЕННЫХ
// ==========================================
if (!process.env.DATABASE_URL) {
    console.error('❌ ОШИБКА: Переменная DATABASE_URL не найдена в .env файле!');
    console.error('Prisma не сможет подключиться к базе данных.');
    process.exit(1);
}

// ==========================================
// 2. PRISMA SINGLETON INSTANCE
// ==========================================
// Явно передаем URL из env в конструктор, чтобы Prisma не пыталась 
// использовать Engine Type "client" (Edge) по ошибке.

export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// ==========================================
// 3. ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БАЗЕ
// ==========================================
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully via Prisma');
    } catch (error) {
        console.error('❌ Critical Database connection error:', error);
        process.exit(1);
    }
}

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
// 5. ОБРАБОТКА КРИТИЧЕСКИХ ОШИБОК
// ==========================================

process.on('unhandledRejection', (err) => {
    console.log('🔥 UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.log('🔥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully');
    server.close(() => {
        prisma.$disconnect();
        console.log('💥 Process terminated!');
    });
});