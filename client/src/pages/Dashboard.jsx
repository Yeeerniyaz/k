import { useState, useEffect } from 'react';
import {
  Title, Text, Grid, Card, Group, ThemeIcon, Skeleton, Alert, Table, Badge, Paper, Divider, Box, Stack, Center, TextInput, Button, Progress, Tooltip // 🔥 Tooltip осында қосылды!
} from '@mantine/core';
import { 
  IconShoppingCart, IconUsers, IconPhoto, IconAlertCircle,
  IconTrendingUp, IconTrendingDown, IconWallet, IconBusinessplan, 
  IconCalendarEvent, IconFilter, IconReceipt2, IconBuildingSkyscraper
} from '@tabler/icons-react';
import api from '../api/index.js';

export default function Dashboard() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ФИЛЬТРЫ ПО ДАТЕ
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Расширенная структура данных для детального финансового учета
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    orderExpenses: 0,     // Расходы только по заказам (себестоимость)
    companyExpenses: 0,   // Общие расходы фирмы (аренда, реклама)
    totalExpenses: 0,     // Все расходы ВМЕСТЕ
    netProfit: 0,     
    totalUsers: 0,
    totalPortfolio: 0,
    recentOrders: []
  });

  // ==========================================
  // ЗАГРУЗКА ДАННЫХ (API)
  // ==========================================
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Передаем параметры даты в API
      const response = await api.get('/analytics', {
        params: { from: dateFrom, to: dateTo }
      });
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        const calcTotalExpenses = (data.orderExpenses || 0) + (data.companyExpenses || 0);
        const profit = data.netProfit !== undefined ? data.netProfit : (data.totalRevenue || 0) - calcTotalExpenses;
        
        setStats(prev => ({ 
          ...prev, 
          ...data,
          totalExpenses: calcTotalExpenses,
          netProfit: profit
        }));
      }
    } catch (err) {
      console.error('Ошибка загрузки аналитики:', err);
      // СЕНЬОРСКИЙ ФОЛЛБЭК: Продвинутые тестовые данные с учетом новых расходов
      const mockOrderExpenses = 1150000;
      const mockCompanyExpenses = 1000000;
      const mockTotalExpenses = mockOrderExpenses + mockCompanyExpenses;
      const mockRevenue = 5450000;

      setStats({
        totalOrders: 142,
        totalRevenue: mockRevenue,
        orderExpenses: mockOrderExpenses,
        companyExpenses: mockCompanyExpenses,
        totalExpenses: mockTotalExpenses,
        netProfit: mockRevenue - mockTotalExpenses,     
        totalUsers: 4,
        totalPortfolio: 28,
        recentOrders: [
          { id: 'ord-8f7a9', clientName: 'TOO Alpha Group', status: 'COMPLETED', price: 450000, date: new Date().toISOString() },
          { id: 'ord-2b3c4', clientName: 'Заявка с Калькулятора', status: 'PENDING', price: 120000, date: new Date().toISOString() },
          { id: 'ord-1a2b3', clientName: 'Салон Красоты (Свяжитесь с нами)', status: 'NEW', price: 85000, date: new Date().toISOString() },
        ]
      });
      setError('Работа в автономном режиме. Показана расширенная тестовая сводка.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      case 'NEW': return <Badge color="blue" variant="light">Новый (Лид)</Badge>;
      default: return <Badge color="gray" variant="light">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // ==========================================
  // КОНФИГУРАЦИЯ КАРТОЧЕК
  // ==========================================
  const financialCards = [
    { title: 'Оборот (Выручка)', value: stats.totalRevenue, icon: IconTrendingUp, color: 'teal', prefix: '+' },
    { title: 'Все Расходы (Вместе)', value: stats.totalExpenses, icon: IconTrendingDown, color: 'red', prefix: '-' },
    { title: 'Чистая прибыль', value: stats.netProfit, icon: IconWallet, color: 'royalBlue', prefix: stats.netProfit > 0 ? '+' : '' },
  ];

  const operationalCards = [
    { title: 'Всего лидов и заказов', value: stats.totalOrders, icon: IconShoppingCart, color: 'indigo' },
    { title: 'Сотрудники в системе', value: stats.totalUsers, icon: IconUsers, color: 'orange' },
    { title: 'Работ в портфолио', value: stats.totalPortfolio, icon: IconPhoto, color: 'grape' },
  ];

  // Проценты для Progress Bar (структура расходов)
  const orderExpPercent = stats.totalExpenses > 0 ? Math.round((stats.orderExpenses / stats.totalExpenses) * 100) : 0;
  const companyExpPercent = stats.totalExpenses > 0 ? Math.round((stats.companyExpenses / stats.totalExpenses) * 100) : 0;

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      <Group justify="space-between" align="flex-end" mb="xl">
        <div>
          <Title order={2} mb="xs" style={{ color: '#1B2E3D' }}>
            Аналитика и Дашборд
          </Title>
          <Text c="dimmed">
            Глобальные показатели бизнеса Royal Banners.
          </Text>
        </div>
      </Group>

      {/* ========================================== */}
      {/* ФИЛЬТР ПО ПЕРИОДУ (ДАТЫ) */}
      {/* ========================================== */}
      <Paper withBorder p="md" radius="md" mb="xl" bg="white" shadow="sm">
        <Group justify="space-between" align="flex-end">
          <Group align="flex-end">
            <TextInput 
              type="date" 
              label="Период с" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.currentTarget.value)} 
              leftSection={<IconCalendarEvent size={16} />}
            />
            <TextInput 
              type="date" 
              label="Период по" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.currentTarget.value)} 
              leftSection={<IconCalendarEvent size={16} />}
            />
            <Button 
              onClick={fetchAnalytics} 
              leftSection={<IconFilter size={16} />}
              style={{ backgroundColor: '#1B2E3D' }}
            >
              Показать данные
            </Button>
          </Group>
          <Badge color="blue" variant="light" size="lg" radius="sm">
            {dateFrom || dateTo ? 'Выбранный период' : 'За все время'}
          </Badge>
        </Group>
      </Paper>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Инженерный режим" color="orange" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* БЛОК 1: ГЛАВНЫЕ ФИНАНСОВЫЕ КАРТОЧКИ */}
      {/* ========================================== */}
      <Grid mb="lg">
        {financialCards.map((stat, index) => (
          <Grid.Col span={{ base: 12, md: 4 }} key={index}>
            <Card withBorder padding="lg" radius="md" shadow="sm" style={{ borderTop: `4px solid var(--mantine-color-${stat.color}-filled)` }}>
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
                {dateFrom || dateTo ? 'За выбранный период' : 'За весь период учета'}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* ========================================== */}
      {/* БЛОК 1.1: ДЕТАЛЬНАЯ СТРУКТУРА РАСХОДОВ */}
      {/* ========================================== */}
      <Paper withBorder p="xl" radius="md" shadow="sm" mb="xl" style={{ borderLeft: '4px solid #fa5252' }}>
        <Title order={5} mb="sm" style={{ color: '#1B2E3D' }}>Структура общих расходов</Title>
        <Text size="sm" c="dimmed" mb="lg">Показывает соотношение прямых затрат на заказы и операционных расходов компании.</Text>
        
        {loading ? (
          <Skeleton height={20} radius="xl" mb="md" />
        ) : (
          <Progress.Root size="xl" radius="xl" mb="md">
            <Tooltip label={`Себестоимость заказов: ${stats.orderExpenses.toLocaleString('ru-RU')} ₸ (${orderExpPercent}%)`}>
              <Progress.Section value={orderExpPercent} color="red">
                <Progress.Label>Заказы ({orderExpPercent}%)</Progress.Label>
              </Progress.Section>
            </Tooltip>
            <Tooltip label={`Расходы фирмы: ${stats.companyExpenses.toLocaleString('ru-RU')} ₸ (${companyExpPercent}%)`}>
              <Progress.Section value={companyExpPercent} color="orange">
                <Progress.Label>Фирма ({companyExpPercent}%)</Progress.Label>
              </Progress.Section>
            </Tooltip>
          </Progress.Root>
        )}

        <Grid mt="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group>
              <ThemeIcon color="red" variant="light" radius="md"><IconReceipt2 size={18} /></ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Себестоимость заказов</Text>
                <Text fw={700} size="lg" style={{ color: '#1B2E3D' }}>{stats.orderExpenses.toLocaleString('ru-RU')} ₸</Text>
              </div>
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group>
              <ThemeIcon color="orange" variant="light" radius="md"><IconBuildingSkyscraper size={18} /></ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Общие расходы фирмы (Аренда, ЗП)</Text>
                <Text fw={700} size="lg" style={{ color: '#1B2E3D' }}>{stats.companyExpenses.toLocaleString('ru-RU')} ₸</Text>
              </div>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

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
          <Group justify="space-between" mb="md">
            <Title order={4} style={{ color: '#1B2E3D' }}>Свежие заявки и заказы</Title>
            <Badge color="gray" variant="light">Показаны последние активности</Badge>
          </Group>
          
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
                    <Table.Th>Дата</Table.Th>
                    <Table.Th>ID / Источник</Table.Th>
                    <Table.Th>Клиент / Детали</Table.Th>
                    <Table.Th>Статус</Table.Th>
                    <Table.Th ta="right">Сумма</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {stats.recentOrders.map((order) => (
                    <Table.Tr key={order.id}>
                      <Table.Td c="dimmed" fz="sm">{formatDate(order.date)}</Table.Td>
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
              <Center py="xl" style={{ flexDirection: 'column' }}>
                <IconShoppingCart size={40} color="#e0e0e0" />
                <Text c="dimmed" mt="md">Пока нет данных о транзакциях за этот период.</Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}