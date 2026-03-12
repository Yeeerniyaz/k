
# ==========================================
# 2-КЕЗЕҢ: БЭКЕНДТІ ДАЙЫНДАУ
# ==========================================
FROM node:22-slim
# Prisma-ға OpenSSL міндетті түрде керек
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Конфигтерді көшіру
COPY package*.json ./
COPY prisma ./prisma/

# 🔥 МАҢЫЗДЫ: Алдымен барлық пакеттерді орнатамыз (Dev-пакеттермен бірге)
RUN npm install

# 🔥 МАҢЫЗДЫ: Присманы генерация жасаймыз
RUN npx prisma generate

# ЕНДІ ҒАНА продакшн режимді қосамыз
ENV NODE_ENV=production



EXPOSE 5005
CMD ["npm", "start"]