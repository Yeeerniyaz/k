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
  Textarea, // 🔥 FIX: Добавили импорт Textarea!
  Badge,
  Center,
  Stack,
  Grid,
  Card,
  ThemeIcon,
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
} from "@tabler/icons-react";

// Импортируем готовые методы из нового axios.js
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
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ ФИЛЬТРОВ И СОРТИРОВКИ
  // ==========================================
  const [searchTerm, setSearchTerm] = useState("");
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

  // Категории, адаптированные под специфику Royal Banners
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
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА РАСХОДОВ (REAL DATA)
  // ==========================================
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      // Используем метод из axios.js
      const response = await apiFetchExpenses();
      setExpenses(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Ошибка загрузки общих расходов:", err);
      setExpenses([]);
      setError(
        "Не удалось подключиться к базе данных. Проверьте соединение с сервером.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ФИЛЬТРАЦИЯ И СОРТИРОВКА
  // ==========================================
  const processedExpenses = [...expenses]
    .filter((item) => {
      // 1. Поиск по комментарию
      const searchString = (item.comment || "").toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());

      // 2. Фильтр по категории
      const matchesCategory =
        filterCategory === "ALL" ? true : item.category === filterCategory;

      // 3. Фильтр по дате "От"
      const matchesDateFrom = dateFrom
        ? new Date(item.date || item.createdAt) >= new Date(dateFrom)
        : true;

      // 4. Фильтр по дате "До" (добавляем 1 день, чтобы включить весь день)
      const matchesDateTo = dateTo
        ? new Date(item.date || item.createdAt) <=
          new Date(new Date(dateTo).getTime() + 86400000)
        : true;

      return (
        matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo
      );
    })
    .sort((a, b) => {
      // 5. Сортировка
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

  // Подсчет итоговой суммы отфильтрованных расходов
  const totalFilteredAmount = processedExpenses.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

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
      fetchExpenses(); // Обновляем данные напрямую с сервера после успеха
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
      // Удаляем из локального состояния только после успешного ответа сервера
      setExpenses((prev) => prev.filter((item) => item.id !== id));
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
            <IconBusinessplan
              size={26}
              color="#FF8C00"
              style={{ verticalAlign: "bottom", marginRight: "8px" }}
            />
            Финансовый учет
          </Title>
          <Text c="dimmed" mt={5}>
            Управление корпоративными расходами компании Royal Banners
          </Text>
        </div>

        <Group>
          <Tooltip label="Обновить данные">
            <ActionIcon
              variant="default"
              size="lg"
              onClick={fetchExpenses}
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
      {/* КАРТОЧКА СТАТИСТИКИ (СУММА ОТФИЛЬТРОВАННОГО) */}
      {/* ========================================== */}
      <Card
        withBorder
        radius="md"
        p="lg"
        mb="xl"
        shadow="sm"
        style={{ borderLeft: "4px solid #fa5252" }}
      >
        <Group justify="space-between">
          <Group>
            <ThemeIcon color="red" variant="light" size={48} radius="md">
              <IconWallet size={24} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Сумма расходов (По выбранным фильтрам)
              </Text>
              <Title order={2} style={{ color: "#1B2E3D" }}>
                {totalFilteredAmount.toLocaleString("ru-RU")} ₸
              </Title>
            </div>
          </Group>
          <IconCalendarStats size={40} color="#f1f3f5" />
        </Group>
      </Card>

      {/* ========================================== */}
      {/* ПАНЕЛЬ ФИЛЬТРОВ И СОРТИРОВКИ */}
      {/* ========================================== */}
      <Paper withBorder p="md" radius="md" mb="xl" bg="white" shadow="sm">
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <TextInput
              label="Поиск"
              placeholder="Слово в комментарии..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Select
              label="Категория"
              leftSection={<IconFilter size={16} />}
              data={[
                { value: "ALL", label: "Все категории" },
                ...expenseCategories.map((c) => ({ value: c, label: c })),
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
      {/* ОСНОВНАЯ ТАБЛИЦА РАСХОДОВ */}
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
        ) : processedExpenses.length > 0 ? (
          <Table
            striped
            highlightOnHover
            verticalSpacing="md"
            horizontalSpacing="lg"
          >
            <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
              <Table.Tr>
                <Table.Th style={{ color: "#1B2E3D" }}>Дата</Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Категория</Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Комментарий</Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>
                  Связь с заказом
                </Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Сумма</Table.Th>
                <Table.Th style={{ color: "#1B2E3D", textAlign: "right" }}>
                  Действия
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {processedExpenses.map((expense) => (
                <Table.Tr key={expense.id}>
                  <Table.Td>
                    <Text size="sm" c="dimmed" fw={500}>
                      {formatDate(expense.date || expense.createdAt)}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Badge color="blue" variant="light" size="md">
                      {expense.category}
                    </Badge>
                  </Table.Td>

                  <Table.Td>
                    <Text size="sm" lineClamp={2} maw={300}>
                      {expense.comment || "Без комментария"}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    {expense.orderId ? (
                      <Badge color="orange" variant="dot">
                        ID: {expense.orderId.slice(0, 8)}
                      </Badge>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Общий расход
                      </Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    <Text fw={700} color="red">
                      -{expense.amount.toLocaleString("ru-RU")} ₸
                    </Text>
                  </Table.Td>

                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Редактировать">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleOpenModal(expense)}
                        >
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(expense.id)}
                        >
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
          <Center style={{ padding: "60px 20px", flexDirection: "column" }}>
            <IconReceipt2 size={60} color="#dee2e6" stroke={1.5} />
            <Text size="lg" fw={500} mt="md" style={{ color: "#1B2E3D" }}>
              Записей не найдено
            </Text>
            <Text c="dimmed" mt={5}>
              По заданным фильтрам расходов нет, или база еще пуста.
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
