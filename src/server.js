import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // В будущем здесь мы добавим проверку подключения к БД через Prisma

    app.listen(PORT, () => {
      console.log(`\n======================================`);
      console.log(`⚡️ Royal Banners API is alive!`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`======================================\n`);
    });
  } catch (error) {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА ЗАПУСКА:', error);
    process.exit(1);
  }
};

startServer();