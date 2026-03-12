// src/controllers/audit.controller.js
import { prisma } from '../server.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';


// ==========================================
// 1. ПОЛУЧИТЬ СПИСОК ЖУРНАЛОВ АУДИТА (С ФИЛЬТРАЦИЕЙ)
// ==========================================
export const getAuditLogs = catchAsync(async (req, res) => {
    // Настройка пагинации (по умолчанию берем по 50 записей, так как логи обычно смотрят большими списками)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // 🔥 СЕНЬОРСКИЙ ПОДХОД: Строим динамический объект фильтрации
    const where = {};

    // Фильтр по конкретному пользователю (кто совершил действие)
    if (req.query.userId) {
        where.userId = req.query.userId;
    }

    // Фильтр по типу действия (например: 'DELETE_ORDER', 'UPLOAD_MEDIA')
    if (req.query.action) {
        where.action = req.query.action;
    }

    // Фильтр по таблице (например: 'Order', 'MediaLibrary', 'PageBlock')
    if (req.query.entityType) {
        where.entityType = req.query.entityType;
    }

    // Фильтр по ID конкретной записи (чтобы посмотреть всю историю изменения одного заказа)
    if (req.query.entityId) {
        where.entityId = req.query.entityId;
    }

    // Фильтр по диапазону дат
    if (req.query.startDate || req.query.endDate) {
        where.createdAt = {};
        if (req.query.startDate) {
            where.createdAt.gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
            where.createdAt.lte = new Date(req.query.endDate);
        }
    }

    // Выполняем запросы параллельно для максимальной скорости (Non-blocking I/O)
    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }, // Самые свежие события сверху
            include: {
                // Подтягиваем данные пользователя, но ТОЛЬКО безопасные поля (без паролей)
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        }),
        prisma.auditLog.count({ where })
    ]);

    res.status(200).json({
        status: 'success',
        results: logs.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        data: logs
    });
});

// ==========================================
// 2. ПОЛУЧИТЬ ДЕТАЛИ КОНКРЕТНОЙ ЗАПИСИ АУДИТА
// ==========================================
export const getAuditLogById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    if (!log) {
        return next(new AppError('Запись аудита не найдена', 404));
    }

    // Здесь фронтенд сможет развернуть поле `details` (Json) и показать, 
    // какие именно поля заказа или страницы были изменены (old state vs new state)
    res.status(200).json({
        status: 'success',
        data: log
    });
});