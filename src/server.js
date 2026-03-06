// 1. СЕНЬОРСКИЙ ПРИОРЕТЕТ: Сначала грузим окружение через абсолютный путь
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Гарантируем, что .env прочитан до того, как Prisma вообще загрузится в память
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. ИМПОРТ ПАКЕТОВ
import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ДИАГНОСТИКА: Убеждаемся, что URL подтянулся
console.log('-------------------------------------------');
console.log('🔍 SYSTEM CHECK:');
console.log('📡 DATABASE_URL:', process.env.DATABASE_URL ? '✅ LOADED' : '❌ NOT FOUND');
console.log('-------------------------------------------');

if (!process.env.DATABASE_URL) {
    console.error('🔥 CRITICAL: DATABASE_URL is missing. Please check your .env file!');
    process.exit(1);
}

// ==========================================
// 3. PRISMA SINGLETON (ROBUST CONFIGURATION)
// ==========================================
// Чтобы избежать ошибки "engine type client", мы явно прописываем 
// datasourceUrl. Это заставляет Prisma использовать стандартный движок.

export const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// ==========================================
// 4. DATABASE CONNECTION
// ==========================================
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma: Database connection established.');
    } catch (error) {
        console.error('❌ Prisma: Connection failed!');
        console.error('📝 Details:', error.message);
        
        // Если база на другом хосте (datebase vs database), ловим это здесь
        if (error.message.includes('getaddrinfo ENOTFOUND')) {
            console.log('💡 Архитектуралық кеңес: .env файлындағы хостты тексер (datebase vs database)');
        }
    }
}

connectDB();

// ==========================================
// 5. SERVER STARTUP
// ==========================================
const PORT = process.env.PORT || 5005;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Senior Architect Service is active on port ${PORT}`);
});

// Глобальные обработчики для стабильности системы
process.on('unhandledRejection', (err) => {
    console.error('🔥 UNHANDLED REJECTION:', err);
});

process.on('SIGTERM', () => {
    server.close(() => {
        prisma.$disconnect();
        console.log('💥 System offline');
    });
});