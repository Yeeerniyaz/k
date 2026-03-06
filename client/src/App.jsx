import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
} from "@tabler/icons-react";

import Login from "./pages/Login.jsx";

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

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();

  const token = localStorage.getItem("royal_token");
  const isAuthenticated = !!token;

  const handleLogout = () => {
    localStorage.removeItem("royal_token");
    window.location.href = "/login";
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
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />

            {/* 🔥 КОНТЕЙНЕР ДЛЯ ЛОГОТИПА */}
            <Group
              gap="sm"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              {/* Квадрат с твоим цветом и скруглением */}
              <Center
                bg="#1B2E3D"
                w={40}
                h={40}
                style={{ borderRadius: "8px" }}
              >
                {/* ВАЖНО: Если твой конь в SVG темный, добавь ему fill="#ffffff" прямо в файле logo.svg, 
                  чтобы он был белым на темном фоне контейнера!
                */}
                <Image src="/src/assets/logo.svg" w={24} h={24} fit="contain" />
              </Center>

              {/* Текст шрифтом Alyamama. visibleFrom="sm" прячет его на телефонах! */}
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

          {isAuthenticated && (
            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Выйти
            </Button>
          )}
        </Group>
      </AppShell.Header>

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

      <AppShell.Main>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/users" element={<Users />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
