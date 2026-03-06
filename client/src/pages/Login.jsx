import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Text,
  Container,
  Button,
  Stack,
  Center,
  Image,
} from "@mantine/core";
import { IconAt, IconLock } from "@tabler/icons-react";
import api from "../api/index.js";

export default function Login() {
  // Состояния для хранения введенных данных
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция отправки формы на наш Node.js бэкенд
  const handleLogin = async (e) => {
    e.preventDefault(); // Останавливаем перезагрузку страницы
    setLoading(true);
    setError(null);

    try {
      // Стучимся в наш смарт-API (он сам решит, слать на VPS или локально)
      const response = await api.post("/auth/login", { email, password });

      // Достаем токен из ответа бэкенда
      const { token } = response.data.data;

      // Прячем токен в сейф браузера (localStorage)
      localStorage.setItem("royal_token", token);

      // Жестко перезагружаем страницу и кидаем в корень,
      // чтобы App.jsx увидел токен и пустил нас в админку
      window.location.href = "/";
    } catch (err) {
      // Если пароль неверный или сервер ответил ошибкой — выводим красивое сообщение
      setError(
        err.response?.data?.message || "Ошибка авторизации. Проверьте данные.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Center mb="lg" bg="gray">
        {/* Выводим твоего коня. Vite сам найдет его в папке public/assets/ */}
        <Image
          src="/src/assets/logo.svg"
          alt="Royal Banners Logo"
          w={100}
          fit="contain"
        />
      </Center>

      <Title ta="center" order={2}>
        Добро пожаловать
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        Войдите в панель управления Royal Banners
      </Text>

      {/* Сама карточка с формой. На белом фоне shadow="md" даст красивую тень */}
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleLogin}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="admin@royalbanners.kz"
              required
              leftSection={<IconAt size={16} stroke={1.5} />}
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={error && " "} // Подсвечиваем инпут красным, если есть ошибка
            />

            <PasswordInput
              label="Пароль"
              placeholder="Ваш пароль"
              required
              leftSection={<IconLock size={16} stroke={1.5} />}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              error={error} // Текст ошибки выводим под паролем
            />

            <Button
              type="submit"
              fullWidth
              mt="xl"
              loading={loading}
              color="orange"
            >
              Войти в систему
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
