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
  TextInput,
  NumberInput,
  Badge,
  Center,
  Stack,
  Grid,
  Select,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconEdit,
  IconReportMoney,
  IconSearch,
  IconArrowsSort,
  IconTags,
} from "@tabler/icons-react";

// 🔥 Senior Update: Импортируем готовые методы из нового axios.js
import {
  fetchPrices as apiFetchPrices,
  addPrice as apiAddPrice,
  updatePrice as apiUpdatePrice,
  deletePrice as apiDeletePrice,
} from "../api/axios.js";

export default function Prices() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ ФИЛЬТРОВ И СОРТИРОВКИ
  // ==========================================
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("NAME_ASC");

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (СОЗДАНИЕ / РЕДАКТИРОВАНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState(null);

  // Поля формы
  const [service, setService] = useState("");
  const [unit, setUnit] = useState("1 кв.м");
  const [priceValue, setPriceValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ПРАЙС-ЛИСТА (REAL DATA)
  // ==========================================
  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      // Используем метод из axios.js
      const response = await apiFetchPrices();
      // Поддержка различных форматов ответа с бэкенда
      const data = response.data?.data || response.data || [];
      setPrices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Ошибка загрузки прайсов:", err);
      // 🔥 Senior Practice: Никаких фейковых данных! Если ошибка - ставим пустой массив.
      setPrices([]);
      setError(
        "Не удалось подключиться к базе цен. Проверьте соединение с сервером.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ФИЛЬТРАЦИЯ И СОРТИРОВКА
  // ==========================================
  const processedPrices = [...prices]
    .filter((p) => {
      // Поиск по названию услуги
      const searchString = (p.service || "").toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "NAME_ASC")
        return (a.service || "").localeCompare(b.service || "");
      if (sortBy === "NAME_DESC")
        return (b.service || "").localeCompare(a.service || "");
      if (sortBy === "PRICE_DESC") return (b.price || 0) - (a.price || 0);
      if (sortBy === "PRICE_ASC") return (a.price || 0) - (b.price || 0);
      return 0;
    });

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ОТКРЫТИЕ МОДАЛКИ
  // ==========================================
  const handleOpenModal = (item = null) => {
    if (item) {
      // Режим редактирования
      setEditingId(item.id);
      setService(item.service);
      setUnit(item.unit);
      setPriceValue(item.price);
    } else {
      // Режим создания
      setEditingId(null);
      setService("");
      setUnit("1 кв.м");
      setPriceValue(0);
    }
    open();
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: СОХРАНЕНИЕ / ОБНОВЛЕНИЕ (REAL DATA)
  // ==========================================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!service || !unit || priceValue < 0) {
      alert("Пожалуйста, заполните все поля корректно.");
      return;
    }

    setIsSubmitting(true);
    const payload = { service, unit, price: priceValue };

    try {
      if (editingId) {
        await apiUpdatePrice(editingId, payload);
      } else {
        await apiAddPrice(payload);
      }
      close();
      // Сразу запрашиваем обновленный список с сервера
      fetchPrices();
    } catch (err) {
      console.error("Ошибка при сохранении:", err);
      // 🔥 Выводим реальную ошибку сервера
      alert(
        err.response?.data?.message ||
          "Ошибка при сохранении позиции. Возможно, такая услуга уже существует.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УДАЛЕНИЕ (REAL DATA)
  // ==========================================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Вы уверены, что хотите удалить эту позицию из прайса? Это напрямую повлияет на онлайн-калькулятор на сайте!",
      )
    )
      return;

    try {
      await apiDeletePrice(id);
      // Локально удаляем из стейта только после успешного удаления на сервере
      setPrices((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert(
        err.response?.data?.message ||
          "Не удалось удалить позицию. Убедитесь, что у вас есть права Администратора.",
      );
    }
  };

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      {/* ========================================== */}
      {/* ШАПКА СТРАНИЦЫ */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            <IconTags
              size={26}
              color="#FF8C00"
              style={{ verticalAlign: "bottom", marginRight: "8px" }}
            />
            Прайс-лист
          </Title>
          <Text c="dimmed" mt={5}>
            База цен на материалы и услуги для калькулятора Royal Banners
          </Text>
        </div>

        <Group>
          <Tooltip label="Обновить данные">
            <ActionIcon
              variant="default"
              size="lg"
              onClick={fetchPrices}
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
            Добавить позицию
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
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Поиск по прайс-листу"
              placeholder="Название услуги или материала (например: Оракал)..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Сортировка"
              leftSection={<IconArrowsSort size={16} />}
              data={[
                { value: "NAME_ASC", label: "По алфавиту (А-Я)" },
                { value: "NAME_DESC", label: "По алфавиту (Я-А)" },
                { value: "PRICE_DESC", label: "Сначала дорогие" },
                { value: "PRICE_ASC", label: "Сначала дешевые" },
              ]}
              value={sortBy}
              onChange={setSortBy}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* ========================================== */}
      {/* ТАБЛИЦА ПРАЙС-ЛИСТА */}
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
        ) : processedPrices.length > 0 ? (
          <Table
            striped
            highlightOnHover
            verticalSpacing="md"
            horizontalSpacing="lg"
          >
            <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
              <Table.Tr>
                <Table.Th style={{ color: "#1B2E3D" }}>
                  Наименование услуги / материала
                </Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>Единица изм.</Table.Th>
                <Table.Th style={{ color: "#1B2E3D", textAlign: "right" }}>
                  Базовая стоимость
                </Table.Th>
                <Table.Th style={{ color: "#1B2E3D", textAlign: "right" }}>
                  Действия
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {processedPrices.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Text fw={600} size="sm" style={{ color: "#1B2E3D" }}>
                      {item.service}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color="gray"
                      variant="light"
                      style={{ color: "#1B2E3D" }}
                    >
                      {item.unit}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fw={700} style={{ color: "#1B2E3D" }}>
                      {item.price.toLocaleString("ru-RU")} ₸
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Редактировать цену">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleOpenModal(item)}
                        >
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить из прайса">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(item.id)}
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
            <IconReportMoney size={48} color="#e0e0e0" stroke={1.5} />
            <Text size="lg" fw={500} mt="md" style={{ color: "#1B2E3D" }}>
              Прайс-лист пуст
            </Text>
            <Text c="dimmed" mt={5}>
              Добавьте новые услуги, чтобы калькулятор на сайте заработал.
            </Text>
            <Group mt="md">
              <Button
                variant="default"
                onClick={() => {
                  setSearchTerm("");
                  setSortBy("NAME_ASC");
                }}
              >
                Сбросить фильтры
              </Button>
              <Button
                style={{ backgroundColor: "#FF8C00", color: "#1B2E3D" }}
                onClick={() => handleOpenModal()}
              >
                Добавить услугу
              </Button>
            </Group>
          </Center>
        )}
      </Paper>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО: СОЗДАТЬ / РЕДАКТИРОВАТЬ */}
      {/* ========================================== */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Title order={3} style={{ color: "#1B2E3D" }}>
            {editingId ? "Редактировать позицию" : "Новая позиция в прайс"}
          </Title>
        }
        size="md"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleSave}>
          <Stack gap="md">
            <TextInput
              label="Наименование услуги / материала"
              placeholder="Например: Печать баннера 440 гр."
              required
              value={service}
              onChange={(e) => setService(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <TextInput
              label="Единица измерения"
              placeholder="1 кв.м, 1 шт., 1 п.м."
              required
              value={unit}
              onChange={(e) => setUnit(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
              description="В чем считается стоимость для калькулятора"
            />

            <NumberInput
              label="Базовая стоимость (₸)"
              placeholder="Введите сумму"
              required
              min={0}
              step={500}
              value={priceValue}
              onChange={setPriceValue}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
              leftSection={<IconReportMoney size={16} color="#1B2E3D" />}
            />

            <Group justify="flex-end" mt="xl">
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
                {editingId ? "Сохранить изменения" : "Добавить в прайс"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}
