import { prisma } from '../server.js';
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcryptjs";

// ==========================================
// 1. ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (ДЛЯ ТАБЛИЦЫ В АДМИНКЕ)
// 🔥 SENIOR UPDATE: Добавлено поле avatarUrl для красивого UI
// ==========================================
export const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            avatarUrl: true, // Добавлено из новой схемы
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    res.status(200).json({
        status: "success",
        results: users.length,
        data: { users } // Оставлено в массиве data.users для старого фронтенда
    });
});

// ==========================================
// 2. ПОЛУЧИТЬ ОДНОГО ПОЛЬЗОВАТЕЛЯ ПО ID
// (Имя функции оставлено getUsers для 100% совместимости с роутером)
// ==========================================
export const getUsers = catchAsync(async (req, res, next) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            avatarUrl: true, // Добавлено из новой схемы
            createdAt: true
        }
    });

    if (!user) {
        return next(new AppError("Пользователь не найден", 404));
    }

    res.status(200).json({
        status: "success",
        data: { user }
    });
});

// ==========================================
// 3. СОЗДАТЬ ПОЛЬЗОВАТЕЛЯ (ВРУЧНУЮ ИЗ АДМИНКИ)
// 🔥 SENIOR UPDATE: Защита ролей и AuditLog
// ==========================================
export const createUser = catchAsync(async (req, res, next) => {
    const { email, password, name, phone, role, avatarUrl } = req.body;

    if (!email || !password) {
        return next(new AppError("Email и пароль обязательны для заполнения", 400));
    }

    // 1. Проверяем, существует ли уже такой email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return next(new AppError("Пользователь с таким email уже существует", 400));
    }

    // 2. Хешируем пароль перед сохранением в БД
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Создаем пользователя
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || email.split('@')[0],
            phone: phone || null,
            role: role || 'CLIENT', // По умолчанию клиент, если не передано иное
            avatarUrl: avatarUrl || null
        },
        // Возвращаем данные без пароля для безопасности
        select: {
            id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, createdAt: true
        }
    });

    // 🔥 SENIOR SECURITY: Фиксируем факт создания нового аккаунта
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "CREATE_USER",
                entityType: "User",
                entityId: newUser.id,
                details: { newEmail: newUser.email, newRole: newUser.role }
            }
        }).catch(console.error);
    }

    res.status(201).json({
        status: "success",
        data: { user: newUser }
    });
});

// ==========================================
// 4. ОБНОВИТЬ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
// 🔥 SENIOR UPDATE: Безопасное обновление пароля + Аудит смены ролей
// ==========================================
export const updateUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, phone, role, password, avatarUrl } = req.body;

    // Ищем пользователя для проверки
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
        return next(new AppError("Пользователь не найден", 404));
    }

    // Собираем объект обновления
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Если меняется email, проверяем на уникальность
    if (email && email !== existingUser.email) {
        const emailCheck = await prisma.user.findUnique({ where: { email } });
        if (emailCheck) {
            return next(new AppError("Этот email уже занят другим пользователем", 400));
        }
        updateData.email = email;
    }

    // Если передан новый пароль, хешируем его
    if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    // Выполняем обновление
    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true, email: true, name: true, role: true, phone: true, avatarUrl: true, updatedAt: true
        }
    });

    // 🔥 SENIOR SECURITY: Фиксируем изменение критических данных (Особенно роли!)
    if (req.user && req.user.id) {
        const detailsLog = {};
        if (updateData.role && updateData.role !== existingUser.role) {
            detailsLog.oldRole = existingUser.role;
            detailsLog.newRole = updateData.role;
        }
        if (password) detailsLog.passwordChanged = true;

        if (Object.keys(detailsLog).length > 0) {
            prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: "UPDATE_USER_PERMISSIONS",
                    entityType: "User",
                    entityId: id,
                    details: detailsLog
                }
            }).catch(console.error);
        }
    }

    res.status(200).json({
        status: "success",
        data: { user: updatedUser }
    });
});

// ==========================================
// 5. УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ
// 🔥 SENIOR UPDATE: Аудит безвозвратного удаления
// ==========================================
export const deleteUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return next(new AppError("Пользователь не найден", 404));
    }

    // Удаляем пользователя
    await prisma.user.delete({
        where: { id }
    });

    // 🔥 SENIOR SECURITY: Фиксируем увольнение сотрудника или удаление клиента
    if (req.user && req.user.id) {
        prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "DELETE_USER",
                entityType: "User",
                entityId: id,
                details: { deletedEmail: user.email, deletedRole: user.role }
            }
        }).catch(console.error);
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});