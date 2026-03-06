# ==========================================
# ЭТАП 1: СБОРКА ФРОНТЕНДА (REACT + MANTINE)
# ==========================================
FROM node:22-slim AS frontend-builder

WORKDIR /build/client

# Копируем конфиги и ставим зависимости
COPY client/package*.json ./
RUN npm install

# Собираем фронтенд (Vite создаст папку dist)
COPY client/ ./
RUN npm run build

# ==========================================
# ЭТАП 2: ФИНАЛЬНЫЙ ОБРАЗ БЭКЕНДА (PRODUCTION)
# ==========================================
FROM node:22-slim

# OpenSSL Prisma үшін міндетті
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Бэкенд конфигтерін көшіру
COPY package*.json ./
COPY prisma ./prisma/

# 2. БАРЛЫҚ тәуелділіктерді орнату (Prisma CLI үшін devDeps керек)
RUN npm install

# 3. Присма клиентін генерация жасау (енді қате шықпайды)
RUN npx prisma generate

# 4. ЕНДІ ҒАНА продакшн режимді қосамыз
ENV NODE_ENV=production

# 5. Исходный код пен жиналған фронтендті көшіру
COPY . .
COPY --from=frontend-builder /build/client/dist ./client/dist

EXPOSE 5005

CMD ["npm", "start"]