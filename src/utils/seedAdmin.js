import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// 🔥 СЕНЬОРСКИЙ ФИКС: Явно указываем URL через современный параметр datasourceUrl
const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function seed() {
    console.log('🚀 Запуск скрипта создания администратора...');

    const email = process.env.ADMIN_EMAIL || 'admin@royalbanners.kz';
    const password = process.env.ADMIN_PASSWORD || 'RoyalAdmin2026!';

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
        console.log('✅ СУПЕР-АДМИНИСТРАТОР УСПЕШНО СОЗДАН!');
        console.log(`📧 Email: ${admin.email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('ℹ️  Сохраните эти данные для входа.');
        console.log('======================================');

    } catch (error) {
        if (error.code === 'P2002') {
            console.log('✅ Админ уже существует в базе (сработала защита от дублей)!');
        } else {
            console.error('💥 Ошибка при создании админа:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

seed();