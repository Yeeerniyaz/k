import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 🔥 SENIOR FEATURE: Умная очистка файлов с диска (Garbage Collector)
// ==========================================
// Безопасно удаляет файл из локальной папки uploads, чтобы сервер не забивался мусором
const deleteLocalFile = (fileUrl) => {
    try {
        if (!fileUrl) return;

        // Извлекаем только имя файла из URL
        const fileName = fileUrl.split('/').pop();
        if (!fileName) return;

        const filePath = path.join(__dirname, '../../uploads', fileName);

        // Проверяем, существует ли файл, и физически его удаляем
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ [GC] Локальный файл удален: ${fileName}`);
        }
    } catch (err) {
        // Логируем ошибку, но не "роняем" сервер
        console.error(`⚠️ Ошибка при удалении локального файла ${fileUrl}:`, err);
    }
};

// ==========================================
// МАППИНГ КАТЕГОРИЙ (Фронтенд -> Prisma Enum)
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

const reverseCategoryMap = Object.entries(categoryMap).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

// ==========================================
// 1. ПОЛУЧИТЬ СПИСОК РАБОТ ПОРТФОЛИО
// ==========================================
export const getPortfolio = catchAsync(async (req, res, next) => {
    const { category, isVisible } = req.query;

    const where = {};

    // Фильтрация по категории с защитой от регистра
    if (category && category.toLowerCase() !== 'all') {
        const normalizedCategory = category.toLowerCase().replace('_', '-');
        const prismaCategory = categoryMap[normalizedCategory];
        if (prismaCategory) {
            where.category = prismaCategory;
        }
    }

    // Фильтрация по видимости
    if (isVisible !== undefined) {
        where.isVisible = isVisible === 'true';
    }

    // 🔥 SENIOR FIX: Обращаемся к правильной модели Portfolio (а не portfolioItem)
    const portfolioItems = await prisma.portfolio.findMany({
        where,
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Форматируем ответ для фронтенда
    const formattedItems = portfolioItems.map(item => ({
        ...item,
        category: reverseCategoryMap[item.category] || item.category
    }));

    res.status(200).json({
        success: true,
        count: formattedItems.length,
        data: formattedItems
    });
});

// ==========================================
// 2. ПОЛУЧИТЬ ОДНУ РАБОТУ ИЗ ПОРТФОЛИО
// ==========================================
export const getPortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const item = await prisma.portfolio.findUnique({
        where: { id }
    });

    if (!item) {
        return next(new AppError('Работа не найдена', 404));
    }

    // Форматируем категорию для ответа
    const formattedItem = {
        ...item,
        category: reverseCategoryMap[item.category] || item.category
    };

    res.status(200).json({
        success: true,
        data: formattedItem
    });
});

// ==========================================
// 3. ДОБАВИТЬ НОВУЮ РАБОТУ В ПОРТФОЛИО
// ==========================================
export const createPortfolioItem = catchAsync(async (req, res, next) => {
    const { title, description, category, isVisible } = req.body;

    // Проверка обязательных полей
    if (!title || !category) {
        return next(new AppError('Название и категория обязательны', 400));
    }

    // Проверка категории
    const normalizedCategory = category.toLowerCase().replace('_', '-');
    const prismaCategory = categoryMap[normalizedCategory];
    if (!prismaCategory) {
        return next(new AppError(`Неверная категория. Доступные: ${Object.keys(categoryMap).join(', ')}`, 400));
    }

    // Обрабатываем файлы, сохраненные через multer (локально)
    let imageUrls = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.file) {
        imageUrls = [`/uploads/${req.file.filename}`];
    }

    // 🔥 SENIOR FIX: Сохраняем в массив imageUrls согласно схеме БД
    const newItem = await prisma.portfolio.create({
        data: {
            title,
            description: description || '',
            category: prismaCategory,
            isVisible: isVisible !== undefined ? (isVisible === 'true' || isVisible === true) : true,
            imageUrls
        }
    });

    // Фиксируем создание работы в Аудите
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "CREATE_PORTFOLIO_ITEM",
                entityType: "Portfolio",
                entityId: newItem.id,
                details: { title: newItem.title }
            }
        }).catch(console.error);
    }

    res.status(201).json({
        success: true,
        data: {
            ...newItem,
            category: reverseCategoryMap[newItem.category] || newItem.category
        }
    });
});

// ==========================================
// 4. ОБНОВИТЬ СУЩЕСТВУЮЩУЮ РАБОТУ
// ==========================================
export const updatePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, category, isVisible } = req.body;

    // Проверяем, существует ли работа
    const existingItem = await prisma.portfolio.findUnique({
        where: { id }
    });

    if (!existingItem) {
        return next(new AppError('Работа не найдена', 404));
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isVisible !== undefined) updateData.isVisible = (isVisible === 'true' || isVisible === true);

    // Обработка категории
    if (category) {
        const normalizedCategory = category.toLowerCase().replace('_', '-');
        const prismaCategory = categoryMap[normalizedCategory];
        if (!prismaCategory) {
            return next(new AppError('Неверная категория', 400));
        }
        updateData.category = prismaCategory;
    }

    // Обработка новых изображений
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/${file.filename}`);
        updateData.imageUrls = newImages;

        // Удаляем старые локальные файлы
        if (existingItem.imageUrls && existingItem.imageUrls.length > 0) {
            existingItem.imageUrls.forEach(img => deleteLocalFile(img));
        }
    } else if (req.file) {
        const newImageUrl = `/uploads/${req.file.filename}`;
        updateData.imageUrls = [newImageUrl];

        // Удаляем старые локальные файлы
        if (existingItem.imageUrls && existingItem.imageUrls.length > 0) {
            existingItem.imageUrls.forEach(img => deleteLocalFile(img));
        }
    }

    const updatedItem = await prisma.portfolio.update({
        where: { id },
        data: updateData
    });

    // Фиксируем редактирование в Аудите
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "UPDATE_PORTFOLIO_ITEM",
                entityType: "Portfolio",
                entityId: updatedItem.id,
                details: { updatedTitle: updatedItem.title }
            }
        }).catch(console.error);
    }

    res.status(200).json({
        success: true,
        data: {
            ...updatedItem,
            category: reverseCategoryMap[updatedItem.category] || updatedItem.category
        }
    });
});

// ==========================================
// 5. УДАЛИТЬ РАБОТУ ИЗ ПОРТФОЛИО
// ==========================================
export const deletePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const item = await prisma.portfolio.findUnique({
        where: { id }
    });

    if (!item) {
        return next(new AppError('Работа не найдена', 404));
    }

    // Очищаем жесткий диск сервера от связанных файлов
    if (item.imageUrls && item.imageUrls.length > 0) {
        item.imageUrls.forEach(img => deleteLocalFile(img));
    }

    // Удаляем запись из базы
    await prisma.portfolio.delete({
        where: { id }
    });

    // Записываем действие в AuditLog
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_PORTFOLIO_ITEM",
                entityType: "Portfolio",
                entityId: id,
                details: { deletedTitle: item.title }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});