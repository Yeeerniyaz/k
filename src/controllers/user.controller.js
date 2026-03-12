import { prisma } from '../server.js';
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcryptjs";

// ==========================================
// 1. ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
// ==========================================
export const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            createdAt: true,
        }
    });

    res.status(200).json({
        status: "success",
        results: users.length,
        data: { users }
    });
});

// ==========================================
// 2. ПОЛУЧИТЬ ОДНОГО ПОЛЬЗОВАТЕЛЯ
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
// 3. СОЗДАТЬ ПОЛЬЗОВАТЕЛЯ (ИЗ АДМИНКИ)
// ==========================================
export const createUser = catchAsync(async (req, res, next) => {
    const { email, password, name, phone, role } = req.body;

    // 🔥 SENIOR SECURITY CHECK: Защита иерархии
    // Если пытаются создать ADMIN или OWNER, это может сделать ТОЛЬКО OWNER
    if ((role === 'ADMIN' || role === 'OWNER') && req.user.role !== 'OWNER') {
        return next(new AppError("Остынь, хакер. Только OWNER может назначать администраторов.", 403));
    }

    // Хэшируем пароль перед сохранением в базу
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            phone,
            role: role || 'CLIENT'
        },
        // Не возвращаем хэш пароля клиенту
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true
        }
    });

    res.status(201).json({
        status: "success",
        data: { user: newUser }
    });
});

// ==========================================
// 4. ОБНОВИТЬ ПОЛЬЗОВАТЕЛЯ
// ==========================================
export const updateUser = catchAsync(async (req, res, next) => {
    const { name, phone, role } = req.body;

    const userToUpdate = await prisma.user.findUnique({
        where: { id: req.params.id }
    });

    if (!userToUpdate) {
        return next(new AppError("Пользователь не найден", 404));
    }

    // 🔥 SENIOR SECURITY CHECK: Защита изменения ролей
    // Проверяем, если роль меняется, и это затрагивает ADMIN или OWNER
    if (role && role !== userToUpdate.role) {
        if ((role === 'ADMIN' || role === 'OWNER' || userToUpdate.role === 'ADMIN' || userToUpdate.role === 'OWNER') && req.user.role !== 'OWNER') {
            return next(new AppError("У тебя нет прав менять роли уровня ADMIN или OWNER.", 403));
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: { name, phone, role },
        select: { id: true, email: true, name: true, role: true, phone: true }
    });

    res.status(200).json({
        status: "success",
        data: { user: updatedUser }
    });
});

// ==========================================
// 5. УДАЛИТЬ ПОЛЬЗОВАТЕЛЯ
// ==========================================
export const deleteUser = catchAsync(async (req, res, next) => {
    const userToDelete = await prisma.user.findUnique({
        where: { id: req.params.id }
    });

    if (!userToDelete) {
        return next(new AppError("Пользователь не найден", 404));
    }

    // 🔥 SENIOR SECURITY CHECK: Абсолютная защита создателя
    if (userToDelete.role === 'OWNER') {
        return next(new AppError("Нельзя удалить OWNER. Это нарушит законы физики и сломает матрицу.", 403));
    }

    // 🔥 SENIOR SECURITY CHECK: Только OWNER может удалять ADMIN-ов
    if (userToDelete.role === 'ADMIN' && req.user.role !== 'OWNER') {
        return next(new AppError("Только OWNER может увольнять администраторов.", 403));
    }

    await prisma.user.delete({
        where: { id: req.params.id }
    });

    res.status(204).json({
        status: "success",
        data: null
    });
});