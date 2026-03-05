# --- Этап сборки и работы (Production) ---
FROM node:22-slim

# Устанавливаем OpenSSL (критически важно для движка Prisma)
# Очищаем кэш apt-get (rm -rf /var/lib/apt/lists/*), чтобы образ весил меньше
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Создаем рабочую папку внутри контейнера
WORKDIR /app

# 🔥 НОВОЕ: Явно указываем, что собираем образ для продакшена (ускоряет работу Node.js)
ENV NODE_ENV=production

# Копируем сначала только конфиги (для кэширования слоев Docker)
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Устанавливаем зависимости
RUN npm install

# Генерируем ядро Prisma Client под нашу систему
RUN npx prisma generate

# Теперь копируем весь остальной код (папку src и т.д.)
COPY . .

# 🔥 ИЗМЕНЕНО: Сообщаем, что контейнер будет слушать 5005 порт (синхронизировано с docker-compose.yml)
EXPOSE 5005

# Запускаем наш сервер (команда npm start уже содержит лимит памяти, который мы прописали)
CMD ["npm", "start"]