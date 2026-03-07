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
  Textarea,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconReceipt,
  IconCalculator,
  IconSearch,
  IconFilter,
  IconArrowsSort,
  IconShoppingCart,
} from "@tabler/icons-react";

import api, {
  fetchOrders as apiFetchOrders,
  updateOrder as apiUpdateOrder,
  deleteOrder as apiDeleteOrder,
} from "../api/axios.js";

export default function Orders() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ ФИЛЬТРОВ И СОРТИРОВКИ
  // ==========================================
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_DESC");

  // ==========================================
  // СОСТОЯНИЯ МОДАЛКИ: СОЗДАНИЕ НОВОГО ЗАКАЗА
  // ==========================================
  const [openedCreate, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: "",
    phone: "",
    serviceType: "BANNERS",
    description: "",
    totalPrice: 0,
  });

  // ==========================================
  // СОСТОЯНИЯ МОДАЛКИ: РЕДАКТИРОВАНИЕ ЗАКАЗА
  // ==========================================
  const [openedEdit, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Поля управления заказом
  const [status, setStatus] = useState("NEW");
  const [price, setPrice] = useState(0);

  // Поля для расходов по заказу
  const [orderExpenses, setOrderExpenses] = useState([]);
  const [expenseCategory, setExpenseCategory] = useState(
    "Материалы (Акрил, ПВХ, Пленка)",
  );
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseComment, setExpenseComment] = useState("");

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ЗАКАЗОВ
  // ==========================================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetchOrders();
      setOrders(response.data?.data || response.data || []);
    } catch (err) {
      console.error("Ошибка загрузки заказов:", err);
      setOrders([]);
      setError(
        "Не удалось загрузить список заказов. Проверьте соединение с сервером.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ФИЛЬТРАЦИЯ И СОРТИРОВКА
  // ==========================================
  const processedOrders = [...orders]
    .filter((order) => {
      const searchString =
        `${order.customerName || order.clientName || ""} ${order.id || ""} ${order.description || ""}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "ALL" ? true : order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "DATE_DESC")
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "DATE_ASC")
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "PRICE_DESC")
        return (b.price || b.totalPrice || 0) - (a.price || a.totalPrice || 0);
      if (sortBy === "PRICE_ASC")
        return (a.price || a.totalPrice || 0) - (b.price || b.totalPrice || 0);
      return 0;
    });

  // ==========================================
  // БИЗНЕС-ЛОГИКА: СОЗДАНИЕ НОВОГО ЗАКАЗА
  // ==========================================
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.customerName || !newOrder.phone) return;

    setIsCreating(true);
    try {
      await api.post("/orders", {
        customerName: newOrder.customerName,
        phone: newOrder.phone,
        serviceType: newOrder.serviceType,
        description:
          newOrder.description || "Создано вручную менеджером Royal Banners",
        price: newOrder.totalPrice,
        totalPrice: newOrder.totalPrice,
        status: "NEW",
        hasEyelets: false,
        needsMount: true,
      });

      setNewOrder({
        customerName: "",
        phone: "",
        serviceType: "BANNERS",
        description: "",
        totalPrice: 0,
      });
      closeCreate();
      fetchOrders();
    } catch (err) {
      console.error("Ошибка при создании заявки:", err);
      alert(
        err.response?.data?.message ||
          "Не удалось создать заявку. Проверьте данные.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ОТКРЫТИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ
  // ==========================================
  const handleEditClick = (order) => {
    setEditingOrder(order);
    setStatus(order.status || "NEW");
    setPrice(order.price || order.totalPrice || 0);
    setOrderExpenses(order.expenses || []);

    setExpenseCategory("Материалы (Акрил, ПВХ, Пленка)");
    setExpenseAmount(0);
    setExpenseComment("");

    openEdit();
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УПРАВЛЕНИЕ РАСХОДАМИ
  // ==========================================
  const handleAddExpense = () => {
    if (expenseAmount <= 0) return;
    const newExpense = {
      id: Date.now(),
      category: expenseCategory,
      amount: expenseAmount,
      comment: expenseComment || "Без комментария",
    };
    setOrderExpenses([...orderExpenses, newExpense]);
    setExpenseAmount(0);
    setExpenseComment("");
  };

  const handleRemoveExpense = (expenseId) => {
    setOrderExpenses(orderExpenses.filter((e) => e.id !== expenseId));
  };

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
      await apiUpdateOrder(editingOrder.id, {
        status,
        price,
        totalPrice: price,
        expenses: orderExpenses,
      });
      closeEdit();
      fetchOrders();
    } catch (err) {
      console.error("Ошибка при обновлении заказа:", err);
      alert(
        err.response?.data?.message ||
          "Не удалось обновить заказ. Попробуйте позже.",
      );
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
      await apiDeleteOrder(id);
      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert(
        err.response?.data?.message ||
          "Не удалось удалить заказ. Проверьте права доступа.",
      );
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
            Выполнен / Сдан
          </Badge>
        );
      case "READY":
        return (
          <Badge color="teal" variant="outline">
            Готов к монтажу
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge color="violet" variant="light">
            В производстве
          </Badge>
        );
      case "PENDING":
        return (
          <Badge color="orange" variant="light">
            Ожидание / Замер
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
          <Badge color="blue" variant="filled">
            Новая заявка
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
            Сводка заявок Royal Banners. Отслеживание этапов производства и
            оплат.
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
            onClick={openCreate}
            style={{
              backgroundColor: "#1B2E3D",
              color: "white",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.02)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Новый заказ
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
      {/* ПАНЕЛЬ ФИЛЬТРОВ И СОРТИРОВКИ */}
      {/* ========================================== */}
      <Paper withBorder p="md" radius="md" mb="xl" bg="white" shadow="sm">
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              placeholder="Поиск по клиенту, описанию или ID..."
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
                { value: "NEW", label: "Новые заявки" },
                { value: "PENDING", label: "Ожидание / Выезд на замер" },
                { value: "IN_PROGRESS", label: "В работе (Производство)" },
                { value: "COMPLETED", label: "Выполненные (Сданы)" },
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
      {/* ОСНОВНОЙ ВЫВОД ДАННЫХ (ТАБЛИЦА / КАРТОЧКИ) */}
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
          <>
            {/* 🔥 ДЕСКТОПНАЯ ВЕРСИЯ: ТАБЛИЦА (Скрывается на мобильных) */}
            <Box visibleFrom="md" style={{ overflowX: "auto" }}>
              <Table
                striped
                highlightOnHover
                verticalSpacing="md"
                horizontalSpacing="lg"
                style={{ minWidth: 1000 }}
              >
                <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
                  <Table.Tr>
                    <Table.Th style={{ color: "#1B2E3D" }}>ID / Дата</Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>Клиент</Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>
                      ТЗ / Описание
                    </Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>Статус</Table.Th>
                    <Table.Th style={{ color: "#1B2E3D" }}>Смета</Table.Th>
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
                          {order.customerName ||
                            order.clientName ||
                            "Без имени"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {order.phone || order.clientPhone || "Нет телефона"}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Text size="sm" lineClamp={2} maw={280}>
                          {order.description || "Нет описания"}
                        </Text>
                      </Table.Td>

                      <Table.Td>{renderStatusBadge(order.status)}</Table.Td>

                      <Table.Td>
                        <Text fw={700} size="sm" style={{ color: "#1B2E3D" }}>
                          {order.price || order.totalPrice
                            ? `${(order.price || order.totalPrice).toLocaleString("ru-RU")} ₸`
                            : "Смета не готова"}
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
                          <Tooltip label="Удалить заказ">
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
            </Box>

            {/* 🔥 МОБИЛЬНАЯ ВЕРСИЯ: КАРТОЧКИ (Показывается только на смартфонах) */}
            <Box hiddenFrom="md" bg="#f8f9fa" p="md">
              <Stack gap="md">
                {processedOrders.map((order) => (
                  <Paper
                    key={order.id}
                    withBorder
                    shadow="sm"
                    p="md"
                    radius="md"
                  >
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <Box>
                        <Text fw={700} size="md" style={{ color: "#1B2E3D" }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(order.createdAt)}
                        </Text>
                      </Box>
                      {renderStatusBadge(order.status)}
                    </Group>

                    <Divider my="sm" />

                    <Box mb="xs">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Клиент
                      </Text>
                      <Text fw={600} size="sm" style={{ color: "#1B2E3D" }}>
                        {order.customerName || order.clientName || "Без имени"}
                      </Text>
                      <Text
                        size="xs"
                        c="blue"
                        component="a"
                        href={`tel:${order.phone || order.clientPhone}`}
                      >
                        {order.phone || order.clientPhone || "Нет телефона"}
                      </Text>
                    </Box>

                    <Box mb="sm">
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        ТЗ / Описание
                      </Text>
                      <Text size="sm" lineClamp={3}>
                        {order.description || "Нет описания"}
                      </Text>
                    </Box>

                    <Group justify="space-between" align="flex-end" mt="md">
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Смета
                        </Text>
                        <Text fw={800} size="lg" style={{ color: "#1B2E3D" }}>
                          {order.price || order.totalPrice
                            ? `${(order.price || order.totalPrice).toLocaleString("ru-RU")} ₸`
                            : "Не готова"}
                        </Text>
                      </Box>

                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="lg"
                          onClick={() => handleEditClick(order)}
                        >
                          <IconEdit size={18} stroke={1.5} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="lg"
                          onClick={() => handleDeleteOrder(order.id)}
                        >
                          <IconTrash size={18} stroke={1.5} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </>
        ) : (
          <Center style={{ padding: "60px 20px", flexDirection: "column" }}>
            <Text size="lg" fw={500} style={{ color: "#1B2E3D" }}>
              Заказы не найдены
            </Text>
            <Text c="dimmed" mt={5}>
              База данных пуста или нет подходящих результатов по фильтру.
            </Text>
          </Center>
        )}
      </Paper>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО 1: ДОБАВЛЕНИЕ НОВОГО ЗАКАЗА */}
      {/* ========================================== */}
      <Modal
        opened={openedCreate}
        onClose={closeCreate}
        title={
          <Title order={3} style={{ color: "#1B2E3D" }}>
            Новая заявка (Royal Banners)
          </Title>
        }
        size="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleCreateOrder}>
          <Stack gap="md">
            <Grid>
              {/* 🔥 SENIOR FIX: Адаптивные инпут-поля (схлопываются на телефоне) */}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Имя клиента / Компания"
                  placeholder="Иван Иванов"
                  required
                  value={newOrder.customerName}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      customerName: e.currentTarget.value,
                    })
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Телефон"
                  placeholder="+7 (777) 000-00-00"
                  required
                  value={newOrder.phone}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, phone: e.currentTarget.value })
                  }
                />
              </Grid.Col>
            </Grid>

            <Select
              label="Основной тип работ"
              data={[
                { value: "BANNERS", label: "Баннеры" },
                { value: "LIGHTBOXES", label: "Лайтбоксы" },
                { value: "SIGNBOARDS", label: "Вывески" },
                { value: "3D_FIGURES", label: "Объемные фигуры" },
                { value: "METAL_FRAMES", label: "Металлокаркасы" },
                { value: "POS_MATERIALS", label: "ПОС материалы" },
                { value: "DESIGN_PRINT", label: "Дизайн и печать" },
              ]}
              value={newOrder.serviceType}
              onChange={(val) => setNewOrder({ ...newOrder, serviceType: val })}
            />

            <NumberInput
              label="Предварительная смета (₸)"
              description="Если цена пока неизвестна, оставьте 0"
              min={0}
              step={5000}
              value={newOrder.totalPrice}
              onChange={(val) => setNewOrder({ ...newOrder, totalPrice: val })}
            />

            <Textarea
              label="Техническое задание (ТЗ) / Описание"
              placeholder="Размеры, материалы, особенности монтажа, адрес..."
              minRows={4}
              value={newOrder.description}
              onChange={(e) =>
                setNewOrder({ ...newOrder, description: e.currentTarget.value })
              }
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeCreate}>
                Отмена
              </Button>
              <Button
                type="submit"
                loading={isCreating}
                style={{
                  backgroundColor: "#FF8C00",
                  color: "#1B2E3D",
                  fontWeight: 700,
                }}
              >
                Создать заказ
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО 2: ФИНАНСЫ И СТАТУС */}
      {/* ========================================== */}
      <Modal
        opened={openedEdit}
        onClose={closeEdit}
        title={
          <Title order={3} style={{ color: "#1B2E3D" }}>
            Управление заказом
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
                  {/* 🔥 SENIOR FIX: Адаптивность инфо-блока */}
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Заказчик
                    </Text>
                    <Text fw={600}>
                      {editingOrder.customerName ||
                        editingOrder.clientName ||
                        "Не указано"}
                    </Text>
                    <Text size="sm">
                      {editingOrder.phone || editingOrder.clientPhone}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Описание / ТЗ
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
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Статус выполнения"
                    data={[
                      { value: "NEW", label: "Новая заявка" },
                      { value: "PENDING", label: "Ожидание / Замер" },
                      { value: "IN_PROGRESS", label: "В производстве" },
                      { value: "READY", label: "Готов к монтажу" },
                      {
                        value: "COMPLETED",
                        label: "Выполнен (Сдан и Оплачен)",
                      },
                      { value: "CANCELED", label: "Отменен (Отказ)" },
                    ]}
                    required
                    value={status}
                    onChange={setStatus}
                    styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Итоговая выручка (₸)"
                    description="Утвержденная смета для клиента"
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
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <Select
                      label="Категория"
                      data={[
                        "Материалы (Акрил, ПВХ, Пленка)",
                        "Печать (Баннеры, Оракал)",
                        "Монтаж/Подрядчики",
                        "Транспорт/ГСМ",
                        "Прочее",
                      ]}
                      value={expenseCategory}
                      onChange={setExpenseCategory}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <NumberInput
                      label="Сумма (₸)"
                      min={0}
                      step={1000}
                      value={expenseAmount}
                      onChange={setExpenseAmount}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput
                      label="Комментарий"
                      placeholder="Например: Покупка диодов"
                      value={expenseComment}
                      onChange={(e) => setExpenseComment(e.currentTarget.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 2 }}>
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

                {/* СПИСОК ДОБАВЛЕННЫХ РАСХОДОВ (ТАБЛИЦА / КАРТОЧКИ) */}
                {orderExpenses.length > 0 && (
                  <>
                    {/* ДЕСКТОП: ТАБЛИЦА РАСХОДОВ */}
                    <Box visibleFrom="sm">
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
                    </Box>

                    {/* МОБИЛКА: КАРТОЧКИ РАСХОДОВ */}
                    <Box hiddenFrom="sm" mt="md">
                      <Stack gap="xs">
                        {orderExpenses.map((exp) => (
                          <Paper key={exp.id} withBorder p="sm" radius="md">
                            <Group
                              justify="space-between"
                              align="flex-start"
                              wrap="nowrap"
                            >
                              <Box>
                                <Badge color="gray" variant="light" mb={5}>
                                  {exp.category}
                                </Badge>
                                <Text size="sm" lineClamp={2}>
                                  {exp.comment}
                                </Text>
                              </Box>
                              <Stack align="flex-end" gap={5}>
                                <Text fw={600} color="red">
                                  -{exp.amount.toLocaleString("ru-RU")} ₸
                                </Text>
                                <ActionIcon
                                  color="red"
                                  variant="subtle"
                                  size="sm"
                                  onClick={() => handleRemoveExpense(exp.id)}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Stack>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  </>
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
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    style={{ backgroundColor: "white", color: "#1B2E3D" }}
                  >
                    Сохранить изменения
                  </Button>
                </Group>
              </Paper>
            </Stack>
          </form>
        )}
      </Modal>
    </div>
  );
}
