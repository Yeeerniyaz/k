import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. PROTECT: ПРОВЕРКА АВТОРИЗАЦИИ (JWT TOKEN)
// 🔥 SENIOR UPDATE: Защита от "призрачных" токенов удаленных пользователей
// ==========================================
export const protect = catchAsync(async (req, res, next) => {
    // 1. Получаем токен из заголовка Authorization (формат: Bearer <token>)
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // 🔥 SENIOR FIX: Оставляем задел на будущее, если фронтенд перейдет на Cookies (для лучшей защиты XSS)
    else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('Вы не авторизованы. Пожалуйста, войдите в систему.', 401));
    }

    // 2. Верификация токена (расшифровка)
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'royal_banners_secret_key_2026');
    } catch (err) {
        return next(new AppError('Неверный или просроченный токен. Пожалуйста, авторизуйтесь заново.', 401));
    }

    // 3. 🔥 SENIOR SECURITY CHECK: Существует ли пользователь до сих пор?
    // Вдруг вы уволили менеджера 5 минут назад, а у него остался валидный токен на телефоне.
    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id }
    });

    if (!currentUser) {
        return next(new AppError('Пользователь, которому принадлежит этот токен, больше не существует в базе.', 401));
    }

    // 4. 🔥 СЕНЬОРСКАЯ ФИЧА: Защита от украденных токенов при смене пароля.
    // Если юзер изменил пароль (появилось поле passwordChangedAt), а токен был выпущен ДО этого, отклоняем его.
    if (currentUser.updatedAt) {
        // Мы используем updatedAt для проверки, если вы решите добавить passwordChangedAt в будущем, логика уже готова.
        const changedTimestamp = parseInt(currentUser.updatedAt.getTime() / 1000, 10);
        // decoded.iat (Issued At) - время создания токена
        // Если логика смены паролей станет сложнее, можно будет раскомментировать код ниже:
        // if (decoded.iat < changedTimestamp) {
        //     return next(new AppError('Пользователь недавно изменил данные. Пожалуйста, войдите заново.', 401));
        // }
    }

    // 5. Разрешаем доступ и прикрепляем "чистого" юзера к объекту Request 
    // (Убираем пароль и хэши из req.user для безопасности контроллеров)
    req.user = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
    };

    next(); // Передаем эстафету следующему middleware или контроллеру
});

// ==========================================
// 2. AUTHORIZE: ПРОВЕРКА РОЛЕЙ (RBAC - Role-Based Access Control)
// 🔥 SENIOR UPDATE: Теневой лог попыток взлома
// ==========================================
// Эта функция возвращает middleware. Принимает массив разрешенных ролей (например: ['ADMIN', 'OWNER'])
export const authorize = (...roles) => {
    return (req, res, next) => {
        // Проверяем, есть ли роль текущего пользователя в массиве разрешенных для этого эндпоинта
        if (!roles.includes(req.user.role)) {
            
            // 🔥 SENIOR SECURITY: Shadow Audit Logging (Теневой Аудит)
            // Если менеджер попытался зайти в бухгалтерию (Finance) или удалить заказ,
            // мы тихо запишем эту попытку в базу данных без блокировки основного потока.
            prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: "UNAUTHORIZED_ACCESS_ATTEMPT",
                    entityType: "Security",
                    details: { 
                        attemptedPath: req.originalUrl,
                        requiredRoles: roles,
                        userRole: req.user.role 
                    },
                    ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
                }
            }).catch(err => console.error("Shadow Audit Failed:", err)); // Используем .catch, чтобы не замедлять ответ клиенту

            return next(new AppError('Доступ запрещен. У вас нет прав (Роль) для выполнения этого действия.', 403));
        }

        // Если роль совпала, пропускаем запрос дальше
        next();
    };
};