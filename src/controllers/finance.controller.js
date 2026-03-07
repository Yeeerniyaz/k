import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ФИНАНСОВОЙ СВОДКИ И ТРАНЗАКЦИЙ
// ==========================================
export const getExpenses = catchAsync(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    // Настраиваем умную фильтрацию по датам (если передано с фронта)
    const dateFilterExp = {};
    const dateFilterOrd = {};

    if (startDate || endDate) {
        dateFilterExp.date = {};
        dateFilterOrd.updatedAt = {}; // Датой получения дохода считаем момент закрытия заказа

        if (startDate) {
            dateFilterExp.date.gte = new Date(startDate);
            dateFilterOrd.updatedAt.gte = new Date(startDate);
        }
        if (endDate) {
            // Ставим конец дня (23:59:59), чтобы захватить весь выбранный день целиком
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilterExp.date.lte = end;
            dateFilterOrd.updatedAt.lte = end;
        }
    }

    // 1. Получаем ВСЕ расходы (и общие операционные, и себестоимость внутри заказов)
    const expenses = await prisma.expense.findMany({
        where: dateFilterExp,
        orderBy: { date: 'desc' }
    });

    // 2. Получаем доходы (только ЗАВЕРШЕННЫЕ заказы приносят фактическую прибыль)
    const completedOrders = await prisma.order.findMany({
        where: {
            status: 'COMPLETED',
            ...dateFilterOrd
        },
        orderBy: { updatedAt: 'desc' }
    });

    // 3. Высчитываем финансовую сводку для дашборда
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = completedOrders.reduce((sum, ord) => sum + ord.totalPrice, 0);
    const netProfit = totalIncome - totalExpense;

    // 4. Формируем единую ленту транзакций для таблицы на фронтенде
    const formattedExpenses = expenses.map(exp => ({
        id: exp.id,
        type: 'EXPENSE',
        category: exp.category || 'Расход',
        amount: exp.amount,
        comment: exp.orderId ? `[Себестоимость заказа] ${exp.comment || 'Без комментария'}` : (exp.comment || 'Без комментария'),
        date: exp.date
    }));

    const formattedIncomes = completedOrders.map(ord => ({
        id: ord.id,
        type: 'INCOME',
        category: 'Оплата за заказ',
        amount: ord.totalPrice,
        comment: `Клиент: ${ord.customerName} | Услуга: ${ord.serviceType}`,
        date: ord.updatedAt
    }));

    // Сливаем в один массив и сортируем (самые свежие сверху)
    const transactions = [...formattedExpenses, ...formattedIncomes].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json({
        status: 'success',
        success: true, // Поддержка старого и нового форматов фронтенда
        results: transactions.length,
        data: transactions, // Единая лента (доходы + расходы)
        summary: {
            totalIncome,
            totalExpense,
            netProfit
        }
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