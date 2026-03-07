import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Image,
  Button,
  Group,
  Center,
  Skeleton,
  Modal,
  Box,
  ActionIcon,
  Badge,
  Affix,
  Transition,
  rem,
  Alert,
} from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import {
  IconArrowLeft,
  IconZoomIn,
  IconPhotoOff,
  IconArrowUp,
  IconPhoto,
} from "@tabler/icons-react";

// 🔥 Senior Update: Импортируем метод из нового единого axios.js
import { fetchPortfolio } from "../api/axios.js";

export default function Category() {
  const { id } = useParams(); // Получаем ID категории из URL
  const navigate = useNavigate();
  const [scroll, scrollTo] = useWindowScroll();

  // ==========================================
  // СЛОВАРЬ КАТЕГОРИЙ (Метаданные для шапки)
  // ==========================================
  const categoryMeta = {
    banners: {
      title: "Баннеры",
      desc: "Примеры нашей широкоформатной и интерьерной печати.",
    },
    lightboxes: {
      title: "Лайтбоксы",
      desc: "Галерея световых коробов различной сложности.",
    },
    signboards: {
      title: "Вывески",
      desc: "Фасадные и интерьерные вывески премиум-класса.",
    },
    "3d-figures": {
      title: "Объемные фигуры",
      desc: "Реализованные проекты объемных световых и несветовых букв.",
    },
    "metal-frames": {
      title: "Металлокаркасы",
      desc: "Надежные несущие конструкции и сварные работы.",
    },
    "pos-materials": {
      title: "ПОС материалы",
      desc: "Оформление витрин, ролл-апы и промо-столы.",
    },
  };

  const currentMeta = categoryMeta[id] || {
    title: "Наши работы",
    desc: "Галерея выполненных проектов",
  };

  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Обработка ошибок для пользователей

  // Состояния для Lightbox (увеличенного просмотра с галереей)
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ==========================================
  // ЗАГРУЗКА И ФИЛЬТРАЦИЯ ПОРТФОЛИО (REAL DATA)
  // ==========================================
  useEffect(() => {
    const fetchCategoryItems = async () => {
      try {
        setLoading(true);
        setError(null);
        // Используем метод из axios.js
        const response = await fetchPortfolio();
        const allItems = response.data.data || response.data || [];

        // Фильтруем работы, оставляем только те, что относятся к текущей категории
        // Нормализуем строку (заменяем _ на - и делаем lowercase)
        const filteredItems = allItems.filter((item) => {
          const itemCat = item.category?.toLowerCase().replace("_", "-");
          return itemCat === id;
        });
        setItems(filteredItems);
      } catch (err) {
        console.error("Ошибка загрузки галереи:", err);
        setError(
          "Не удалось загрузить галерею работ. Пожалуйста, попробуйте позже.",
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryItems();
  }, [id]);

  // ==========================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ==========================================
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0); // Сбрасываем индекс при открытии новой работы
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

  return (
    <div
      style={{
        fontFamily: '"Google Sans", sans-serif',
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        paddingBottom: "80px",
      }}
    >
      {/* ========================================== */}
      {/* ПЛАВАЮЩАЯ КНОПКА "НАВЕРХ" */}
      {/* ========================================== */}
      <Affix position={{ bottom: rem(20), right: rem(20) }}>
        <Transition transition="slide-up" mounted={scroll.y > 300}>
          {(transitionStyles) => (
            <ActionIcon
              style={{
                ...transitionStyles,
                backgroundColor: "#1B2E3D",
                color: "white",
                border: "none",
                boxShadow: "0 4px 12px rgba(27, 46, 61, 0.3)",
              }}
              onClick={() => scrollTo({ y: 0 })}
              size="xl"
              radius="xl"
              aria-label="Вернуться наверх"
            >
              <IconArrowUp size={24} stroke={2} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>

      {/* ========================================== */}
      {/* ШАПКА ГАЛЕРЕИ */}
      {/* ========================================== */}
      <Box
        bg="white"
        pt={60}
        pb={40}
        style={{ borderBottom: "1px solid #eaeaea" }}
      >
        <Container size="lg">
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
            <Badge
              color="gray"
              variant="light"
              mb="sm"
              size="lg"
              style={{ color: "#1B2E3D" }}
            >
              Категория
            </Badge>
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
              {currentMeta.title}
            </Title>
            <Text c="dimmed" size="lg" ta="center" mt="md" maw={600}>
              {currentMeta.desc}
            </Text>
          </Center>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* СЕТКА ГАЛЕРЕИ */}
      {/* ========================================== */}
      {error && (
        <Container size="lg" mt="xl">
          <Alert
            icon={<IconPhotoOff size={16} />}
            title="Упс!"
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        </Container>
      )}

      <Container size="lg" mt={50}>
        {loading ? (
          <Grid gutter="xl">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton height={300} radius="md" />
              </Grid.Col>
            ))}
          </Grid>
        ) : items.length > 0 ? (
          <Grid gutter="xl">
            {items.map((item) => {
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
                        height={250}
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

                      {/* 🔥 SENIOR ФИЧА: Если картинок больше одной, показываем счетчик */}
                      {allImages.length > 1 && (
                        <Badge
                          variant="white"
                          size="sm"
                          leftSection={<IconPhoto size={12} />}
                          style={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                            fontWeight: 700,
                            color: "#1B2E3D",
                          }}
                        >
                          +{allImages.length - 1} фото
                        </Badge>
                      )}

                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          borderRadius: "50%",
                          padding: "8px",
                          display: "flex",
                        }}
                      >
                        <IconZoomIn color="white" size={20} />
                      </div>
                    </Card.Section>

                    <Box mt="md" style={{ flexGrow: 1 }}>
                      <Title
                        order={4}
                        style={{ color: "#1B2E3D" }}
                        lineClamp={1}
                      >
                        {item.title}
                      </Title>
                      <Text size="sm" c="dimmed" mt="xs" lineClamp={3}>
                        {item.description || "Описание отсутствует"}
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
            <IconPhotoOff size={60} color="#dee2e6" stroke={1.5} />
            <Title order={3} mt="md" style={{ color: "#1B2E3D" }}>
              Работы пока не добавлены
            </Title>
            <Text c="dimmed" mt="xs" maw={400}>
              В данной категории еще нет загруженных проектов. Загляните сюда
              чуть позже или перейдите в другой раздел.
            </Text>
            <Button
              mt="xl"
              variant="default"
              onClick={() => navigate("/#catalog")}
            >
              Смотреть другие услуги
            </Button>
          </Center>
        )}
      </Container>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО ДЛЯ ПРОСМОТРА КАРТИНКИ (LIGHTBOX С ГАЛЕРЕЕЙ) */}
      {/* ========================================== */}
      <Modal
        opened={!!selectedItem}
        onClose={() => setSelectedItem(null)}
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
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            {/* Главное изображение */}
            <Image
              src={getAllImages(selectedItem)[currentImageIndex]}
              alt={selectedItem.title}
              fallbackSrc="https://placehold.co/800x600?text=Ошибка+загрузки"
              style={{
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: "8px",
                transition: "opacity 0.2s ease-in-out",
              }}
            />

            {/* Галерея Thumbnails */}
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

            <div
              style={{
                position: "absolute",
                bottom: getAllImages(selectedItem).length > 1 ? 80 : 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                padding: "20px",
                borderBottomLeftRadius: "8px",
                borderBottomRightRadius: "8px",
              }}
            >
              <Title order={3} style={{ color: "white" }}>
                {selectedItem.title}
              </Title>
              {selectedItem.description && (
                <Text
                  size="sm"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                  mt="xs"
                >
                  {selectedItem.description}
                </Text>
              )}
            </div>
            <Button
              variant="filled"
              color="dark"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                borderRadius: "50%",
              }}
              w={40}
              h={40}
              p={0}
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
