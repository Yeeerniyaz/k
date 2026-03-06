import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Интегрируем нашу единую систему ошибок
import { AppError } from '../utils/AppError.js';

// Гарантируем правильную загрузку переменных окружения
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ==========================================
// 1. КОНФИГУРАЦИЯ CLOUDINARY (С ПРОВЕРКОЙ)
// ==========================================

// Fail-Fast подход: предупреждаем заранее, если ключей нет
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️  ВНИМАНИЕ: Ключи Cloudinary не найдены в .env. Загрузка фото работать не будет!');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// 2. ФУНКЦИЯ ЗАГРУЗКИ (ИЗ ПАМЯТИ В ОБЛАКО)
// ==========================================
// Принимает imageBuffer (из multer) и опционально имя папки
export const uploadImage = (imageBuffer, folderName = 'royal_banners_portfolio') => {
    return new Promise((resolve, reject) => {
        // Создаем потоковый загрузчик
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderName,
                // Автоматическая оптимизация: Cloudinary сам сожмет фото и переведет в WebP
                format: 'webp',
                quality: 'auto',
                fetch_format: 'auto'
            },
            (error, result) => {
                if (error) {
                    console.error('💥 Ошибка Cloudinary (Upload):', error);
                    // Вместо сырой ошибки бросаем AppError, чтобы error.middleware.js его корректно обработал
                    return reject(new AppError('Не удалось загрузить изображение в облако. Проверьте настройки Cloudinary.', 500));
                }
                resolve(result); // Возвращаем результат (там будет лежать secure_url картинки)
            }
        );

        // Превращаем наш Buffer из оперативной памяти в читаемый поток и отправляем в облако
        streamifier.createReadStream(imageBuffer).pipe(uploadStream);
    });
};

// ==========================================
// 3. ФУНКЦИЯ УДАЛЕНИЯ (ДЛЯ ПОЛНОГО КОНТРОЛЯ)
// ==========================================
export const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('💥 Ошибка Cloudinary (Delete):', error);
        // Бросаем AppError для единообразия
        throw new AppError('Не удалось удалить изображение из облака.', 500);
    }
};