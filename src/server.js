// 1. СЕНЬОРСКИЙ ПРИОРЕТЕТ: Загрузка окружения в самом начале
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Явно подгружаем .env (уже проверено, что работает)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import app from './app.js';

// ТЕРМИНАЛДАҒЫ ДИАГНОСТИКА
console.log('-------------------------------------------');
console.log('🔍 DATABASE_URL Status:', process.env.DATABASE_URL ? '✅ LOADED' : '❌ NOT FOUND');
console.log('🔍 Running on Port:', process.env.PORT || 5005);
console.log('-------------------------------------------');

// ==========================================
// 2. PRISMA SINGLETON (CLEAN & STABLE)
// ==========================================
// Поскольку переменная DATABASE_URL уже находится в process.env,
// Prisma автоматически подхватит её. Нам не нужно передавать ничего в конструктор.
// Это исключает любые ошибки валидации параметров.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// ==========================================
// 3. ПРОВЕРКА ПОДКЛЮЧЕНИЯ
// ==========================================
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma Engine: Connected to Database successfully');
  } catch (error) {
    console.error('❌ Prisma Engine: Connection failed!');
    console.error('📝 Error message:', error.message);
    // В продакшене здесь можно добавить уведомление в Telegram/Sentry
  }
}

connectDB();

// ==========================================
// 4. ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 5005;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Service is live at http://localhost:${PORT}`);
});

// ==========================================
// 5. ГЛОБАЛЬНАЯ ЗАЩИТА (SAFETY NET)
// ==========================================
process.on('unhandledRejection', (err) => {
  console.error('🔥 UNHANDLED REJECTION:', err);
  // Мы не останавливаем сервер, чтобы он продолжал обслуживать другие запросы
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing resources...');
  server.close(() => {
    prisma.$disconnect();
    console.log('💥 Server and Database disconnected');
  });
});