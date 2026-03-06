import { prisma } from '../server.js';
import bcrypt from 'bcryptjs'; // Парольдерді қауіпсіз сақтау үшін

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ СОТРУДНИКОВ
// ==========================================
export const getUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            // 🔥 СЕНЬОРСКАЯ ФИЧА: Никогда не возвращаем пароли на фронтенд!
            select: {
                id: true,
                name: true,
                email: true,
                phone: true, // Новый телефонный номер
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            status: 'success',
            success: true, // Поддержка старого и нового форматов
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. СОЗДАНИЕ НОВОГО СОТРУДНИКА
// ==========================================
export const createUser = async (req, res, next) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Базовая валидация
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Email и пароль обязательны'
            });
        }

        // Проверка: не занят ли email другим менеджером
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }

        // Шифруем пароль (Соль 10 раундов)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                name: name || 'Без имени',
                email,
                phone: phone || null, // Записываем телефон
                password: hashedPassword,
                role: role || 'MANAGER'
            },
            // Снова возвращаем без пароля
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        });

        res.status(201).json({
            status: 'success',
            success: true,
            message: 'Сотрудник успешно добавлен',
            data: newUser
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. ОБНОВЛЕНИЕ ДАННЫХ СОТРУДНИКА
// ==========================================
export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, password } = req.body;

        // Смарт-проверка: существует ли пользователь?
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'Сотрудник не найден'
            });
        }

        // Если меняют email, нужно убедиться, что он свободен
        if (email && email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email } });
            if (emailTaken) {
                return res.status(400).json({
                    status: 'error',
                    success: false,
                    message: 'Этот email уже используется'
                });
            }
        }

        // Формируем объект с новыми данными
        const updateData = {
            name: name !== undefined ? name : undefined,
            email: email !== undefined ? email : undefined,
            phone: phone !== undefined ? phone : undefined, // Обновляем телефон
            role: role !== undefined ? role : undefined,
        };

        // Если администратор задал новый пароль — шифруем его
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                updatedAt: true
            }
        });

        res.status(200).json({
            status: 'success',
            success: true,
            message: 'Профиль сотрудника обновлен',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. УДАЛЕНИЕ СОТРУДНИКА
// ==========================================
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'Сотрудник не найден или уже удален'
            });
        }

        // 🔥 Защита от случайного удаления главного администратора
        if (existingUser.role === 'ADMIN') {
            return res.status(403).json({
                status: 'error',
                success: false,
                message: 'Удаление профиля администратора запрещено'
            });
        }

        await prisma.user.delete({ where: { id } });

        res.status(200).json({
            status: 'success',
            success: true,
            message: 'Доступ сотрудника успешно аннулирован'
        });
    } catch (error) {
        next(error);
    }
};