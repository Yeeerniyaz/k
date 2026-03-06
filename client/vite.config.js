import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ==========================================
// КОНФИГУРАЦИЯ VITE ДЛЯ НАШЕГО ENTERPRISE-МОНОЛИТА
// ==========================================
export default defineConfig({
  plugins: [react()],
  
  // Настройки сервера для разработки (npm run dev)
  server: {
    port: 5055, // Фронтенд будет висеть на 3000 порту
    open: true, // Автоматически открывать браузер при запуске
    
    // 🔥 ГЛАВНАЯ МАГИЯ: Проксируем запросы
    // Когда React стучится на /api/portfolio, Vite сам перекидывает запрос на бэкенд (5005 порт)
    // Это полностью избавляет нас от проблем с CORS во время разработки
    proxy: {
      '/api': {
        target: 'http://localhost:5005', // Адрес нашего запущенного бэкенда
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Настройки сборки для продакшена (npm run build)
  build: {
    // Папка, куда Vite положит готовые HTML/CSS/JS файлы.
    // Именно эту папку (client/dist) ожидает увидеть наш src/app.js на бэкенде!
    outDir: 'dist',
    emptyOutDir: true, // Очищать папку перед каждой новой сборкой
    chunkSizeWarningLimit: 1000, // Увеличиваем лимит, чтобы Mantine не ругался на размер чанков
  },
});