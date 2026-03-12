import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  AppShell,
  Burger,
  Group,
  Title,
  NavLink,
  Button,
  Text,
  Center,
  Image,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconPhoto,
  IconShoppingCart,
  IconUsers,
  IconLogout,
  IconReportMoney,
  IconWallet,
  IconSettings,
} from "@tabler/icons-react";

// ==========================================
// ИМПОРТЫ НАШИХ БОЕВЫХ СТРАНИЦ
// ==========================================
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Orders from "./pages/Orders.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Users from "./pages/Users.jsx";
import Category from "./pages/Category.jsx";
import Prices from "./pages/Prices.jsx";
import Finance from "./pages/Finance.jsx";
import CalculatorSettings from "./pages/CalculatorSettings.jsx";
import PublicPortfolio from "./pages/PublicPortfolio.jsx";
import PageBuilder from "./pages/PageBuilder";

// Внутри твоих роутов

// ==========================================
// СЕНЬОРСКАЯ АРХИТЕКТУРА: ИЗОЛИРОВАННАЯ АДМИНКА
// Этот Layout загружается ТОЛЬКО если пользователь авторизован и зашел на /admin
// ==========================================
const AdminLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // 🔥 FIX: Удаляем правильные ключи из локального хранилища
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // При выходе жестко выкидываем на публичную главную страницу к клиентам
    window.location.href = "/";
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      {/* ========================================== */}
      {/* ШАПКА АДМИНКИ */}
      {/* ========================================== */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group
              gap="sm"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/admin")}
            >
              <Center
                bg="#1B2E3D"
                w={40}
                h={40}
                style={{ borderRadius: "8px" }}
              >
                <Image src="/assets/logo.svg" w={24} h={24} fit="contain" />
              </Center>
              <Title
                order={3}
                visibleFrom="sm"
                style={{
                  fontFamily: '"Alyamama", sans-serif',
                  color: "#1B2E3D",
                  letterSpacing: "1px",
                  fontWeight: 700,
                }}
              >
                ROYAL BANNERS
              </Title>
            </Group>
          </Group>

          <Button
            variant="light"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
            style={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 600 }}
          >
            Выйти
          </Button>
        </Group>
      </AppShell.Header>

      {/* ========================================== */}
      {/* БОКОВОЕ МЕНЮ АДМИНКИ */}
      {/* ========================================== */}
      <AppShell.Navbar
        p="md"
        style={{ fontFamily: '"Google Sans", sans-serif' }}
      >
        <NavLink
          label="Дашборд"
          leftSection={<IconDashboard size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={
            location.pathname === "/admin" || location.pathname === "/admin/"
          }
        />
        <NavLink
          label="Заказы"
          leftSection={<IconShoppingCart size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin/orders");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={location.pathname === "/admin/orders"}
        />
        <NavLink
          label="Финансы"
          leftSection={<IconWallet size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin/finance");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={location.pathname === "/admin/finance"}
        />
        <NavLink
          label="Прайс-лист"
          leftSection={<IconReportMoney size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin/prices");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={location.pathname === "/admin/prices"}
        />
        <NavLink
          label="Калькулятор"
          leftSection={<IconSettings size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin/calculator-settings");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={location.pathname === "/admin/calculator-settings"}
        />
        <NavLink
          label="Портфолио"
          leftSection={<IconPhoto size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin/portfolio");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={location.pathname === "/admin/portfolio"}
        />
        <NavLink
          label="Сотрудники"
          leftSection={<IconUsers size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin/users");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={location.pathname === "/admin/users"}
        />
        <NavLink
          label="Страница"
          leftSection={<IconUsers size="1.1rem" stroke={1.5} />}
          onClick={() => {
            navigate("/admin/cms");
            toggle();
          }}
          color="royalBlue"
          variant="light"
          active={location.pathname === "/admin/cms"}
        />
      </AppShell.Navbar>

      {/* ========================================== */}
      {/* РЕНДЕР КОНТЕНТА АДМИНКИ */}
      {/* ========================================== */}
      <AppShell.Main bg="#f8f9fa">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/calculator-settings" element={<CalculatorSettings />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/users" element={<Users />} />
          <Route path="/cms" element={<PageBuilder />} />
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
  // 🔥 FIX: Ищем правильный ключ 'token', а не старый 'royal_token'
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

  return (
    <Routes>
      {/* 1. ПУБЛИЧНАЯ ЗОНА (Доступна всем клиентам) */}
      <Route path="/" element={<Home />} />
      <Route path="/category/:id" element={<Category />} />
      <Route path="/portfolio" element={<PublicPortfolio />} />

      {/* 2. АВТОРИЗАЦИЯ */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? <Login /> : <Navigate to="/admin" replace />
        }
      />

      {/* 3. ПРИВАТНАЯ ЗОНА (Админка, защищена проверкой токена) */}
      <Route
        path="/admin/*"
        element={
          isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />
        }
      />

      {/* 4. ОБРАБОТКА ОШИБОК 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
