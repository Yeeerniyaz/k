// src/controllers/media.controller.js
import { prisma } from '../server.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { AppError } from '../utils/AppError.js';
import {catchAsync} from '../utils/catchAsync.js';


// ==========================================
// 1. ПОЛУЧИТЬ ВСЕ МЕДИАФАЙЛЫ (ДЛЯ АДМИНКИ)
// ==========================================
export const getAllMedia = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30; // Грузим порциями, чтобы фронт не вис
    const skip = (page - 1) * limit;

    // Опциональный фильтр (например, ?type=image)
    const { type } = req.query;
    const where = type ? { mimetype: { contains: type } } : {};

    const [media, total] = await Promise.all([
        prisma.mediaLibrary.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } } // Кто загрузил
        }),
        prisma.mediaLibrary.count({ where })
    ]);

    res.status(200).json({
        status: 'success',
        results: media.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        data: media
    });
});

// ==========================================
// 2. ЗАГРУЗИТЬ ФАЙЛ
// ==========================================
export const uploadMedia = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Файл не найден. Пожалуйста, прикрепите файл.', 400));
    }

    // 1. Отправляем в Cloudinary через твой сервис
    const cloudData = await uploadImage(req.file.path, 'royal_banners/media');

    // 2. Записываем метаданные в Prisma
    const newMedia = await prisma.mediaLibrary.create({
        data: {
            filename: req.file.originalname,
            url: cloudData.url,
            publicId: cloudData.publicId,
            mimetype: req.file.mimetype,
            sizeBytes: cloudData.bytes,
            uploadedBy: req.user.id // Берется из auth.middleware
        }
    });

    // 3. Логируем действие для безопасности
    await prisma.auditLog.create({
        data: {
            userId: req.user.id,
            action: 'UPLOAD_MEDIA',
            entityType: 'MediaLibrary',
            entityId: newMedia.id,
            details: { filename: newMedia.filename, size: newMedia.sizeBytes }
        }
    });

    res.status(201).json({ status: 'success', data: newMedia });
});

// ==========================================
// 3. УДАЛИТЬ ФАЙЛ
// ==========================================
export const deleteMedia = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const media = await prisma.mediaLibrary.findUnique({ where: { id } });
    if (!media) {
        return next(new AppError('Медиафайл не найден', 404));
    }

    // 1. Удаляем из Cloudinary
    if (media.publicId) {
        const resourceType = media.mimetype.includes('video') ? 'video' :
            media.mimetype === 'application/pdf' ? 'raw' : 'image';
        await deleteImage(media.publicId, resourceType);
    }

    // 2. Удаляем из базы
    await prisma.mediaLibrary.delete({ where: { id } });

    // 3. Фиксируем удаление в аудите
    await prisma.auditLog.create({
        data: {
            userId: req.user.id,
            action: 'DELETE_MEDIA',
            entityType: 'MediaLibrary',
            entityId: id,
            details: { filename: media.filename, url: media.url }
        }
    });

    res.status(204).json({ status: 'success', data: null });
});