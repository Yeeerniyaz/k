import app from './app.js';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Экспортируем prisma для использования в контроллерах
export const prisma = new PrismaClient();
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

        // Твой старый Graceful shutdown - сохранен и улучшен
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