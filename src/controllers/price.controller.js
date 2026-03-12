import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧИТЬ ВЕСЬ ПРАЙС-ЛИСТ (ДЛЯ КАЛЬКУЛЯТОРА И АДМИНКИ)
// ==========================================
export const getPrices = catchAsync(async (req, res, next) => {
    const prices = await prisma.price.findMany({
        orderBy: {
            createdAt: 'asc' // Сортируем по порядку добавления
        }
    });

    res.status(200).json({
        status: 'success',
        results: prices.length,
        data: prices
    });
});

// ==========================================
// 2. ПОЛУЧИТЬ ОДНУ ПОЗИЦИЮ (ДЛЯ РЕДАКТИРОВАНИЯ И ПРОВЕРКИ)
// ==========================================
export const getPriceById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const price = await prisma.price.findUnique({
        where: { id }
    });

    if (!price) {
        return next(new AppError('Позиция в прайсе не найдена', 404));
    }

    res.status(200).json({
        status: 'success',
        data: price
    });
});

// ==========================================
// 3. ДОБАВИТЬ НОВУЮ УСЛУГУ В ПРАЙС-ЛИСТ
// 🔥 SENIOR UPDATE: Защита данных и Аудит действий
// ==========================================
export const createPrice = catchAsync(async (req, res, next) => {
    const { service, unit, price } = req.body;

    if (!service || !unit || price === undefined) {
        return next(new AppError('Пожалуйста, заполните все обязательные поля: название (service), единицы (unit) и цену (price)', 400));
    }

    // 1. Защита БД: Проверка на уникальность названия услуги (чтобы не было дублей в калькуляторе)
    const existingService = await prisma.price.findUnique({
        where: { service }
    });

    if (existingService) {
        return next(new AppError(`Услуга с названием "${service}" уже существует в прайс-листе`, 400));
    }

    // 2. Валидация финансов: цена не может быть отрицательной
    const parsedPrice = parseInt(price);
    if (parsedPrice < 0) {
        return next(new AppError('Цена не может быть отрицательной', 400));
    }

    // 3. Сохранение в базу
    const newPrice = await prisma.price.create({
        data: {
            service,
            unit,
            price: parsedPrice
        }
    });

    // 🔥 SENIOR SECURITY: Фиксируем добавление новой расценки в ERP
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "CREATE_PRICE_ITEM",
                entityType: "Price",
                entityId: newPrice.id,
                details: { service: newPrice.service, price: newPrice.price }
            }
        }).catch(console.error);
    }

    res.status(201).json({
        status: 'success',
        data: newPrice
    });
});

// ==========================================
// 4. ОБНОВИТЬ СУЩЕСТВУЮЩУЮ ПОЗИЦИЮ (СМЕНА ЦЕНЫ)
// 🔥 SENIOR UPDATE: Логирование изменения цен для защиты от махинаций
// ==========================================
export const updatePrice = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { service, unit, price } = req.body;

    const existingPriceItem = await prisma.price.findUnique({
        where: { id }
    });

    if (!existingPriceItem) {
        return next(new AppError('Позиция в прайсе не найдена', 404));
    }

    // Собираем объект обновления
    const updateData = {};
    if (service && service !== existingPriceItem.service) {
        // Если меняют название, проверяем чтобы оно не совпало с другим существующим
        const nameCheck = await prisma.price.findUnique({ where: { service } });
        if (nameCheck) return next(new AppError(`Услуга "${service}" уже существует`, 400));
        updateData.service = service;
    }
    if (unit) updateData.unit = unit;
    
    if (price !== undefined) {
        const parsedPrice = parseInt(price);
        if (parsedPrice < 0) return next(new AppError('Цена не может быть отрицательной', 400));
        updateData.price = parsedPrice;
    }

    // Обновляем в БД
    const updatedPrice = await prisma.price.update({
        where: { id },
        data: updateData
    });

    // 🔥 SENIOR SECURITY: Жесткий контроль изменения прайса!
    if (req.user && req.user.id) {
        const detailsLog = {};
        // Записываем старую и новую цену, если был факт изменения
        if (updateData.price !== undefined && updateData.price !== existingPriceItem.price) {
            detailsLog.oldPrice = existingPriceItem.price;
            detailsLog.newPrice = updateData.price;
        }
        if (updateData.service && updateData.service !== existingPriceItem.service) {
            detailsLog.oldService = existingPriceItem.service;
            detailsLog.newService = updateData.service;
        }

        if (Object.keys(detailsLog).length > 0) {
            prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: "UPDATE_PRICE_ITEM",
                    entityType: "Price",
                    entityId: updatedPrice.id,
                    details: detailsLog
                }
            }).catch(console.error);
        }
    }

    res.status(200).json({
        status: 'success',
        data: updatedPrice
    });
});

// ==========================================
// 5. УДАЛИТЬ ПОЗИЦИЮ ИЗ ПРАЙС-ЛИСТА
// 🔥 SENIOR UPDATE: Аудит удаления услуги
// ==========================================
export const deletePrice = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const price = await prisma.price.findUnique({
        where: { id }
    });

    if (!price) {
        return next(new AppError('Позиция в прайсе не найдена', 404));
    }

    await prisma.price.delete({
        where: { id }
    });

    // 🔥 SENIOR SECURITY: Фиксируем удаление из прайса (во избежание саботажа)
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_PRICE_ITEM",
                entityType: "Price",
                entityId: id,
                details: { deletedService: price.service, deletedPrice: price.price }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});