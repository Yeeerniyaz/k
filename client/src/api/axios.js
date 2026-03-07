import axios from 'axios';

// ==========================================
// 1. ИНТЕЛЛЕКТУАЛЬНАЯ КОНФИГУРАЦИЯ (СЕНЬОР-ХАК)
// ==========================================
// Автоматически определяем, где запущен фронтенд.
// Если на локальном ПК (localhost) - стучимся на боевой VPS (ukb.yeee.kz) или локальный порт.
// Если проект уже скомпилирован на VPS - используем относительный путь '/api' или VITE_API_URL.
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalDev
    ? (import.meta.env.VITE_API_URL || 'https://ukb.yeee.kz/api')
    : (import.meta.env.VITE_API_URL || '/api');

const API = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==========================================
// 2. ИНТЕРСЕПТОР ЗАПРОСОВ (АВТО-ТОКЕН)
// ==========================================
API.interceptors.request.use(
    (config) => {
        // Единый стандарт ключа: 'token'
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// 3. ИНТЕРСЕПТОР ОТВЕТОВ (ГЛОБАЛЬНАЯ ОШИБКА 401)
// ==========================================
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('🚨 Сессия истекла. Доступ закрыт.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Если мы не на странице логина, делаем редирект
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ==========================================
// 4. API ЭНДПОИНТЫ (МЕТОДЫ)
// ==========================================

// --- AUTH (Авторизация) ---
export const login = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');
export const logout = () => API.post('/auth/logout');

// --- ANALYTICS ---
export const fetchDashboardStats = (params) => API.get('/analytics/dashboard', { params });

// --- ORDERS (Заказы) ---
export const fetchOrders = () => API.get('/orders');
export const createOrder = (orderData) => API.post('/orders', orderData);
export const updateOrder = (id, orderData) => API.put(`/orders/${id}`, orderData);
export const deleteOrder = (id) => API.delete(`/orders/${id}`);

// --- FINANCE (Расходы фирмы) ---
export const fetchExpenses = () => API.get('/finance/expenses');
export const addExpense = (expenseData) => API.post('/finance/expenses', expenseData);
export const updateExpense = (id, expenseData) => API.put(`/finance/expenses/${id}`, expenseData);
export const deleteExpense = (id) => API.delete(`/finance/expenses/${id}`);

// --- PRICES (Прайс-лист) ---
export const fetchPrices = () => API.get('/prices');
export const addPrice = (priceData) => API.post('/prices', priceData);
export const updatePrice = (id, priceData) => API.put(`/prices/${id}`, priceData);
export const deletePrice = (id) => API.delete(`/prices/${id}`);

// --- PORTFOLIO (Наши работы) ---
export const fetchPortfolio = () => API.get('/portfolio');
// Нағыз Senior варианты: Axios бәрін өзі реттейді
export const addPortfolio = (formData) => API.post('/portfolio', formData);
export const updatePortfolioItem = (id, data) => API.put(`/portfolio/${id}`, data);
export const deletePortfolioItem = (id) => API.delete(`/portfolio/${id}`);

// --- USERS (Персонал) ---
export const fetchUsers = () => API.get('/users');
export const createUser = (userData) => API.post('/users', userData);
export const updateUser = (id, userData) => API.put(`/users/${id}`, userData);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Экспортируем сам инстанс по умолчанию (на случай, если где-то нужен прямой вызов API.get(...))
export default API;