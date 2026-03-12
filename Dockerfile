# ==========================================
# 2-КЕЗЕҢ: БЭКЕНДТІ ДАЙЫНДАУ
# ==========================================
FROM node:22-slim

# Prisma-ға OpenSSL міндетті түрде керек
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# 🔥 SENIOR FIX 1: WORKDIR тек папка болуы керек!
WORKDIR /app

# Алдымен конфигтерді көшіреміз
COPY package*.json ./
COPY prisma ./prisma/

# 🔥 SENIOR FIX 2: ЕҢ МАҢЫЗДЫ ҚАДАМ - БАРЛЫҚ КОДТЫ (src) КӨШІРУ!
# Бұл болмаса, сервер ешқашан қосылмайды.
COPY . .

# Dev-пакеттермен бірге орнатамыз
RUN npm install

# Prisma клиентін генерациялаймыз
RUN npx prisma generate

# Енді ғана продакшн режимді қосамыз
ENV NODE_ENV=production

EXPOSE 5505

CMD ["npm", "start"]