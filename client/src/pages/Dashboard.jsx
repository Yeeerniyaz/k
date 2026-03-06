import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Grid,
  Card,
  Group,
  ThemeIcon,
  Skeleton,
  Alert,
  Table,
  Badge,
  Paper
} from '@mantine/core';
import { 
  IconCoin, 
  IconShoppingCart, 
  IconUsers, 
  IconPhoto, 
  IconAlertCircle,
  IconArrowUpRight
} from '@tabler/icons-react';
import api from '../api/index.js';

export default function Dashboard() {
  // ==========================================
  // СОСТОЯНИЯ
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Базовая структура данных, чтобы UI не падал, даже если бэкенд пустой
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalPortfolio: 0,
    recentOrders: []
  });

  // ==========================================
  // ЗАГРУЗКА ДАННЫХ (API)
  // ==========================================
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Стучимся в наш бэкенд за аналитикой
        const response = await api.get('/analytics');
        
        if (response.data && response.data.data) {
           setStats(prev => ({ ...prev, ...response.data.data }));
        }
      } catch (err) {
        console.error('Ошибка загрузки аналитики:', err);
        setError('Не удалось загрузить данные аналитики. Сервер недоступен или вернул ошибку.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // ==========================================
  // КОНФИГ КАРТОЧЕК СТАТИСТИКИ
  // ==========================================
  const statCards = [
    { title: 'Всего заказов', value: stats.totalOrders || 0, icon: IconShoppingCart, color: 'blue' },
    { title: 'Выручка', value: `${stats.totalRevenue || 0} ₸`, icon: IconCoin, color: 'green' },
    { title: 'Сотрудники', value: stats.totalUsers || 0, icon: IconUsers, color: 'orange' },
    { title: 'Работ в портфолио', value: stats.totalPortfolio || 0, icon: IconPhoto, color: 'grape' },
  ];

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      {/* Заголовок страницы */}
      <Title order={2} mb="md" style={{ color: '#1B2E3D' }}>
        Аналитика и Дашборд
      </Title>
      <Text c="dimmed" mb="xl">
        Ключевые показатели системы Royal Banners в реальном времени.
      </Text>

      {/* Вывод ошибки, если API недоступно */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Внимание" color="red" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* СЕТКА КАРТОЧЕК (АДАПТИВНАЯ) */}
      {/* ========================================== */}
      <Grid mb="xl">
        {statCards.map((stat, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md" shadow="sm">
              <Group justify="space-between">
                <Text size="sm" c="dimmed" fw={600} tt="uppercase">
                  {stat.title}
                </Text>
                <ThemeIcon color={stat.color} variant="light" size={38} radius="md">
                  <stat.icon size={20} stroke={1.5} />
                </ThemeIcon>
              </Group>

              <Group align="flex-end" gap="xs" mt={25}>
                {loading ? (
                  <Skeleton height={30} width="60%" />
                ) : (
                  <Text style={{ fontSize: '24px', fontWeight: 700, color: '#1B2E3D' }}>
                    {stat.value}
                  </Text>
                )}
              </Group>
              
              <Text size="xs" c="dimmed" mt={7}>
                <IconArrowUpRight size={12} stroke={1.5} style={{ verticalAlign: 'middle', marginRight: '4px', color: 'teal' }} />
                Синхронизировано с базой
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* ========================================== */}
      {/* БЛОК ПОСЛЕДНИХ АКТИВНОСТЕЙ */}
      {/* ========================================== */}
      <Paper withBorder radius="md" p="md" shadow="sm">
        <Title order={4} mb="md" style={{ color: '#1B2E3D' }}>
          Последние активности
        </Title>
        
        {loading ? (
          <>
            <Skeleton height={40} mt="sm" radius="sm" />
            <Skeleton height={40} mt="sm" radius="sm" />
            <Skeleton height={40} mt="sm" radius="sm" />
          </>
        ) : stats.recentOrders && stats.recentOrders.length > 0 ? (
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID Заказа</Table.Th>
                <Table.Th>Клиент</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Сумма</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {stats.recentOrders.map((order) => (
                <Table.Tr key={order.id}>
                  <Table.Td fw={500}>{order.id.slice(0, 8)}...</Table.Td>
                  <Table.Td>{order.clientName || 'Неизвестно'}</Table.Td>
                  <Table.Td>
                    <Badge 
                      color={order.status === 'COMPLETED' ? 'green' : order.status === 'PENDING' ? 'orange' : 'blue'}
                      variant="light"
                    >
                      {order.status || 'NEW'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{order.price ? `${order.price} ₸` : '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            Пока нет данных о последних транзакциях.
          </Text>
        )}
      </Paper>
    </div>
  );
}