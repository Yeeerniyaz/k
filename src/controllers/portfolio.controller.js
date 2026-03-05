import { prisma } from '../server.js';
// 🔥 НОВЫЙ ИМПОРТ: Подключаем наш сервис загрузки в облако
import { uploadImage } from '../services/cloudinary.service.js';

// ==========================================
// 1. ПОЛУЧЕНИЕ ВСЕХ РАБОТ ДЛЯ ВИТРИНЫ
// ==========================================
export const getPortfolio = async (req, res, next) => {
    try {
        const works = await prisma.portfolio.findMany({
            where: { isVisible: true }, // Отдаем только те, что разрешено показывать
            orderBy: { createdAt: 'desc' } // Свежие работы сверху
        });

        res.status(200).json({
            status: 'success',
            results: works.length,
            data: works
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. ДОБАВЛЕНИЕ НОВОЙ РАБОТЫ В ПОРТФОЛИО
// ==========================================
export const addPortfolioItem = async (req, res, next) => {
    try {
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
            return res.status(400).json({
                status: 'error',
                message: 'Название, категория и картинка (файл или ссылка) обязательны'
            });
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
    } catch (error) {
        next(error);
    }
};