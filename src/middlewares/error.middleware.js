import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. СПЕЦИФИЧЕСКИЕ ОБРАБОТЧИКИ ОШИБОК (SENIOR LEVEL)
// ==========================================

// Ошибка уникальности базы данных Prisma (например, попытка зарегистрировать занятый email)
const handlePrismaUniqueConstraint = (err) => {
    // Prisma возвращает поле meta.target с указанием поля, вызвавшего ошибку
    const field = err.meta && err.meta.target ? err.meta.target.join(', ') : 'поле';
    const message = `Запись с таким значением (${field}) уже существует. Пожалуйста, используйте другое значение.`;
    return new AppError(message, 400);
};

// Запись не найдена в базе данных (Prisma Error P2025)
const handlePrismaRecordNotFound = () => {
    return new AppError('Запрашиваемая запись не найдена в базе данных.', 404);
};

// Ошибка валидации типов Prisma (передали строку вместо числа и т.д.)
const handlePrismaValidationError = (err) => {
    return new AppError(`Некорректные данные для базы данных. Проверьте правильность заполнения полей.`, 400);
};

// Ошибки авторизации JWT
const handleJWTError = () => new AppError('Неверный токен доступа. Пожалуйста, авторизуйтесь заново.', 401);
const handleJWTExpiredError = () => new AppError('Срок действия вашего токена истек. Пожалуйста, войдите в систему снова.', 401);

// ==========================================
// 2. ОТВЕТ В РЕЖИМЕ РАЗРАБОТКИ (DEVELOPMENT)
// ==========================================
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack // Отдаем полный путь ошибки для удобного дебага
    });
};

// ==========================================
// 3. ОТВЕТ В РАБОЧЕЙ СРЕДЕ (PRODUCTION)
// ==========================================
const sendErrorProd = (err, res) => {
    // Операционные ошибки (Ожидаемые, например: неверный пароль, файл слишком большой)
    // Мы доверяем этим ошибкам и смело показываем их сообщение клиенту
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } 
    // Программные или неизвестные ошибки (Баги в коде, отвал базы данных и т.д.)
    // Мы НЕ должны "сливать" детали нашей инфраструктуры клиенту
    else {
        // 1. Логируем критическую ошибку в консоль сервера для DevOps-инженера
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА 💥', err);

        // 2. Отправляем клиенту универсальное безопасное сообщение
        res.status(500).json({
            status: 'error',
            message: 'Что-то пошло не так на сервере. Мы уже работаем над устранением проблемы.'
        });
    }
};

// ==========================================
// 4. ГЛАВНЫЙ ЭКСПОРТНЫЙ MIDDLEWARE (GLOBAL ERROR HANDLER)
// ==========================================
export const errorHandler = (err, req, res, next) => {
    // Задаем базовые значения, если они не были переданы
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Разделяем логику в зависимости от окружения (переменная задается в .env)
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        // Клонируем объект ошибки для безопасных мутаций
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.code = err.code;

        // 🔥 СЕНЬОРСКИЙ ПЕРЕХВАТЧИК: Преобразуем "страшные" ошибки базы данных в понятные AppError
        
        // Prisma: Нарушение уникального ограничения
        if (error.code === 'P2002') error = handlePrismaUniqueConstraint(error);
        
        // Prisma: Запись не найдена
        if (error.code === 'P2025') error = handlePrismaRecordNotFound(error);
        
        // Prisma: Ошибки валидации
        if (err.message && err.message.includes('PrismaClientValidationError')) error = handlePrismaValidationError(error);

        // JWT: Ошибки верификации токенов
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};