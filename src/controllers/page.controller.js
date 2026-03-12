import { prisma } from "../utils/prisma.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

// ==========================================
// 1. ПОЛУЧИТЬ АКТИВНЫЕ БЛОКИ (ДЛЯ КЛИЕНТОВ НА ФРОНТЕНДЕ)
// ==========================================
export const getPublicBlocks = catchAsync(async (req, res, next) => {
    const blocks = await prisma.pageBlock.findMany({
        where: {
            page: "home",
            isActive: true
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
// 2. ПОЛУЧИТЬ ВСЕ БЛОКИ (ДЛЯ АДМИНКИ / OWNER)
// ==========================================
export const getAllBlocks = catchAsync(async (req, res, next) => {
    const blocks = await prisma.pageBlock.findMany({
        where: {
            page: "home"
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
// ==========================================
export const createBlock = catchAsync(async (req, res, next) => {
    const { type, data, order, isActive } = req.body;

    const newBlock = await prisma.pageBlock.create({
        data: {
            type,
            data, // Это JSON поле, сюда летит объект со всеми текстами и ссылками
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            page: "home"
        }
    });

    res.status(201).json({
        status: "success",
        data: newBlock
    });
});

// ==========================================
// 4. ОБНОВИТЬ КОНТЕНТ ИЛИ СТАТУС БЛОКА
// ==========================================
export const updateBlock = catchAsync(async (req, res, next) => {
    // Разрешаем обновлять только нужные поля, чтобы не сломать id или page
    const { type, data, order, isActive } = req.body;

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
        }
    });

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