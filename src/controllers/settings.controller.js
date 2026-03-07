import prisma from '../server.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
// ==========================================
// 1. READ: ПОЛУЧИТЬ НАСТРОЙКИ КАЛЬКУЛЯТОРА (Для витрины)
// ==========================================
export const getCalculatorSettings = catchAsync(async (req, res, next) => {
    const setting = await prisma.setting.findUnique({
        where: { key: 'calculator_config' }
    });
    
    // Если в базе еще нет настроек (чистая база), возвращаем пустой массив
    const config = setting ? setting.value : [];
    
    res.status(200).json({
        success: true,
        config
    });
});

// ==========================================
// 2. CREATE / UPDATE (UPSERT): СОХРАНИТЬ КАЛЬКУЛЯТОР
// ==========================================
export const updateCalculatorSettings = catchAsync(async (req, res, next) => {
    const { config } = req.body;
    
    if (!config) {
        return next(new AppError('Не переданы данные конфигурации (config)', 400));
    }

    // Идеальный подход для настроек - Upsert. 
    // Если ключ есть -> обновляет. Если ключа нет -> создает.
    const setting = await prisma.setting.upsert({
        where: { key: 'calculator_config' },
        update: { value: config },
        create: { key: 'calculator_config', value: config }
    });
    
    res.status(200).json({
        success: true,
        message: 'Архитектура калькулятора успешно сохранена',
        data: setting
    });
});

// ==========================================
// 3. READ: ПОЛУЧИТЬ ЛЮБУЮ ДРУГУЮ НАСТРОЙКУ ПО КЛЮЧУ
// ==========================================
export const getSettingByKey = catchAsync(async (req, res, next) => {
    const { key } = req.params;
    
    const setting = await prisma.setting.findUnique({
        where: { key }
    });

    if (!setting) {
        return next(new AppError(`Настройка с ключом '${key}' не найдена`, 404));
    }

    res.status(200).json({
        success: true,
        data: setting
    });
});

// ==========================================
// 4. DELETE: УДАЛИТЬ НАСТРОЙКУ ПО КЛЮЧУ
// ==========================================
export const deleteSetting = catchAsync(async (req, res, next) => {
    const { key } = req.params;

    const settingExists = await prisma.setting.findUnique({
        where: { key }
    });

    if (!settingExists) {
        return next(new AppError(`Настройка с ключом '${key}' не найдена`, 404));
    }

    await prisma.setting.delete({
        where: { key }
    });

    res.status(200).json({
        success: true,
        message: `Настройка '${key}' успешно удалена`
    });
});