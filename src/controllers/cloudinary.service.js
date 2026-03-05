import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// 1. КОНФИГУРАЦИЯ CLOUDINARY
// ==========================================
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
                    console.error('💥 Ошибка загрузки в Cloudinary:', error);
                    return reject(error);
                }
                resolve(result); // Возвращаем результат (там будет лежать url картинки)
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
        console.error('💥 Ошибка удаления из Cloudinary:', error);
        throw error;
    }
};