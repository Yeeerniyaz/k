# Тек іске қосуға арналған жеңіл образ
FROM node:22-slim

# OpenSSL міндетті түрде керек (Prisma үшін)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Тек қажетті файлдарды көшіреміз (ноутта жиналған node_modules қоса)
# Ескерту: Егер ноут Windows болса, node_modules-ті көшіру қауіпті болуы мүмкін.
# Сондықтан біз тек package.json мен prisma-ны көшіріп, инсталлды серверде жасаймыз,
# бірақ ЕШҚАНДАЙ BUILD жасатпаймыз.
COPY package*.json ./
COPY prisma ./prisma/

# Серверде тек қажетті пакеттерді тез орнату
RUN npm install --omit=dev

# 2. Ноутта жиналған фронтендті көшіру
COPY client/dist ./client/dist

# 3. Қалған бэкенд кодын көшіру
COPY . .

# 4. Присманы генерация жасау (бірақ бұл жолы ол өте жеңіл өтеді)
RUN npx prisma generate

EXPOSE 5005

CMD ["npm", "start"]