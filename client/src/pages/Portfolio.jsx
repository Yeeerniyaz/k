import { useState, useEffect } from "react";
import {
  Title,
  Text,
  Paper,
  Grid,
  Card,
  Image,
  Button,
  Group,
  ActionIcon,
  Skeleton,
  Alert,
  Tooltip,
  Modal,
  TextInput,
  Select,
  Textarea,
  FileInput,
  Badge,
  Center,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconUpload,
  IconPhoto,
  IconSearch,
  IconFilter,
  IconArrowsSort,
} from "@tabler/icons-react";

// 🔥 Senior Update: Импортируем готовые методы из нового axios.js
import {
  fetchPortfolio as apiFetchPortfolio,
  addPortfolio as apiAddPortfolio,
  deletePortfolioItem as apiDeletePortfolioItem,
} from "../api/axios.js";

export default function Portfolio() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ ФИЛЬТРОВ И СОРТИРОВКИ
  // ==========================================
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (ДОБАВЛЕНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Категории должны совпадать с теми, что мы используем на витрине
  const categoryOptions = [
    { value: "banners", label: "Баннеры" },
    { value: "lightboxes", label: "Лайтбоксы" },
    { value: "signboards", label: "Вывески" },
    { value: "3d-figures", label: "Объемные фигуры" },
    { value: "metal-frames", label: "Металлокаркасы" },
    { value: "pos-materials", label: "ПОС материалы" },
  ];

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ПОРТФОЛИО (REAL DATA)
  // ==========================================
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      // Используем метод из axios.js
      const response = await apiFetchPortfolio();
      setItems(response.data.data || []);
    } catch (err) {
      console.error("Ошибка загрузки портфолио:", err);
      // 🔥 Senior Practice: Убрали фейковые данные. Пустой массив при ошибке.
      setItems([]);
      setError(
        "Не удалось загрузить список работ. Проверьте соединение с сервером.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ФИЛЬТРАЦИЯ И СОРТИРОВКА
  // ==========================================
  const processedItems = [...items]
    .filter((item) => {
      // 1. Поиск по названию или описанию
      const searchString =
        `${item.title || ""} ${item.description || ""}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());

      // 2. Фильтр по категории
      const matchesCategory =
        filterCategory === "ALL" ? true : item.category === filterCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // 3. Сортировка
      if (sortBy === "NEWEST")
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === "OLDEST")
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "NAME_ASC")
        return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "NAME_DESC")
        return (b.title || "").localeCompare(a.title || "");
      return 0;
    });

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ДОБАВЛЕНИЕ НОВОЙ РАБОТЫ (REAL DATA)
  // ==========================================
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !category || !file) return;

    setIsSubmitting(true);

    // Для отправки файлов используем FormData
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("image", file);

    try {
      // Отправляем мультипарт-запрос через функцию axios.js
      await apiAddPortfolio(formData);

      // Очищаем форму и закрываем модалку
      setTitle("");
      setCategory("");
      setDescription("");
      setFile(null);
      close();

      // Обновляем список работ напрямую с сервера
      fetchPortfolio();
    } catch (err) {
      console.error("Ошибка при создании работы:", err);
      // 🔥 Senior Update: Убрана локальная имитация создания объекта. Показываем реальную ошибку.
      alert(
        err.response?.data?.message ||
          "Ошибка при загрузке работы в облако. Возможно, файл слишком большой.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УДАЛЕНИЕ РАБОТЫ (REAL DATA)
  // ==========================================
  const handleDelete = async (id) => {
    if (
      !window.confirm("Вы уверены, что хотите удалить эту работу из портфолио?")
    )
      return;

    try {
      await apiDeletePortfolioItem(id);
      // Локально удаляем из стейта, только после того как сервер ответил 200 OK
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      // 🔥 Senior Update: Убрана демо-имитация удаления.
      alert(
        err.response?.data?.message ||
          "Не удалось удалить работу. Убедитесь, что у вас есть права Администратора.",
      );
    }
  };

  // Вспомогательная функция для красивого названия категории
  const getCategoryLabel = (val) => {
    const cat = categoryOptions.find((c) => c.value === val);
    return cat ? cat.label : val;
  };

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      {/* ========================================== */}
      {/* ШАПКА СТРАНИЦЫ */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            Управление портфолио
          </Title>
          <Text c="dimmed" mt={5}>
            Добавляйте фотографии выполненных проектов для витрины
          </Text>
        </div>

        <Group>
          <Tooltip label="Обновить данные">
            <ActionIcon
              variant="default"
              size="lg"
              onClick={fetchPortfolio}
              loading={loading}
            >
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={open}
            style={{
              backgroundColor: "#1B2E3D",
              color: "white",
              fontWeight: 600,
            }}
          >
            Добавить работу
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
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label="Поиск по работам"
              placeholder="Название или описание..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Категория"
              leftSection={<IconFilter size={16} />}
              data={[
                { value: "ALL", label: "Все категории" },
                ...categoryOptions,
              ]}
              value={filterCategory}
              onChange={setFilterCategory}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Сортировка"
              leftSection={<IconArrowsSort size={16} />}
              data={[
                { value: "NEWEST", label: "Сначала новые" },
                { value: "OLDEST", label: "Сначала старые" },
                { value: "NAME_ASC", label: "По алфавиту (А-Я)" },
                { value: "NAME_DESC", label: "По алфавиту (Я-А)" },
              ]}
              value={sortBy}
              onChange={setSortBy}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* ========================================== */}
      {/* СЕТКА ПОРТФОЛИО */}
      {/* ========================================== */}
      {loading ? (
        <Grid gutter="md">
          {[1, 2, 3, 4].map((i) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton height={250} radius="md" />
            </Grid.Col>
          ))}
        </Grid>
      ) : processedItems.length > 0 ? (
        <Grid gutter="md">
          {processedItems.map((item) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Card.Section style={{ position: "relative" }}>
                  <Image
                    src={item.imageUrl}
                    height={200}
                    alt={item.title}
                    fallbackSrc="https://placehold.co/600x400?text=Нет+Изображения"
                  />
                  <Badge
                    variant="filled"
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      backgroundColor: "#1B2E3D",
                    }}
                  >
                    {getCategoryLabel(item.category)}
                  </Badge>
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text
                    fw={600}
                    style={{ color: "#1B2E3D" }}
                    lineClamp={1}
                    title={item.title}
                  >
                    {item.title}
                  </Text>
                </Group>

                <Text
                  size="sm"
                  c="dimmed"
                  lineClamp={2}
                  style={{ flexGrow: 1 }}
                >
                  {item.description || "Нет описания"}
                </Text>

                <Button
                  variant="light"
                  color="red"
                  fullWidth
                  mt="md"
                  radius="md"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => handleDelete(item.id)}
                >
                  Удалить
                </Button>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Paper withBorder p={60} radius="md" bg="white">
          <Center style={{ flexDirection: "column" }}>
            <IconPhoto size={60} color="#e0e0e0" stroke={1} />
            <Text size="lg" fw={500} mt="md" style={{ color: "#1B2E3D" }}>
              Работы не найдены
            </Text>
            <Text c="dimmed" mt={5}>
              {items.length === 0
                ? "Загрузите первую фотографию, чтобы клиенты увидели ваши работы."
                : "По вашему запросу ничего не найдено. Измените фильтры."}
            </Text>
            {items.length === 0 ? (
              <Button
                mt="lg"
                style={{ backgroundColor: "#1B2E3D" }}
                onClick={open}
              >
                Загрузить работу
              </Button>
            ) : (
              <Button
                mt="lg"
                variant="default"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("ALL");
                  setSortBy("NEWEST");
                }}
              >
                Сбросить фильтры
              </Button>
            )}
          </Center>
        </Paper>
      )}

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ */}
      {/* ========================================== */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Title order={3} style={{ color: "#1B2E3D" }}>
            Новая работа
          </Title>
        }
        size="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="Название проекта"
              placeholder="Например: Световая вывеска для ресторана"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <Select
              label="Категория"
              placeholder="Выберите раздел"
              data={categoryOptions}
              required
              value={category}
              onChange={setCategory}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <FileInput
              label="Фотография работы"
              placeholder="Нажмите, чтобы выбрать файл"
              required
              accept="image/png,image/jpeg,image/webp"
              leftSection={<IconUpload size={16} />}
              value={file}
              onChange={setFile}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <Textarea
              label="Описание (необязательно)"
              placeholder="Кратко опишите материалы и особенности монтажа"
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={close}>
                Отмена
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                style={{ backgroundColor: "#1B2E3D" }}
              >
                Сохранить
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}
