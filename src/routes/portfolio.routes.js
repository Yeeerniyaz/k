import express from 'express';
import https from 'https'; // 🔥 SENIOR FIX: Встроенный модуль Node.js для проксирования
import {
    getPortfolio,
    addPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem
} from '../controllers/portfolio.controller.js';

import { protect, authorize } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

// ==========================================
// 🔥 СЕНЬОРСКИЙ ПРОКСИ: ОБХОД БЛОКИРОВОК ПРОВАЙДЕРОВ
// ==========================================
// Если мобильный интернет блокирует Cloudinary, мы скачиваем фото сервером и отдаем клиенту!
router.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL is required');

    https.get(targetUrl, (cloudRes) => {
        // Копируем заголовки от Cloudinary (тип файла, кэш)
        res.set('Content-Type', cloudRes.headers['content-type']);
        res.set('Cache-Control', 'public, max-age=31536000'); // Кэшируем на год
        
        // Перенаправляем поток напрямую в телефон
        cloudRes.pipe(res);
    }).on('error', (err) => {
        console.error('Ошибка проксирования картинки:', err);
        res.status(500).send('Error fetching image');
    });
});

// ==========================================
// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (ОТКРЫТЫ ДЛЯ ВСЕХ)
// ==========================================
router.get('/', getPortfolio);

// ==========================================
// 2. ЗАЩИЩЕННЫЕ МАРШРУТЫ (ДЛЯ АДМИНКИ)
// ==========================================
router.use(protect);

router.post('/', upload.array('images', 10), addPortfolioItem);

// ==========================================
// 3. ОПЕРАЦИИ С КОНКРЕТНОЙ РАБОТОЙ
// ==========================================
router.route('/:id')
    .put(updatePortfolioItem)
    .delete(authorize('ADMIN'), deletePortfolioItem);

export default router;