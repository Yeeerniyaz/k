import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, Title, NavLink, Button, Text, Center, Image } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconPhoto, IconShoppingCart, IconUsers, IconLogout } from '@tabler/icons-react';

// ==========================================
// ИМПОРТЫ НАШИХ БОЕВЫХ СТРАНИЦ
// ==========================================
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';

// ==========================================
// ЗАГЛУШКИ ДЛЯ ОСТАВШИХСЯ СТРАНИЦ АДМИНКИ
// ==========================================
const Portfolio = () => <div style={{ fontFamily: '"Google Sans", sans-serif' }}><Title order={2} style={{ color: '#1B2E3D' }}>Портфолио</Title><Text mt="sm" c="dimmed">Редактор ваших лучших работ...</Text></div>;
const Users = () => <div style={{ fontFamily: '"Google Sans", sans-serif' }}><Title order={2} style={{ color: '#1B2E3D' }}>Сотрудники</Title><Text mt="sm" c="dimmed">Управление доступом менеджеров...</Text></div>;

// ==========================================
// СЕНЬОРСКАЯ АРХИТЕКТУРА: ИЗОЛИРОВАННАЯ АДМИНКА
// Этот Layout загружается ТОЛЬКО если пользователь авторизован и зашел на /admin
// ==========================================
const AdminLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('royal_token');
    // При выходе выкидываем на публичную главную страницу к клиентам
    window.location.href = '/'; 
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>
              <Center bg="#1B2E3D" w={40} h={40} style={{ borderRadius: '8px' }}>
                <Image src="/assets/logo.svg" w={24} h={24} fit="contain" />
              </Center>
              <Title order={3} visibleFrom="sm" style={{ fontFamily: '"Alyamama", sans-serif', color: '#1B2E3D', letterSpacing: '1px', fontWeight: 700 }}>
                ROYAL BANNERS
              </Title>
            </Group>
          </Group>
          
          <Button variant="light" color="red" leftSection={<IconLogout size={16}/>} onClick={handleLogout} style={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 600 }}>
            Выйти
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ fontFamily: '"Google Sans", sans-serif' }}>
        <NavLink label="Дашборд" leftSection={<IconDashboard size="1.1rem" stroke={1.5} />} onClick={() => { navigate('/admin'); toggle(); }} color="royalBlue" variant="light" active={location.pathname === '/admin'} />
        <NavLink label="Заказы" leftSection={<IconShoppingCart size="1.1rem" stroke={1.5} />} onClick={() => { navigate('/admin/orders'); toggle(); }} color="royalBlue" variant="light" active={location.pathname === '/admin/orders'} />
        <NavLink label="Портфолио" leftSection={<IconPhoto size="1.1rem" stroke={1.5} />} onClick={() => { navigate('/admin/portfolio'); toggle(); }} color="royalBlue" variant="light" active={location.pathname === '/admin/portfolio'} />
        <NavLink label="Сотрудники" leftSection={<IconUsers size="1.1rem" stroke={1.5} />} onClick={() => { navigate('/admin/users'); toggle(); }} color="royalBlue" variant="light" active={location.pathname === '/admin/users'} />
      </AppShell.Navbar>

      <AppShell.Main bg="#f8f9fa">
        {/* Вложенные роуты админки */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/users" element={<Users />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
};

// ==========================================
// ГЛАВНЫЙ РОУТЕР ПРИЛОЖЕНИЯ
// ==========================================
export default function App() {
  const token = localStorage.getItem('royal_token');
  const isAuthenticated = !!token;

  return (
    <Routes>
      {/* 1. ПУБЛИЧНАЯ ЗОНА (Доступна всем) */}
      <Route path="/" element={<Home />} />
      
      {/* Роут для просмотра конкретной категории (Баннеры, Лайтбоксы и т.д.) */}
      <Route path="/category/:id" element={
        <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: '"Google Sans", sans-serif' }}>
          <Title order={2} style={{ color: '#1B2E3D' }}>Работы категории</Title>
          <Text c="dimmed" mt="sm" mb="xl">Скоро здесь появится галерея ваших проектов...</Text>
          <Button component="a" href="/" color="#1B2E3D">На главную</Button>
        </div>
      } />

      {/* 2. АВТОРИЗАЦИЯ */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/admin" replace />} />

      {/* 3. ПРИВАТНАЯ ЗОНА (Админка, защищена проверкой токена) */}
      <Route path="/admin/*" element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />} />

      {/* 4. ОБРАБОТКА ОШИБОК 404 (Если ввели несуществующий адрес - на главную) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}