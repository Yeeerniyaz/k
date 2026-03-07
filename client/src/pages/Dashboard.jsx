import { useState, useEffect } from "react";
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
  Paper,
  Divider,
  Box,
  Stack,
  Center,
  TextInput,
  Button,
  Progress,
  Tooltip,
  Select,
} from "@mantine/core";
import {
  IconShoppingCart,
  IconUsers,
  IconPhoto,
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconBusinessplan,
  IconCalendarEvent,
  IconFilter,
  IconReceipt2,
  IconBuildingSkyscraper,
  IconClock,
} from "@tabler/icons-react";

// 🔥 Senior Update: Импортируем из единого axios.js
import { fetchDashboardStats } from "../api/axios.js";

export default function Dashboard() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ (STATE MANAGEMENT)
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ФИЛЬТРЫ ПО ДАТЕ
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [preset, setPreset] = useState("all"); // Быстрые фильтры

  // Инициализация структуры данных (изначально всё по нулям - CLEAN DATA)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    orderExpenses: 0, // Себестоимость (материалы, работа)
    companyExpenses: 0, // Операционка (аренда, налоги)
    totalExpenses: 0, // Итоговый расход
    netProfit: 0,
    totalUsers: 0,
    totalPortfolio: 0,
    recentOrders: [],
  });

  // ==========================================
  // БИЗНЕС-ЛОГИКА: БЫСТРЫЕ ФИЛЬТРЫ
  // ==========================================
  const handlePresetChange = (value) => {
    setPreset(value);
    const today = new Date();
    
    if (value === "today") {
      const dateStr = today.toISOString().split("T")[0];
      setDateFrom(dateStr);
      setDateTo(dateStr);
    } else if (value === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(firstDay.toISOString().split("T")[0]);
      setDateTo(today.toISOString().split("T")[0]);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  };

  // ==========================================
  // МЕТОД ЗАГРУЗКИ АНАЛИТИКИ (REAL DATA ONLY)
  // ==========================================
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Формируем параметры запроса
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      // Используем функцию из axios.js
      const response = await fetchDashboardStats(params);

      // 🔥 Senior Fix: Проверяем и success, и status, так как API может отдавать разные форматы
      if (response.data && (response.data.success || response.data.status === 'success')) {
        const data = response.data.data;

        // Расчет агрегированных данных на стороне клиента (для надежности)
        const calcOrderExp = data.orderExpenses || 0;
        const calcCompExp = data.companyExpenses || 0;
        const calcTotalExpenses = calcOrderExp + calcCompExp;
        const calcRevenue = data.totalRevenue || 0;
        const profit =
          data.netProfit !== undefined
            ? data.netProfit
            : calcRevenue - calcTotalExpenses;

        setStats({
          totalOrders: data.totalOrders || 0,
          totalRevenue: calcRevenue,
          orderExpenses: calcOrderExp,
          companyExpenses: calcCompExp,
          totalExpenses: calcTotalExpenses,
          netProfit: profit,
          totalUsers: data.totalUsers || 0,
          totalPortfolio: data.totalPortfolio || 0,
          recentOrders: data.recentOrders || [],
        });
      }
    } catch (err) {
      console.error("Критическая ошибка при получении аналитики:", err);
      // 🔥 Senior Practice: Никаких фейковых данных! Если сервер недоступен, ставим 0.
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        orderExpenses: 0,
        companyExpenses: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalUsers: 0,
        totalPortfolio: 0,
        recentOrders: [],
      });
      setError(
        "Ошибка соединения с сервером. Не удалось получить актуальные финансовые данные.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Эффект первичной инициализации и реакции на изменение быстрых фильтров
  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  // ==========================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РЕНДЕРИНГА
  // ==========================================
  const renderStatusBadge = (status) => {
    const statusMap = {
      COMPLETED: { label: "Выполнен", color: "green" },
      PENDING: { label: "В работе", color: "orange" },
      CANCELED: { label: "Отменен", color: "red" },
      NEW: { label: "Новый (Лид)", color: "blue" },
    };
    const config = statusMap[status] || { label: status || "Неизвестно", color: "gray" };
    return (
      <Badge color={config.color} variant="light">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // КОНФИГУРАЦИЯ ФИНАНСОВЫХ КАРТОЧЕК
  const financialCards = [
    {
      title: "Оборот (Выручка)",
      value: stats.totalRevenue,
      icon: IconTrendingUp,
      color: "teal",
      prefix: "+",
    },
    {
      title: "Все Расходы (Вместе)",
      value: stats.totalExpenses,
      icon: IconTrendingDown,
      color: "red",
      prefix: "-",
    },
    {
      title: "Чистая прибыль",
      value: stats.netProfit,
      icon: IconWallet,
      color: "indigo",
      prefix: stats.netProfit >= 0 ? "+" : "",
    },
  ];

  // КОНФИГУРАЦИЯ ОПЕРАЦИОННЫХ КАРТОЧЕК
  const operationalCards = [
    {
      title: "Всего лидов и заказов",
      value: stats.totalOrders,
      icon: IconShoppingCart,
      color: "indigo",
    },
    {
      title: "Сотрудники в системе",
      value: stats.totalUsers,
      icon: IconUsers,
      color: "orange",
    },
    {
      title: "Работ в портфолио",
      value: stats.totalPortfolio,
      icon: IconPhoto,
      color: "grape",
    },
  ];

  // Расчет долей расходов для визуализации
  const orderExpPercent =
    stats.totalExpenses > 0
      ? Math.round((stats.orderExpenses / stats.totalExpenses) * 100)
      : 0;
  const companyExpPercent =
    stats.totalExpenses > 0
      ? Math.round((stats.companyExpenses / stats.totalExpenses) * 100)
      : 0;

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      <Group justify="space-between" align="flex-end" mb="xl">
        <Box>
          <Title order={2} mb="xs" style={{ color: "#1B2E3D" }}>
            Аналитика и Дашборд
          </Title>
          <Text c="dimmed">
            Контроль ключевых показателей бизнеса Royal Banners в режиме
            реального времени.
          </Text>
        </Box>
      </Group>

      {/* ФИЛЬТРАЦИЯ */}
      <Paper withBorder p="md" radius="md" mb="xl" bg="white" shadow="sm">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Group align="flex-end">
            <Select
              label="Быстрый период"
              placeholder="Выберите"
              data={[
                { value: "all", label: "За все время" },
                { value: "today", label: "Сегодня" },
                { value: "month", label: "Текущий месяц" },
              ]}
              value={preset}
              onChange={handlePresetChange}
              leftSection={<IconClock size={16} />}
              style={{ width: 180 }}
            />
            <TextInput
              type="date"
              label="С даты"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.currentTarget.value);
                setPreset(null); // Сбрасываем пресет при ручном вводе
              }}
              leftSection={<IconCalendarEvent size={16} />}
            />
            <TextInput
              type="date"
              label="По дату"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.currentTarget.value);
                setPreset(null);
              }}
              leftSection={<IconCalendarEvent size={16} />}
            />
            <Button
              onClick={fetchAnalytics}
              leftSection={<IconFilter size={16} />}
              style={{ backgroundColor: "#1B2E3D" }}
            >
              Обновить отчет
            </Button>
          </Group>
          <Badge color="blue" variant="filled" size="lg" radius="sm">
            {dateFrom || dateTo ? "Выбранный период" : "Весь период"}
          </Badge>
        </Group>
      </Paper>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Внимание"
          color="red"
          mb="xl"
          radius="md"
          variant="light"
        >
          {error}
        </Alert>
      )}

      {/* ГЛАВНЫЕ МЕТРИКИ */}
      <Grid mb="lg">
        {financialCards.map((stat, index) => (
          <Grid.Col span={{ base: 12, md: 4 }} key={index}>
            <Card
              withBorder
              padding="lg"
              radius="md"
              shadow="sm"
              style={{
                borderTop: `4px solid var(--mantine-color-${stat.color}-filled)`,
              }}
            >
              <Group justify="space-between">
                <Text size="sm" c="dimmed" fw={600} tt="uppercase">
                  {stat.title}
                </Text>
                <ThemeIcon
                  color={stat.color}
                  variant="light"
                  size={38}
                  radius="md"
                >
                  <stat.icon size={20} stroke={1.5} />
                </ThemeIcon>
              </Group>

              <Group align="flex-end" gap="xs" mt={25}>
                {loading ? (
                  <Skeleton height={36} width="70%" />
                ) : (
                  <Text
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: "#1B2E3D",
                    }}
                  >
                    {stat.prefix}
                    {stat.value.toLocaleString("ru-RU")} ₸
                  </Text>
                )}
              </Group>

              <Text size="xs" c="dimmed" mt={7}>
                Данные за {dateFrom || dateTo ? "период" : "все время"}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* ДЕТАЛИЗАЦИЯ РАСХОДОВ */}
      <Paper
        withBorder
        p="xl"
        radius="md"
        shadow="sm"
        mb="xl"
        style={{ borderLeft: "4px solid #fa5252" }}
      >
        <Title order={5} mb="sm" style={{ color: "#1B2E3D" }}>
          Распределение расходов
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Анализ прямых и косвенных затрат предприятия.
        </Text>

        {loading ? (
          <Skeleton height={20} radius="xl" mb="md" />
        ) : (
          <Progress.Root size="xl" radius="xl" mb="md">
            <Tooltip
              label={`Себестоимость: ${stats.orderExpenses.toLocaleString("ru-RU")} ₸`}
            >
              <Progress.Section value={orderExpPercent} color="red">
                <Progress.Label>Заказы ({orderExpPercent}%)</Progress.Label>
              </Progress.Section>
            </Tooltip>
            <Tooltip
              label={`Фирма: ${stats.companyExpenses.toLocaleString("ru-RU")} ₸`}
            >
              <Progress.Section value={companyExpPercent} color="orange">
                <Progress.Label>Фирма ({companyExpPercent}%)</Progress.Label>
              </Progress.Section>
            </Tooltip>
          </Progress.Root>
        )}

        <Grid mt="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group>
              <ThemeIcon color="red" variant="light" radius="md">
                <IconReceipt2 size={18} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Себестоимость производства
                </Text>
                <Text fw={700} size="lg" style={{ color: "#1B2E3D" }}>
                  {stats.orderExpenses.toLocaleString("ru-RU")} ₸
                </Text>
              </div>
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group>
              <ThemeIcon color="orange" variant="light" radius="md">
                <IconBuildingSkyscraper size={18} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Общие расходы компании
                </Text>
                <Text fw={700} size="lg" style={{ color: "#1B2E3D" }}>
                  {stats.companyExpenses.toLocaleString("ru-RU")} ₸
                </Text>
              </div>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      <Divider my="xl" />

      {/* ОПЕРАЦИОНКА И ТАБЛИЦА */}
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Title order={4} mb="md" style={{ color: "#1B2E3D" }}>
            Активность
          </Title>
          <Stack gap="md">
            {operationalCards.map((stat, index) => (
              <Paper key={index} withBorder p="md" radius="md" shadow="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon
                      color={stat.color}
                      variant="light"
                      size={38}
                      radius="md"
                    >
                      <stat.icon size={20} stroke={1.5} />
                    </ThemeIcon>
                    <Text fw={600} style={{ color: "#1B2E3D" }}>
                      {stat.title}
                    </Text>
                  </Group>
                  {loading ? (
                    <Skeleton height={24} width={40} />
                  ) : (
                    <Title order={3} style={{ color: "#1B2E3D" }}>
                      {stat.value}
                    </Title>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title order={4} mb="md" style={{ color: "#1B2E3D" }}>
            Последние транзакции
          </Title>

          <Paper
            withBorder
            radius="md"
            p={0}
            shadow="sm"
            style={{ overflow: "hidden" }}
          >
            {loading ? (
              <Box p="md">
                <Skeleton height={40} mb="sm" />
                <Skeleton height={40} mb="sm" />
                <Skeleton height={40} />
              </Box>
            ) : stats.recentOrders.length > 0 ? (
              <Box style={{ overflowX: "auto" }}>
                <Table
                  striped
                  highlightOnHover
                  verticalSpacing="md"
                  horizontalSpacing="md"
                  style={{ minWidth: 600 }}
                >
                  <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
                    <Table.Tr>
                      <Table.Th>Дата</Table.Th>
                      <Table.Th>Клиент</Table.Th>
                      <Table.Th>Статус</Table.Th>
                      <Table.Th ta="right">Сумма</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats.recentOrders.map((order) => (
                      <Table.Tr key={order.id}>
                        <Table.Td c="dimmed" fz="sm">
                          {formatDate(order.createdAt || order.date)}
                        </Table.Td>
                        <Table.Td fw={500} style={{ color: "#1B2E3D" }}>
                          {order.customerName || order.clientName || "Без имени"}
                        </Table.Td>
                        <Table.Td>{renderStatusBadge(order.status)}</Table.Td>
                        <Table.Td
                          ta="right"
                          fw={600}
                          style={{ color: "#1B2E3D" }}
                        >
                          {order.totalPrice || order.price
                            ? `${(order.totalPrice || order.price).toLocaleString("ru-RU")} ₸`
                            : "-"}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            ) : (
              <Center py="xl" style={{ flexDirection: "column" }}>
                <IconShoppingCart size={40} color="#e0e0e0" />
                <Text c="dimmed" mt="md">
                  За выбранный период данных нет
                </Text>
              </Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}