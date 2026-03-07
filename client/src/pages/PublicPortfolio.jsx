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
import {
  IconPhotoOff,
  IconX,
  IconArrowLeft,
  IconPhoto,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Импортируем готовый метод из axios.js
import { fetchPortfolio as apiFetchPortfolio } from "../api/axios.js";

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

  // ПРОСМОТР ПРОЕКТА (LIGHTBOX С ГАЛЕРЕЕЙ)
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Индекс активной картинки в галерее

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
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА РАБОТ (REAL DATA)
  // ==========================================
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetchPortfolio();
      setItems(response.data.data || response.data || []);
    } catch (err) {
      console.error("Ошибка загрузки портфолио:", err);
      setItems([]);
      setError("Не удалось подключиться к серверу. Попробуйте зайти позже.");
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
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0); // При открытии всегда показываем первую картинку
    open();
  };

  const getCategoryLabel = (val) => {
    const cat = categories.find(
      (c) => c.value === val || c.value.replace("-", "_").toUpperCase() === val,
    );
    return cat ? cat.label : val;
  };

  // Извлекаем обложку (совместимо со старым форматом imageUrl и новым imageUrls)
  const getCoverImage = (item) => {
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
    if (item.imageUrl) return item.imageUrl;
    return null;
  };

  // Извлекаем все картинки (нормализуем в массив)
  const getAllImages = (item) => {
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls;
    if (item.imageUrl) return [item.imageUrl];
    return [];
  };

  // Фильтруем и сортируем (свежие сверху)
  const filteredItems = items
    .filter((item) => {
      if (activeCategory === "ALL") return true;
      // Нормализуем для точного сравнения (на бэке может быть BANNERS, на фронте banners)
      const itemCat = item.category?.toLowerCase().replace("_", "-");
      return itemCat === activeCategory;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <Box bg="#f8f9fa" style={{ minHeight: "100vh", paddingBottom: "80px" }}>
      {/* ========================================== */}
      {/* ШАПКА ПОРТФОЛИО */}
      {/* ========================================== */}
      <Box
        bg="white"
        pt={60}
        pb={40}
        style={{ borderBottom: "1px solid #eaeaea" }}
      >
        <Container size="lg">
          {/* Кнопка "Назад" */}
          <Group mb="xl">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/")}
              style={{ padding: 0 }}
            >
              На главную
            </Button>
          </Group>

          <Center style={{ flexDirection: "column" }}>
            <Title
              order={1}
              ta="center"
              style={{
                color: "#1B2E3D",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontFamily: '"Alyamama", sans-serif',
                letterSpacing: "1px",
              }}
            >
              ГАЛЕРЕЯ НАШИХ РАБОТ
            </Title>
            <Text c="dimmed" size="lg" ta="center" mt="md" maw={600}>
              Здесь собраны реальные проекты, выполненные нашей командой. От
              идеи до финального монтажа.
            </Text>
          </Center>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* ФИЛЬТРЫ КАТЕГОРИЙ */}
      {/* ========================================== */}
      <Container size="lg" mt={40}>
        {error && (
          <Center mb="xl">
            <Text color="red" fw={500}>
              {error}
            </Text>
          </Center>
        )}

        <Group justify="center" gap="sm" mb={40}>
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
                borderColor:
                  activeCategory === cat.value ? "transparent" : "#eaeaea",
                transition: "all 0.2s ease",
              }}
            >
              {cat.label}
            </Button>
          ))}
        </Group>

        {/* ========================================== */}
        {/* СЕТКА ПРОЕКТОВ */}
        {/* ========================================== */}
        {loading ? (
          <Grid gutter="xl">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton height={350} radius="md" />
              </Grid.Col>
            ))}
          </Grid>
        ) : filteredItems.length > 0 ? (
          <Grid gutter="xl">
            {filteredItems.map((item) => {
              const coverImage = getCoverImage(item);
              const allImages = getAllImages(item);

              return (
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={item.id}>
                  <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{
                      cursor: "pointer",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 24px rgba(27, 46, 61, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "var(--mantine-shadow-sm)";
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <Card.Section
                      style={{ position: "relative", overflow: "hidden" }}
                    >
                      <Image
                        src={coverImage}
                        height={280}
                        alt={item.title}
                        fallbackSrc="https://placehold.co/600x400?text=Изображение+не+найдено"
                        style={{ transition: "transform 0.5s ease" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />

                      {/* Бейдж категории */}
                      <Badge
                        variant="filled"
                        size="md"
                        style={{
                          position: "absolute",
                          top: 15,
                          right: 15,
                          backgroundColor: "rgba(27, 46, 61, 0.85)",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {getCategoryLabel(item.category)}
                      </Badge>

                      {/* 🔥 SENIOR ФИЧА: Если картинок больше одной, показываем счетчик */}
                      {allImages.length > 1 && (
                        <Badge
                          variant="white"
                          size="sm"
                          leftSection={<IconPhoto size={12} />}
                          style={{
                            position: "absolute",
                            bottom: 15,
                            right: 15,
                            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                            fontWeight: 700,
                            color: "#1B2E3D",
                          }}
                        >
                          +{allImages.length - 1} фото
                        </Badge>
                      )}
                    </Card.Section>

                    <Box mt="md" style={{ flexGrow: 1 }}>
                      <Title
                        order={4}
                        style={{ color: "#1B2E3D" }}
                        lineClamp={1}
                      >
                        {item.title}
                      </Title>
                      <Text size="sm" c="dimmed" mt="xs" lineClamp={2}>
                        {item.description || "Описание проекта..."}
                      </Text>
                    </Box>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        ) : (
          <Center
            style={{
              flexDirection: "column",
              padding: "80px 20px",
              textAlign: "center",
            }}
          >
            <IconPhotoOff size={80} color="#dee2e6" stroke={1.5} />
            <Title order={3} mt="md" style={{ color: "#1B2E3D" }}>
              В этом разделе пока пусто
            </Title>
            <Text c="dimmed" mt="xs" maw={400}>
              Возможно, мы еще не успели загрузить фотографии новых объектов.
              Попробуйте выбрать другую категорию.
            </Text>
            <Button
              mt="xl"
              variant="default"
              onClick={() => setActiveCategory("ALL")}
            >
              Показать все работы
            </Button>
          </Center>
        )}
      </Container>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО LIGHTBOX С ГАЛЕРЕЕЙ */}
      {/* ========================================== */}
      <Modal
        opened={opened}
        onClose={close}
        size="auto"
        centered
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.8, blur: 5 }}
        styles={{
          content: { backgroundColor: "transparent", boxShadow: "none" },
          body: { padding: 0 },
        }}
      >
        {selectedItem && (
          <Box
            style={{ position: "relative", maxWidth: "90vw", width: "1000px" }}
          >
            {/* Кнопка закрытия */}
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                zIndex: 10,
                border: "2px solid white",
              }}
              onClick={close}
            >
              <IconX size={20} />
            </ActionIcon>

            {/* Главное изображение */}
            <Image
              src={getAllImages(selectedItem)[currentImageIndex]}
              alt={selectedItem.title}
              fallbackSrc="https://placehold.co/800x600?text=Ошибка+загрузки"
              style={{
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: "12px",
                backgroundColor: "#fff",
                transition: "opacity 0.2s ease-in-out",
              }}
            />

            {/* 🔥 SENIOR ФИЧА: Миниатюры (Thumbnails), если картинок больше 1 */}
            {getAllImages(selectedItem).length > 1 && (
              <Group mt="sm" justify="center" gap="xs">
                {getAllImages(selectedItem).map((imgUrl, idx) => (
                  <Image
                    key={idx}
                    src={imgUrl}
                    w={60}
                    h={60}
                    radius="md"
                    onClick={() => setCurrentImageIndex(idx)}
                    style={{
                      objectFit: "cover",
                      cursor: "pointer",
                      border:
                        currentImageIndex === idx
                          ? "3px solid #FF8C00"
                          : "2px solid transparent",
                      opacity: currentImageIndex === idx ? 1 : 0.6,
                      transition: "all 0.2s ease",
                      backgroundColor: "white",
                    }}
                  />
                ))}
              </Group>
            )}

            {/* Блок с описанием под фото */}
            <Box
              bg="white"
              p="xl"
              mt="md"
              style={{
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <Group justify="space-between" align="flex-start" mb="xs">
                <Title order={3} style={{ color: "#1B2E3D" }}>
                  {selectedItem.title}
                </Title>
                <Badge size="lg" variant="outline" color="gray">
                  {getCategoryLabel(selectedItem.category)}
                </Badge>
              </Group>
              <Text size="md" c="dimmed" style={{ lineHeight: 1.6 }}>
                {selectedItem.description ||
                  "Детальное описание для данного проекта отсутствует."}
              </Text>
            </Box>
          </Box>
        )}
      </Modal>
    </Box>
  );
}
