import axios from 'axios';

// ==========================================
// СМАРТ-КЛИЕНТ ДЛЯ СВЯЗИ С БЭКЕНДОМ (ENTERPRISE)
// ==========================================

// 🔥 СЕНЬОРСКИЙ ХАК: Автоматическое определение среды!
// Если ты открыл проект на ноуте (localhost), запросы летят на твой боевой VPS.
// Если проект уже задеплоен на VPS, запросы летят по относительному пути '/api'.
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalDev ? 'https://r.yeee.kz/api' : '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==========================================
// ПЕРЕХВАТЧИК ЗАПРОСОВ (ИНЖЕКЦИЯ ТОКЕНА)
// ==========================================
api.interceptors.request.use(
    (config) => {
        // Достаем токен админа из локального хранилища твоего браузера
        const token = localStorage.getItem('royal_token');
        
        // Если токен есть, вешаем его как электронный пропуск на каждый запрос
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==========================================
// ПЕРЕХВАТЧИК ОТВЕТОВ (ГЛОБАЛЬНАЯ ОБРАБОТКА ОШИБОК)
// ==========================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Если сервер VPS ответил 401 (Токен недействителен, истек или его нет)
        if (error.response && error.response.status === 401) {
            console.warn('🚨 Доступ закрыт. Выполняем выход...');
            
            // Уничтожаем старый/битый токен
            localStorage.removeItem('royal_token');
            
            // Принудительно выкидываем пользователя на страницу логина
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;