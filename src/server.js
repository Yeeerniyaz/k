import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg'; // pg пакетін қолданамыз
import { PrismaPg } from '@prisma/adapter-pg'; // Адаптерді қолданамыз

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ==========================================
// 0. ОБРАБОТКА КРИТИЧЕСКИХ ОШИБОК СИНХРОННОГО КОДА (UNCAUGHT EXCEPTIONS)
// 🔥 SENIOR UPDATE: Защита от падения процесса до старта сервера
// ==========================================
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

// ==========================================
// 1. ПРОВЕРКА ЗАГРУЗКИ И ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
// ==========================================
console.log('-------------------------------------------');
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? '✅ LOADED' : '❌ NOT FOUND');
// 🔥 SENIOR UPDATE: Проверяем ключи для новых модулей CMS и авторизации
console.log('🔍 JWT_SECRET:', process.env.JWT_SECRET ? '✅ LOADED' : '⚠️ NOT FOUND (Auth may fail)');
console.log('🔍 CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? '✅ LOADED' : '⚠️ NOT FOUND (Media Library may fail)');
console.log('-------------------------------------------');

if (!process.env.DATABASE_URL) {
    console.error('❌ FATAL ERROR: DATABASE_URL is not defined.');
    process.exit(1);
}

// ==========================================
// 2. PRISMA ADAPTER CONFIGURATION (Сеньорский подход для Prisma 7)
// Бұл "engine type client" қатесін біржола жояды
// ==========================================
// 🔥 SENIOR UPDATE: Добавлены таймауты в Pool для стабильности соединений при высоких нагрузках
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000, // Время ожидания подключения
    idleTimeoutMillis: 30000       // Закрывать неактивные соединения через 30 сек
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter, // Адаптерді тікелей береміз
    // 🔥 SENIOR UPDATE: В dev-режиме включаем логирование самих SQL-запросов (query) для отладки
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma: Database connection established using PG Adapter.');
    } catch (error) {
        console.error('❌ Prisma: Connection failed!', error.message);
        process.exit(1); // Завершаем процесс, если БД недоступна
    }
}

connectDB();

// ==========================================
// 3. ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 5005;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Senior Architect Service is active on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ==========================================
// 4. GRACEFUL SHUTDOWN (ПЛАВНАЯ ОСТАНОВКА ПРОЦЕССА) 🔥 НОВОЕ
// ==========================================

// Обработка неперехваченных отклонений промисов (асинхронные ошибки)
process.on('unhandledRejection', (err) => {
    console.error('🔥 UNHANDLED REJECTION! Shutting down gracefully...');
    console.error(err.name, err.message);
    // Сначала закрываем сервер (перестаем принимать новые запросы), потом убиваем процесс
    server.close(() => {
        process.exit(1);
    });
});

// Обработка сигналов завершения от ОС (например, при деплое через Docker, PM2 или Railway)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
    server.close(async () => {
        console.log('💥 Process terminated by OS!');
        await prisma.$disconnect(); // Отключаем Prisma
        await pool.end();           // Освобождаем пул соединений PostgreSQL
    });
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT (Ctrl+C) RECEIVED. Shutting down gracefully...');
    server.close(async () => {
        console.log('💥 Process terminated by User!');
        await prisma.$disconnect();
        await pool.end();
        process.exit(0);
    });
});