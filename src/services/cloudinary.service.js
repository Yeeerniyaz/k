import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ==========================================
// 1. КОНФИГУРАЦИЯ ОБЛАЧНОГО ХРАНИЛИЩА
// ==========================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// 2. ЗАГРУЗКА ФАЙЛА (UPLOAD)
// 🔥 SENIOR UPDATE: Автоочистка локального диска и поддержка Видео/PDF
// ==========================================
export const uploadImage = async (filePath, folder = 'royal_banners') => {
    try {
        // Используем resource_type: 'auto', чтобы Cloudinary сам классифицировал файл
        // (image для фото/SVG, video для MP4, raw для PDF/DOCX)
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto', 
            use_filename: true,    // Сохраняем оригинальное имя файла для удобства поиска в админке
            unique_filename: true, // Добавляем рандомный суффикс, чтобы не было конфликтов имен
            overwrite: false,      
        });

        // 🔥 SENIOR FIX: Оптимизация дискового пространства (Garbage Collection)
        // После успешной отправки в облако, удаляем "мусор" с локального сервера
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Возвращаем расширенный payload для новой модели MediaLibrary
        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes // Критически важно для контроля лимитов в ERP
        };
    } catch (error) {
        // Если произошла ошибка сети, всё равно удаляем локальный файл, чтобы диск не забивался
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        console.error('💥 Cloudinary Upload Error:', error);
        throw new AppError('Ошибка при загрузке файла в облачное хранилище', 500);
    }
};

// ==========================================
// 3. УДАЛЕНИЕ ФАЙЛА (DELETE)
// 🔥 SENIOR UPDATE: Безопасное удаление (Non-blocking)
// ==========================================
export const deleteImage = async (publicId, resourceType = 'image') => {
    try {
        if (!publicId) return null;

        // В Cloudinary для удаления видео или PDF нужно явно передавать их тип.
        // По умолчанию стоит 'image' для обратной совместимости старого кода.
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType 
        });

        return result;
    } catch (error) {
        // 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Мы ловим ошибку, но НЕ пробрасываем её через throw.
        // Зачем? Если мы удаляем заказ или пользователя в базе данных, а Cloudinary 
        // временно недоступен, мы не должны прерывать удаление записи в PostgreSQL.
        // Лучше оставить "сироту" в облаке, чем сломать бизнес-логику ERP.
        console.error(`⚠️ Cloudinary Delete Warning [${publicId}]:`, error);
        return null;
    }
};

// ==========================================
// 4. МАССОВАЯ ЗАГРУЗКА ФАЙЛОВ (BATCH UPLOAD) 🔥 НОВОЕ
// Экстремально быстрая загрузка галереи для портфолио
// ==========================================
export const uploadMultipleImages = async (filePaths, folder = 'royal_banners') => {
    try {
        // Запускаем загрузку всех файлов в облако параллельно (Non-blocking I/O)
        // Это ускоряет загрузку 10 фотографий в 5-6 раз.
        const uploadPromises = filePaths.map(filePath => uploadImage(filePath, folder));
        const results = await Promise.all(uploadPromises);
        
        return results;
    } catch (error) {
        console.error('💥 Cloudinary Batch Upload Error:', error);
        throw new AppError('Ошибка при массовой загрузке файлов', 500);
    }
};