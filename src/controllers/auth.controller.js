import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../server.js'; // Используем единый инстанс БД
// 🔥 СЕНЬОРСКИЕ УТИЛИТЫ:
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// Вспомогательная функция для создания токена
const signToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET || 'royal_banners_secret_key_2026',
        // 🔥 SENIOR UPDATE: Добавлена поддержка переменной окружения для контроля жизни сессии
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// ==========================================
// 1. REGISTER: Регистрация (Первый запуск)
// 🔥 SENIOR UPDATE: Добавлено логирование действий и новые поля профиля
// ==========================================
// Бул функция алғашқы қолданушыларды немесе админдерді тіркеу үшін керек.
export const register = catchAsync(async (req, res, next) => {
    // Подхватываем новые поля, которые мы добавили в schema.prisma
    const { name, email, password, role, phone, avatarUrl } = req.body;

    // 1. Проверяем, не существует ли уже такой пользователь
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return next(new AppError('Пользователь с таким email уже зарегистрирован.', 400));
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
            avatarUrl: avatarUrl || null, // Добавлено сохранение аватарки
            password: hashedPassword,
            role: role || 'MANAGER' // По умолчанию менеджер, если не указано иное
        }
    });

    // 🔥 SENIOR SECURITY: Фиксируем регистрацию (сохраняем IP-адрес для защиты от ботов)
    // Используем .catch() чтобы не блокировать ответ пользователю, если логгер выдаст ошибку
    prisma.auditLog.create({
        data: {
            userId: newUser.id,
            action: "REGISTER_USER",
            entityType: "User",
            entityId: newUser.id,
            details: { email: newUser.email, role: newUser.role },
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
        }
    }).catch(err => console.error("Audit log error:", err));

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
                role: newUser.role,
                phone: newUser.phone,
                avatarUrl: newUser.avatarUrl
            }
        }
    });
});

// ==========================================
// 2. LOGIN: Вход в систему
// 🔥 SENIOR UPDATE: Жесткий контроль сессий в ERP-системе
// ==========================================
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Пожалуйста, укажите email и пароль.', 400));
    }

    // Ищем пользователя и получаем его хешированный пароль
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Неверный email или пароль.', 401));
    }

    // 🔥 SENIOR SECURITY: Фиксируем успешный вход менеджера на работу
    prisma.auditLog.create({
        data: {
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
            details: { email: user.email, role: user.role },
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
        }
    }).catch(err => console.error("Audit log error:", err));

    const token = signToken(user.id);

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatarUrl: user.avatarUrl
            }
        }
    });
});

// ==========================================
// 3. GET ME: Текущий профиль
// 🔥 SENIOR UPDATE: Расширенная выборка (Select) для дашборда
// ==========================================
export const getMe = catchAsync(async (req, res, next) => {
    // req.user берется из authMiddleware
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,      // 🔥 Возвращаем телефон на фронт
            avatarUrl: true,  // 🔥 Возвращаем аватарку (для шапки сайта)
            createdAt: true
        }
    });

    if (!user) {
        return next(new AppError('Пользователь не найден.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

// ==========================================
// 4. LOGOUT: Выход
// 🔥 SENIOR UPDATE: Логирование завершения рабочей сессии
// ==========================================
export const logout = catchAsync(async (req, res, next) => {
    // 🔥 SENIOR SECURITY: Если фронтенд присылает токен при выходе (req.user), мы фиксируем конец смены
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "LOGOUT",
                entityType: "User",
                entityId: req.user.id,
                ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
            }
        }).catch(err => console.error("Audit log error:", err));
    }

    res.status(200).json({
        status: 'success',
        message: 'Вы успешно вышли из системы.'
    });
});