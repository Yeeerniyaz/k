import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg'; // pg пакетін қолданамыз
import { PrismaPg } from '@prisma/adapter-pg'; // Адаптерді қолданамыз

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import app from './app.js';

// 1. ПРОВЕРКА ЗАГРУЗКИ
console.log('-------------------------------------------');
console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? '✅ LOADED' : '❌ NOT FOUND');
console.log('-------------------------------------------');

if (!process.env.DATABASE_URL) {
    process.exit(1);
}

// 2. PRISMA ADAPTER CONFIGURATION (Сеньорский подход для Prisma 7)
// Бұл "engine type client" қатесін біржола жояды
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter, // Адаптерді тікелей береміз
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma: Database connection established using PG Adapter.');
    } catch (error) {
        console.error('❌ Prisma: Connection failed!', error.message);
    }
}

connectDB();

const PORT = process.env.PORT || 5005;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Senior Architect Service is active on port ${PORT}`);
});