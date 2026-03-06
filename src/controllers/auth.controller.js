import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../server.js'; // Используем единый инстанс из server.js

// Вспомогательная функция для создания JWT токена
// Срок жизни токена — 24 часа. Достаточно для рабочего дня.
const signToken = (id) => {
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET || 'royal_banners_secret_key_2026', 
        { expiresIn: '24h' }
    );
};

// ==========================================
// 1. LOGIN: Вход в систему
// ==========================================
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Проверяем, переданы ли email и пароль
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Пожалуйста, укажите email и пароль.'
            });
        }

        // 2. Ищем пользователя в базе
        // Обязательно вытягиваем пароль для сравнения (bcrypt)
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // 3. Проверяем существование пользователя и корректность пароля
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                status: 'error',
                message: 'Неверный email или пароль.'
            });
        }

        // 4. Генерируем токен
        const token = signToken(user.id);

        // 5. Отправляем ответ без пароля
        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('🔥 Login Error:', error);
        next(error);
    }
};

// ==========================================
// 2. GET ME: Получение данных текущего пользователя
// ==========================================
// Используется фронтендом при каждой перезагрузке страницы, 
// чтобы проверить, валиден ли токен и кто залогинен.
export const getMe = async (req, res, next) => {
    try {
        // Мы попадаем сюда только после прохождения middleware 'protect',
        // который уже записал данные пользователя в req.user.
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Пользователь не найден.'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. LOGOUT: Выход (на стороне сервера)
// ==========================================
// В JWT архитектуре выход обычно обрабатывается на фронтенде удалением токена,
// но мы оставляем эндпоинт для чистоты структуры.
export const logout = (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Вы успешно вышли из системы.' 
    });
};