import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- СЕНЬОРСКИЙ FIX ДЛЯ DOTENV ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Явно указываем путь к .env файлу на уровень выше от src
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ==========================================
// 1. ДИАГНОСТИКА ОКРУЖЕНИЯ
// ==========================================
// Если это выведет undefined, значит файл .env не читается сервером
console.log('🔍 Проверка DATABASE_URL:', process.env.DATABASE_URL ? '✅ Найдена' : '❌ НЕ НАЙДЕНА');

if (!process.env.DATABASE_URL) {
    console.error('🔥 КРИТИЧЕСКАЯ ОШИБКА: Файл .env пуст или не найден!');
    console.error('Пожалуйста, создай файл .env в корне проекта и добавь туда DATABASE_URL.');
    process.exit(1);
}

// ==========================================
// 2. PRISMA SINGLETON
// ==========================================
// В Prisma 7+, если DATABASE_URL не подхватывается автоматически,
// мы передаем его через конструктор в свойство datasourceUrl

export const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL, // Прямая передача URL
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ==========================================
// 3. ПОДКЛЮЧЕНИЕ
// ==========================================
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ База деректеріне қосылу сәтті аяқталды!');
    } catch (error) {
        console.error('❌ Prisma қосылу қатесі:', error.message);
    }
}

connectDB();

// ==========================================
// 4. ЗАПУСК
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
});

// Глобальная защита от падения
process.on('unhandledRejection', (err) => {
    console.error('🔥 UNHANDLED REJECTION:', err);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    server.close(() => {
        prisma.$disconnect();
        console.log('💥 Process terminated');
    });
});