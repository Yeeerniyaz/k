import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Text,
  Container,
  Button,
  Box,
  Image,
  Center,
  Alert,
} from "@mantine/core";
import { IconLock, IconAt, IconAlertCircle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// 🔥 Senior Update: Импортируем функцию логина из нового axios.js вместо старого index.js
import { login as loginApi } from "../api/axios.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ==========================================
  // ОБРАБОТКА ВХОДА (AUTHENTICATION)
  // ==========================================
  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      // Валидация на фронтенде (Senior всегда проверяет данные перед отправкой)
      if (!email || !password) {
        throw new Error("Пожалуйста, введите логин и пароль");
      }

      const response = await loginApi({ email, password });

      if (response.data && response.data.token) {
        // Сохраняем токен в localStorage (ключ 'token', как настроено в axios.js)
        localStorage.setItem("token", response.data.token);

        // Если сервер прислал данные пользователя, сохраняем их
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        // Редирект на главную страницу после успешного входа
        navigate("/admin");
      } else {
        throw new Error("Некорректный ответ сервера. Токен не получен.");
      }
    } catch (err) {
      console.error("Ошибка при входе:", err);
      // Если бэкенд вернул сообщение об ошибке, показываем его, иначе стандартное
      const message =
        err.response?.data?.message ||
        err.message ||
        "Ошибка авторизации. Проверьте данные.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        backgroundColor: "#f1f3f5",
        backgroundImage: "linear-gradient(135deg, #1B2E3D 0%, #000000 100%)", // Фирменный стиль (черный + оранжевый будет в кнопке)
      }}
    >
      <Container size={420} my={40}>
        <Paper withBorder shadow="xl" p={30} radius="md" bg="white">
          <Center mb="lg">
            {/* Логотип или Название */}
            <Title order={2} style={{ color: "#1B2E3D", letterSpacing: "1px" }}>
              VECTOR{" "}
              <Text component="span" c="orange.6" inherit>
                ADMIN
              </Text>
            </Title>
          </Center>

          <Text c="dimmed" size="sm" ta="center" mb={30}>
            Введите учетные данные для доступа к системе управления Royal
            Banners
          </Text>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Ошибка доступа"
              color="red"
              mb="md"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextInput
              label="Email (Логин)"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              leftSection={<IconAt size={16} />}
              mb="md"
            />

            <PasswordInput
              label="Пароль"
              placeholder="Ваш пароль"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              leftSection={<IconLock size={16} />}
              mb="md"
            />

            <Button
              fullWidth
              mt="xl"
              size="md"
              type="submit"
              loading={loading}
              style={{
                backgroundColor: "#FF8C00", // Твой любимый оранжевый
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              Войти в систему
            </Button>
          </form>

          <Divider
            my="lg"
            label="Royal Banners Security"
            labelPosition="center"
          />

          <Text size="xs" c="dimmed" ta="center">
            Версия системы: 1.0.0-stable (YEEE Edition) <br />© 2024 Royal
            Banners. Все права защищены.
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}

// Вспомогательный компонент Divider, если он не импортирован из Mantine
function Divider({ my, label, labelPosition }) {
  return (
    <Box style={{ position: "relative", margin: `${my}px 0` }}>
      <hr style={{ border: "none", borderTop: "1px solid #dee2e6" }} />
      <Text
        size="xs"
        c="dimmed"
        style={{
          position: "absolute",
          top: "50%",
          left: labelPosition === "center" ? "50%" : "0",
          transform:
            labelPosition === "center"
              ? "translate(-50%, -50%)"
              : "translateY(-50%)",
          backgroundColor: "white",
          padding: "0 10px",
        }}
      >
        {label}
      </Text>
    </Box>
  );
}
