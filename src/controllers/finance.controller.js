import { prisma } from '../server.js'; // Сеньорский подход: используем единый пул соединений с БД
// 🔥 СЕНЬОРСКИЕ УТИЛИТЫ:
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ ОБЩИХ РАСХОДОВ КОМПАНИИ
// ==========================================
export const getExpenses = catchAsync(async (req, res, next) => {
    // Получаем только те расходы, которые НЕ привязаны к конкретному заказу (orderId: null)
    // Это и есть общие операционные расходы фирмы (Аренда, Зарплата, Реклама и т.д.)
    const expenses = await prisma.expense.findMany({
        where: {
            orderId: null 
        },
        orderBy: {
            date: 'desc' // Свежие транзакции сверху
        }
    });

    res.status(200).json({
        status: 'success',
        success: true, // Поддержка старого и нового форматов фронтенда
        results: expenses.length,
        data: expenses
    });
});

// ==========================================
// 2. ДОБАВЛЕНИЕ НОВОГО ОБЩЕГО РАСХОДА
// ==========================================
export const addExpense = catchAsync(async (req, res, next) => {
    const { category, amount, comment, date } = req.body;

    // Строгая валидация входящих данных
    if (!category || amount === undefined || amount <= 0) {
        return next(new AppError('Категория и сумма (больше нуля) обязательны для заполнения', 400));
    }

    // Создаем новую транзакцию
    const newExpense = await prisma.expense.create({
        data: {
            category,
            amount: parseInt(amount, 10),
            comment: comment || 'Без комментария',
            date: date ? new Date(date) : new Date(), // Если дату не передали, ставим текущую
            orderId: null // Явно указываем, что это общий расход фирмы, а не себестоимость заказа
        }
    });

    res.status(201).json({
        status: 'success',
        success: true,
        message: 'Операционный расход успешно зафиксирован',
        data: newExpense
    });
});

// ==========================================
// 3. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО РАСХОДА
// ==========================================
export const updateExpense = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { category, amount, comment, date } = req.body;

    // Смарт-проверка: существует ли такая транзакция перед обновлением?
    const existingExpense = await prisma.expense.findUnique({ where: { id } });
    if (!existingExpense) {
        return next(new AppError('Транзакция не найдена (возможно, она была удалена ранее)', 404));
    }

    // Формируем объект только с теми полями, которые реально нужно обновить
    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseInt(amount, 10);
    if (comment !== undefined) updateData.comment = comment;
    if (date !== undefined) updateData.date = new Date(date);

    const updatedExpense = await prisma.expense.update({
        where: { id },
        data: updateData
    });

    res.status(200).json({
        status: 'success',
        success: true,
        message: 'Данные транзакции успешно обновлены',
        data: updatedExpense
    });
});

// ==========================================
// 4. УДАЛЕНИЕ РАСХОДА (ОТМЕНА ТРАНЗАКЦИИ)
// ==========================================
export const deleteExpense = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Защита от фатальной ошибки БД (RecordNotFound)
    const existingExpense = await prisma.expense.findUnique({ where: { id } });
    if (!existingExpense) {
        return next(new AppError('Транзакция не найдена или уже удалена', 404));
    }

    await prisma.expense.delete({ where: { id } });

    res.status(200).json({
        status: 'success',
        success: true,
        message: 'Транзакция успешно удалена из базы'
    });
});