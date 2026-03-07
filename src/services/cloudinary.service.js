import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ==========================================
// 1. КОНФИГУРАЦИЯ CLOUDINARY
// ==========================================
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ ВНИМАНИЕ: Ключи Cloudinary не найдены в .env. Загрузка фото работать не будет!');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// 2. ФУНКЦИЯ ЗАГРУЗКИ (ИЗ ПАМЯТИ В ОБЛАКО)
// ==========================================
export const uploadImage = (imageBuffer, folderName = 'royal_banners_portfolio') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderName,
                // 🔥 SENIOR FIX v4: Полностью убираем принудительную конвертацию при загрузке.
                // Пусть Cloudinary сохраняет оригинальный файл (даже если это тяжелый HEIC с iPhone),
                // чтобы процесс загрузки не обрывался и не создавал "битые" файлы.
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) {
                    console.error('💥 Ошибка Cloudinary (Upload):', error);
                    return reject(new AppError('Не удалось загрузить изображение в облако. Проверьте настройки.', 500));
                }
                
                // 🔥 ГЛАВНЫЙ СЕНЬОРСКИЙ ТРЮК (ON-THE-FLY OPTIMIZATION):
                // Мы не ломаем файл при загрузке, но в базу данных сохраняем "умную" ссылку.
                // f_auto = Cloudinary сам решит: отдать айфону JPG, а андроиду WebP.
                // q_auto = автоматическое сжатие без потери качества.
                // w_1200 = ограничение ширины до 1200px (чтобы грузилось моментально).
                if (result.secure_url && result.secure_url.includes('/upload/')) {
                    result.secure_url = result.secure_url.replace(
                        '/upload/', 
                        '/upload/f_auto,q_auto,w_1200/'
                    );
                }
                
                resolve(result); 
            }
        );

        streamifier.createReadStream(imageBuffer).pipe(uploadStream);
    });
};

// ==========================================
// 3. ФУНКЦИЯ УДАЛЕНИЯ 
// ==========================================
export const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('💥 Ошибка Cloudinary (Delete):', error);
        throw new AppError('Не удалось удалить изображение из облака.', 500);
    }
};