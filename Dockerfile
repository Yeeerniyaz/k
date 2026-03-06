# Тек іске қосуға арналған жеңіл образ
FROM node:22-slim

# OpenSSL міндетті түрде керек (Prisma үшін)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ноутта жиналған барлық файлдарды (node_modules, client/dist, prisma) көшіру
# Маңызды: Ноутың мен сервердің ОС бірдей болуы керек (мысалы, Linux/Docker Desktop)
COPY . .

# Продакшн режим
ENV NODE_ENV=production

EXPOSE 5005

# Бірден іске қосамыз
CMD ["npm", "start"]