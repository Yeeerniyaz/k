import jwt from 'jsonwebtoken';
import { prisma } from '../server.js'; // Используем наш единый инстанс Prisma
// 🔥 СЕНЬОРСКИЕ УТИЛИТЫ:
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. PROTECT: Проверка авторизации (JWT)
// ==========================================
// Бұл функция қолданушының логин болғанын тексереді.
export const protect = catchAsync(async (req, res, next) => {
    let token;

    // 1. Проверяем наличие токена в заголовках запроса (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Егер токен жоқ болса — AppError арқылы қатені глобальды өңдегішке жібереміз
    if (!token) {
        return next(new AppError('Вы не авторизованы. Пожалуйста, войдите в систему.', 401));
    }

    // 2. Верификация токена
    // Если токен невалиден или просрочен, jwt.verify выбросит ошибку (JsonWebTokenError или TokenExpiredError),
    // которую автоматически поймает наш catchAsync и передаст в error.middleware.js!
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'royal_banners_secret_key_2026');

    // 3. Поиск пользователя в базе данных по ID из токена
    // Извлекаем без пароля для безопасности
    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    if (!currentUser) {
        return next(new AppError('Пользователь, которому принадлежит этот токен, больше не существует.', 401));
    }

    // 4. ПЕРЕДАЕМ ДАННЫЕ ДАЛЬШЕ
    // Теперь в любом контроллере мы можем обратиться к req.user, чтобы узнать кто делает запрос
    req.user = currentUser;
    next();
});

// ==========================================
// 2. AUTHORIZE: Проверка прав доступа (Roles)
// ==========================================
// Бұл функция қолданушының рөлін тексереді (мысалы, тек ADMIN өшіре алады).
export const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user данные попадают сюда из middleware 'protect'
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`У вас недостаточно прав для выполнения этого действия. Требуемая роль: ${roles.join(' или ')}`, 403));
        }
        next();
    };
};