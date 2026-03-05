import { Router } from 'express';
import { getPortfolio, addPortfolioItem } from '../controllers/portfolio.controller.js';

const router = Router();

// GET /api/portfolio - Получить все работы для красивой витрины
router.get('/', getPortfolio);

// POST /api/portfolio - Добавить новую работу (вызовешь это из админки)
router.post('/', addPortfolioItem);

export default router;