// ==========================================
// ГЛОБАЛЬНЫЙ КЛАСС ОШИБОК ROYAL BANNERS API
// ==========================================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // Ошибки 4xx - это 'fail' (вина клиента, неверный ввод), 5xx - 'error' (ошибка на сервере)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Флаг, который показывает, что мы сами предвидели эту ошибку (например, неверный пароль)
    // Если этого флага нет, значит ошибка системная (баг в коде, упала БД и т.д.)
    this.isOperational = true;

    // Сохраняем стек вызовов (откуда прилетела ошибка), но исключаем из него сам этот конструктор
    Error.captureStackTrace(this, this.constructor);
  }
}

// 🔥 SENIOR FIX: Делаем экспорт дефолтным, чтобы import AppError from "./AppError.js" работал правильно
export default AppError;