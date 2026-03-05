# --- Этап сборки и работы (Production) ---
FROM node:22-slim

# Устанавливаем OpenSSL (критически важно для движка Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Создаем рабочую папку внутри контейнера
WORKDIR /app

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

# Сообщаем, что контейнер будет слушать 5000 порт
EXPOSE 5000

# Запускаем наш сервер (команда npm start уже содержит лимит памяти, который мы прописали)
CMD ["npm", "start"]