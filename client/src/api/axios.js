import axios from 'axios';

// ==========================================
// 1. СОЗДАНИЕ ЭКЗЕМПЛЯРА AXIOS (SINGLETON)
// ==========================================
// Базовый URL берется из .env или используется локальный сервер по умолчанию.
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==========================================
// 2. REQUEST INTERCEPTOR (АВТО-ТОКЕН)
// ==========================================
// Перед каждым запросом на бэкенд, эта функция проверяет наличие токена.
// Если токен есть — добавляет его в заголовок Authorization.
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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
// 3. RESPONSE INTERCEPTOR (ОБРАБОТКА ОШИБОК)
// ==========================================
// Если бэкенд вернет 401 (токен протух), мы автоматически очищаем сессию.
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Сессия истекла или токен невалиден. Разлогиниваем...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Если мы не на странице логина, делаем редирект
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        // Сеньорский подход: пробрасываем ошибку дальше для обработки в UI (через Mantine Notifications)
        return Promise.reject(error);
    }
);

// ==========================================
// 4. API ЭНДПОИНТЫ (МЕТОДЫ)
// ==========================================

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
// Для портфолио используем multipart/form-data для передачи файлов
export const addPortfolio = (formData) => API.post('/portfolio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updatePortfolio = (id, data) => API.put(`/portfolio/${id}`, data);
export const deletePortfolio = (id) => API.delete(`/portfolio/${id}`);

// --- USERS (Персонал) ---
export const fetchUsers = () => API.get('/users');
export const createUser = (userData) => API.post('/users', userData);
export const updateUser = (id, userData) => API.put(`/users/${id}`, userData);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// --- AUTH (Авторизация) ---
export const login = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');

export default API;