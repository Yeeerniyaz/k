import { useState, useEffect, useCallback } from "react";
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
} from "@mantine/core";
import {
  IconPhotoOff,
  IconX,
  IconArrowLeft,
  IconPhoto,
  IconZoomIn,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import { fetchPortfolio as apiFetchPortfolio } from "../api/axios.js";

export default function PublicPortfolio() {
  const navigate = useNavigate();

  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState("ALL");

  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
  // БИЗНЕС-ЛОГИКА
  // ==========================================
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetchPortfolio();
      
      const data = response.data?.data || response.data || [];
      setItems(data);
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
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (СЕНЬОР-ФИКС)
  // ==========================================
  const getCategoryLabel = (val) => {
    const cat = categories.find(
      (c) => c.value === val || c.value.replace("-", "_").toUpperCase() === val,
    );
    return cat ? cat.label : val;
  };

  // 🔥 SENIOR FIX: Жесткая санитария URL для мобильных браузеров
  const getSafeUrl = (url) => {
    if (!url) return null;
    let safeUrl = url.replace('http://', 'https://'); // Решает проблему Mixed Content
    
    // БРОНЕЖИЛЕТ ДЛЯ IPHONE: Заставляем Cloudinary отдать универсальный JPG вместо WebP
    if (safeUrl.includes('f_auto')) {
      safeUrl = safeUrl.replace('f_auto', 'f_jpg');
    }
    return safeUrl;
  };

  const getCoverImage = (item) => {
    if (item.imageUrls && item.imageUrls.length > 0) return getSafeUrl(item.imageUrls[0]);
    if (item.imageUrl) return getSafeUrl(item.imageUrl);
    return null;
  };

  const getAllImages = (item) => {
    if (!item) return [];
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls.map(getSafeUrl);
    if (item.imageUrl) return [getSafeUrl(item.imageUrl)];
    return [];
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
  };

  const closeLightbox = () => {
    setSelectedItem(null);
  };

  const lightboxImages = getAllImages(selectedItem);

  const handleNext = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === lightboxImages.length - 1 ? 0 : prev + 1,
    );
  }, [lightboxImages.length]);

  const handlePrev = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? lightboxImages.length - 1 : prev - 1,
    );
  }, [lightboxImages.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedItem) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, handleNext, handlePrev]);

  const filteredItems = items
    .filter((item) => {
      if (activeCategory === "ALL") return true;
      const itemCat = item.category?.toLowerCase().replace("_", "-");
      return itemCat === activeCategory;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return (
    <Box
      bg="#f8f9fa"
      style={{
        minHeight: "100vh",
        paddingBottom: "80px",
        fontFamily: '"Google Sans", sans-serif',
      }}
    >
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
                      style={{ position: "relative", overflow: "hidden", height: 280 }}
                    >
                      {/* 🔥 SENIOR FIX: referrerPolicy для обхода защит iPhone (ITP) */}
                      <img
                        src={coverImage || "https://placehold.co/600x400?text=Нет+фото"}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "https://placehold.co/600x400?text=Ошибка+загрузки";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.5s ease",
                          backgroundColor: "#f1f3f5"
                        }}
                      />

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

                      <div
                        style={{
                          position: "absolute",
                          top: 15,
                          left: 15,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          borderRadius: "50%",
                          padding: "8px",
                          display: "flex",
                        }}
                      >
                        <IconZoomIn color="white" size={20} />
                      </div>

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

      <Modal
        opened={!!selectedItem}
        onClose={closeLightbox}
        fullScreen
        withCloseButton={false}
        transitionProps={{ transition: "fade", duration: 250 }}
        styles={{
          inner: { padding: 0 },
          content: { backgroundColor: "#0f0f0f", color: "white" },
          body: {
            height: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            padding: 0,
          },
        }}
      >
        {selectedItem && (
          <>
            <Group
              justify="space-between"
              align="flex-start"
              p="md"
              style={{ flexShrink: 0 }}
            >
              <Box style={{ maxWidth: "80%" }}>
                <Title order={3} style={{ color: "white" }} lineClamp={1}>
                  {selectedItem.title}
                </Title>
                <Text size="sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {getCategoryLabel(selectedItem.category)}
                </Text>
                {selectedItem.description && (
                  <Text
                    size="sm"
                    mt={5}
                    style={{ color: "rgba(255,255,255,0.9)" }}
                    lineClamp={2}
                  >
                    {selectedItem.description}
                  </Text>
                )}
              </Box>
              <ActionIcon
                onClick={closeLightbox}
                size="xl"
                variant="transparent"
                style={{ color: "white" }}
              >
                <IconX size={32} />
              </ActionIcon>
            </Group>

            <Box
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                padding: "0 16px",
              }}
            >
              {lightboxImages.length > 1 && (
                <ActionIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  size="xl"
                  variant="transparent"
                  style={{
                    position: "absolute",
                    left: 10,
                    zIndex: 10,
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: "50%",
                  }}
                >
                  <IconChevronLeft size={40} />
                </ActionIcon>
              )}

              {/* 🔥 SENIOR FIX: Добавлена политика реферрера для обхода блокировок */}
              <img
                src={lightboxImages[currentImageIndex]}
                alt={selectedItem.title}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/800x600?text=Ошибка+загрузки";
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "75vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />

              {lightboxImages.length > 1 && (
                <ActionIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  size="xl"
                  variant="transparent"
                  style={{
                    position: "absolute",
                    right: 10,
                    zIndex: 10,
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: "50%",
                  }}
                >
                  <IconChevronRight size={40} />
                </ActionIcon>
              )}
            </Box>

            {lightboxImages.length > 1 && (
              <Box
                style={{
                  flexShrink: 0,
                  padding: "16px",
                  overflowX: "auto",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Group gap="sm" style={{ flexWrap: "nowrap" }}>
                  {lightboxImages.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onClick={() => setCurrentImageIndex(idx)}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        objectFit: "cover",
                        cursor: "pointer",
                        border:
                          currentImageIndex === idx
                            ? "2px solid #FF8C00"
                            : "2px solid transparent",
                        opacity: currentImageIndex === idx ? 1 : 0.5,
                        transition: "all 0.2s ease",
                      }}
                      alt="Thumbnail"
                    />
                  ))}
                </Group>
              </Box>
            )}
          </>
        )}
      </Modal>
    </Box>
  );
}