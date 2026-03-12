import { prisma } from '../server.js';
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

// ==========================================
// 1. ПОЛУЧИТЬ АКТИВНЫЕ БЛОКИ (ДЛЯ КЛИЕНТОВ НА ФРОНТЕНДЕ)
// 🔥 SENIOR UPDATE: Добавлена поддержка динамических страниц (slug) и видимости
// ==========================================
export const getPublicBlocks = catchAsync(async (req, res, next) => {
    // Поддержка старого фронтенда (где всегда была только home) + нового по slug
    const requestedSlug = req.query.page || "home";

    // Ищем страницу в новой таблице Page
    const dynamicPage = await prisma.page.findUnique({
        where: { slug: requestedSlug }
    });

    // Формируем гибкое условие поиска (старый строковый page или новый pageId)
    const whereCondition = {
        isActive: true,
        OR: [
            { page: requestedSlug }, // Для старых записей
            ...(dynamicPage ? [{ pageId: dynamicPage.id }] : []) // Для новых динамических страниц
        ]
    };

    const blocks = await prisma.pageBlock.findMany({
        where: whereCondition,
        orderBy: {
            order: "asc"
        },
    });

    res.status(200).json({
        status: "success",
        // Передаем также мета-теги страницы, если она найдена
        pageMeta: dynamicPage ? {
            title: dynamicPage.metaTitle,
            description: dynamicPage.metaDescription,
            keywords: dynamicPage.metaKeywords
        } : null,
        data: blocks
    });
});

// ==========================================
// 2. ПОЛУЧИТЬ ВСЕ БЛОКИ (ДЛЯ АДМИНКИ / OWNER)
// 🔥 SENIOR UPDATE: Добавлена фильтрация по конкретной странице
// ==========================================
export const getAllBlocks = catchAsync(async (req, res, next) => {
    const requestedSlug = req.query.page || "home";

    const dynamicPage = await prisma.page.findUnique({
        where: { slug: requestedSlug }
    });

    const blocks = await prisma.pageBlock.findMany({
        where: {
            OR: [
                { page: requestedSlug },
                ...(dynamicPage ? [{ pageId: dynamicPage.id }] : [])
            ]
        },
        orderBy: {
            order: "asc"
        },
    });

    res.status(200).json({
        status: "success",
        data: blocks
    });
});

// ==========================================
// 3. СОЗДАТЬ НОВЫЙ БЛОК НА СТРАНИЦЕ
// 🔥 SENIOR UPDATE: Поддержка стилей, устройств и привязки к PageId
// ==========================================
export const createBlock = catchAsync(async (req, res, next) => {
    const { type, data, order, isActive, pageId, styles, deviceVisibility } = req.body;

    // Транзакция: создаем блок и сразу пишем в AuditLog (если есть req.user)
    const [newBlock, auditLog] = await prisma.$transaction(async (tx) => {
        const created = await tx.pageBlock.create({
            data: {
                type,
                data, // Это JSON поле, сюда летит объект со всеми текстами и ссылками
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true,
                page: pageId ? "dynamic" : "home", // Сохраняем совместимость

                // Новые поля для CMS
                ...(pageId && { pageId }),
                ...(styles && { styles }),
                ...(deviceVisibility && { deviceVisibility }),
            }
        });

        // Пишем лог действий для безопасности ERP
        let log = null;
        if (req.user && req.user.id) {
            log = await tx.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: "CREATE_PAGE_BLOCK",
                    entityType: "PageBlock",
                    entityId: created.id,
                    details: { type: created.type, order: created.order }
                }
            });
        }

        return [created, log];
    });

    res.status(201).json({
        status: "success",
        data: newBlock
    });
});

// ==========================================
// 4. ОБНОВИТЬ КОНТЕНТ ИЛИ СТАТУС БЛОКА
// 🔥 SENIOR UPDATE: Добавлено обновление стилей и видимости на устройствах + Аудит
// ==========================================
export const updateBlock = catchAsync(async (req, res, next) => {
    // Разрешаем обновлять только нужные поля, чтобы не сломать id или page
    const { type, data, order, isActive, styles, deviceVisibility } = req.body;

    const block = await prisma.pageBlock.findUnique({
        where: { id: req.params.id }
    });

    if (!block) {
        return next(new AppError("Блок не найден", 404));
    }

    const updatedBlock = await prisma.pageBlock.update({
        where: { id: req.params.id },
        data: {
            ...(type && { type }),
            ...(data && { data }),
            ...(order !== undefined && { order }),
            ...(isActive !== undefined && { isActive }),
            ...(styles !== undefined && { styles }), // Обновление визуальных стилей
            ...(deviceVisibility && { deviceVisibility }), // Адаптация под моб/пк
        }
    });

    // Асинхронно пишем в лог, не блокируя ответ клиенту (Оптимизация производительности)
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "UPDATE_PAGE_BLOCK",
                entityType: "PageBlock",
                entityId: updatedBlock.id,
                details: { oldState: block, newState: updatedBlock }
            }
        }).catch(err => console.error("Audit log error:", err));
    }

    res.status(200).json({
        status: "success",
        data: updatedBlock
    });
});

// ==========================================
// 5. УДАЛИТЬ БЛОК НАВСЕГДА
// ==========================================
export const deleteBlock = catchAsync(async (req, res, next) => {
    const block = await prisma.pageBlock.findUnique({
        where: { id: req.params.id }
    });

    if (!block) {
        return next(new AppError("Блок не найден", 404));
    }

    await prisma.pageBlock.delete({
        where: { id: req.params.id }
    });

    // Логируем удаление
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_PAGE_BLOCK",
                entityType: "PageBlock",
                entityId: req.params.id,
                details: { deletedData: block }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});

// ==========================================
// 6. 🔥 МАССОВОЕ ОБНОВЛЕНИЕ ПОРЯДКА (ДЛЯ DRAG & DROP В АДМИНКЕ)
// ==========================================
export const reorderBlocks = catchAsync(async (req, res, next) => {
    const { blocks } = req.body; // Ожидаем массив: [{ id: "uuid-1", order: 0 }, { id: "uuid-2", order: 1 }]

    if (!blocks || !Array.isArray(blocks)) {
        return next(new AppError("Неверный формат данных. Ожидается массив блоков.", 400));
    }

    // Обновляем все через транзакцию Prisma. 
    // Это значит: либо обновятся ВСЕ блоки успешно, либо НИ ОДИН (если произойдет ошибка).
    const updatePromises = blocks.map((block) =>
        prisma.pageBlock.update({
            where: { id: block.id },
            data: { order: block.order },
        })
    );

    await prisma.$transaction(updatePromises);

    res.status(200).json({
        status: "success",
        message: "Порядок компонентов успешно сохранен"
    });
});

// =========================================================================
// 🔥 SENIOR EXPANSION: НОВЫЕ ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ САМИМИ СТРАНИЦАМИ (PAGES)
// =========================================================================

// ==========================================
// 7. ПОЛУЧИТЬ СПИСОК ВСЕХ СТРАНИЦ (ДЛЯ АДМИНКИ)
// ==========================================
export const getAllPages = catchAsync(async (req, res, next) => {
    const pages = await prisma.page.findMany({
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
        status: "success",
        data: pages
    });
});

// ==========================================
// 8. СОЗДАТЬ НОВУЮ ДИНАМИЧЕСКУЮ СТРАНИЦУ
// ==========================================
export const createPage = catchAsync(async (req, res, next) => {
    const { slug, title, metaTitle, metaDescription, metaKeywords, isPublished } = req.body;

    if (!slug || !title) {
        return next(new AppError("У страницы должны быть slug (URL) и title (Название)", 400));
    }

    // Проверка на уникальность slug
    const existingPage = await prisma.page.findUnique({ where: { slug } });
    if (existingPage) {
        return next(new AppError(`Страница с URL "${slug}" уже существует`, 400));
    }

    const newPage = await prisma.page.create({
        data: {
            slug,
            title,
            metaTitle,
            metaDescription,
            metaKeywords,
            isPublished: isPublished !== undefined ? isPublished : true
        }
    });

    res.status(201).json({
        status: "success",
        data: newPage
    });
});

// ==========================================
// 9. ОБНОВИТЬ НАСТРОЙКИ СТРАНИЦЫ (SEO, СТАТУС, НАЗВАНИЕ)
// ==========================================
export const updatePage = catchAsync(async (req, res, next) => {
    const { title, slug, metaTitle, metaDescription, metaKeywords, isPublished } = req.body;

    const pageId = req.params.id;
    const page = await prisma.page.findUnique({ where: { id: pageId } });

    if (!page) {
        return next(new AppError("Страница не найдена", 404));
    }

    if (slug && slug !== page.slug) {
        const existingPage = await prisma.page.findUnique({ where: { slug } });
        if (existingPage) return next(new AppError(`Страница с URL "${slug}" уже занята`, 400));
    }

    const updatedPage = await prisma.page.update({
        where: { id: pageId },
        data: {
            ...(title && { title }),
            ...(slug && { slug }),
            ...(metaTitle !== undefined && { metaTitle }),
            ...(metaDescription !== undefined && { metaDescription }),
            ...(metaKeywords !== undefined && { metaKeywords }),
            ...(isPublished !== undefined && { isPublished })
        }
    });

    res.status(200).json({
        status: "success",
        data: updatedPage
    });
});

// ==========================================
// 10. УДАЛИТЬ СТРАНИЦУ (КАСКАДНО УДАЛЯТСЯ И ЕЁ БЛОКИ)
// ==========================================
export const deletePage = catchAsync(async (req, res, next) => {
    const pageId = req.params.id;

    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
        return next(new AppError("Страница не найдена", 404));
    }

    // При удалении страницы все блоки удалятся автоматически (onDelete: Cascade в схеме Prisma)
    await prisma.page.delete({ where: { id: pageId } });

    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_PAGE",
                entityType: "Page",
                entityId: pageId,
                details: { deletedSlug: page.slug }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});