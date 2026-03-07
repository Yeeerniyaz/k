import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Title,
  Text,
  Button,
  Stack,
  Center,
  Image,
  Flex,
  Box,
  Alert
} from '@mantine/core';
import { IconAt, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// 🔥 Senior Update: Импортируем функцию логина из нового axios.js
import { login as loginApi } from '../api/axios.js';

export default function Login() {
  // ==========================================
  // СОСТОЯНИЯ
  // ==========================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Инициализируем хук навигации
  const navigate = useNavigate();

  // ==========================================
  // БИЗНЕС-ЛОГИКА (AUTHENTICATION)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Валидация на фронтенде перед отправкой
      if (!email || !password) {
        throw new Error('Пожалуйста, введите логин и пароль');
      }

      // Используем новый API метод
      const response = await loginApi({ email, password });
      
      // Сервер должен вернуть token внутри data или data.token
      // (Проверяем оба варианта на всякий случай)
      const token = response.data.token || response.data.data?.token;

      if (token) {
        // 🔥 FIX: Сохраняем токен со стандартным ключом 'token'
        localStorage.setItem('token', token);

        // Если сервер прислал данные пользователя, сохраняем их тоже
        const user = response.data.user || response.data.data?.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        // 🔥 SENIOR FIX: Поскольку в App.jsx нет глобального стейта (Context/Redux),
        // обычный navigate() не заставит App.jsx заново прочитать localStorage.
        // Поэтому делаем жесткий редирект, чтобы приложение инициализировалось заново.
        window.location.href = '/admin';
      } else {
        throw new Error('Некорректный ответ сервера. Токен не получен.');
      }
    } catch (err) {
      console.error('Ошибка при входе:', err);
      // Вытягиваем текст ошибки от бэкенда или показываем стандартный
      const message = err.response?.data?.message || err.message || 'Ошибка авторизации. Проверьте данные.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🔥 СЕНЬОРСКИЙ ХАК: Flex-контейнер на весь экран, перекрывающий всё остальное
    <Flex
      pos="fixed"
      top={0}
      left={0}
      w="100vw"
      h="100vh"
      style={{ zIndex: 9999, fontFamily: '"Google Sans", sans-serif' }}
      // На мобилках колонкой (сверху вниз), на ПК строкой (слева направо)
      direction={{ base: 'column', md: 'row' }}
    >
      
      {/* ========================================== */}
      {/* ЛЕВАЯ ЗОНА: БРЕНДИНГ (Синяя) */}
      {/* ========================================== */}
      <Center
        w={{ base: '100%', md: '45%' }}
        h={{ base: '35%', md: '100%' }}
        bg="#1B2E3D"
        p="xl"
        style={{ flexDirection: 'column', textAlign: 'center' }}
      >
        {/* Логотип: на телефоне поменьше, на ПК побольше */}
        <Image 
          src="/assets/logo.svg" 
          w={{ base: 50, md: 90 }} 
          fit="contain" 
          mb="md" 
        />
        
        <Title
          order={1}
          style={{
            fontFamily: '"Alyamama", sans-serif',
            color: 'white',
            letterSpacing: '2px',
            fontSize: 'clamp(28px, 4vw, 42px)' // Адаптивный размер шрифта
          }}
        >
          ROYAL BANNERS
        </Title>
        
        <Text 
          c="rgba(255, 255, 255, 0.7)" 
          mt="sm" 
          size="lg" 
          visibleFrom="sm" // Показываем этот текст только на ПК
        >
          Единая система управления предприятием
        </Text>
      </Center>

      {/* ========================================== */}
      {/* ПРАВАЯ ЗОНА: ФОРМА АВТОРИЗАЦИИ (Белая) */}
      {/* ========================================== */}
      <Center
        w={{ base: '100%', md: '55%' }}
        h={{ base: '65%', md: '100%' }}
        bg="white"
        p="xl"
      >
        {/* Контейнер ограничивает ширину формы, чтобы она не растягивалась на весь экран */}
        <Box w="100%" maw={380}>
          <Title order={2} mb={5} style={{ color: '#1B2E3D' }}>
            Вход в систему
          </Title>
          <Text c="dimmed" size="sm" mb={25}>
            Введите ваши учетные данные для доступа к панели
          </Text>

          {/* 🔥 НОВОЕ: Красивый вывод ошибок сервера */}
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Внимание" color="red" mb="md" variant="light" radius="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="admin@royalbanners.kz"
                required
                leftSection={<IconAt size={18} stroke={1.5} color="#1B2E3D" />}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                error={error && " "} // Подсвечивает красным без текста (текст в Alert)
                styles={{
                  label: { color: '#1B2E3D', fontWeight: 600, marginBottom: '6px' },
                  input: { fontFamily: '"Google Sans", sans-serif', borderColor: error ? 'red' : '#e0e0e0' }
                }}
              />
              
              <PasswordInput
                label="Пароль"
                placeholder="Ваш пароль"
                required
                leftSection={<IconLock size={18} stroke={1.5} color="#1B2E3D" />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                error={error && " "}
                styles={{
                  label: { color: '#1B2E3D', fontWeight: 600, marginBottom: '6px' },
                  input: { fontFamily: '"Google Sans", sans-serif', borderColor: error ? 'red' : '#e0e0e0' },
                  error: { fontFamily: '"Google Sans", sans-serif', marginTop: '6px' }
                }}
              />
              
              <Button 
                type="submit" 
                fullWidth 
                mt="xl" 
                loading={loading} 
                radius="md"
                size="lg"
                style={{ 
                  fontFamily: '"Google Sans", sans-serif', 
                  fontWeight: 600,
                  backgroundColor: '#1B2E3D',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                Войти в панель
              </Button>
            </Stack>
          </form>
        </Box>
      </Center>

    </Flex>
  );
}