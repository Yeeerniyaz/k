import { useState, useEffect } from "react";
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
  Tooltip,
  Modal,
  Select,
  NumberInput,
  Stack,
  Center,
  Divider,
  TextInput,
  Grid,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconUser,
  IconPhone,
  IconFileText,
  IconReceipt,
  IconCalculator,
  IconSearch,
  IconFilter,
  IconArrowsSort,
} from "@tabler/icons-react";
import api from "../api/index.js";

export default function Orders() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ ФИЛЬТРОВ И СОРТИРОВКИ (НОВОЕ)
  // ==========================================
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_DESC");

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (РЕДАКТИРОВАНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Поля управления заказом
  const [status, setStatus] = useState("NEW");
  const [price, setPrice] = useState(0);

  // Поля для расходов по заказу
  const [orderExpenses, setOrderExpenses] = useState([]);
  const [expenseCategory, setExpenseCategory] = useState("Материалы");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseComment, setExpenseComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ЗАКАЗОВ
  // ==========================================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/orders");
      setOrders(response.data.data || response.data || []);
    } catch (err) {
      console.error("Ошибка загрузки заказов:", err);
      // Сеньорский фоллбэк: демо-данные с расходами
      setOrders([
        {
          id: "dev-1",
          clientName: "Тест Калькулятор",
          clientPhone: "+7 777 111 22 33",
          description: "Лайтбокс 2х1м (Заявка с калькулятора)",
          status: "NEW",
          price: 45000,
          expenses: [
            {
              id: 1,
              category: "Материалы",
              amount: 15000,
              comment: "Акрил и диоды",
            },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: "dev-2",
          clientName: "Иван Иванов",
          clientPhone: "+7 701 000 00 00",
          description: "Объемные буквы (Свяжитесь с нами)",
          status: "PENDING",
          price: 120000,
          expenses: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Вчера
        },
      ]);
      setError("Не удалось загрузить боевые заказы. Показаны тестовые данные.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ФИЛЬТРАЦИЯ И СОРТИРОВКА (НОВОЕ)
  // ==========================================
  const processedOrders = [...orders]
    .filter((order) => {
      // 1. Поиск по тексту (Имя клиента, ID, Описание/Источник)
      const searchString = `${order.clientName || ""} ${order.id || ""} ${order.description || ""}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      
      // 2. Фильтр по статусу
      const matchesStatus = filterStatus === "ALL" ? true : order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // 3. Сортировка
      if (sortBy === "DATE_DESC") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "DATE_ASC") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "PRICE_DESC") return (b.price || 0) - (a.price || 0);
      if (sortBy === "PRICE_ASC") return (a.price || 0) - (b.price || 0);
      return 0;
    });

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ОТКРЫТИЕ МОДАЛКИ
  // ==========================================
  const handleEditClick = (order) => {
    setEditingOrder(order);
    setStatus(order.status || "NEW");
    setPrice(order.price || 0);
    // Загружаем существующие расходы заказа, если они есть
    setOrderExpenses(order.expenses || []);

    // Сбрасываем форму добавления расхода
    setExpenseCategory("Материалы");
    setExpenseAmount(0);
    setExpenseComment("");

    open();
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УПРАВЛЕНИЕ РАСХОДАМИ
  // ==========================================
  const handleAddExpense = () => {
    if (expenseAmount <= 0) return;

    const newExpense = {
      id: Date.now(), // Временный ID для фронтенда
      category: expenseCategory,
      amount: expenseAmount,
      comment: expenseComment || "Без комментария",
    };

    setOrderExpenses([...orderExpenses, newExpense]);

    // Очищаем инпуты после добавления
    setExpenseAmount(0);
    setExpenseComment("");
  };

  const handleRemoveExpense = (expenseId) => {
    setOrderExpenses(orderExpenses.filter((e) => e.id !== expenseId));
  };

  // Расчет итогов
  const totalExpenses = orderExpenses.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const netProfit = price - totalExpenses;

  // ==========================================
  // БИЗНЕС-ЛОГИКА: СОХРАНЕНИЕ ИЗМЕНЕНИЙ
  // ==========================================
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsSubmitting(true);
    try {
      // Отправляем обновленные данные (статус, цену и массив расходов)
      await api.put(`/orders/${editingOrder.id}`, {
        status,
        price,
        expenses: orderExpenses, // Бэкенд должен будет принять этот массив
      });

      close();
      fetchOrders();
    } catch (err) {
      console.error("Ошибка при обновлении заказа:", err);

      // Имитация успеха для демо
      if (error) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editingOrder.id
              ? { ...o, status, price, expenses: orderExpenses }
              : o,
          ),
        );
        close();
      } else {
        alert("Не удалось обновить заказ.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УДАЛЕНИЕ ЗАКАЗА
  // ==========================================
  const handleDeleteOrder = async (id) => {
    if (
      !window.confirm("Вы уверены, что хотите безвозвратно удалить этот заказ?")
    )
      return;

    try {
      await api.delete(`/orders/${id}`);
      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      if (error) {
        setOrders((prev) => prev.filter((order) => order.id !== id));
      } else {
        alert("Не удалось удалить заказ.");
      }
    }
  };

  // ==========================================
  // ФУНКЦИИ ФОРМАТИРОВАНИЯ
  // ==========================================
  const renderStatusBadge = (currentStatus) => {
    switch (currentStatus) {
      case "COMPLETED":
        return (
          <Badge color="green" variant="light">
            Выполнен
          </Badge>
        );
      case "PENDING":
        return (
          <Badge color="orange" variant="light">
            В работе
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge color="red" variant="light">
            Отменен
          </Badge>
        );
      case "NEW":
        return (
          <Badge color="blue" variant="light">
            Новый
          </Badge>
        );
      default:
        return (
          <Badge color="gray" variant="light">
            {currentStatus}
          </Badge>
        );
    }
  };

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
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: "#1B2E3D" }}>
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
            style={{ backgroundColor: "#1B2E3D", color: "white" }}
          >
            Новый заказ (Ручной ввод)
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Внимание (Режим разработки)"
          color="orange"
          mb="xl"
          radius="md"
        >
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* ПАНЕЛЬ ФИЛЬТРОВ И СОРТИРОВКИ (НОВЫЙ БЛОК) */}
      {/* ========================================== */}
      <Paper withBorder p="md" radius="md" mb="xl" bg="white" shadow="sm">
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              placeholder="Поиск по клиенту, ID или источнику (калькулятор)..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              leftSection={<IconFilter size={16} />}
              data={[
                { value: "ALL", label: "Все статусы" },
                { value: "NEW", label: "Новые (Лиды с сайта)" },
                { value: "PENDING", label: "В работе (Производство)" },
                { value: "COMPLETED", label: "Выполненные (Оплачены)" },
                { value: "CANCELED", label: "Отмененные" },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              leftSection={<IconArrowsSort size={16} />}
              data={[
                { value: "DATE_DESC", label: "Сначала новые (по дате)" },
                { value: "DATE_ASC", label: "Сначала старые (по дате)" },
                { value: "PRICE_DESC", label: "Сначала дорогие (по сумме)" },
                { value: "PRICE_ASC", label: "Сначала дешевые (по сумме)" },
              ]}
              value={sortBy}
              onChange={setSortBy}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* ========================================== */}
      {/* ОСНОВНАЯ ТАБЛИЦА ЗАКАЗОВ */}
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
        ) : processedOrders.length > 0 ? (
          <Table
            striped
            highlightOnHover
            verticalSpacing="md"
            horizontalSpacing="lg"
          >
            <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
              <Table.Tr>
                <Table.Th style={{ color: "#1B2E3D" }}>ID / Дата</Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Клиент</Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Детали заказа</Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Статус</Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Сумма</Table.Th>
                <Table.Th style={{ color: "#1B2E3D", textAlign: "right" }}>
                  Действия
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {processedOrders.map((order) => (
                <Table.Tr key={order.id}>
                  <Table.Td>
                    <Text fw={600} size="sm" style={{ color: "#1B2E3D" }}>
                      {order.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(order.createdAt)}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text fw={500} size="sm" style={{ color: "#1B2E3D" }}>
                      {order.clientName || "Без имени"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {order.clientPhone || "Нет телефона"}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="sm" lineClamp={2} maw={250}>
                      {order.description || "Нет описания"}
                    </Text>
                  </Table.Td>

                  <Table.Td>{renderStatusBadge(order.status)}</Table.Td>

                  <Table.Td>
                    <Text fw={700} size="sm" style={{ color: "#1B2E3D" }}>
                      {order.price
                        ? `${order.price.toLocaleString("ru-RU")} ₸`
                        : "Не указана"}
                    </Text>
                  </Table.Td>

                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Управление финансами и статусом">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEditClick(order)}
                        >
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteOrder(order.id)}
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
            <Text size="lg" fw={500} style={{ color: "#1B2E3D" }}>
              Заказы не найдены
            </Text>
            <Text c="dimmed" mt={5}>
              Попробуйте изменить параметры поиска или фильтрации.
            </Text>
          </Center>
        )}
      </Paper>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО: ФИНАНСЫ И СТАТУС ЗАКАЗА */}
      {/* ========================================== */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Title order={3} style={{ color: "#1B2E3D" }}>
            Финансы заказа
          </Title>
        }
        size="xl"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        {editingOrder && (
          <form onSubmit={handleUpdateOrder}>
            <Stack gap="md">
              {/* БЛОК 1: ИНФОРМАЦИЯ */}
              <Paper p="md" radius="md" bg="#f8f9fa" withBorder>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Клиент
                    </Text>
                    <Text fw={600}>
                      {editingOrder.clientName || "Не указано"}
                    </Text>
                    <Text size="sm">{editingOrder.clientPhone}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Описание от клиента
                    </Text>
                    <Text size="sm" lineClamp={3}>
                      {editingOrder.description}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Paper>

              <Divider />

              {/* БЛОК 2: СТАТУС И ВЫРУЧКА */}
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Статус выполнения"
                    data={[
                      { value: "NEW", label: "Новый (Не обработан)" },
                      {
                        value: "PENDING",
                        label: "В работе (Замер / Производство)",
                      },
                      { value: "COMPLETED", label: "Выполнен (Оплачен)" },
                      { value: "CANCELED", label: "Отменен (Отказ)" },
                    ]}
                    required
                    value={status}
                    onChange={setStatus}
                    styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Итоговая выручка (₸)"
                    description="Окончательная цена для клиента"
                    required
                    min={0}
                    step={1000}
                    value={price}
                    onChange={setPrice}
                    styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
                  />
                </Grid.Col>
              </Grid>

              <Divider
                label={
                  <Text fw={600} style={{ color: "#1B2E3D" }}>
                    <IconReceipt
                      size={14}
                      style={{ verticalAlign: "middle", marginRight: 5 }}
                    />
                    Расходы по заказу (Себестоимость)
                  </Text>
                }
                labelPosition="center"
                my="sm"
              />

              {/* БЛОК 3: ДОБАВЛЕНИЕ РАСХОДОВ */}
              <Paper p="md" radius="md" withBorder bg="white">
                <Grid align="flex-end">
                  <Grid.Col span={3}>
                    <Select
                      label="Категория"
                      data={[
                        "Материалы",
                        "Монтаж/Подрядчики",
                        "Доставка/Логистика",
                        "Зарплата",
                        "Прочее",
                      ]}
                      value={expenseCategory}
                      onChange={setExpenseCategory}
                    />
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <NumberInput
                      label="Сумма (₸)"
                      min={0}
                      step={500}
                      value={expenseAmount}
                      onChange={setExpenseAmount}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Комментарий"
                      placeholder="Например: Покупка акрила"
                      value={expenseComment}
                      onChange={(e) => setExpenseComment(e.currentTarget.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={2}>
                    <Button
                      fullWidth
                      variant="light"
                      color="blue"
                      onClick={handleAddExpense}
                      disabled={expenseAmount <= 0}
                    >
                      Добавить
                    </Button>
                  </Grid.Col>
                </Grid>

                {/* СПИСОК ДОБАВЛЕННЫХ РАСХОДОВ */}
                {orderExpenses.length > 0 && (
                  <Table mt="md" verticalSpacing="sm" striped>
                    <Table.Tbody>
                      {orderExpenses.map((exp) => (
                        <Table.Tr key={exp.id}>
                          <Table.Td w={150}>
                            <Badge color="gray" variant="light">
                              {exp.category}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{exp.comment}</Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text fw={600} color="red">
                              -{exp.amount.toLocaleString("ru-RU")} ₸
                            </Text>
                          </Table.Td>
                          <Table.Td w={50} ta="right">
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => handleRemoveExpense(exp.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Paper>

              {/* БЛОК 4: ФИНАНСОВАЯ СВОДКА (ПРИБЫЛЬ) */}
              <Paper p="md" radius="md" bg="#1B2E3D" mt="sm">
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <ThemeIcon
                      size={40}
                      radius="md"
                      color="rgba(255,255,255,0.1)"
                      variant="filled"
                    >
                      <IconCalculator size={20} color="white" />
                    </ThemeIcon>
                    <div>
                      <Text
                        size="xs"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                        tt="uppercase"
                      >
                        Чистая прибыль
                      </Text>
                      <Text
                        size="xl"
                        fw={700}
                        style={{
                          color: netProfit >= 0 ? "#40c057" : "#fa5252",
                        }}
                      >
                        {netProfit > 0 ? "+" : ""}
                        {netProfit.toLocaleString("ru-RU")} ₸
                      </Text>
                    </div>
                  </Group>

                  <Stack gap={0} align="flex-end">
                    <Text size="sm" style={{ color: "white" }}>
                      Выручка: {price.toLocaleString()} ₸
                    </Text>
                    <Text size="sm" style={{ color: "#fa5252" }}>
                      Расходы: -{totalExpenses.toLocaleString()} ₸
                    </Text>
                  </Stack>
                </Group>
              </Paper>

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={close}>
                  Отмена
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  style={{ backgroundColor: "#1B2E3D" }}
                >
                  Сохранить всё
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </div>
  );
}