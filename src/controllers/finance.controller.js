import { prisma } from '../server.js'; // Сеньорский подход: используем единый пул соединений с БД

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ ОБЩИХ РАСХОДОВ КОМПАНИИ
// ==========================================
export const getExpenses = async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. ДОБАВЛЕНИЕ НОВОГО ОБЩЕГО РАСХОДА
// ==========================================
export const addExpense = async (req, res, next) => {
    try {
        const { category, amount, comment, date } = req.body;

        // Строгая валидация входящих данных
        if (!category || amount === undefined || amount <= 0) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Категория и сумма (больше нуля) обязательны для заполнения'
            });
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
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО РАСХОДА
// ==========================================
export const updateExpense = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { category, amount, comment, date } = req.body;

        // Смарт-проверка: существует ли такая транзакция перед обновлением?
        const existingExpense = await prisma.expense.findUnique({ where: { id } });
        if (!existingExpense) {
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'Транзакция не найдена (возможно, она была удалена ранее)'
            });
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
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. УДАЛЕНИЕ РАСХОДА (ОТМЕНА ТРАНЗАКЦИИ)
// ==========================================
export const deleteExpense = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Защита от фатальной ошибки БД (RecordNotFound)
        const existingExpense = await prisma.expense.findUnique({ where: { id } });
        if (!existingExpense) {
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'Транзакция не найдена или уже удалена'
            });
        }

        await prisma.expense.delete({ where: { id } });

        res.status(200).json({
            status: 'success',
            success: true,
            message: 'Транзакция успешно удалена из базы'
        });
    } catch (error) {
        next(error);
    }
};