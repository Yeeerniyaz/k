import { prisma } from '../server.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ==========================================
// 1. ПОЛУЧИТЬ НАСТРОЙКИ КАЛЬКУЛЯТОРА
// Оставлено для 100% обратной совместимости старого фронтенда
// ==========================================
export const getCalculatorSettings = catchAsync(async (req, res, next) => {
    // Ищем настройки по ключу, который был жестко прописан в базе
    let settings = await prisma.setting.findUnique({
        where: { key: 'calculator_config' }
    });

    // Если настроек еще нет в базе (первый запуск проекта), отдаем пустой объект
    if (!settings) {
        settings = { key: 'calculator_config', value: {} };
    }

    res.status(200).json({
        status: 'success',
        data: settings.value // Отдаем сразу JSON-тело для старого фронтенда
    });
});

// ==========================================
// 2. ОБНОВИТЬ НАСТРОЙКИ КАЛЬКУЛЯТОРА
// Оставлено для старой версии панели управления
// ==========================================
export const updateCalculatorSettings = catchAsync(async (req, res, next) => {
    const configData = req.body;

    // Используем upsert: если записи нет — создаст, если есть — обновит
    const updatedSettings = await prisma.setting.upsert({
        where: { key: 'calculator_config' },
        update: { value: configData },
        create: { key: 'calculator_config', value: configData }
    });

    // 🔥 SENIOR SECURITY: Аудит изменений критических формул (цен)
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "UPDATE_CALCULATOR_SETTINGS",
                entityType: "Setting",
                entityId: updatedSettings.id,
                details: { key: 'calculator_config' }
            }
        }).catch(console.error);
    }

    res.status(200).json({
        status: 'success',
        data: updatedSettings.value
    });
});

// =========================================================================
// 🔥 SENIOR EXPANSION: УНИВЕРСАЛЬНЫЙ ДВИЖОК НАСТРОЕК (ДЛЯ HEADLESS CMS)
// Эти методы позволят сохранять любые данные: цвета сайта, контакты, соц.сети
// =========================================================================

// ==========================================
// 3. ПОЛУЧИТЬ ЛЮБЫЕ НАСТРОЙКИ ПО КЛЮЧУ
// ==========================================
export const getSettingByKey = catchAsync(async (req, res, next) => {
    const { key } = req.params;

    const setting = await prisma.setting.findUnique({
        where: { key }
    });

    if (!setting) {
        return next(new AppError(`Настройки с ключом "${key}" не найдены`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: setting
    });
});

// ==========================================
// 4. ПОЛУЧИТЬ ВСЕ ДОСТУПНЫЕ НАСТРОЙКИ В БАЗЕ
// ==========================================
export const getAllSettings = catchAsync(async (req, res, next) => {
    const settings = await prisma.setting.findMany();

    res.status(200).json({
        status: 'success',
        results: settings.length,
        data: settings
    });
});

// ==========================================
// 5. ОБНОВИТЬ ИЛИ СОЗДАТЬ ЛЮБУЮ НАСТРОЙКУ ПО КЛЮЧУ (UPSERT ENGINE)
// ==========================================
export const upsertSettingByKey = catchAsync(async (req, res, next) => {
    const { key } = req.params;
    const { value } = req.body; // Ожидаем, что value будет валидным JSON объектом

    if (!value) {
        return next(new AppError('Поле "value" обязательно для сохранения', 400));
    }

    // Мощный паттерн Upsert (Обновить или Вставить)
    const updatedSetting = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
    });

    // Записываем изменение глобальных настроек сайта в Аудит
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "UPSERT_GLOBAL_SETTING",
                entityType: "Setting",
                entityId: updatedSetting.id,
                details: { key }
            }
        }).catch(console.error);
    }

    res.status(200).json({
        status: 'success',
        data: updatedSetting
    });
});