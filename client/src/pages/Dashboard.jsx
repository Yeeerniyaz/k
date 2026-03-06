import { useState, useEffect } from 'react';
import {
  Title, Text, Grid, Card, Group, ThemeIcon, Skeleton, Alert, Table, Badge, Paper, Divider, Box, Stack, Center // 🔥 Теперь тут есть и Stack, и Center!
} from '@mantine/core';
import { 
  IconCoin, IconShoppingCart, IconUsers, IconPhoto, IconAlertCircle,
  IconTrendingUp, IconTrendingDown, IconWallet, IconBusinessplan, IconArrowUpRight
} from '@tabler/icons-react';
import api from '../api/index.js';

export default function Dashboard() {
  // ==========================================
  // СОСТОЯНИЯ
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Расширенная структура данных для финансового учета
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalExpenses: 0, 
    netProfit: 0,     
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
        const response = await api.get('/analytics');
        
        if (response.data && response.data.data) {
          const data = response.data.data;
          const profit = data.netProfit !== undefined ? data.netProfit : (data.totalRevenue || 0) - (data.totalExpenses || 0);
          
          setStats(prev => ({ 
            ...prev, 
            ...data,
            netProfit: profit
          }));
        }
      } catch (err) {
        console.error('Ошибка загрузки аналитики:', err);
        // СЕНЬОРСКИЙ ФОЛЛБЭК: Идеальные тестовые данные, пока бэкенд в разработке
        setStats({
          totalOrders: 142,
          totalRevenue: 5450000,
          totalExpenses: 2150000, 
          netProfit: 3300000,     
          totalUsers: 4,
          totalPortfolio: 28,
          recentOrders: [
            { id: 'ord-8f7a9', clientName: 'TOO Alpha Group', status: 'COMPLETED', price: 450000 },
            { id: 'ord-2b3c4', clientName: 'Иван (Калькулятор)', status: 'PENDING', price: 120000 },
            { id: 'ord-1a2b3', clientName: 'Салон Красоты', status: 'NEW', price: 85000 },
          ]
        });
        setError('Работа в автономном режиме. Показана тестовая финансовая сводка.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // ==========================================
  // ФУНКЦИИ ФОРМАТИРОВАНИЯ
  // ==========================================
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return <Badge color="green" variant="light">Выполнен</Badge>;
      case 'PENDING': return <Badge color="orange" variant="light">В работе</Badge>;
      case 'CANCELED': return <Badge color="red" variant="light">Отменен</Badge>;
      case 'NEW': return <Badge color="blue" variant="light">Новый</Badge>;
      default: return <Badge color="gray" variant="light">{status}</Badge>;
    }
  };

  // ==========================================
  // КОНФИГУРАЦИЯ КАРТОЧЕК
  // ==========================================
  const financialCards = [
    { title: 'Общий оборот (Выручка)', value: stats.totalRevenue, icon: IconTrendingUp, color: 'teal', prefix: '+' },
    { title: 'Общие расходы (Себестоимость)', value: stats.totalExpenses, icon: IconTrendingDown, color: 'red', prefix: '-' },
    { title: 'Чистая прибыль', value: stats.netProfit, icon: IconWallet, color: 'royalBlue', prefix: stats.netProfit > 0 ? '+' : '' },
  ];

  const operationalCards = [
    { title: 'Всего заказов', value: stats.totalOrders, icon: IconShoppingCart, color: 'indigo' },
    { title: 'Сотрудники в системе', value: stats.totalUsers, icon: IconUsers, color: 'orange' },
    { title: 'Работ в портфолио', value: stats.totalPortfolio, icon: IconPhoto, color: 'grape' },
  ];

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      <Title order={2} mb="xs" style={{ color: '#1B2E3D' }}>
        Аналитика и Дашборд
      </Title>
      <Text c="dimmed" mb="xl">
        Глобальные показатели бизнеса Royal Banners.
      </Text>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Режим разработки" color="orange" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* БЛОК 1: ФИНАНСОВАЯ СВОДКА */}
      {/* ========================================== */}
      <Title order={4} mb="md" style={{ color: '#1B2E3D' }}>Финансовые показатели</Title>
      <Grid mb="xl">
        {financialCards.map((stat, index) => (
          <Grid.Col span={{ base: 12, md: 4 }} key={index}>
            <Card withBorder padding="lg" radius="md" shadow="sm" style={{ borderTop: `3px solid var(--mantine-color-${stat.color}-filled)` }}>
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
                  <Skeleton height={36} width="70%" />
                ) : (
                  <Text style={{ 
                    fontSize: '28px', 
                    fontWeight: 700, 
                    color: stat.title === 'Чистая прибыль' ? '#1B2E3D' : (stat.color === 'red' ? '#fa5252' : '#2b8a3e') 
                  }}>
                    {stat.prefix}{stat.value.toLocaleString('ru-RU')} ₸
                  </Text>
                )}
              </Group>
              
              <Text size="xs" c="dimmed" mt={7}>
                <IconBusinessplan size={12} stroke={1.5} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                С учетом всех заказов в базе
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Divider my="xl" />

      {/* ========================================== */}
      {/* БЛОК 2: ОПЕРАЦИОННЫЕ ПОКАЗАТЕЛИ И АКТИВНОСТЬ */}
      {/* ========================================== */}
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Title order={4} mb="md" style={{ color: '#1B2E3D' }}>Операционная сводка</Title>
          <Stack gap="md">
            {operationalCards.map((stat, index) => (
              <Paper key={index} withBorder p="md" radius="md" shadow="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon color={stat.color} variant="light" size={38} radius="md">
                      <stat.icon size={20} stroke={1.5} />
                    </ThemeIcon>
                    <Text fw={600} style={{ color: '#1B2E3D' }}>{stat.title}</Text>
                  </Group>
                  {loading ? (
                    <Skeleton height={24} width={40} />
                  ) : (
                    <Title order={3} style={{ color: '#1B2E3D' }}>{stat.value}</Title>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title order={4} mb="md" style={{ color: '#1B2E3D' }}>Последние транзакции</Title>
          <Paper withBorder radius="md" p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            {loading ? (
              <Box p="md">
                <Skeleton height={40} mb="sm" radius="sm" />
                <Skeleton height={40} mb="sm" radius="sm" />
                <Skeleton height={40} radius="sm" />
              </Box>
            ) : stats.recentOrders && stats.recentOrders.length > 0 ? (
              <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="md">
                <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                  <Table.Tr>
                    <Table.Th>ID Заказа</Table.Th>
                    <Table.Th>Клиент</Table.Th>
                    <Table.Th>Статус</Table.Th>
                    <Table.Th ta="right">Сумма</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {stats.recentOrders.map((order) => (
                    <Table.Tr key={order.id}>
                      <Table.Td fw={500} style={{ color: '#1B2E3D' }}>{order.id.slice(0, 8).toUpperCase()}</Table.Td>
                      <Table.Td>{order.clientName || 'Неизвестно'}</Table.Td>
                      <Table.Td>{renderStatusBadge(order.status)}</Table.Td>
                      <Table.Td ta="right" fw={600} style={{ color: '#1B2E3D' }}>
                        {order.price ? `${order.price.toLocaleString('ru-RU')} ₸` : '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Center py="xl">
                <Text c="dimmed">Пока нет данных о последних транзакциях.</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}