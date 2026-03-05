import { prisma } from '../server.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ПРОФИЛЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (getMe)
// ==========================================
// Описание: Возвращает данные пользователя, который сейчас залогинен
export const getMe = async (req, res, next) => {
    try {
        // req.user берется из функции protect (нашего middleware)
        // Если запрос дошел сюда, значит токен валидный и id точно есть
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Пользователь не найден в базе данных'
            });
        }

        // Безопасность: никогда не отдаем хэш пароля на фронтенд
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            status: 'success',
            data: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. ПОЛУЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (ДЛЯ АДМИНКИ)
// ==========================================
// Описание: Выводит список всех менеджеров и клиентов (только для ADMIN)
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
                // Явно указываем select, чтобы пароли вообще не доставались из базы
            }
        });

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};