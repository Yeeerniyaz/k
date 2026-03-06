import multer from 'multer';
import path from 'path';

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
    // Проверка расширения
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Проверка MIME-типа
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Ошибка: Разрешены только изображения (jpeg, jpg, png, webp)!'), false);
    }
};

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ MULTER
// ==========================================
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Лимит: 5MB (достаточно для баннеров высокого качества)
    },
    fileFilter: fileFilter
});

// 🔥 ВОТ ОНО: Экспортируем по дефолту, чтобы SyntaxError исчезла
export default upload;