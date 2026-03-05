import jwt from 'jsonwebtoken';

// ==========================================
// 1. ЗАЩИТА МАРШРУТОВ (ПРОВЕРКА ТОКЕНА)
// ==========================================
export const protect = async (req, res, next) => {
    try {
        let token;

        // Проверяем, передан ли токен в заголовках (стандартный паттерн Bearer Token)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Вытаскиваем сам токен (отделяем от слова "Bearer ")
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Вы не авторизованы. Пожалуйста, войдите в систему.'
            });
        }

        // Расшифровываем токен с помощью нашего секретного ключа
        const jwtSecret = process.env.JWT_SECRET || 'super_secret_royal_banners_key_2026';
        
        const decoded = jwt.verify(token, jwtSecret);

        // Помещаем данные пользователя (id, role, email) в объект запроса
        // Теперь в любом следующем контроллере мы сможем получить доступ к req.user
        req.user = decoded;

        // Пропускаем запрос дальше
        next();
    } catch (error) {
        // Если токен просрочен или подделан, ловим ошибку здесь
        return res.status(401).json({
            status: 'error',
            message: 'Недействительный или просроченный токен. Войдите заново.'
        });
    }
};

// ==========================================
// 2. КОНТРОЛЬ ДОСТУПА ПО РОЛЯМ (RBAC)
// ==========================================
// Эта функция принимает список разрешенных ролей (например: 'ADMIN', 'MANAGER')
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user берется из функции protect, которая должна выполниться ДО этой функции
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'У вас нет прав для выполнения этого действия.'
            });
        }
        
        // Если роль подходит - пропускаем дальше
        next();
    };
};