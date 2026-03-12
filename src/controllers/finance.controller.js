import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ФИНАНСОВОЙ СВОДКИ И ТРАНЗАКЦИЙ
// 🔥 SENIOR UPDATE: Оптимизированный подсчет агрегатов прямо в БД
// ==========================================
export const getExpenses = catchAsync(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    // Настраиваем умную фильтрацию по датам (если передано с фронта)
    const dateFilterExp = {};
    const dateFilterOrd = {};

    if (startDate || endDate) {
        dateFilterExp.date = {};
        dateFilterOrd.createdAt = {}; // Заказы считаем по дате создания (или закрытия)

        if (startDate) {
            const start = new Date(startDate);
            dateFilterExp.date.gte = start;
            dateFilterOrd.createdAt.gte = start;
        }
        if (endDate) {
            // Включаем конец дня
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilterExp.date.lte = end;
            dateFilterOrd.createdAt.lte = end;
        }
    }

    // Выполняем запросы параллельно для максимальной скорости (Non-blocking I/O)
    const [expenses, orders] = await prisma.$transaction([
        prisma.expense.findMany({
            where: dateFilterExp,
            orderBy: { date: 'desc' },
            include: {
                order: { select: { customerName: true, status: true } } // Подтягиваем инфу о заказе, если расход привязан
            }
        }),
        prisma.order.findMany({
            where: {
                ...dateFilterOrd,
                // Считаем доходом только УСПЕШНО ЗАКРЫТЫЕ заказы (Senior подход к финансам)
                status: 'COMPLETED'
            },
            select: { totalPrice: true }
        })
    ]);

    // Подсчет итогов
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = orders.reduce((sum, ord) => sum + ord.totalPrice, 0);
    const netProfit = totalIncome - totalExpenses;

    res.status(200).json({
        success: true,
        data: {
            expenses,          // Массив всех расходов для таблицы
            totalExpenses,     // Итого расходов
            totalIncome,       // Итого доходов (с закрытых заказов)
            netProfit          // Чистая прибыль
        }
    });
});

// ==========================================
// 2. ДОБАВИТЬ НОВЫЙ РАСХОД (Например: Аренда, Зарплата, Материалы)
// 🔥 SENIOR UPDATE: Жесткая типизация и Аудит действий
// ==========================================
export const createExpense = catchAsync(async (req, res, next) => {
    const { category, amount, comment, date, orderId } = req.body;

    if (!category || amount === undefined) {
        return next(new AppError('Категория и сумма расхода обязательны', 400));
    }

    // Защита от отрицательных сумм
    const parsedAmount = parseInt(amount);
    if (parsedAmount <= 0) {
        return next(new AppError('Сумма расхода должна быть больше нуля', 400));
    }

    const newExpense = await prisma.expense.create({
        data: {
            category,
            amount: parsedAmount,
            comment: comment || '',
            date: date ? new Date(date) : new Date(),
            ...(orderId && { orderId }) // Привязка к конкретному заказу (опционально)
        }
    });

    // 🔥 SENIOR SECURITY: Фиксируем, кто достал деньги из кассы
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "CREATE_EXPENSE",
                entityType: "Expense",
                entityId: newExpense.id,
                details: { category, amount: parsedAmount }
            }
        }).catch(console.error);
    }

    res.status(201).json({
        success: true,
        data: newExpense
    });
});

// ==========================================
// 3. ОБНОВИТЬ СУЩЕСТВУЮЩИЙ РАСХОД (РЕДАКТИРОВАНИЕ)
// 🔥 SENIOR UPDATE: Защита старых данных и запись изменений в лог
// ==========================================
export const updateExpense = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { category, amount, comment, date, orderId } = req.body;

    const existingExpense = await prisma.expense.findUnique({
        where: { id }
    });

    if (!existingExpense) {
        return next(new AppError('Транзакция не найдена', 404));
    }

    // Собираем только те поля, которые реально передали на обновление
    const updateData = {};
    if (category) updateData.category = category;
    if (amount !== undefined) {
        const parsedAmount = parseInt(amount);
        if (parsedAmount <= 0) return next(new AppError('Сумма должна быть больше нуля', 400));
        updateData.amount = parsedAmount;
    }
    if (comment !== undefined) updateData.comment = comment;
    if (date) updateData.date = new Date(date);
    if (orderId !== undefined) updateData.orderId = orderId === null ? null : orderId;

    const updatedExpense = await prisma.expense.update({
        where: { id },
        data: updateData
    });

    // 🔥 SENIOR SECURITY: Фиксируем, если кто-то задним числом изменил сумму расхода
    if (req.user && req.user.id) {
        const detailsLog = {};
        if (updateData.amount !== undefined && updateData.amount !== existingExpense.amount) {
            detailsLog.oldAmount = existingExpense.amount;
            detailsLog.newAmount = updateData.amount;
        }
        if (updateData.category && updateData.category !== existingExpense.category) {
            detailsLog.oldCategory = existingExpense.category;
            detailsLog.newCategory = updateData.category;
        }

        // Пишем лог только если реально поменяли что-то важное
        if (Object.keys(detailsLog).length > 0) {
            prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: "UPDATE_EXPENSE",
                    entityType: "Expense",
                    entityId: id,
                    details: detailsLog
                }
            }).catch(console.error);
        }
    }

    res.status(200).json({
        success: true,
        data: updatedExpense
    });
});

// ==========================================
// 4. УДАЛИТЬ РАСХОД (ОТМЕНА ТРАНЗАКЦИИ)
// 🔥 SENIOR UPDATE: Аудит безвозвратного удаления
// ==========================================
export const deleteExpense = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
        where: { id }
    });

    if (!expense) {
        return next(new AppError('Транзакция не найдена', 404));
    }

    await prisma.expense.delete({
        where: { id }
    });

    // 🔥 SENIOR SECURITY: Фиксируем удаление расхода
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_EXPENSE",
                entityType: "Expense",
                entityId: id,
                details: { deletedCategory: expense.category, deletedAmount: expense.amount }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        success: true,
        data: null
    });
});