import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Барлық прайс-листі алу
export const getPrices = async (req, res, next) => {
  try {
    const prices = await prisma.price.findMany({
      orderBy: { service: 'asc' }
    });
    res.json({ success: true, data: prices });
  } catch (error) {
    next(error);
  }
};

// Жаңа баға позициясын қосу
export const createPrice = async (req, res, next) => {
  try {
    const { service, unit, price } = req.body;
    
    // Қызметтің бар-жоғын тексеру
    const existing = await prisma.price.findUnique({ where: { service } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Мұндай қызмет прайста бар' });
    }

    const newPrice = await prisma.price.create({
      data: { 
        service, 
        unit, 
        price: parseInt(price) 
      }
    });
    res.status(201).json({ success: true, data: newPrice });
  } catch (error) {
    next(error);
  }
};

// Бағаны жаңарту
export const updatePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { service, unit, price } = req.body;

    const updatedPrice = await prisma.price.update({
      where: { id },
      data: { 
        service, 
        unit, 
        price: price ? parseInt(price) : undefined 
      }
    });
    res.json({ success: true, data: updatedPrice });
  } catch (error) {
    next(error);
  }
};

// Позицияны өшіру
export const deletePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.price.delete({ where: { id } });
    res.json({ success: true, message: 'Позиция прайс-листтен өшірілді' });
  } catch (error) {
    next(error);
  }
};