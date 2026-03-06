import { useState, useEffect } from 'react';
import {
  Title, Text, Paper, Table, Button, Group, ActionIcon, 
  Skeleton, Alert, Tooltip, Modal, TextInput, PasswordInput, 
  Select, Badge, Center, Stack, Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconUserPlus, IconTrash, IconAlertCircle, IconRefresh, 
  IconMail, IconLock, IconUser, IconShieldLock, IconEdit
} from '@tabler/icons-react';
import api from '../api/index.js';

export default function Users() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (СОЗДАНИЕ / РЕДАКТИРОВАНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState(null); // Смарт-флаг: null = создание, ID = редактирование
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MANAGER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА СОТРУДНИКОВ
  // ==========================================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users');
      setUsers(response.data.data || response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки сотрудников:', err);
      // Умный фоллбэк: если бэкенд для пользователей еще не готов, покажем фейковые данные для теста UI
      setUsers([
        { id: '1', name: 'Ернияз (Владелец)', email: 'admin@royalbanners.kz', role: 'ADMIN', createdAt: new Date().toISOString() },
        { id: '2', name: 'Тестовый Менеджер', email: 'manager@royalbanners.kz', role: 'MANAGER', createdAt: new Date().toISOString() }
      ]);
      setError('Не удалось подключиться к базе пользователей. Показаны демонстрационные данные.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ОТКРЫТИЕ МОДАЛКИ
  // ==========================================
  const handleOpenModal = (user = null) => {
    if (user) {
      // Режим редактирования
      setEditingId(user.id);
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'MANAGER');
      setPassword(''); // Специально оставляем пустым для безопасности
    } else {
      // Режим создания
      setEditingId(null);
      setName('');
      setEmail('');
      setRole('MANAGER');
      setPassword('');
    }
    open();
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: СОХРАНЕНИЕ (СОЗДАНИЕ/ОБНОВЛЕНИЕ)
  // ==========================================
  const handleSaveUser = async (e) => {
    e.preventDefault();
    // Базовая валидация (пароль обязателен только при создании)
    if (!name || !email || !role) return;
    if (!editingId && !password) {
      alert('При создании нового сотрудника необходимо задать пароль.');
      return;
    }

    setIsSubmitting(true);
    
    // Формируем payload. Пароль добавляем только если он был изменен или задан
    const payload = { name, email, role };
    if (password.trim() !== '') {
      payload.password = password;
    }

    try {
      if (editingId) {
        // Обновляем существующего (смена пароля или данных)
        await api.put(`/users/${editingId}`, payload);
      } else {
        // Создаем нового
        await api.post('/users', payload);
      }
      
      close();
      fetchUsers(); // Обновляем таблицу
    } catch (err) {
      console.error('Ошибка при сохранении пользователя:', err);
      
      // Сеньорская заглушка для демо-режима
      if (error) {
        if (editingId) {
          setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...payload } : u));
        } else {
          setUsers(prev => [...prev, { id: Date.now().toString(), ...payload, createdAt: new Date().toISOString() }]);
        }
        close();
      } else {
        alert(err.response?.data?.message || 'Ошибка при сохранении профиля сотрудника. Возможно, email занят.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УДАЛЕНИЕ СОТРУДНИКА
  // ==========================================
  const handleDeleteUser = async (id, userRole) => {
    if (userRole === 'ADMIN') {
      alert('Удаление администратора запрещено в целях безопасности.');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите закрыть доступ этому сотруднику? Это действие нельзя отменить.')) return;
    
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      if (error) {
        setUsers(prev => prev.filter(user => user.id !== id)); // Демо-удаление
      } else {
        alert('Не удалось удалить сотрудника.');
      }
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      
      {/* ========================================== */}
      {/* ШАПКА СТРАНИЦЫ */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#1B2E3D' }}>Сотрудники и Доступы</Title>
          <Text c="dimmed" mt={5}>Управление правами доступа к панели администратора</Text>
        </div>
        
        <Group>
          <Tooltip label="Обновить список">
            <ActionIcon variant="default" size="lg" onClick={fetchUsers} loading={loading}>
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Button 
            leftSection={<IconUserPlus size={16} />} 
            onClick={() => handleOpenModal()}
            style={{ backgroundColor: '#1B2E3D', color: 'white', fontWeight: 600 }}
          >
            Добавить сотрудника
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Внимание (Режим разработки)" color="orange" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ */}
      {/* ========================================== */}
      <Paper withBorder radius="md" shadow="sm" p={0} style={{ overflow: 'hidden', backgroundColor: 'white' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} />
          </div>
        ) : users.length > 0 ? (
          <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
              <Table.Tr>
                <Table.Th style={{ color: '#1B2E3D' }}>Сотрудник</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Контакты</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Роль</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Дата добавления</Table.Th>
                <Table.Th style={{ color: '#1B2E3D', textAlign: 'right' }}>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((user) => (
                <Table.Tr key={user.id}>
                  {/* Имя */}
                  <Table.Td>
                    <Group gap="sm">
                      <Center w={36} h={36} bg="#f1f3f5" style={{ borderRadius: '50%' }}>
                        {user.role === 'ADMIN' ? <IconShieldLock size={18} color="#1B2E3D" /> : <IconUser size={18} color="#868e96" />}
                      </Center>
                      <Text fw={600} size="sm" style={{ color: '#1B2E3D' }}>{user.name}</Text>
                    </Group>
                  </Table.Td>
                  
                  {/* Email */}
                  <Table.Td>
                    <Text size="sm">{user.email}</Text>
                  </Table.Td>
                  
                  {/* Роль */}
                  <Table.Td>
                    {user.role === 'ADMIN' ? (
                      <Badge color="red" variant="light">Администратор</Badge>
                    ) : (
                      <Badge color="gray" variant="light" style={{ color: '#1B2E3D' }}>Менеджер</Badge>
                    )}
                  </Table.Td>

                  {/* Дата */}
                  <Table.Td>
                    <Text size="sm" c="dimmed">{formatDate(user.createdAt)}</Text>
                  </Table.Td>
                  
                  {/* Действия */}
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Group gap="xs" justify="flex-end">
                      {/* КНОПКА РЕДАКТИРОВАНИЯ - ТЕПЕРЬ ЕСТЬ У ВСЕХ */}
                      <Tooltip label="Редактировать профиль и пароль">
                        <ActionIcon variant="light" color="blue" onClick={() => handleOpenModal(user)}>
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      
                      {/* УДАЛЕНИЕ ДОСТУПНО ТОЛЬКО ДЛЯ МЕНЕДЖЕРОВ */}
                      {user.role !== 'ADMIN' && (
                        <Tooltip label="Удалить доступ">
                          <ActionIcon variant="light" color="red" onClick={() => handleDeleteUser(user.id, user.role)}>
                            <IconTrash size={16} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Center style={{ padding: '60px 20px', flexDirection: 'column' }}>
            <IconUser size={48} color="#e0e0e0" stroke={1.5} />
            <Text size="lg" fw={500} mt="md" style={{ color: '#1B2E3D' }}>Нет сотрудников</Text>
            <Text c="dimmed" mt={5}>Добавьте менеджеров для работы с заказами.</Text>
          </Center>
        )}
      </Paper>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО: ДОБАВИТЬ / ИЗМЕНИТЬ СОТРУДНИКА */}
      {/* ========================================== */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={<Title order={3} style={{ color: '#1B2E3D' }}>{editingId ? 'Редактировать профиль' : 'Добавить сотрудника'}</Title>}
        size="md"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleSaveUser}>
          <Stack gap="md">
            <TextInput
              label="ФИО сотрудника"
              placeholder="Иван Иванов"
              required
              leftSection={<IconUser size={16} color="#1B2E3D" />}
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <TextInput
              label="Email (Логин)"
              placeholder="manager@royalbanners.kz"
              type="email"
              required
              leftSection={<IconMail size={16} color="#1B2E3D" />}
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <Select
              label="Роль в системе"
              data={[
                { value: 'MANAGER', label: 'Менеджер (Обработка заказов)' },
                { value: 'ADMIN', label: 'Администратор (Полный доступ)' }
              ]}
              required
              value={role}
              onChange={setRole}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <Divider my="xs" label="Смена пароля" labelPosition="center" />

            <PasswordInput
              label={editingId ? "Новый пароль" : "Пароль"}
              placeholder={editingId ? "Оставьте пустым, чтобы не менять" : "Задайте надежный пароль"}
              required={!editingId} // Обязательно только при создании
              leftSection={<IconLock size={16} color="#1B2E3D" />}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
              description={editingId ? "Впишите новый пароль, если сотрудник его забыл." : ""}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={close}>Отмена</Button>
              <Button type="submit" loading={isSubmitting} style={{ backgroundColor: '#1B2E3D' }}>
                {editingId ? 'Сохранить изменения' : 'Создать аккаунт'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

    </div>
  );
}