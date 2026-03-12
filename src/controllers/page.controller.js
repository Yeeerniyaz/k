import { prisma } from '../server.js';
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 🔥 SENIOR FEATURE: Умная очистка файлов с диска (Garbage Collector)
// ==========================================
const deleteLocalFile = (fileUrl) => {
    try {
        if (!fileUrl) return;
        
        const fileName = fileUrl.split('/').pop();
        if (!fileName) return;

        const filePath = path.join(__dirname, '../../uploads', fileName);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.error(`⚠️ Ошибка при удалении локального файла ${fileUrl}:`, err);
    }
};

// ==========================================
// 1. ПОЛУЧИТЬ АКТИВНЫЕ БЛОКИ (ДЛЯ КЛИЕНТОВ НА ФРОНТЕНДЕ)
// 🔥 SENIOR UPDATE: Обратная совместимость старых и новых страниц
// ==========================================
export const getPublicBlocks = catchAsync(async (req, res, next) => {
    // Поддержка старого фронтенда (где всегда была только home) + нового по slug
    const requestedSlug = req.query.page || "home";

    // 1. Ищем страницу в таблице Page (если она уже создана в новой архитектуре)
    const dynamicPage = await prisma.page.findUnique({
        where: { slug: requestedSlug }
    });

    // 2. Формируем гибкое условие поиска блоков
    // Мы ищем либо старые блоки (где просто строка page = "home"),
    // либо новые блоки, привязанные к ID найденной страницы
    const whereCondition = {
        isActive: true,
        OR: [
            { page: requestedSlug }
        ]
    };

    if (dynamicPage) {
        whereCondition.OR.push({ pageId: dynamicPage.id });
    }

    // 3. Вытаскиваем блоки
    const blocks = await prisma.pageBlock.findMany({
        where: whereCondition,
        orderBy: { order: 'asc' }
    });

    res.status(200).json({
        success: true,
        count: blocks.length,
        // Передаем мета-теги страницы (SEO), если она существует, иначе дефолтные
        meta: dynamicPage ? { title: dynamicPage.metaTitle, description: dynamicPage.metaDesc } : null,
        data: blocks
    });
});

// ==========================================
// 2. ПОЛУЧИТЬ ВСЕ БЛОКИ (ДЛЯ АДМИНКИ)
// ==========================================
export const getAdminBlocks = catchAsync(async (req, res, next) => {
    const requestedSlug = req.query.page || "home";

    const dynamicPage = await prisma.page.findUnique({
        where: { slug: requestedSlug }
    });

    const whereCondition = {
        OR: [
            { page: requestedSlug }
        ]
    };

    if (dynamicPage) {
        whereCondition.OR.push({ pageId: dynamicPage.id });
    }

    const blocks = await prisma.pageBlock.findMany({
        where: whereCondition,
        orderBy: { order: 'asc' }
    });

    res.status(200).json({
        success: true,
        count: blocks.length,
        pageId: dynamicPage ? dynamicPage.id : null,
        data: blocks
    });
});

// ==========================================
// 3. СОЗДАТЬ НОВЫЙ БЛОК НА СТРАНИЦЕ
// 🔥 SENIOR UPDATE: Поддержка локальных картинок (uploads)
// ==========================================
export const createBlock = catchAsync(async (req, res, next) => {
    const { title, subtitle, content, type, order, page, isActive } = req.body;

    // Определяем, куда привязать блок: к новой Page по ID или к старой строке
    let pageId = null;
    let pageSlug = page || "home";

    const existingPage = await prisma.page.findUnique({ where: { slug: pageSlug } });
    if (existingPage) {
        pageId = existingPage.id;
    }

    // Обработка загруженного файла через Multer (локально)
    let imageUrl = '';
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    const newBlock = await prisma.pageBlock.create({
        data: {
            title: title || '',
            subtitle: subtitle || '',
            content: content || '',
            type: type || 'HERO',
            imageUrl,
            order: order ? parseInt(order) : 0,
            isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
            page: pageSlug, // Старое строковое поле для обратной совместимости
            pageId: pageId  // Новая реляционная связь
        }
    });

    // Аудит добавления блока
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "CREATE_PAGE_BLOCK",
                entityType: "PageBuilder",
                entityId: newBlock.id,
                details: { blockType: newBlock.type, targetPage: pageSlug }
            }
        }).catch(console.error);
    }

    res.status(201).json({
        success: true,
        data: newBlock
    });
});

// ==========================================
// 4. ОБНОВИТЬ СУЩЕСТВУЮЩИЙ БЛОК
// 🔥 SENIOR UPDATE: Garbage Collection для старых фоновых изображений блока
// ==========================================
export const updateBlock = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, subtitle, content, type, order, isActive } = req.body;

    const existingBlock = await prisma.pageBlock.findUnique({ where: { id } });
    
    if (!existingBlock) {
        return next(new AppError('Блок не найден', 404));
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

    // Если загружена новая картинка (фон блока), удаляем старую
    if (req.file) {
        const newImageUrl = `/uploads/${req.file.filename}`;
        updateData.imageUrl = newImageUrl;

        if (existingBlock.imageUrl) {
            deleteLocalFile(existingBlock.imageUrl);
        }
    }

    const updatedBlock = await prisma.pageBlock.update({
        where: { id },
        data: updateData
    });

    // Аудит изменения контента сайта
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "UPDATE_PAGE_BLOCK",
                entityType: "PageBuilder",
                entityId: updatedBlock.id,
                details: { updatedType: updatedBlock.type }
            }
        }).catch(console.error);
    }

    res.status(200).json({
        success: true,
        data: updatedBlock
    });
});

// ==========================================
// 5. ИЗМЕНИТЬ ПОРЯДОК БЛОКОВ (DRAG & DROP)
// 🔥 SENIOR UPDATE: Массовое транзакционное обновление
// ==========================================
export const updateBlocksOrder = catchAsync(async (req, res, next) => {
    const { blocks } = req.body; // Ожидаем массив [{ id: "uuid", order: 1 }, { id: "uuid", order: 2 }]

    if (!blocks || !Array.isArray(blocks)) {
        return next(new AppError('Необходим массив блоков с их новым порядком', 400));
    }

    // Выполняем обновления параллельно через транзакцию Prisma
    // Это гарантирует, что либо обновятся все блоки, либо ни один
    const transaction = blocks.map(block => 
        prisma.pageBlock.update({
            where: { id: block.id },
            data: { order: parseInt(block.order) }
        })
    );

    await prisma.$transaction(transaction);

    res.status(200).json({
        success: true,
        message: 'Порядок блоков успешно обновлен'
    });
});

// ==========================================
// 6. УДАЛИТЬ БЛОК
// 🔥 SENIOR UPDATE: Полное удаление картинок и аудит
// ==========================================
export const deleteBlock = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const block = await prisma.pageBlock.findUnique({ where: { id } });

    if (!block) {
        return next(new AppError('Блок не найден', 404));
    }

    // Удаляем картинку, привязанную к этому блоку
    if (block.imageUrl) {
        deleteLocalFile(block.imageUrl);
    }

    await prisma.pageBlock.delete({ where: { id } });

    // Аудит удаления
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_PAGE_BLOCK",
                entityType: "PageBuilder",
                entityId: id,
                details: { deletedBlockType: block.type }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});

// ==========================================
// 7. СУПЕР-АДМИН: УПРАВЛЕНИЕ СТРАНИЦАМИ (SEO И НАВИГАЦИЯ)
// ==========================================
// Получить список всех созданных страниц (для меню или роутера фронтенда)
export const getAllPages = catchAsync(async (req, res, next) => {
    const pages = await prisma.page.findMany({
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        success: true,
        data: pages
    });
});

// Создать новую страницу (например "О нас", "Контакты")
export const createPage = catchAsync(async (req, res, next) => {
    const { title, slug, metaTitle, metaDesc } = req.body;

    if (!title || !slug) {
        return next(new AppError('Название (title) и путь (slug) обязательны', 400));
    }

    const newPage = await prisma.page.create({
        data: { title, slug, metaTitle, metaDesc }
    });

    res.status(201).json({ success: true, data: newPage });
});

// Обновить SEO данные страницы
export const updatePage = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const { title, metaTitle, metaDesc, isPublished } = req.body;

    const existingPage = await prisma.page.findUnique({ where: { slug } });
    if (!existingPage) return next(new AppError('Страница не найдена', 404));

    const updatedPage = await prisma.page.update({
        where: { slug },
        data: {
            title: title || existingPage.title,
            metaTitle: metaTitle !== undefined ? metaTitle : existingPage.metaTitle,
            metaDesc: metaDesc !== undefined ? metaDesc : existingPage.metaDesc,
            isPublished: isPublished !== undefined ? isPublished : existingPage.isPublished
        }
    });

    res.status(200).json({ success: true, data: updatedPage });
});