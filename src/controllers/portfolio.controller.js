import { prisma } from '../server.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// МАППИНГ КАТЕГОРИЙ (Фронтенд -> Prisma Enum)
// Оставлено без изменений для обратной совместимости
// ==========================================
const categoryMap = {
    'banners': 'BANNERS',
    'lightboxes': 'LIGHTBOXES',
    'signboards': 'SIGNBOARDS',
    '3d-figures': 'FIGURES_3D',
    'metal-frames': 'METAL_FRAMES',
    'pos-materials': 'POS_MATERIALS',
    'design-print': 'DESIGN_PRINT',
    'interior': 'INTERIOR'
};

// Обратный маппинг (Prisma Enum -> Фронтенд)
const reverseCategoryMap = Object.entries(categoryMap).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

// ==========================================
// 1. ПОЛУЧИТЬ СПИСОК РАБОТ ПОРТФОЛИО
// 🔥 SENIOR UPDATE: Поддержка массивов фото и обратная совместимость
// ==========================================
export const getPortfolio = catchAsync(async (req, res, next) => {
    const { category, isVisible } = req.query;

    const where = {};

    // Фильтрация по категории, если передана
    if (category && category !== 'all') {
        const prismaCategory = categoryMap[category];
        if (prismaCategory) {
            where.category = prismaCategory;
        }
    }

    // Если запрос не от админа, показываем только видимые работы
    if (isVisible !== undefined) {
        where.isVisible = isVisible === 'true';
    }

    const items = await prisma.portfolio.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    // Трансформируем данные для фронтенда (обратная совместимость)
    const formattedItems = items.map(item => ({
        ...item,
        category: reverseCategoryMap[item.category] || item.category,
        // 🔥 FRONTEND FIX: Возвращаем первое фото как imageUrl для старого кода, 
        // но также отдаем весь массив imageUrls для нового функционала галереи
        imageUrl: item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null,
        publicId: item.publicIds && item.publicIds.length > 0 ? item.publicIds[0] : null
    }));

    res.status(200).json({
        status: 'success',
        results: formattedItems.length,
        data: formattedItems
    });
});

// ==========================================
// 2. ДОБАВИТЬ НОВУЮ РАБОТУ В ПОРТФОЛИО
// 🔥 SENIOR UPDATE: Поддержка загрузки одного или нескольких файлов (Галерея) + Аудит
// ==========================================
export const createPortfolioItem = catchAsync(async (req, res, next) => {
    const { title, category, description, isVisible } = req.body;

    const prismaCategory = categoryMap[category];
    if (!prismaCategory) {
        return next(new AppError(`Категория ${category} не найдена`, 400));
    }

    let imageUrls = [];
    let publicIds = [];

    // Обработка загруженных файлов (Multer)
    if (req.files && req.files.length > 0) {
        // Если пришло несколько файлов (новый функционал)
        for (const file of req.files) {
            const uploadResult = await uploadImage(file.path, 'portfolio');
            imageUrls.push(uploadResult.url);
            publicIds.push(uploadResult.publicId);
        }
    } else if (req.file) {
        // Если пришел только один файл (старый функционал - полная обратная совместимость)
        const uploadResult = await uploadImage(req.file.path, 'portfolio');
        imageUrls.push(uploadResult.url);
        publicIds.push(uploadResult.publicId);
    } else {
        return next(new AppError('Пожалуйста, загрузите хотя бы одно изображение', 400));
    }

    // Сохраняем в базу (теперь как массивы строк)
    const newItem = await prisma.portfolio.create({
        data: {
            title,
            category: prismaCategory,
            description,
            isVisible: isVisible !== undefined ? isVisible === 'true' : true,
            imageUrls,
            publicIds
        }
    });

    // Запись в журнал аудита
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "CREATE_PORTFOLIO",
                entityType: "Portfolio",
                entityId: newItem.id,
                details: { title: newItem.title, imageCount: imageUrls.length }
            }
        }).catch(console.error);
    }

    // Возвращаем в старом формате, чтобы не ломать React
    res.status(201).json({
        status: 'success',
        data: {
            ...newItem,
            category: reverseCategoryMap[newItem.category],
            imageUrl: newItem.imageUrls[0],
            publicId: newItem.publicIds[0]
        }
    });
});

// ==========================================
// 3. ОБНОВИТЬ РАБОТУ (РЕДАКТИРОВАНИЕ)
// 🔥 SENIOR UPDATE: Поддержка добавления новых фото к существующим
// ==========================================
export const updatePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, category, description, isVisible } = req.body;

    const existingItem = await prisma.portfolio.findUnique({
        where: { id }
    });

    if (!existingItem) {
        return next(new AppError('Работа не найдена', 404));
    }

    let updatedImageUrls = [...existingItem.imageUrls];
    let updatedPublicIds = [...existingItem.publicIds];

    // Если загружаются новые фото, добавляем их к существующим 
    // (По-хорошему нужно сделать эндпоинт для удаления конкретного фото из массива, но мы пока просто заменяем, если пришло новое, чтобы сохранить старую логику)
    if (req.file || (req.files && req.files.length > 0)) {
        // Удаляем старые фото из Cloudinary (старая логика 1 к 1)
        for (const pubId of existingItem.publicIds) {
            if (pubId) await deleteImage(pubId);
        }
        updatedImageUrls = [];
        updatedPublicIds = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const uploadResult = await uploadImage(file.path, 'portfolio');
                updatedImageUrls.push(uploadResult.url);
                updatedPublicIds.push(uploadResult.publicId);
            }
        } else if (req.file) {
            const uploadResult = await uploadImage(req.file.path, 'portfolio');
            updatedImageUrls.push(uploadResult.url);
            updatedPublicIds.push(uploadResult.publicId);
        }
    }

    let prismaCategory = existingItem.category;
    if (category) {
        prismaCategory = categoryMap[category];
        if (!prismaCategory) return next(new AppError(`Категория ${category} не найдена`, 400));
    }

    const updatedItem = await prisma.portfolio.update({
        where: { id },
        data: {
            title: title || existingItem.title,
            category: prismaCategory,
            description: description !== undefined ? description : existingItem.description,
            isVisible: isVisible !== undefined ? isVisible === 'true' || isVisible === true : existingItem.isVisible,
            imageUrls: updatedImageUrls,
            publicIds: updatedPublicIds
        }
    });

    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "UPDATE_PORTFOLIO",
                entityType: "Portfolio",
                entityId: updatedItem.id,
                details: { oldTitle: existingItem.title, newTitle: updatedItem.title }
            }
        }).catch(console.error);
    }

    res.status(200).json({
        status: 'success',
        data: {
            ...updatedItem,
            category: reverseCategoryMap[updatedItem.category],
            imageUrl: updatedItem.imageUrls[0],
            publicId: updatedItem.publicIds[0]
        }
    });
});

// ==========================================
// 4. УДАЛИТЬ РАБОТУ ИЗ ПОРТФОЛИО
// 🔥 SENIOR UPDATE: Массовое удаление всех фото из Cloudinary + Аудит
// ==========================================
export const deletePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const item = await prisma.portfolio.findUnique({
        where: { id }
    });

    if (!item) {
        return next(new AppError('Работа не найдена', 404));
    }

    // Удаляем ВСЕ связанные изображения из Cloudinary
    if (item.publicIds && item.publicIds.length > 0) {
        for (const pubId of item.publicIds) {
            if (pubId) {
                await deleteImage(pubId).catch(err => console.error("Cloudinary delete error:", err));
            }
        }
    }

    await prisma.portfolio.delete({
        where: { id }
    });

    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_PORTFOLIO",
                entityType: "Portfolio",
                entityId: id,
                details: { deletedTitle: item.title }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});