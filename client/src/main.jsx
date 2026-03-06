import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import App from './App.jsx';

// 🔥 ОБЯЗАТЕЛЬНО: Подключаем базовые стили Mantine
import '@mantine/core/styles.css';
// Твои глобальные стили (если нужны)
import './index.css';

// ==========================================
// ГЛОБАЛЬНАЯ ТЕМА ПРИЛОЖЕНИЯ (ENTERPRISE UI)
// ==========================================
const theme = createTheme({
  // Устанавливаем фирменный оранжевый акцент
  primaryColor: 'orange',
  // Выбираем насыщенность цвета (от 0 до 9)
  primaryShade: 6,
  // Базовый шрифт для чистого и современного вида
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Оборачиваем всё в Mantine и принудительно ставим светлую тему (Light Mode) */}
    <MantineProvider theme={theme} defaultColorScheme="light" withGlobalStyles withNormalizeCSS>
      {/* Подключаем маршрутизатор для навигации по страницам */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>,
);