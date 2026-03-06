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

# Шаг 1: Копируем конфиги бэкенда
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Шаг 2: Устанавливаем ВСЕ зависимости (пока без флага production),
# чтобы установился CLI-инструмент prisma из devDependencies
RUN npm install

# Шаг 3: Генерируем клиент Prisma
RUN npx prisma generate

# Шаг 4: ТОЛЬКО ТЕПЕРЬ включаем production режим!
ENV NODE_ENV=production

# Шаг 5: Копируем исходный код бэкенда (в одну строку!)
COPY . .

# Шаг 6: Копируем ГОТОВУЮ папку dist из первого этапа
COPY --from=frontend-builder /build/client/dist ./client/dist

# Сообщаем, что контейнер будет слушать 5005 порт
EXPOSE 5005

# Запускаем сервер
CMD ["npm", "start"]