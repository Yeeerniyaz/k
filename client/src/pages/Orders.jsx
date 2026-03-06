import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Paper,
  Table,
  Badge,
  Button,
  Group,
  ActionIcon,
  Skeleton,
  Alert,
  Tooltip
} from '@mantine/core';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconAlertCircle,
  IconRefresh
} from '@tabler/icons-react';
import api from '../api/index.js';

export default function Orders() {
  // ==========================================
  // СОСТОЯНИЯ
  // ==========================================
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ЗАКАЗОВ
  // ==========================================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Обращаемся к нашему API за списком заказов
      const response = await api.get('/orders');
      // Ожидаем, что бэкенд возвращает { data: [...] }
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err);
      setError('Не удалось загрузить список заказов. Проверьте соединение с сервером.');
    } finally {
      setLoading(false);
    }
  };

  // Запускаем загрузку при первом рендере страницы
  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // ФУНКЦИИ ФОРМАТИРОВАНИЯ
  // ==========================================
  // Красивый вывод статуса с правильным цветом
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge color="green" variant="light">Выполнен</Badge>;
      case 'PENDING':
        return <Badge color="orange" variant="light">В ожидании</Badge>;
      case 'CANCELED':
        return <Badge color="red" variant="light">Отменен</Badge>;
      default:
        return <Badge color="blue" variant="light">{status || 'НОВЫЙ'}</Badge>;
    }
  };

  // Форматирование даты в читаемый вид
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      {/* ========================================== */}
      {/* ШАПКА СТРАНИЦЫ (ЗАГОЛОВОК И КНОПКИ) */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#1B2E3D' }}>
            Управление заказами
          </Title>
          <Text c="dimmed" mt={5}>
            Полный список всех клиентских заявок и транзакций
          </Text>
        </div>
        
        <Group>
          <Tooltip label="Обновить данные">
            <ActionIcon 
              variant="default" 
              size="lg" 
              onClick={fetchOrders} 
              loading={loading}
            >
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Button 
            leftSection={<IconPlus size={16} />} 
            style={{ backgroundColor: '#1B2E3D', color: 'white' }}
          >
            Новый заказ
          </Button>
        </Group>
      </Group>

      {/* Вывод ошибки */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Ошибка API" color="red" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* ОСНОВНАЯ ТАБЛИЦА */}
      {/* ========================================== */}
      <Paper withBorder radius="md" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
        {loading ? (
          // Скелетон, пока данные грузятся
          <div style={{ padding: '20px' }}>
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} />
          </div>
        ) : orders.length > 0 ? (
          <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
              <Table.Tr>
                <Table.Th style={{ color: '#1B2E3D' }}>ID / Дата</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Клиент</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Услуга</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Статус</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Сумма</Table.Th>
                <Table.Th style={{ color: '#1B2E3D', textAlign: 'right' }}>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map((order) => (
                <Table.Tr key={order.id}>
                  {/* ID и Дата */}
                  <Table.Td>
                    <Text fw={600} size="sm">{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text size="xs" c="dimmed">{formatDate(order.createdAt)}</Text>
                  </Table.Td>
                  
                  {/* Клиент */}
                  <Table.Td>
                    <Text fw={500} size="sm">{order.clientName || 'Без имени'}</Text>
                    <Text size="xs" c="dimmed">{order.clientPhone || 'Нет телефона'}</Text>
                  </Table.Td>
                  
                  {/* Описание услуги */}
                  <Table.Td>
                    <Text size="sm" lineClamp={2}>
                      {order.description || 'Нет описания'}
                    </Text>
                  </Table.Td>
                  
                  {/* Статус */}
                  <Table.Td>
                    {renderStatusBadge(order.status)}
                  </Table.Td>
                  
                  {/* Сумма */}
                  <Table.Td>
                    <Text fw={600} size="sm">
                      {order.price ? `${order.price.toLocaleString('ru-RU')} ₸` : '-'}
                    </Text>
                  </Table.Td>
                  
                  {/* Действия (Редактировать / Удалить) */}
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Редактировать">
                        <ActionIcon variant="light" color="blue">
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить">
                        <ActionIcon variant="light" color="red">
                          <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          // Заглушка, если база пустая
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Text size="lg" fw={500} style={{ color: '#1B2E3D' }}>
              Заказов пока нет
            </Text>
            <Text c="dimmed" mt={5}>
              Нажмите «Новый заказ», чтобы добавить первую запись.
            </Text>
          </div>
        )}
      </Paper>
    </div>
  );
}