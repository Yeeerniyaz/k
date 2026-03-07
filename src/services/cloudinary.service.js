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
                // 🔥 SENIOR FIX v3: Күштеп JPG форматына айналдырамыз!
                // Бұл HEIC-ті де, WebP-ді де жұтып, барлық құрылғыға түсінікті JPG қылып шығарады.
                format: 'jpg', 
                quality: 'auto:good'
            },
            (error, result) => {
                if (error) {
                    console.error('💥 Ошибка Cloudinary (Upload):', error);
                    return reject(new AppError('Не удалось загрузить изображение в облако.', 500));
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