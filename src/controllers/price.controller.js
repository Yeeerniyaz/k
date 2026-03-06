import { prisma } from '../server.js'; // 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Используем единый инстанс БД
// 🔥 СЕНЬОРСКИЕ УТИЛИТЫ:
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕГО ПРАЙС-ЛИСТА
// ==========================================
// Барлық прайс-листі алу
export const getPrices = catchAsync(async (req, res, next) => {
    const prices = await prisma.price.findMany({
        orderBy: { service: 'asc' } // Сортировка по алфавиту
    });

    res.status(200).json({
        success: true,
        status: 'success', // Поддержка обоих стандартов ответа для совместимости с фронтендом
        results: prices.length,
        data: prices
    });
});

// ==========================================
// 2. ДОБАВЛЕНИЕ НОВОЙ ПОЗИЦИИ В ПРАЙС
// ==========================================
// Жаңа баға позициясын қосу
export const createPrice = catchAsync(async (req, res, next) => {
    const { service, unit, price } = req.body;

    // Валидация входных данных
    if (!service || !unit || price === undefined) {
        return next(new AppError('Необходимо указать наименование (service), единицу измерения (unit) и цену (price)', 400));
    }

    // Қызметтің бар-жоғын тексеру (Проверка на дубликаты)
    const existing = await prisma.price.findUnique({ where: { service } });
    if (existing) {
        return next(new AppError('Мұндай қызмет прайста бар / Такая услуга уже существует', 400));
    }

    const newPrice = await prisma.price.create({
        data: {
            service,
            unit,
            price: parseInt(price, 10)
        }
    });

    res.status(201).json({
        success: true,
        status: 'success',
        message: 'Позиция успешно добавлена в прайс-лист',
        data: newPrice
    });
});

// ==========================================
// 3. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕЦ ЦЕНЫ
// ==========================================
// Бағаны жаңарту
export const updatePrice = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { service, unit, price } = req.body;

    // Смарт-проверка: существует ли запись перед обновлением?
    const existingPrice = await prisma.price.findUnique({ where: { id } });
    if (!existingPrice) {
        return next(new AppError('Позиция не найдена (возможно, она была удалена ранее)', 404));
    }

    const updatedPrice = await prisma.price.update({
        where: { id },
        data: {
            service: service !== undefined ? service : undefined,
            unit: unit !== undefined ? unit : undefined,
            price: price !== undefined ? parseInt(price, 10) : undefined
        }
    });

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Прайс-лист успешно обновлен',
        data: updatedPrice
    });
});

// ==========================================
// 4. УДАЛЕНИЕ ПОЗИЦИИ ИЗ ПРАЙС-ЛИСТА
// ==========================================
// Позицияны өшіру
export const deletePrice = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Проверяем существование, чтобы избежать фатальной ошибки БД (RecordNotFound)
    const existingPrice = await prisma.price.findUnique({ where: { id } });
    if (!existingPrice) {
        return next(new AppError('Позиция не найдена или уже удалена', 404));
    }

    await prisma.price.delete({ where: { id } });

    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Позиция прайс-листтен өшірілді / Позиция удалена из прайс-листа'
    });
});