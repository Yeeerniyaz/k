# ==========================================
# ЛЕГКИЙ ОБРАЗ БЭКЕНДА (PRODUCTION)
# ==========================================
FROM node:22-slim


# Устанавливаем OpenSSL (критически важно для движка Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Шаг 1: Копируем только файлы зависимостей бэкенда
COPY package*.json ./
COPY prisma ./prisma/

# Шаг 2: Устанавливаем зависимости и генерируем Prisma 
# (Это съест минимум ресурсов сервера)
RUN npm install

# Шаг 3: Включаем production режим
ENV NODE_ENV=production

# Шаг 4: Копируем весь исходный код бэкенда и УЖЕ СОБРАННЫЙ фронтенд (client/dist)
COPY . .

# Сообщаем, что контейнер будет слушать 5005 порт
EXPOSE 5005

# Запускаем сервер
CMD ["npm", "start"]