import multer from 'multer';
import path from 'path';

// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Подключаем наш кастомный класс ошибок
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. КОНФИГУРАЦИЯ ХРАНИЛИЩА (STORAGE)
// ==========================================
const storage = multer.memoryStorage();

// ==========================================
// 2. ФИЛЬТР ФАЙЛОВ (FILE FILTER)
// ==========================================
const fileFilter = (req, file, cb) => {
    // 🔥 SENIOR FIX: Добавили поддержку HEIC/HEIF (форматы современных смартфонов)
    const filetypes = /jpeg|jpg|png|webp|heic|heif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    // Mimetype у HEIC может отличаться, поэтому делаем проверку мягче
    const mimetype = filetypes.test(file.mimetype) || file.mimetype.includes('octet-stream');

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new AppError('Разрешены только изображения (jpeg, jpg, png, webp, heic)!', 400), false);
    }
};

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ MULTER
// ==========================================
const upload = multer({
    storage: storage,
    limits: {
        // 🔥 SENIOR FIX: Увеличили лимит до 20MB, так как фото с камер телефонов весят много!
        fileSize: 20 * 1024 * 1024,
    },
    fileFilter: fileFilter
});

export default upload;