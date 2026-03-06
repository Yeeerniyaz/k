// 1. СЕНЬОРСКИЙ ПРИОРЕТЕТ: Загрузка env-переменных
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Явное указание пути, чтобы избежать проблем в Docker/Linux
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ДИАГНОСТИКА (Енді біз сенімдіміз, бірақ бақылауда ұстаймыз)
console.log('-------------------------------------------');
console.log('🔍 DATABASE_URL Status:', process.env.DATABASE_URL ? '✅ LOADED' : '❌ NOT FOUND');
console.log('🔍 Working Port:', process.env.PORT);
console.log('-------------------------------------------');

// ==========================================
// 2. PRISMA SINGLETON (CLEAN VERSION)
// ==========================================
// Поскольку DATABASE_URL уже в окружении (env), 
// мы вызываем пустой конструктор. Prisma сама найдет переменную.
// Это самый совместимый способ для всех версий.
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// ==========================================
// 3. ПОДКЛЮЧЕНИЕ К БАЗЕ
// ==========================================
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma Engine: Connected to Database');
    } catch (error) {
        console.error('❌ Prisma Engine: Connection Failed');
        console.error('📝 Details:', error.message);
    }
}

connectDB();

// ==========================================
// 4. ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 5005;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API is live on port ${PORT}`);
});

// Глобальные обработчики для стабильности
process.on('unhandledRejection', (err) => {
    console.error('🔥 Unhandled Rejection:', err);
    // Не падаем, просто логируем
});

process.on('SIGTERM', () => {
    server.close(() => {
        prisma.$disconnect();
        console.log('💥 Server Terminated');
    });
});