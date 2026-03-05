import { prisma } from '../server.js';

// Получить все работы для красивой витрины
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

// Добавить новую работу (вызовешь это из админки)
export const addPortfolioItem = async (req, res, next) => {
    try {
        const { title, category, imageUrl, description } = req.body;

        if (!title || !category || !imageUrl) {
            return res.status(400).json({
                status: 'error',
                message: 'Название, категория и ссылка на картинку обязательны'
            });
        }

        const newItem = await prisma.portfolio.create({
            data: {
                title,
                category, // Должно совпадать с ServiceCategory из schema.prisma
                imageUrl,
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