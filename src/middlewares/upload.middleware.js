import multer from 'multer';
import path from 'path';

// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Подключаем наш кастомный класс ошибок
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. КОНФИГУРАЦИЯ ХРАНИЛИЩА (STORAGE)
// ==========================================
// Мы используем memoryStorage, чтобы не засорять диск сервера временными файлами.
// Файл будет доступен в req.file.buffer для последующей отправки в Cloudinary.
const storage = multer.memoryStorage();

// ==========================================
// 2. ФИЛЬТР ФАЙЛОВ (FILE FILTER)
// ==========================================
// Сеньорский подход: принимаем ТОЛЬКО изображения. Никаких скриптов или PDF.
const fileFilter = (req, file, cb) => {
    // Допустимые расширения
    const filetypes = /jpeg|jpg|png|webp/;
    // Проверка расширения (toLowerCase для защиты от .PNG или .JPG)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Проверка MIME-типа (дополнительная защита от подмены расширения)
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        // Проверка пройдена, пропускаем файл
        return cb(null, true);
    } else {
        // 🔥 ИСПРАВЛЕНИЕ: Используем AppError (статус 400 - Bad Request).
        // Теперь эта ошибка аккуратно перехватится нашим error.middleware.js
        cb(new AppError('Разрешены только изображения (jpeg, jpg, png, webp)!', 400), false);
    }
};

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ MULTER
// ==========================================
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Лимит: 5MB (оптимально для баннеров и портфолио)
    },
    fileFilter: fileFilter
});

// Экспортируем по дефолту
export default upload;