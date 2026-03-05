import { Router } from 'express';
import { createOrder } from '../controllers/order.controller.js';

const router = Router();

// Маршрут: POST /api/orders
router.post('/', createOrder);

export default router;