import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  AppShell,
  Burger,
  Group,
  Title,
  NavLink,
  Button,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconPhoto,
  IconShoppingCart,
  IconUsers,
  IconLogout,
} from "@tabler/icons-react";

// ==========================================
// 1. ЗАГЛУШКИ ДЛЯ СТРАНИЦ
// (Позже каждую из них мы вынесем в отдельный красивый файл)
// ==========================================
const Dashboard = () => (
  <div>
    <Title order={2}>Аналитика и Дашборд</Title>
    <Text mt="sm">Здесь будут графики и статистика...</Text>
  </div>
);
const Orders = () => (
  <div>
    <Title order={2}>Управление заказами</Title>
    <Text mt="sm">Список заявок от клиентов...</Text>
  </div>
);
const Portfolio = () => (
  <div>
    <Title order={2}>Портфолио</Title>
    <Text mt="sm">Редактор ваших лучших работ...</Text>
  </div>
);
const Users = () => (
  <div>
    <Title order={2}>Сотрудники</Title>
    <Text mt="sm">Управление доступом менеджеров...</Text>
  </div>
);
const Login = () => (
  <div>
    <Title order={2}>Авторизация</Title>
    <Text mt="sm">Скоро здесь будет форма входа...</Text>
  </div>
);

export default function App() {
  // Хук для управления состоянием мобильного меню (бургер)
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();

  // ==========================================
  // 2. БАЗОВАЯ ПРОВЕРКА АВТОРИЗАЦИИ
  // Пока мы жестко задаем false, чтобы видеть только страницу логина.
  // Позже мы заменим это на проверку JWT-токена из localStorage или Zustand.
  // ==========================================
  const isAuthenticated = false;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        // Боковое меню скрыто на мобилках, пока не нажмут на бургер
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      {/* ========================================== */}
      {/* ХЕДЕР (ВЕРХНЯЯ ПАНЕЛЬ) */}
      {/* ========================================== */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* Кнопка-бургер появляется только на мобильных экранах */}
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3} c="orange">
              Royal Banners
            </Title>
          </Group>

          {/* Кнопка выхода отображается только если пользователь авторизован */}
          {isAuthenticated && (
            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={16} />}
            >
              Выйти
            </Button>
          )}
        </Group>
      </AppShell.Header>

      {/* ========================================== */}
      {/* САЙДБАР (БОКОВОЕ МЕНЮ) */}
      {/* ========================================== */}
      {/* Рендерим меню только если админ вошел в систему */}
      {isAuthenticated && (
        <AppShell.Navbar p="md">
          <NavLink
            label="Дашборд"
            leftSection={<IconDashboard size="1rem" stroke={1.5} />}
            onClick={() => {
              navigate("/");
              toggle();
            }}
          />
          <NavLink
            label="Заказы"
            leftSection={<IconShoppingCart size="1rem" stroke={1.5} />}
            onClick={() => {
              navigate("/orders");
              toggle();
            }}
          />
          <NavLink
            label="Портфолио"
            leftSection={<IconPhoto size="1rem" stroke={1.5} />}
            onClick={() => {
              navigate("/portfolio");
              toggle();
            }}
          />
          <NavLink
            label="Сотрудники"
            leftSection={<IconUsers size="1rem" stroke={1.5} />}
            onClick={() => {
              navigate("/users");
              toggle();
            }}
          />
        </AppShell.Navbar>
      )}

      {/* ========================================== */}
      {/* ГЛАВНАЯ ЗОНА (КОНТЕНТ СТРАНИЦ) */}
      {/* ========================================== */}
      <AppShell.Main>
        <Routes>
          {/* Сценарий 1: Гость (не авторизован) */}
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<Login />} />
              {/* Любой другой URL перекидывает на логин */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            /* Сценарий 2: Админ (авторизован) */
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/users" element={<Users />} />
              {/* Любой неизвестный URL перекидывает на главную */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
