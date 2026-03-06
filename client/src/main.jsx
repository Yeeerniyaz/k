import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import App from './App.jsx';

import '@mantine/core/styles.css';
import './index.css';

// ==========================================
// ГЛОБАЛЬНАЯ ТЕМА ПРИЛОЖЕНИЯ (ENTERPRISE UI)
// ==========================================
const theme = createTheme({
  // 1. Создаем кастомную палитру для твоего цвета #1B2E3D
  colors: {
    royalBlue: [
      '#ebf1f6', '#d3e1ec', '#a2c1d9', '#6d9fc5', '#4281b3',
      '#266ea8', '#1663a2', '#06538f', '#1B2E3D', '#003a68' // Индекс 8 - твой цвет
    ],
  },
  // 2. Устанавливаем его как главный цвет приложения
  primaryColor: 'royalBlue',
  primaryShade: 8,
  
  // 3. Устанавливаем Google Sans для всего приложения
  fontFamily: '"Google Sans", sans-serif',
  headings: {
    fontFamily: '"Google Sans", sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>,
);