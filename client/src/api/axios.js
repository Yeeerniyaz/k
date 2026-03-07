import axios from 'axios';

// ==========================================
// 1. ЖЕСТКАЯ КОНФИГУРАЦИЯ ДЛЯ VPS (SENIOR LEVEL)
// ==========================================
// Берем IP или домен, по которому ты открыл сайт на телефоне (например, 89.123.45.67)
const hostname = window.location.hostname;
const protocol = window.location.protocol;

// 🔥 ЖЕСТКО указываем порт бэкенда (5005), чтобы телефон не терял сервер
export const API_URL = "http://82.115.43.240:5005/api";

// Экспортируем чистый домен бэкенда (без /api на конце)
export const BASE_URL = API_URL.replace('/api', '');

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

export const login = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');
export const logout = () => API.post('/auth/logout');

export const fetchDashboardStats = (params) => API.get('/analytics/dashboard', { params });

export const fetchOrders = () => API.get('/orders');
export const createOrder = (orderData) => API.post('/orders', orderData);
export const updateOrder = (id, orderData) => API.put(`/orders/${id}`, orderData);
export const deleteOrder = (id) => API.delete(`/orders/${id}`);

export const fetchExpenses = () => API.get('/finance/expenses');
export const addExpense = (expenseData) => API.post('/finance/expenses', expenseData);
export const updateExpense = (id, expenseData) => API.put(`/finance/expenses/${id}`, expenseData);
export const deleteExpense = (id) => API.delete(`/finance/expenses/${id}`);

export const fetchPrices = () => API.get('/prices');
export const addPrice = (priceData) => API.post('/prices', priceData);
export const updatePrice = (id, priceData) => API.put(`/prices/${id}`, priceData);
export const deletePrice = (id) => API.delete(`/prices/${id}`);

export const fetchPortfolio = () => API.get('/portfolio');
// ВАЖНО: Никаких кастомных заголовков для multipart, браузер сделает это сам!
export const addPortfolio = (formData) => API.post('/portfolio', formData);
export const updatePortfolioItem = (id, data) => API.put(`/portfolio/${id}`, data);
export const deletePortfolioItem = (id) => API.delete(`/portfolio/${id}`);

export const fetchUsers = () => API.get('/users');
export const createUser = (userData) => API.post('/users', userData);
export const updateUser = (id, userData) => API.put(`/users/${id}`, userData);
export const deleteUser = (id) => API.delete(`/users/${id}`);

export default API;