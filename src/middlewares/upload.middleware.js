import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Подключаем наш кастомный класс ошибок
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 SENIOR FIX: Защита от падения сервера.
// Автоматически создаем директорию для временного хранения файлов (если ее вдруг удалили из репозитория)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// 1. КОНФИГУРАЦИЯ ХРАНИЛИЩА (STORAGE)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Все файлы временно сохраняются на диск перед загрузкой в Cloudinary/S3
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Генерируем 100% уникальное имя файла, чтобы избежать перезаписи 
        // при одновременной загрузке файлов с одинаковыми именами от разных пользователей.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Убираем пробелы и спецсимволы из оригинального имени для безопасности
        const safeOriginalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
        
        cb(null, `${safeOriginalName}-${uniqueSuffix}${ext}`);
    }
});

// ==========================================
// 2. ФИЛЬТРАЦИЯ ФАЙЛОВ (FILE FILTER)
// 🔥 SENIOR UPDATE: Расширена поддержка для новой MediaLibrary (Видео, Документы, SVG)
// ==========================================
const fileFilter = (req, file, cb) => {
    // Регулярные выражения для проверки расширений
    // 1. Изображения (включая современные WebP и векторные SVG для иконок сайта)
    const allowedImageTypes = /jpeg|jpg|png|webp|gif|svg/;
    // 2. Медиа и документы для новой CMS
    const allowedMediaTypes = /mp4|pdf|doc|docx/;

    const ext = path.extname(file.originalname).toLowerCase();
    
    // Проверяем как расширение, так и реальный MIME-тип файла
    const extnameIsValid = allowedImageTypes.test(ext) || allowedMediaTypes.test(ext);
    const mimetypeIsValid = allowedImageTypes.test(file.mimetype) || allowedMediaTypes.test(file.mimetype);

    if (mimetypeIsValid && extnameIsValid) {
        return cb(null, true);
    } else {
        // Передаем ошибку в наш глобальный ErrorHandler
        return cb(new AppError('Ошибка загрузки: Разрешены только изображения (JPEG, PNG, WEBP, SVG), видео (MP4) или документы (PDF, DOCX)!', 400), false);
    }
};

// ==========================================
// 3. ИНИЦИАЛИЗАЦИЯ MULTER
// 🔥 SENIOR UPDATE: Лимит увеличен для поддержки тяжелого Enterprise контента
// ==========================================
const upload = multer({
    storage: storage,
    limits: { 
        // Старый лимит был слишком мал для видео и больших PDF-презентаций
        // Увеличили до 50MB на каждый файл
        fileSize: 50 * 1024 * 1024 
    },
    fileFilter: fileFilter
});

export default upload;