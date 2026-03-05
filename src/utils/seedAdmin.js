import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Подгружаем переменные окружения, чтобы скрипт видел базу
dotenv.config();

const prisma = new PrismaClient();

// ==========================================
// СКРИПТ СОЗДАНИЯ ПЕРВОГО СУПЕР-АДМИНА
// ==========================================
const seedAdmin = async () => {
    try {
        console.log('🔄 Запуск скрипта инициализации базы данных...');

        // 1. Проверяем, есть ли уже хотя бы один админ в системе
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (existingAdmin) {
            console.log('✅ Супер-админ уже существует в базе. Создание отменено.');
            process.exit(0);
        }

        // 2. Настройки по умолчанию для первого админа
        // В реальном проекте логин/пароль можно брать из .env
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        const adminName = 'Куаныш (Super Admin)';
        const adminPhone = '+77089321854';

        // 3. Хэшируем пароль перед сохранением
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // 4. Создаем запись в базе
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: adminName,
                phone: adminPhone,
                role: 'ADMIN'
            }
        });

        console.log('🎉 Успех! Первый Супер-Админ успешно создан.');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Пароль: ${adminPassword}`);
        console.log('⚠️ Обязательно смените пароль после первого входа!');

        process.exit(0);
    } catch (error) {
        console.error('💥 Ошибка при создании админа:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

// Запускаем функцию
seedAdmin();