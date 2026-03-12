import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Указываем путь к нашей локальной папке с файлами
const uploadDir = path.join(__dirname, '../../uploads');

// ==========================================
// 1. ПОЛУЧИТЬ ВСЕ ФАЙЛЫ ИЗ МЕДИАБИБЛИОТЕКИ
// 🔥 SENIOR FEATURE: Прямое чтение файловой системы (Без нагрузки на БД)
// ==========================================
export const getAllMedia = catchAsync(async (req, res, next) => {
    // Проверяем, существует ли папка. Если нет — создаем, чтобы не было ошибки
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Читаем все файлы в директории
    const files = fs.readdirSync(uploadDir);

    // Собираем метаданные о каждом файле (размер, дата создания, ссылка)
    const mediaFiles = files.map(fileName => {
        const filePath = path.join(uploadDir, fileName);
        const stats = fs.statSync(filePath);

        return {
            name: fileName,
            url: `/uploads/${fileName}`,
            size: stats.size, // Размер в байтах
            createdAt: stats.birthtime, // Дата загрузки
            // Определяем тип файла по расширению
            type: fileName.match(/\.(mp4|avi|mov)$/i) ? 'video' :
                fileName.match(/\.(pdf|doc|docx)$/i) ? 'document' : 'image'
        };
    });

    // Сортируем файлы: самые новые сверху
    mediaFiles.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
        success: true,
        count: mediaFiles.length,
        data: mediaFiles
    });
});

// ==========================================
// 2. ЗАГРУЗИТЬ НОВЫЕ ФАЙЛЫ В МЕДИАБИБЛИОТЕКУ
// 🔥 SENIOR UPDATE: Поддержка массовой загрузки через Multer
// ==========================================
export const uploadMedia = catchAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        // Проверяем, вдруг передали только один файл (req.file)
        if (!req.file) {
            return next(new AppError('Пожалуйста, загрузите хотя бы один файл', 400));
        }
        // Приводим к массиву для единообразия обработки
        req.files = [req.file];
    }

    // Формируем список загруженных файлов
    const uploadedFiles = req.files.map(file => ({
        name: file.filename,
        url: `/uploads/${file.filename}`,
        size: file.size,
        type: file.mimetype.startsWith('video/') ? 'video' :
            file.mimetype.includes('pdf') ? 'document' : 'image'
    }));

    // 🔥 SENIOR SECURITY: Фиксируем загрузку в систему Аудита
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "UPLOAD_MEDIA",
                entityType: "MediaLibrary",
                details: {
                    uploadedCount: uploadedFiles.length,
                    files: uploadedFiles.map(f => f.name)
                }
            }
        }).catch(console.error); // Не блокируем ответ, если логгер выдаст ошибку
    }

    res.status(201).json({
        success: true,
        message: `Успешно загружено файлов: ${uploadedFiles.length}`,
        data: uploadedFiles
    });
});

// ==========================================
// 3. УДАЛИТЬ ФАЙЛ ИЗ МЕДИАБИБЛИОТЕКИ
// 🔥 SENIOR UPDATE: Физическое удаление файла с диска + Аудит
// ==========================================
export const deleteMedia = catchAsync(async (req, res, next) => {
    const { fileName } = req.params;

    if (!fileName) {
        return next(new AppError('Не указано имя файла для удаления', 400));
    }

    // Формируем полный путь к файлу
    const filePath = path.join(uploadDir, fileName);

    // Проверяем, существует ли файл на жестком диске
    if (!fs.existsSync(filePath)) {
        return next(new AppError('Файл не найден на сервере', 404));
    }

    // Безвозвратно удаляем файл
    fs.unlinkSync(filePath);

    // 🔥 SENIOR SECURITY: Фиксируем удаление файла (Защита от вандализма)
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_MEDIA",
                entityType: "MediaLibrary",
                details: { deletedFileName: fileName }
            }
        }).catch(console.error);
    }

    res.status(200).json({
        success: true,
        message: `Файл ${fileName} успешно удален`
    });
});