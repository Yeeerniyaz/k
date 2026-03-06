# ==========================================
# ЭТАП 1: СБОРКА ФРОНТЕНДА (REACT)
# ==========================================
FROM node:22-slim AS frontend-builder

WORKDIR /build/client

# Копируем конфиги фронтенда
COPY client/package*.json ./
RUN npm install

# Собираем фронтенд (создает папку dist)
COPY client/ ./
RUN npm run build

# ==========================================
# ЭТАП 2: СБОРКА И ЗАПУСК БЭКЕНДА
# ==========================================
FROM node:22-slim

# Устанавливаем OpenSSL (критично для движка Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Копируем конфиги бэкенда
COPY package*.json ./
COPY prisma ./prisma/

# 2. Устанавливаем ВСЕ зависимости (включая devDependencies для Prisma CLI)
# Мы НЕ ставим NODE_ENV=production здесь
RUN npm install

# 3. Генерируем клиент Prisma
# Теперь памяти (Swap) и пакетов точно хватит
RUN npx prisma generate

# 4. Копируем исходный код бэкенда
COPY . .

# 5. Копируем собранный фронтенд из первого этапа
COPY --from=frontend-builder /build/client/dist ./client/dist

# 6. ТОЛЬКО СЕЙЧАС включаем продакшн режим для работы сервера
ENV NODE_ENV=production

EXPOSE 5005

# Запуск сервера
CMD ["npm", "start"]