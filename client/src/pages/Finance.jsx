import { useState, useEffect } from "react";
import {
  Title,
  Text,
  Paper,
  Table,
  Button,
  Group,
  ActionIcon,
  Skeleton,
  Alert,
  Tooltip,
  Modal,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Badge,
  Center,
  Stack,
  Grid,
  Card,
  ThemeIcon,
  Box,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconEdit,
  IconReceipt2,
  IconWallet,
  IconCalendarStats,
  IconSearch,
  IconFilter,
  IconArrowsSort,
  IconCalendarEvent,
  IconBusinessplan,
  IconTrendingUp,
  IconTrendingDown,
  IconCoin,
  IconLock,
} from "@tabler/icons-react";

// 🔥 Senior Update: Импортируем готовые методы из нового axios.js
import {
  fetchExpenses as apiFetchExpenses,
  addExpense as apiAddExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
} from "../api/axios.js";

export default function Finance() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ ФИЛЬТРОВ И СОРТИРОВКИ
  // ==========================================
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, INCOME, EXPENSE
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (СОЗДАНИЕ / РЕДАКТИРОВАНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState(null);

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 Категории для ручных расходов
  const expenseCategories = [
    "Аренда цеха / офиса",
    "Зарплата (Оклад / Премии)",
    "Реклама (Target, 2GIS)",
    "Закупка общего материала (Склад)",
    "Налоги и сборы",
    "Транспорт и Логистика",
    "Оборудование и Инструменты",
    "Прочие корпоративные расходы",
  ];

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ДАННЫХ (REAL DATA)
  // ==========================================
  const fetchTransactionsData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Метод API теперь возвращает и доходы, и расходы в единой ленте
      const response = await apiFetchExpenses();

      setTransactions(response.data?.data || response.data || []);
      setSummary(
        response.data?.summary || {
          totalIncome: 0,
          totalExpense: 0,
          netProfit: 0,
        },
      );
    } catch (err) {
      console.error("Ошибка загрузки финансовых данных:", err);
      setTransactions([]);
      setError(
        "Не удалось подключиться к базе данных. Проверьте соединение с сервером.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsData();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ФИЛЬТРАЦИЯ И СОРТИРОВКА
  // ==========================================
  const processedTransactions = [...transactions]
    .filter((item) => {
      // 1. Поиск по комментарию
      const searchString = (item.comment || "").toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());

      // 2. Фильтр по типу (Доход / Расход)
      const matchesType =
        filterType === "ALL" ? true : item.type === filterType;

      // 3. Фильтр по категории
      const matchesCategory =
        filterCategory === "ALL" ? true : item.category === filterCategory;

      // 4. Фильтр по дате "От"
      const matchesDateFrom = dateFrom
        ? new Date(item.date || item.createdAt) >= new Date(dateFrom)
        : true;

      // 5. Фильтр по дате "До" (добавляем 1 день, чтобы включить весь день)
      const matchesDateTo = dateTo
        ? new Date(item.date || item.createdAt) <=
          new Date(new Date(dateTo).getTime() + 86400000)
        : true;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesDateFrom &&
        matchesDateTo
      );
    })
    .sort((a, b) => {
      // 6. Сортировка
      if (sortBy === "DATE_DESC")
        return (
          new Date(b.date || b.createdAt || 0) -
          new Date(a.date || a.createdAt || 0)
        );
      if (sortBy === "DATE_ASC")
        return (
          new Date(a.date || a.createdAt || 0) -
          new Date(b.date || b.createdAt || 0)
        );
      if (sortBy === "AMOUNT_DESC") return (b.amount || 0) - (a.amount || 0);
      if (sortBy === "AMOUNT_ASC") return (a.amount || 0) - (b.amount || 0);
      return 0;
    });

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УПРАВЛЕНИЕ ФОРМОЙ
  // ==========================================
  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingId(expense.id);
      setCategory(expense.category);
      setAmount(expense.amount);
      setComment(expense.comment || "");
    } else {
      setEditingId(null);
      setCategory(expenseCategories[0]);
      setAmount(0);
      setComment("");
    }
    open();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!category || amount <= 0) {
      alert("Пожалуйста, выберите категорию и укажите сумму больше нуля.");
      return;
    }

    setIsSubmitting(true);
    const payload = { category, amount, comment };

    try {
      if (editingId) {
        await apiUpdateExpense(editingId, payload);
      } else {
        await apiAddExpense(payload);
      }

      close();
      fetchTransactionsData(); // Обновляем данные напрямую с сервера после успеха
    } catch (err) {
      console.error("Ошибка при сохранении расхода:", err);
      alert(err.response?.data?.message || "Ошибка при сохранении транзакции.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту запись о расходе?"))
      return;

    try {
      await apiDeleteExpense(id);
      fetchTransactionsData(); // Перезапрашиваем данные, чтобы обновить summary
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert(
        err.response?.data?.message ||
          "Не удалось удалить расход. Проверьте права доступа.",
      );
    }
  };

  // ==========================================
  // ФУНКЦИИ ФОРМАТИРОВАНИЯ
  // ==========================================
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      {/* ========================================== */}
      {/* ШАПКА СТРАНИЦЫ */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            Финансовый учет
          </Title>
          <Text c="dimmed" mt={5}>
            Аналитика доходов и управление расходами Royal Banners
          </Text>
        </div>

        <Group>
          <Tooltip label="Обновить данные">
            <ActionIcon
              variant="default"
              size="lg"
              onClick={fetchTransactionsData}
              loading={loading}
            >
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => handleOpenModal()}
            style={{
              backgroundColor: "#1B2E3D",
              color: "white",
              fontWeight: 600,
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.02)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Добавить расход
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Внимание"
          color="red"
          mb="xl"
          radius="md"
        >
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* КАРТОЧКИ СТАТИСТИКИ (ИЗ БЭКЕНДА) */}
      {/* ========================================== */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card
            withBorder
            radius="md"
            p="lg"
            shadow="sm"
            style={{ borderLeft: "4px solid #40c057" }}
          >
            <Group justify="space-between">
              <Group>
                <ThemeIcon color="green" variant="light" size={48} radius="md">
                  <IconTrendingUp size={24} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Доходы (Завершенные заказы)
                  </Text>
                  <Title order={2} style={{ color: "#1B2E3D" }}>
                    {summary.totalIncome.toLocaleString("ru-RU")} ₸
                  </Title>
                </div>
              </Group>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card
            withBorder
            radius="md"
            p="lg"
            shadow="sm"
            style={{ borderLeft: "4px solid #fa5252" }}
          >
            <Group justify="space-between">
              <Group>
                <ThemeIcon color="red" variant="light" size={48} radius="md">
                  <IconTrendingDown size={24} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Сумма всех расходов
                  </Text>
                  <Title order={2} style={{ color: "#1B2E3D" }}>
                    {summary.totalExpense.toLocaleString("ru-RU")} ₸
                  </Title>
                </div>
              </Group>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card
            withBorder
            radius="md"
            p="lg"
            shadow="sm"
            style={{ borderLeft: "4px solid #228be6" }}
          >
            <Group justify="space-between">
              <Group>
                <ThemeIcon color="blue" variant="light" size={48} radius="md">
                  <IconCoin size={24} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Чистая прибыль
                  </Text>
                  <Title
                    order={2}
                    style={{
                      color: summary.netProfit >= 0 ? "#40c057" : "#fa5252",
                    }}
                  >
                    {summary.netProfit.toLocaleString("ru-RU")} ₸
                  </Title>
                </div>
              </Group>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* ========================================== */}
      {/* ПАНЕЛЬ ФИЛЬТРОВ И СОРТИРОВКИ */}
      {/* ========================================== */}
      <Paper withBorder p="md" radius="md" mb="xl" bg="white" shadow="sm">
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <TextInput
              label="Поиск"
              placeholder="Слово в комментарии..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Тип"
              leftSection={<IconWallet size={16} />}
              data={[
                { value: "ALL", label: "Все транзакции" },
                { value: "INCOME", label: "Только доходы" },
                { value: "EXPENSE", label: "Только расходы" },
              ]}
              value={filterType}
              onChange={setFilterType}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <Select
              label="Категория"
              leftSection={<IconFilter size={16} />}
              data={[
                { value: "ALL", label: "Все категории" },
                ...expenseCategories.map((c) => ({ value: c, label: c })),
                { value: "Оплата за заказ", label: "Оплата за заказ" },
              ]}
              value={filterCategory}
              onChange={setFilterCategory}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <TextInput
              type="date"
              label="Период с"
              leftSection={<IconCalendarEvent size={16} />}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
            <TextInput
              type="date"
              label="По"
              leftSection={<IconCalendarEvent size={16} />}
              value={dateTo}
              onChange={(e) => setDateTo(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 12, md: 2 }}>
            <Select
              label="Сортировка"
              leftSection={<IconArrowsSort size={16} />}
              data={[
                { value: "DATE_DESC", label: "Сначала новые" },
                { value: "DATE_ASC", label: "Сначала старые" },
                { value: "AMOUNT_DESC", label: "Сначала крупные" },
                { value: "AMOUNT_ASC", label: "Сначала мелкие" },
              ]}
              value={sortBy}
              onChange={setSortBy}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* ========================================== */}
      {/* ОСНОВНОЙ ВЫВОД ДАННЫХ (ТАБЛИЦА ИЛИ КАРТОЧКИ) */}
      {/* ========================================== */}
      <Paper
        withBorder
        radius="md"
        shadow="sm"
        p={0}
        style={{ overflow: "hidden", backgroundColor: "white" }}
      >
        {loading ? (
          <div style={{ padding: "20px" }}>
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} />
          </div>
        ) : processedTransactions.length > 0 ? (
          <>
            {/* 🔥 ДЕСКТОПНАЯ ВЕРСИЯ: ТАБЛИЦА (Скрыта на мобилках) */}
            <Box visibleFrom="sm" style={{ overflowX: "auto" }}>
              <Table
                striped
                highlightOnHover
                verticalSpacing="md"
                horizontalSpacing="lg"
                style={{ minWidth: 800 }}
              >
                <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
                  <Table.Tr>
                    <Table.Th style={{ color: "#1B2E3D" }}>Дата</Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>Тип</Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>Категория</Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>
                      Комментарий
                    </Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>Сумма</Table.Th>
                    <Table.Th style={{ color: "#1B2E3D", textAlign: "right" }}>
                      Действия
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {processedTransactions.map((transaction) => (
                    <Table.Tr key={transaction.id}>
                      <Table.Td>
                        <Text size="sm" c="dimmed" fw={500}>
                          {formatDate(
                            transaction.date || transaction.createdAt,
                          )}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        {transaction.type === "INCOME" ? (
                          <Badge color="green" variant="light">
                            Доход
                          </Badge>
                        ) : (
                          <Badge color="red" variant="light">
                            Расход
                          </Badge>
                        )}
                      </Table.Td>

                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {transaction.category}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Text size="sm" lineClamp={2} maw={300}>
                          {transaction.comment || "Без комментария"}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        {transaction.type === "INCOME" ? (
                          <Text fw={700} color="green">
                            +{transaction.amount.toLocaleString("ru-RU")} ₸
                          </Text>
                        ) : (
                          <Text fw={700} color="red">
                            -{transaction.amount.toLocaleString("ru-RU")} ₸
                          </Text>
                        )}
                      </Table.Td>

                      <Table.Td style={{ textAlign: "right" }}>
                        <Group gap="xs" justify="flex-end">
                          {transaction.type === "INCOME" ? (
                            <Tooltip label="Доход генерируется из заказов (системная запись)">
                              <ActionIcon
                                variant="transparent"
                                color="gray"
                                style={{ cursor: "not-allowed" }}
                              >
                                <IconLock size={16} stroke={1.5} />
                              </ActionIcon>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip label="Редактировать">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => handleOpenModal(transaction)}
                                >
                                  <IconEdit size={16} stroke={1.5} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Удалить">
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(transaction.id)}
                                >
                                  <IconTrash size={16} stroke={1.5} />
                                </ActionIcon>
                              </Tooltip>
                            </>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>

            {/* 🔥 МОБИЛЬНАЯ ВЕРСИЯ: КАРТОЧКИ (Показывается только на телефонах) */}
            <Box hiddenFrom="sm" p="md" bg="#f8f9fa">
              <Stack gap="md">
                {processedTransactions.map((transaction) => (
                  <Paper
                    key={transaction.id}
                    withBorder
                    p="md"
                    radius="md"
                    shadow="sm"
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" c="dimmed">
                        {formatDate(transaction.date || transaction.createdAt)}
                      </Text>
                      {transaction.type === "INCOME" ? (
                        <Badge color="green" variant="light">
                          Доход
                        </Badge>
                      ) : (
                        <Badge color="red" variant="light">
                          Расход
                        </Badge>
                      )}
                    </Group>

                    <Divider my="sm" />

                    <Box mb="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Категория
                      </Text>
                      <Text fw={600} size="sm" style={{ color: "#1B2E3D" }}>
                        {transaction.category}
                      </Text>
                    </Box>

                    <Box mb="md">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Комментарий
                      </Text>
                      <Text size="sm" lineClamp={3}>
                        {transaction.comment || "Без комментария"}
                      </Text>
                    </Box>

                    <Group justify="space-between" align="flex-end">
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Сумма
                        </Text>
                        {transaction.type === "INCOME" ? (
                          <Text fw={800} size="lg" color="green">
                            +{transaction.amount.toLocaleString("ru-RU")} ₸
                          </Text>
                        ) : (
                          <Text fw={800} size="lg" color="red">
                            -{transaction.amount.toLocaleString("ru-RU")} ₸
                          </Text>
                        )}
                      </Box>

                      <Group gap="xs">
                        {transaction.type === "INCOME" ? (
                          <Tooltip label="Системная запись (нельзя редактировать)">
                            <ActionIcon
                              variant="transparent"
                              color="gray"
                              size="lg"
                              style={{ cursor: "not-allowed" }}
                            >
                              <IconLock size={18} stroke={1.5} />
                            </ActionIcon>
                          </Tooltip>
                        ) : (
                          <>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="lg"
                              onClick={() => handleOpenModal(transaction)}
                            >
                              <IconEdit size={18} stroke={1.5} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="lg"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <IconTrash size={18} stroke={1.5} />
                            </ActionIcon>
                          </>
                        )}
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </>
        ) : (
          <Center style={{ padding: "60px 20px", flexDirection: "column" }}>
            <IconReceipt2 size={60} color="#dee2e6" stroke={1.5} />
            <Text size="lg" fw={500} mt="md" style={{ color: "#1B2E3D" }}>
              Записей не найдено
            </Text>
            <Text c="dimmed" mt={5}>
              По заданным фильтрам транзакций нет, или база еще пуста.
            </Text>
          </Center>
        )}
      </Paper>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
      {/* ========================================== */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Title order={3} style={{ color: "#1B2E3D" }}>
            {editingId ? "Редактировать расход" : "Новый расход"}
          </Title>
        }
        size="md"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleSave}>
          <Stack gap="md">
            <Select
              label="Категория расхода"
              placeholder="Выберите категорию"
              data={expenseCategories}
              required
              value={category}
              onChange={setCategory}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <NumberInput
              label="Сумма (₸)"
              placeholder="Например: 50000"
              required
              min={0}
              step={1000}
              value={amount}
              onChange={setAmount}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <Textarea
              label="Комментарий"
              placeholder="Например: Оплата аренды за Май"
              minRows={3}
              value={comment}
              onChange={(e) => setComment(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={close}>
                Отмена
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                style={{
                  backgroundColor: "#FF8C00",
                  color: "#1B2E3D",
                  fontWeight: 700,
                }}
              >
                {editingId ? "Сохранить изменения" : "Добавить расход"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}
