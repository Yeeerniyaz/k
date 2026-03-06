import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../server.js'; // Используем единый инстанс БД

// Вспомогательная функция для создания токена
const signToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET || 'royal_banners_secret_key_2026',
        { expiresIn: '24h' }
    );
};

// ==========================================
// 1. REGISTER: Регистрация (Первый запуск)
// ==========================================
// Бул функция алғашқы қолданушыларды немесе админдерді тіркеу үшін керек.
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // 1. Проверяем, не существует ли уже такой пользователь
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Пользователь с таким email уже зарегистрирован.'
            });
        }

        // 2. Хешируем пароль (Соль 10 раундов)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Создаем запись в базе данных
        const newUser = await prisma.user.create({
            data: {
                name: name || 'Админ',
                email,
                phone: phone || null,
                password: hashedPassword,
                role: role || 'MANAGER' // По умолчанию менеджер, если не указано иное
            }
        });

        // 4. Генерируем токен, чтобы пользователь сразу залогинился
        const token = signToken(newUser.id);

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                }
            }
        });
    } catch (error) {
        console.error('🔥 Register Error:', error);
        next(error);
    }
};

// ==========================================
// 2. LOGIN: Вход в систему
// ==========================================
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Пожалуйста, укажите email и пароль.'
            });
        }

        // Ищем пользователя и получаем его хешированный пароль
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                status: 'error',
                message: 'Неверный email или пароль.'
            });
        }

        const token = signToken(user.id);

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
        next(error);
    }
};

// ==========================================
// 3. GET ME: Текущий профиль
// ==========================================
export const getMe = async (req, res, next) => {
    try {
        // req.user берется из authMiddleware
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

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. LOGOUT: Выход
// ==========================================
export const logout = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Вы успешно вышли из системы.'
    });
};