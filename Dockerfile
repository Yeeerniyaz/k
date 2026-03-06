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

# Устанавливаем OpenSSL и сертификаты (критично для движка Prisma)
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Копируем конфиги бэкенда и схему БД
COPY package*.json ./
COPY prisma ./prisma/

# 2. Устанавливаем ВСЕ зависимости
# (NODE_ENV=production еще НЕ установлен, поэтому prisma установится из devDependencies)
RUN npm install

# 3. Генерируем клиент Prisma
# Теперь памяти (Swap) и пакетов хватит на 100%
RUN npx prisma generate

# 4. Копируем исходный код бэкенда
COPY . .

# 5. Копируем собранный фронтенд из первого этапа
COPY --from=frontend-builder /build/client/dist ./client/dist

# 6. ТОЛЬКО СЕЙЧАС включаем продакшн режим
ENV NODE_ENV=production

# Сообщаем порт
EXPOSE 5005

# Запуск сервера
CMD ["npm", "start"]