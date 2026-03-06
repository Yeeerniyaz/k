# ==========================================
# ЭТАП 1: СБОРКА ФРОНТЕНДА (REACT + MANTINE)
# ==========================================
# Берем легкий образ Node.js
FROM node:22-slim AS frontend-builder

# Создаем папку для фронтенда
WORKDIR /build/client

# Копируем package.json клиента и устанавливаем зависимости
COPY client/package*.json ./
RUN npm install

# Копируем весь код клиента и собираем его (Vite создаст папку dist)
COPY client/ ./
RUN npm run build

# ==========================================
# ЭТАП 2: ФИНАЛЬНЫЙ ОБРАЗ БЭКЕНДА (PRODUCTION)
# ==========================================
FROM node:22-slim

# Устанавливаем OpenSSL (критически важно для движка Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# СЕНЬОРСКИЙ ШАГ 1: Копируем конфиги бэкенда
COPY package*.json ./
COPY prisma ./prisma/

# СЕНЬОРСКИЙ ШАГ 2: Устанавливаем ВСЕ зависимости (пока без флага production),
# чтобы установился CLI-инструмент prisma
RUN npm install

# СЕНЬОРСКИЙ ШАГ 3: Генерируем клиент Prisma
RUN npx prisma generate

# СЕНЬОРСКИЙ ШАГ 4: ТОЛЬКО ТЕПЕРЬ включаем production режим,
# чтобы бэкенд и Express.js работали максимально быстро
ENV NODE_ENV=production

# Копируем исходный код бэкенда (исправлен перенос строки)
COPY . .

# Копируем ГОТОВУЮ папку dist из первого этапа!
# Теперь нашему src/app.js будет что раздавать пользователям.
COPY --from=frontend-builder /build/client/dist ./client/dist

# Сообщаем, что контейнер будет слушать 5005 порт
EXPOSE 5005

# Запускаем сервер
CMD ["npm", "start"]