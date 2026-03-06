import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Image,
  Group,
  Badge,
  Skeleton,
  Center,
  Modal,
  Button,
  ActionIcon,
  Box,
  Transition,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPhotoOff, IconX, IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import api from "../api/index.js";

export default function PublicPortfolio() {
  const navigate = useNavigate();

  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ФИЛЬТРАЦИЯ
  const [activeCategory, setActiveCategory] = useState("ALL");

  // ПРОСМОТР СУБЪЕКТА (LIGHTBOX)
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Категории для красивого отображения клиентам
  const categories = [
    { value: "ALL", label: "Все работы" },
    { value: "banners", label: "Баннеры" },
    { value: "lightboxes", label: "Лайтбоксы" },
    { value: "signboards", label: "Вывески" },
    { value: "3d-figures", label: "Объемные фигуры" },
    { value: "metal-frames", label: "Металлокаркасы" },
    { value: "pos-materials", label: "ПОС материалы" },
  ];

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ДАННЫХ
  // ==========================================
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await api.get("/portfolio");
      // В публичной части показываем только то, что есть.
      // Если бэкенд поддерживает isVisible, можно было бы фильтровать: .filter(i => i.isVisible)
      setItems(response.data.data || []);
    } catch (err) {
      console.error("Ошибка загрузки портфолио:", err);
      // Фолбэк для режима разработки
      setItems([
        {
          id: "1",
          title: "Вывеска для ресторана",
          category: "signboards",
          description: "Световые буквы на композите. Яркое свечение ночью.",
          imageUrl: "https://placehold.co/800x600?text=Ресторан",
        },
        {
          id: "2",
          title: "Огромный баннер",
          category: "banners",
          description: "Широкоформатная печать, монтаж альпинистами.",
          imageUrl: "https://placehold.co/800x600?text=Баннер",
        },
        {
          id: "3",
          title: "Двусторонний лайтбокс",
          category: "lightboxes",
          description: "Идеально для привлечения пешеходного трафика.",
          imageUrl: "https://placehold.co/800x600?text=Лайтбокс",
        },
        {
          id: "4",
          title: "Оформление витрины",
          category: "pos-materials",
          description: "Оклейка пленкой Oracal с плоттерной резкой.",
          imageUrl: "https://placehold.co/800x600?text=Витрина",
        },
      ]);
      setError("Демо-режим: Не удалось подключиться к серверу.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // ==========================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ==========================================
  const handleImageClick = (item) => {
    setSelectedImage(item);
    open();
  };

  const filteredItems =
    activeCategory === "ALL"
      ? items
      : items.filter((item) => item.category === activeCategory);

  const getCategoryLabel = (val) => {
    const cat = categories.find((c) => c.value === val);
    return cat ? cat.label : val;
  };

  return (
    <Box
      bg="#f8f9fa"
      style={{ minHeight: "100vh", fontFamily: '"Google Sans", sans-serif' }}
    >
      {/* ========================================== */}
      {/* НАВИГАЦИЯ / ШАПКА */}
      {/* ========================================== */}
      <Box
        bg="#1B2E3D"
        py="md"
        px="xl"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Container size="xl">
          <Group justify="space-between">
            <Group
              gap="sm"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              <ActionIcon variant="transparent" color="white" size="lg">
                <IconArrowLeft size={24} />
              </ActionIcon>
              <Title
                order={3}
                style={{
                  fontFamily: '"Alyamama", sans-serif',
                  color: "white",
                  letterSpacing: "1px",
                }}
              >
                ROYAL BANNERS
              </Title>
            </Group>
            <Button variant="light" color="gray" onClick={() => navigate("/")}>
              На главную
            </Button>
          </Group>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* HERO СЕКЦИЯ */}
      {/* ========================================== */}
      <Container size="xl" py={50}>
        <Center
          style={{ flexDirection: "column", textAlign: "center" }}
          mb={40}
        >
          <Title
            order={1}
            style={{ color: "#1B2E3D", fontSize: "2.5rem", fontWeight: 800 }}
          >
            Наши работы
          </Title>
          <Text c="dimmed" mt="md" size="lg" maw={600}>
            Ознакомьтесь с качеством нашего исполнения. Мы гордимся каждым
            проектом и всегда доводим дело до идеала.
          </Text>
        </Center>

        {/* ПАНЕЛЬ ФИЛЬТРОВ (КНОПКИ) */}
        <Group justify="center" gap="xs" mb={40}>
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? "filled" : "default"}
              radius="xl"
              onClick={() => setActiveCategory(cat.value)}
              style={{
                backgroundColor:
                  activeCategory === cat.value ? "#1B2E3D" : "white",
                color: activeCategory === cat.value ? "white" : "#1B2E3D",
                transition: "all 0.2s ease",
              }}
            >
              {cat.label}
            </Button>
          ))}
        </Group>

        {/* ========================================== */}
        {/* СЕТКА ПОРТФОЛИО */}
        {/* ========================================== */}
        {loading ? (
          <Grid gutter="xl">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton height={300} radius="md" />
              </Grid.Col>
            ))}
          </Grid>
        ) : filteredItems.length > 0 ? (
          <Grid gutter="xl">
            {filteredItems.map((item) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={item.id}>
                <Card
                  shadow="sm"
                  padding="none"
                  radius="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 20px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.05)";
                  }}
                  onClick={() => handleImageClick(item)}
                >
                  <Card.Section
                    style={{ position: "relative", overflow: "hidden" }}
                  >
                    <Image
                      src={item.imageUrl}
                      height={250}
                      alt={item.title}
                      fallbackSrc="https://placehold.co/600x400?text=Нет+Изображения"
                      style={{ transition: "transform 0.3s ease" }}
                    />
                    <Badge
                      variant="filled"
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        backgroundColor: "#1B2E3D",
                      }}
                    >
                      {getCategoryLabel(item.category)}
                    </Badge>
                  </Card.Section>

                  <Box
                    p="md"
                    style={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Text
                      fw={700}
                      size="lg"
                      style={{ color: "#1B2E3D" }}
                      mb="xs"
                    >
                      {item.title}
                    </Text>
                    <Text size="sm" c="dimmed" lineClamp={3}>
                      {item.description ||
                        "Ознакомьтесь с деталями этой работы, нажав на фотографию."}
                    </Text>
                  </Box>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Center py={80} style={{ flexDirection: "column" }}>
            <IconPhotoOff size={64} color="#ced4da" stroke={1.5} />
            <Title order={3} mt="md" style={{ color: "#1B2E3D" }}>
              Работ не найдено
            </Title>
            <Text c="dimmed" mt="sm">
              В данной категории пока нет добавленных фотографий.
            </Text>
            <Button
              mt="lg"
              variant="outline"
              color="gray"
              onClick={() => setActiveCategory("ALL")}
            >
              Смотреть все работы
            </Button>
          </Center>
        )}
      </Container>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО ДЛЯ ПРОСМОТРА ФОТО (LIGHTBOX) */}
      {/* ========================================== */}
      <Modal
        opened={opened}
        onClose={close}
        withCloseButton={false}
        size="80%" // Огромный размер для детального просмотра
        padding={0}
        radius="md"
        centered
        overlayProps={{ backgroundOpacity: 0.8, blur: 5 }}
      >
        {selectedImage && (
          <Box
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Кнопка закрытия поверх картинки */}
            <ActionIcon
              variant="filled"
              color="dark"
              radius="xl"
              size="lg"
              onClick={close}
              style={{ position: "absolute", top: 15, right: 15, zIndex: 10 }}
            >
              <IconX size={20} />
            </ActionIcon>

            {/* Сама картинка */}
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.title}
              fit="contain"
              style={{ maxHeight: "70vh", backgroundColor: "#f1f3f5" }}
              fallbackSrc="https://placehold.co/1200x800?text=Нет+Изображения"
            />

            {/* Блок с описанием внизу */}
            <Box p="xl" bg="white">
              <Group justify="space-between" align="flex-start" mb="sm">
                <Title order={3} style={{ color: "#1B2E3D" }}>
                  {selectedImage.title}
                </Title>
                <Badge size="lg" variant="outline" color="gray">
                  {getCategoryLabel(selectedImage.category)}
                </Badge>
              </Group>
              <Text size="md" c="dimmed" style={{ lineHeight: 1.6 }}>
                {selectedImage.description ||
                  "Детальное описание для данного проекта отсутствует."}
              </Text>
            </Box>
          </Box>
        )}
      </Modal>
    </Box>
  );
}
