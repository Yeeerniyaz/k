# ==========================================
# ЭТАП 1: СБОРКА ФРОНТЕНДА (REACT + MANTINE)
# ==========================================
# Берем легкий образ Node.js
FROM node:22-slim AS frontend-builder

# Создаем папку для фронтенда


# ==========================================
# ЭТАП 2: ФИНАЛЬНЫЙ ОБРАЗ БЭКЕНДА (PRODUCTION)
# ==========================================
FROM node:22-slim

# Устанавливаем OpenSSL (критически важно для движка Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Копируем конфиги бэкенда
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm install
RUN npx prisma generate

# Копируем исходный код бэкенда
COPY . .

# 🔥 СЕНЬОРСКИЙ ШАГ: Копируем ГОТОВУЮ папку dist из первого этапа!
# Теперь нашему src/app.js будет что раздавать пользователям.
COPY --from=frontend-builder /build/client/dist ./client/dist

# Сообщаем, что контейнер будет слушать 5005 порт
EXPOSE 5005

# Запускаем сервер
CMD ["npm", "start"]