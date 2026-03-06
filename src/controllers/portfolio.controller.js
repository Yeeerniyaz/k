import { prisma } from '../server.js';
// 🔥 НОВЫЙ ИМПОРТ: Подключаем наш сервис загрузки в облако
import { uploadImage } from '../services/cloudinary.service.js';
// 🔥 СЕНЬОРСКИЕ УТИЛИТЫ:
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ РАБОТ ДЛЯ ВИТРИНЫ
// ==========================================
export const getPortfolio = catchAsync(async (req, res, next) => {
    const works = await prisma.portfolio.findMany({
        where: { isVisible: true }, // Отдаем только те, что разрешено показывать
        orderBy: { createdAt: 'desc' } // Свежие работы сверху
    });

    res.status(200).json({
        status: 'success',
        results: works.length,
        data: works
    });
});

// ==========================================
// 2. ДОБАВЛЕНИЕ НОВОЙ РАБОТЫ В ПОРТФОЛИО
// ==========================================
export const addPortfolioItem = catchAsync(async (req, res, next) => {
    const { title, category, description } = req.body;

    // Оставляем поддержку старого способа (если передана просто текстовая ссылка)
    let imageUrl = req.body.imageUrl;

    // Если пользователь прикрепил реальный файл (фото с телефона или ПК)
    if (req.file) {
        // Телепортируем файл из оперативной памяти прямо в Cloudinary
        const uploadResult = await uploadImage(req.file.buffer, 'royal_banners_portfolio');
        // Cloudinary сам сжал фото, перевел в WebP и вернул нам готовую ссылку
        imageUrl = uploadResult.secure_url;
    }

    // Строгая проверка: у нас в итоге должна быть картинка (либо загруженная, либо ссылкой)
    if (!title || !category || !imageUrl) {
        return next(new AppError('Название, категория и картинка (файл или ссылка) обязательны', 400));
    }

    // Сохраняем запись в базу данных
    const newItem = await prisma.portfolio.create({
        data: {
            title,
            category, // Должно совпадать с ServiceCategory из schema.prisma
            imageUrl, // Теперь здесь всегда надежная и быстрая ссылка
            description
        }
    });

    res.status(201).json({
        status: 'success',
        message: 'Работа успешно добавлена в портфолио',
        data: newItem
    });
});

// 🔥 НОВОЕ: УДАЛЕНИЕ РАБОТЫ (ДЛЯ АДМИНКИ)
// ==========================================
// 3. УДАЛЕНИЕ РАБОТЫ ИЗ БАЗЫ
// ==========================================
export const deletePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Сначала проверяем, существует ли такая работа
    const existingItem = await prisma.portfolio.findUnique({
        where: { id }
    });

    if (!existingItem) {
        return next(new AppError('Работа не найдена или уже удалена', 404));
    }

    // Удаляем запись из базы данных
    await prisma.portfolio.delete({
        where: { id }
    });

    res.status(200).json({
        status: 'success',
        message: 'Работа успешно удалена из портфолио'
    });
});

// 🔥 НОВОЕ: ОБНОВЛЕНИЕ РАБОТЫ (ДЛЯ АДМИНКИ)
// ==========================================
// 4. СКРЫТИЕ ИЛИ ИЗМЕНЕНИЕ ТЕКСТА РАБОТЫ
// ==========================================
export const updatePortfolioItem = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, category, description, isVisible } = req.body;

    const existingItem = await prisma.portfolio.findUnique({ where: { id } });
    if (!existingItem) {
        return next(new AppError('Работа не найдена', 404));
    }

    // Обновляем только те поля, которые были переданы
    const updatedItem = await prisma.portfolio.update({
        where: { id },
        data: {
            title: title !== undefined ? title : undefined,
            category: category !== undefined ? category : undefined,
            description: description !== undefined ? description : undefined,
            isVisible: isVisible !== undefined ? Boolean(isVisible) : undefined
        }
    });

    res.status(200).json({
        status: 'success',
        message: 'Данные работы обновлены',
        data: updatedItem
    });
});