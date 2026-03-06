// 1. СЕНЬОРСКИЙ FIX: Сначала загружаем переменные окружения через абсолютный путь
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Явно указываем путь к .env, который лежит в корне проекта (на уровень выше от src)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. ТЕПЕРЬ импортируем всё остальное
import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ПРОВЕРКА ЗАГРУЗКИ (Debug log)
console.log('-------------------------------------------');
console.log('🔍 Статус DATABASE_URL:', process.env.DATABASE_URL ? '✅ ЗАГРУЖЕНО' : '❌ ОШИБКА: НЕ НАЙДЕНО');
console.log('🔍 Текущий PORT:', process.env.PORT);
console.log('-------------------------------------------');

if (!process.env.DATABASE_URL) {
    console.error('🔥 КРИТИЧЕСКАЯ ОШИБКА: Переменные окружения не подгрузились!');
    console.error('Проверь, что файл .env находится в корневой папке и не пуст.');
    process.exit(1);
}

// ==========================================
// 3. PRISMA SINGLETON (PRISMA 7+ COMPLIANT)
// ==========================================
// Используем datasourceUrl для прямой передачи строки подключения

export const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// ==========================================
// 4. ПОДКЛЮЧЕНИЕ К БАЗЕ
// ==========================================
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma успешно подключилась к базе данных');
    } catch (error) {
        console.error('❌ Ошибка подключения к БД:', error.message);
        console.log('💡 Совет: Проверь, запущен ли контейнер с базой и правильный ли хост (database vs datebase)');
    }
}

connectDB();

// ==========================================
// 5. ЗАПУСК СЕРВЕРА
// ==========================================
// Используем порт из .env (у тебя там 5005)
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Senior Server is running on http://localhost:${PORT}`);
});

// Глобальная защита процесса
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