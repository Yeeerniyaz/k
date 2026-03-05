import multer from 'multer';

// 1. Настройка хранилища
// Мы используем memoryStorage, чтобы файл сохранялся в оперативную память (Buffer).
const multerStorage = multer.memoryStorage();

// 2. Фильтрация файлов
// Проверяем mimetype, чтобы убедиться, что пользователь грузит именно картинку
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Разрешена загрузка только изображений (JPG, PNG, WEBP)'), false);
    }
};

// 3. Экспорт Middleware
// 🔥 ИМЕННО ЭТОТ ЭКСПОРТ ИЩЕТ ТВОЙ ROUTER: export const uploadPhoto
export const uploadPhoto = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10 МБ 
    }
});