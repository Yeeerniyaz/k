import { prisma } from '../server.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// Маппинг категорий (перевод с фронтенда на Prisma Enum)
const categoryMap = {
    'banners': 'BANNERS',
    'lightboxes': 'LIGHTBOXES',
    'signboards': 'SIGNBOARDS',
    '3d-figures': 'FIGURES_3D',
    'metal-frames': 'METAL_FRAMES',
    'pos-materials': 'POS_MATERIALS',
    'interior': 'INTERIOR',
    'design_print': 'DESIGN_PRINT'
};

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ РАБОТ ДЛЯ ВИТРИНЫ
// ==========================================
export const getPortfolio = catchAsync(async (req, res, next) => {
    const works = await prisma.portfolio.findMany({
        where: { isVisible: true },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        status: 'success',
        results: works.length,
        data: works
    });
});

// ==========================================
// 2. ДОБАВЛЕНИЕ НОВОЙ РАБОТЫ (С НЕСКОЛЬКИМИ ФОТО)
// ==========================================
export const addPortfolioItem = catchAsync(async (req, res, next) => {
    const { title, category, description } = req.body;

    const dbCategory = categoryMap[category] || 'BANNERS';

    let imageUrls = [];
    let publicIds = [];

    // 🔥 SENIOR ФИЧА: Параллельная загрузка нескольких файлов в Cloudinary
    if (req.files && req.files.length > 0) {
        // Запускаем все загрузки одновременно для скорости
        const uploadPromises = req.files.map(file => uploadImage(file.buffer, 'royal_banners_portfolio'));
        const results = await Promise.all(uploadPromises);

        // Разделяем результаты на ссылки и ID
        imageUrls = results.map(result => result.secure_url);
        publicIds = results.map(result => result.public_id);
    }
    // Обратная совместимость: если прислали просто ссылки строкой или массивом
    else if (req.body.imageUrls) {
        imageUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
    } else if (req.body.imageUrl) {
        imageUrls = [req.body.imageUrl];
    }

    if (!title || !category || imageUrls.length === 0) {
        return next(new AppError('Название, категория и минимум одна картинка обязательны', 400));
    }

    // Сохраняем в базу (теперь это массивы)
    const portfolioItem = await prisma.portfolio.create({
        data: {
            title,
            category: dbCategory,
            imageUrls, // МАССИВ ССЫЛОК
            publicIds, // МАССИВ ID для удаления
            description
        }
    });

    res.status(201).json({
        status: 'success',
        success: true,
        message: 'Работа успешно добавлена в портфолио',
        data: portfolioItem
    });
});

// ==========================================
// 3. УДАЛЕНИЕ РАБОТЫ (ИЗ БАЗЫ И ОБЛАКА)
// ==========================================
export const deletePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const existingItem = await prisma.portfolio.findUnique({
        where: { id }
    });

    if (!existingItem) {
        return next(new AppError('Работа не найдена или уже удалена', 404));
    }

    // 🔥 SENIOR ФИЧА: Удаляем ВСЕ картинки из Cloudinary (если они там были)
    if (existingItem.publicIds && existingItem.publicIds.length > 0) {
        try {
            // Параллельно удаляем все связанные фото
            const deletePromises = existingItem.publicIds.map(pubId => deleteImage(pubId));
            await Promise.all(deletePromises);
        } catch (err) {
            console.error("Ошибка при удалении картинок из Cloudinary:", err);
            // Даже если облако затупило, базу всё равно чистим
        }
    } else if (existingItem.publicId) {
        // Поддержка старых записей, где был только один publicId
        try {
            await deleteImage(existingItem.publicId);
        } catch (err) {
            console.error("Ошибка при удалении старой картинки:", err);
        }
    }

    await prisma.portfolio.delete({
        where: { id }
    });

    res.status(200).json({
        status: 'success',
        success: true,
        message: 'Работа успешно удалена из портфолио'
    });
});

// ==========================================
// 4. ОБНОВЛЕНИЕ ИНФОРМАЦИИ (БЕЗ ФОТО)
// ==========================================
export const updatePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, category, description, isVisible } = req.body;

    const existingItem = await prisma.portfolio.findUnique({ where: { id } });
    if (!existingItem) {
        return next(new AppError('Работа не найдена', 404));
    }

    const updatedItem = await prisma.portfolio.update({
        where: { id },
        data: {
            title: title !== undefined ? title : undefined,
            category: category ? categoryMap[category] : undefined,
            description: description !== undefined ? description : undefined,
            isVisible: isVisible !== undefined ? Boolean(isVisible) : undefined
        }
    });

    res.status(200).json({
        status: 'success',
        success: true,
        message: 'Данные работы обновлены',
        data: updatedItem
    });
});