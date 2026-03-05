import { prisma } from '../server.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. Регистрация нового пользователя
export const register = async (req, res, next) => {
    try {
        const { email, password, name, phone, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email и пароль обязательны для заполнения'
            });
        }

        // Проверяем, существует ли уже пользователь с таким email
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Пользователь с таким email уже существует'
            });
        }

        // Хэшируем пароль (12 раундов - современный стандарт безопасности)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создаем пользователя в базе
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                // Если роль передана (например, создаем админа), используем её, иначе CLIENT
                role: role || 'CLIENT'
            }
        });

        // Безопасность: исключаем хэш пароля из ответа API
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            status: 'success',
            message: 'Пользователь успешно зарегистрирован',
            data: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

// 2. Авторизация пользователя (Login)
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email и пароль обязательны для авторизации'
            });
        }

        // Ищем пользователя в базе
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Неверный email или пароль'
            });
        }

        // Сравниваем введенный пароль с хэшем из базы
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Неверный email или пароль'
            });
        }

        // Генерируем JWT токен
        // В идеале JWT_SECRET нужно добавить в твой .env файл!
        const jwtSecret = process.env.JWT_SECRET || 'super_secret_royal_banners_key_2026';
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            jwtSecret,
            { expiresIn: '7d' } // Токен живет 7 дней, чтобы менеджерам не приходилось логиниться каждый день
        );

        // Безопасность: исключаем хэш пароля из ответа
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            status: 'success',
            message: 'Авторизация успешна',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};