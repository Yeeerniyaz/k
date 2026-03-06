import jwt from 'jsonwebtoken';
import { prisma } from '../server.js'; // Используем наш единый инстанс Prisma

// ==========================================
// 1. PROTECT: Проверка авторизации (JWT)
// ==========================================
// Бул функция қолданушының логин болғанын тексереді.
export const protect = async (req, res, next) => {
    let token;

    // 1. Проверяем наличие токена в заголовках запроса (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Егер токен жоқ болса — қате қайтарамыз
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Вы не авторизованы. Пожалуйста, войдите в систему.'
        });
    }

    try {
        // 2. Верификация токена
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
            return res.status(401).json({
                status: 'error',
                message: 'Пользователь, которому принадлежит этот токен, больше не существует.'
            });
        }

        // 4. ПЕРЕДАЕМ ДАННЫЕ ДАЛЬШЕ
        // Теперь в любом контроллере мы можем обратиться к req.user, чтобы узнать кто делает запрос
        req.user = currentUser;
        next();
    } catch (error) {
        console.error('🔥 Auth Middleware Error:', error);
        return res.status(401).json({
            status: 'error',
            message: 'Токен невалиден или просрочен. Войдите заново.'
        });
    }
};

// ==========================================
// 2. AUTHORIZE: Проверка прав доступа (Roles)
// ==========================================
// Бул функция қолданушының рөлін тексереді (мысалы, тек ADMIN өшіре алады).
export const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user данные попадают сюда из middleware 'protect'
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `У вас недостаточно прав для выполнения этого действия. Требуемая роль: ${roles.join(' или ')}`
            });
        }
        next();
    };
};