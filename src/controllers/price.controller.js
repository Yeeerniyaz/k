import { prisma } from '../server.js'; // 🔥 СЕНЬОРСКАЯ ПРАКТИКА: Используем единый инстанс БД вместо new PrismaClient()

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕГО ПРАЙС-ЛИСТА
// ==========================================
// Барлық прайс-листі алу
export const getPrices = async (req, res, next) => {
    try {
        const prices = await prisma.price.findMany({
            orderBy: { service: 'asc' } // Сортировка по алфавиту
        });

        res.status(200).json({
            success: true,
            status: 'success', // Поддержка обоих стандартов ответа для совместимости с фронтендом
            results: prices.length,
            data: prices
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. ДОБАВЛЕНИЕ НОВОЙ ПОЗИЦИИ В ПРАЙС
// ==========================================
// Жаңа баға позициясын қосу
export const createPrice = async (req, res, next) => {
    try {
        const { service, unit, price } = req.body;

        // Валидация входных данных
        if (!service || !unit || price === undefined) {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: 'Необходимо указать наименование (service), единицу измерения (unit) и цену (price)'
            });
        }

        // Қызметтің бар-жоғын тексеру (Проверка на дубликаты)
        const existing = await prisma.price.findUnique({ where: { service } });
        if (existing) {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: 'Мұндай қызмет прайста бар / Такая услуга уже существует'
            });
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
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕЙ ЦЕНЫ
// ==========================================
// Бағаны жаңарту
export const updatePrice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { service, unit, price } = req.body;

        // Смарт-проверка: существует ли запись перед обновлением?
        const existingPrice = await prisma.price.findUnique({ where: { id } });
        if (!existingPrice) {
            return res.status(404).json({
                success: false,
                status: 'error',
                message: 'Позиция не найдена (возможно, она была удалена ранее)'
            });
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
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. УДАЛЕНИЕ ПОЗИЦИИ ИЗ ПРАЙС-ЛИСТА
// ==========================================
// Позицияны өшіру
export const deletePrice = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Проверяем существование, чтобы избежать фатальной ошибки БД (RecordNotFound)
        const existingPrice = await prisma.price.findUnique({ where: { id } });
        if (!existingPrice) {
            return res.status(404).json({
                success: false,
                status: 'error',
                message: 'Позиция не найдена или уже удалена'
            });
        }

        await prisma.price.delete({ where: { id } });

        res.status(200).json({
            success: true,
            status: 'success',
            message: 'Позиция прайс-листтен өшірілді / Позиция удалена из прайс-листа'
        });
    } catch (error) {
        next(error);
    }
};