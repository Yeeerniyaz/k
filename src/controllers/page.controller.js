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
            console.log(`✅ [GC] Локальный файл удален: ${fileName}`);
        }
    } catch (err) {
        console.error(`⚠️ Ошибка при удалении локального файла ${fileUrl}:`, err);
    }
};

// ==========================================
// 1. ПОЛУЧИТЬ АКТИВНЫЕ БЛОКИ (ДЛЯ КЛИЕНТОВ НА ФРОНТЕНДЕ)
// ==========================================
export const getPublicBlocks = catchAsync(async (req, res, next) => {
    const requestedSlug = req.query.page || "home";

    const dynamicPage = await prisma.page.findUnique({
        where: { slug: requestedSlug }
    });

    const whereCondition = {
        isActive: true,
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

    // Распаковываем JSON для фронтенда, чтобы он получал плоские title и subtitle
    const formattedBlocks = blocks.map(block => {
        const blockData = typeof block.data === 'string' ? JSON.parse(block.data) : (block.data || {});
        return {
            ...block,
            title: blockData.title || '',
            subtitle: blockData.subtitle || '',
            content: blockData.content || '',
            imageUrl: blockData.imageUrl || ''
        };
    });

    res.status(200).json({
        success: true,
        count: formattedBlocks.length,
        meta: dynamicPage ? { title: dynamicPage.metaTitle, description: dynamicPage.metaDescription } : null,
        data: formattedBlocks
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

    // Подготовка данных для Конструктора в React
    const formattedBlocks = blocks.map(block => {
        const blockData = typeof block.data === 'string' ? JSON.parse(block.data) : (block.data || {});
        return {
            ...block,
            title: blockData.title || '',
            subtitle: blockData.subtitle || '',
            content: blockData.content || '',
            imageUrl: blockData.imageUrl || ''
        };
    });

    res.status(200).json({
        success: true,
        count: formattedBlocks.length,
        pageId: dynamicPage ? dynamicPage.id : null,
        data: formattedBlocks
    });
});

// ==========================================
// 3. СОЗДАТЬ НОВЫЙ БЛОК НА СТРАНИЦЕ
// 🔥 SENIOR UPDATE: Упаковка стандартных полей в JSON для Prisma
// ==========================================
export const createBlock = catchAsync(async (req, res, next) => {
    const { title, subtitle, content, type, order, page, isActive } = req.body;

    let pageId = null;
    let pageSlug = page || "home";

    const existingPage = await prisma.page.findUnique({ where: { slug: pageSlug } });
    if (existingPage) {
        pageId = existingPage.id;
    }

    // Собираем объект, который ляжет в колонку `data` (JSON)
    const blockData = {
        title: title || '',
        subtitle: subtitle || '',
        content: content || ''
    };

    if (req.file) {
        blockData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const newBlock = await prisma.pageBlock.create({
        data: {
            type: type || 'Hero',
            order: order ? parseInt(order) : 0,
            isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
            page: pageSlug,
            pageId: pageId,
            data: blockData // Вот тут Prisma счастлива
        }
    });

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
// 🔥 SENIOR UPDATE: Обновление внутри JSON и удаление старой картинки
// ==========================================
export const updateBlock = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, subtitle, content, type, order, isActive } = req.body;

    const existingBlock = await prisma.pageBlock.findUnique({ where: { id } });
    
    if (!existingBlock) {
        return next(new AppError('Блок не найден', 404));
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) updateData.isActive = (isActive === 'true' || isActive === true);

    // Достаем старый JSON
    const blockData = typeof existingBlock.data === 'string' ? JSON.parse(existingBlock.data) : (existingBlock.data || {});
    
    // Точечно обновляем тексты
    if (title !== undefined) blockData.title = title;
    if (subtitle !== undefined) blockData.subtitle = subtitle;
    if (content !== undefined) blockData.content = content;

    // Если загружена новая картинка, удаляем старую и пишем новый путь
    if (req.file) {
        const newImageUrl = `/uploads/${req.file.filename}`;
        
        if (blockData.imageUrl) {
            deleteLocalFile(blockData.imageUrl);
        }
        
        blockData.imageUrl = newImageUrl;
    }

    // Кладем обновленный JSON обратно
    updateData.data = blockData;

    const updatedBlock = await prisma.pageBlock.update({
        where: { id },
        data: updateData
    });

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
// ==========================================
export const updateBlocksOrder = catchAsync(async (req, res, next) => {
    const { blocks } = req.body;

    if (!blocks || !Array.isArray(blocks)) {
        return next(new AppError('Необходим массив блоков с их новым порядком', 400));
    }

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
// 🔥 SENIOR UPDATE: Извлекаем imageUrl из JSON перед удалением
// ==========================================
export const deleteBlock = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const block = await prisma.pageBlock.findUnique({ where: { id } });

    if (!block) {
        return next(new AppError('Блок не найден', 404));
    }

    const blockData = typeof block.data === 'string' ? JSON.parse(block.data) : (block.data || {});
    
    // Удаляем картинку с диска
    if (blockData.imageUrl) {
        deleteLocalFile(blockData.imageUrl);
    }

    await prisma.pageBlock.delete({ where: { id } });

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
export const getAllPages = catchAsync(async (req, res, next) => {
    const pages = await prisma.page.findMany({
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        success: true,
        data: pages
    });
});

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