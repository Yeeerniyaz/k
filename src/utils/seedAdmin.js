import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Инициализируем клиент явно
const prisma = new PrismaClient();

async function seed() {
    console.log('🚀 Запуск скрипта создания администратора...');

    const email = 'admin@royalbanners.kz';
    const password = 'RoyalAdmin2026!';

    try {
        // 1. Проверяем, есть ли уже админ в базе
        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log(`⚠️  Администратор с email ${email} уже существует.`);
            return;
        }

        // 2. Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Создаем запись
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ADMIN',
                name: 'Super Admin'
            }
        });

        console.log('======================================');
        console.log('✅ СУПЕР-АДМИНИСТРАТОР СОЗДАН!');
        console.log(`📧 Email: ${admin.email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('ℹ️  Сохраните эти данные для входа.');
        console.log('======================================');

    } catch (error) {
        console.error('💥 Ошибка при создании админа:', error);
    } finally {
        // Обязательно закрываем соединение, чтобы скрипт завершился
        await prisma.$disconnect();
    }
}

seed();