import app from './app.js';
import dotenv from 'dotenv';
// 🔥 Импорты для Prisma 7
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

dotenv.config();

// --- Инициализация БД для Prisma 7 ---
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Передаем адаптер в конструктор
export const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('📦 База данных PostgreSQL успешно подключена.');

        const server = app.listen(PORT, () => {
            console.log(`\n======================================`);
            console.log(`🚀 Royal Banners API is alive!`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔌 Server running on port: ${PORT}`);
            console.log(`======================================\n`);
        });

        // Graceful shutdown - плавное отключение
        process.on('SIGINT', async () => {
            await prisma.$disconnect();
            server.close(() => {
                console.log('🛑 Сервер остановлен, соединение с БД закрыто.');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА ЗАПУСКА:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();