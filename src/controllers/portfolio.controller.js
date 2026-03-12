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
        
        // Извлекаем только имя файла из URL (например, из /uploads/banner-123.jpg берем banner-123.jpg)
        const fileName = fileUrl.split('/').pop();
        if (!fileName) return;

        const filePath = path.join(__dirname, '../../uploads', fileName);
        
        // Проверяем, существует ли файл, и физически его удаляем
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        // Логируем ошибку, но не "роняем" сервер, чтобы удаление из БД не прервалось
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

    // Фильтрация по категории
    if (category && category !== 'all') {
        const prismaCategory = categoryMap[category];
        if (prismaCategory) {
            where.category = prismaCategory;
        }
    }

    // Фильтрация по видимости
    if (isVisible !== undefined) {
        where.isVisible = isVisible === 'true';
    }

    const portfolioItems = await prisma.portfolioItem.findMany({
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
// 2. ПОЛУЧИТЬ ОДНУ РАБОТУ ИЗ ПОРТФОЛИО (🔥 ВОССТАНОВЛЕНО)
// ==========================================
export const getPortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const item = await prisma.portfolioItem.findUnique({
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
    const { title, description, category, clientName, isVisible } = req.body;

    // Проверка обязательных полей
    if (!title || !category) {
        return next(new AppError('Название и категория обязательны', 400));
    }

    // Проверка категории
    const prismaCategory = categoryMap[category];
    if (!prismaCategory) {
        return next(new AppError(`Неверная категория. Доступные: ${Object.keys(categoryMap).join(', ')}`, 400));
    }

    // Обрабатываем файлы, сохраненные через multer (локально)
    let imageUrl = '';
    let images = []; 

    // Если загружено несколько файлов (массив)
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => `/uploads/${file.filename}`);
        imageUrl = images[0]; // Первая картинка становится главной для обратной совместимости
    } 
    // Если загружен только один файл (старый формат)
    else if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
        images = [imageUrl];
    }

    // Поле cloudinaryId мы убрали из схемы БД ранее, поэтому сохраняем только локальные URL
    const newItem = await prisma.portfolioItem.create({
        data: {
            title,
            description: description || '',
            category: prismaCategory,
            clientName: clientName || null,
            isVisible: isVisible !== undefined ? isVisible === 'true' : true,
            imageUrl: imageUrl || '', 
            images: images 
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
    const { title, description, category, clientName, isVisible } = req.body;

    // Проверяем, существует ли работа
    const existingItem = await prisma.portfolioItem.findUnique({
        where: { id }
    });

    if (!existingItem) {
        return next(new AppError('Работа не найдена', 404));
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (isVisible !== undefined) updateData.isVisible = isVisible === 'true' || isVisible === true;

    // Обработка категории
    if (category) {
        const prismaCategory = categoryMap[category];
        if (!prismaCategory) {
            return next(new AppError('Неверная категория', 400));
        }
        updateData.category = prismaCategory;
    }

    // Обработка нового изображения (или массива изображений)
    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/${file.filename}`);
        updateData.imageUrl = newImages[0];
        updateData.images = newImages;

        // Удаляем старые локальные файлы
        if (existingItem.images && existingItem.images.length > 0) {
            existingItem.images.forEach(img => deleteLocalFile(img));
        } else if (existingItem.imageUrl) {
            deleteLocalFile(existingItem.imageUrl);
        }
    } else if (req.file) {
        const newImageUrl = `/uploads/${req.file.filename}`;
        updateData.imageUrl = newImageUrl;
        updateData.images = [newImageUrl];

        // Удаляем старые локальные файлы
        if (existingItem.images && existingItem.images.length > 0) {
            existingItem.images.forEach(img => deleteLocalFile(img));
        } else if (existingItem.imageUrl) {
            deleteLocalFile(existingItem.imageUrl);
        }
    }

    const updatedItem = await prisma.portfolioItem.update({
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

    const item = await prisma.portfolioItem.findUnique({
        where: { id }
    });

    if (!item) {
        return next(new AppError('Работа не найдена', 404));
    }

    // Очищаем жесткий диск сервера от связанных файлов
    if (item.images && item.images.length > 0) {
        item.images.forEach(img => deleteLocalFile(img));
    } else if (item.imageUrl) {
        deleteLocalFile(item.imageUrl);
    }

    // Удаляем запись из базы
    await prisma.portfolioItem.delete({
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