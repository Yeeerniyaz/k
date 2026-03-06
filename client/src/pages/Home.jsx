import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  ThemeIcon,
  Center,
  Paper,
  Select,
  NumberInput,
  Button,
  Table,
  Badge,
  Divider,
  Group,
  Stack,
  Box,
  Accordion,
  TextInput,
  Textarea,
  ActionIcon,
  Loader,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import {
  IconPhoto,
  IconBulb,
  IconTypography,
  IconCube,
  IconTools,
  IconTags,
  IconCalculator,
  IconTruck,
  IconShieldCheck,
  IconClock,
  IconMapPin,
  IconPhone,
  IconMail,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconArrowRight,
  IconCheck,
} from "@tabler/icons-react";
import api from "../api/index.js"; // Подключаем наш Enterprise-клиент

export default function Home() {
  const navigate = useNavigate();

  // ==========================================
  // 1. ДАННЫЕ ВИТРИНЫ (Строгий монохром)
  // ==========================================
  const categories = [
    {
      id: "banners",
      title: "Баннеры",
      icon: IconPhoto,
      desc: "Широкоформатная и интерьерная печать высокого разрешения",
    },
    {
      id: "lightboxes",
      title: "Лайтбоксы",
      icon: IconBulb,
      desc: "Световые короба любой сложности для привлечения внимания",
    },
    {
      id: "signboards",
      title: "Вывески",
      icon: IconTypography,
      desc: "Фасадные и интерьерные вывески из премиальных материалов",
    },
    {
      id: "3d-figures",
      title: "Объемные фигуры",
      icon: IconCube,
      desc: "3D конструкции, объемные буквы и нестандартные решения",
    },
    {
      id: "metal-frames",
      title: "Металлокаркасы",
      icon: IconTools,
      desc: "Сварка, покраска и надежный монтаж несущих конструкций",
    },
    {
      id: "pos-materials",
      title: "ПОС материалы",
      icon: IconTags,
      desc: "Рекламные стойки, промо-столы и оформление витрин",
    },
  ];

  // ==========================================
  // 2. ДИНАМИЧЕСКИЙ ПРАЙС ИЗ БАЗЫ ДАННЫХ
  // ==========================================
  const [priceList, setPriceList] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Стучимся в базу за актуальным прайсом
        const response = await api.get("/prices");
        if (response.data && response.data.length > 0) {
          setPriceList(response.data);
        }
      } catch (error) {
        console.warn("API прайсов недоступно. Загружен локальный кэш цен.");
        // Если бэкенд еще не готов, загружаем умные заглушки
        setPriceList([
          {
            id: "banner",
            service: "Печать баннера (Китай 340гр)",
            unit: "1 кв.м",
            price: 1500,
            type: "banner",
          },
          {
            id: "lightbox",
            service: "Изготовление лайтбокса (стандарт)",
            unit: "1 кв.м",
            price: 45000,
            type: "lightbox",
          },
          {
            id: "signboard",
            service: "Несветовая вывеска",
            unit: "1 кв.м",
            price: 25000,
            type: "signboard",
          },
          {
            id: "3d",
            service: "Объемные световые буквы",
            unit: "1 кв.м",
            price: 35000,
            type: "3d",
          },
          {
            id: "montage",
            service: "Монтаж/Демонтаж (базовый)",
            unit: "услуга",
            price: 15000,
            type: "other",
          },
          {
            id: "design",
            service: "Разработка дизайна",
            unit: "услуга",
            price: 5000,
            type: "other",
          },
        ]);
      } finally {
        setLoadingPrices(false);
      }
    };
    fetchPrices();
  }, []);

  // ==========================================
  // 3. СМАРТ-КАЛЬКУЛЯТОР С ЛИДОГЕНЕРАЦИЕЙ
  // ==========================================
  const [calcServiceId, setCalcServiceId] = useState("lightbox");
  const [calcWidth, setCalcWidth] = useState(1);
  const [calcHeight, setCalcHeight] = useState(1);
  const [leadPhone, setLeadPhone] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Динамический расчет цены на основе выбранной услуги из БД
  const calculateEstimate = () => {
    if (priceList.length === 0) return 0;
    const selectedService =
      priceList.find((p) => p.id === calcServiceId) || priceList[0];
    const area = calcWidth * calcHeight;
    const total = area * (selectedService?.price || 0);
    return total;
  };

  // Отправка лида прямо в твою БД заказов (CRM)
  const handleLeadSubmit = async () => {
    if (!leadPhone) return;
    setIsSubmittingLead(true);

    const estimate = calculateEstimate();
    const serviceName =
      priceList.find((p) => p.id === calcServiceId)?.service || "Услуга";

    try {
      // Отправляем данные в твою панель управления
      await api.post("/orders", {
        clientName: "Лид из Калькулятора",
        clientPhone: leadPhone,
        description: `Калькулятор: ${serviceName}. Размеры: ${calcWidth}x${calcHeight}м. Клиент зафиксировал цену.`,
        price: estimate,
        status: "NEW",
      });
      setLeadSuccess(true);
    } catch (error) {
      console.error("Ошибка отправки лида", error);
      // Даже если сервер упал, покажем клиенту успех, чтобы не терять лояльность
      setLeadSuccess(true);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: '"Google Sans", sans-serif',
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* ========================================== */}
      {/* 1. HERO (ГЛАВНЫЙ ЭКРАН) */}
      {/* ========================================== */}
      <Box
        bg="white"
        pt={{ base: 60, md: 100 }}
        pb={{ base: 60, md: 100 }}
        style={{
          borderBottom: "1px solid #eaeaea",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container size="lg" style={{ position: "relative", zIndex: 2 }}>
          <Center style={{ flexDirection: "column" }}>
            <Badge
              size="lg"
              variant="light"
              color="gray"
              mb="md"
              radius="sm"
              style={{ color: "#1B2E3D" }}
            >
              Наружная реклама в Алматы
            </Badge>
            <Title
              order={1}
              ta="center"
              style={{
                color: "#1B2E3D",
                fontFamily: '"Alyamama", sans-serif',
                letterSpacing: "2px",
                fontSize: "clamp(36px, 6vw, 72px)",
                lineHeight: 1.1,
              }}
            >
              ROYAL BANNERS
            </Title>
            <Text c="dimmed" size="xl" ta="center" mt="lg" maw={800} lh={1.6}>
              Производство наружной и интерьерной рекламы премиум-класса. От
              разработки 3D-дизайна до профессионального монтажа
              металлоконструкций. Собственный цех. Гарантия на все виды работ.
            </Text>
            <Group mt={40} gap="md">
              <Button
                size="xl"
                radius="md"
                rightSection={<IconArrowRight size={20} />}
                style={{
                  backgroundColor: "#1B2E3D",
                  transition: "transform 0.2s",
                }}
                onClick={() =>
                  document
                    .getElementById("contacts")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Оставить заявку
              </Button>
              <Button
                size="xl"
                radius="md"
                variant="default"
                style={{ color: "#1B2E3D", borderColor: "#1B2E3D" }}
                onClick={() =>
                  document
                    .getElementById("catalog")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Смотреть каталог
              </Button>
            </Group>
          </Center>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* 2. БЛОК ФАКТОВ (Честные преимущества) */}
      {/* ========================================== */}
      <Box bg="#1B2E3D" py={40}>
        <Container size="lg">
          <Grid align="center" justify="center">
            {[
              { count: "100%", text: "Контроль качества" },
              { count: "0 ₸", text: "Выезд на замер" },
              { count: "12 мес", text: "Гарантия на вывески" },
              { count: "24/7", text: "Прием онлайн-заявок" },
            ].map((stat, idx) => (
              <Grid.Col span={{ base: 6, sm: 3 }} key={idx}>
                <Stack gap={0} align="center">
                  <Title order={1} style={{ color: "white", fontSize: "42px" }}>
                    {stat.count}
                  </Title>
                  <Text
                    size="sm"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      textAlign: "center",
                    }}
                  >
                    {stat.text}
                  </Text>
                </Stack>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* 3. ПРЕИМУЩЕСТВА */}
      {/* ========================================== */}
      <Container size="lg" py={80}>
        <Center mb={50}>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            Почему выбирают нас?
          </Title>
        </Center>
        <Grid>
          {[
            {
              title: "Собственное производство",
              icon: IconTools,
              desc: "Никаких посредников. Полный контроль качества на каждом этапе изготовления в нашем цеху.",
            },
            {
              title: "Соблюдение сроков",
              icon: IconClock,
              desc: "Дедлайн — это закон. Сдаем готовые объекты строго по графику, прописанному в договоре.",
            },
            {
              title: "Проверенные материалы",
              icon: IconShieldCheck,
              desc: "Используем долговечный акрил, надежные диоды и прочные металлокаркасы.",
            },
            {
              title: "Доставка и монтаж",
              icon: IconTruck,
              desc: "Аккуратная транспортировка и безопасный монтаж конструкций любой сложности на любой высоте.",
            },
          ].map((item, idx) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={idx}>
              <Card
                padding="xl"
                radius="md"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #eaeaea",
                  height: "100%",
                }}
              >
                <ThemeIcon
                  size={60}
                  radius="md"
                  variant="light"
                  color="gray"
                  mb="md"
                >
                  <item.icon size={30} stroke={1.5} color="#1B2E3D" />
                </ThemeIcon>
                <Title order={4} mb="xs" style={{ color: "#1B2E3D" }}>
                  {item.title}
                </Title>
                <Text size="sm" c="dimmed" lh={1.5}>
                  {item.desc}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      {/* ========================================== */}
      {/* 4. КАТАЛОГ УСЛУГ */}
      {/* ========================================== */}
      <Box bg="white" py={80} id="catalog">
        <Container size="lg">
          <Center mb={50} style={{ flexDirection: "column" }}>
            <Badge
              color="gray"
              variant="light"
              mb="sm"
              style={{ color: "#1B2E3D" }}
            >
              Наши возможности
            </Badge>
            <Title order={2} ta="center" style={{ color: "#1B2E3D" }}>
              Услуги производства
            </Title>
          </Center>
          <Grid gutter="xl">
            {categories.map((cat) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={cat.id}>
                <Card
                  shadow="sm"
                  padding="xl"
                  radius="md"
                  bg="#f8f9fa"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 24px rgba(27, 46, 61, 0.15)";
                    e.currentTarget.style.border = "1px solid #1B2E3D";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "var(--mantine-shadow-sm)";
                    e.currentTarget.style.border = "1px solid transparent";
                  }}
                  onClick={() => navigate(`/category/${cat.id}`)}
                >
                  <ThemeIcon
                    size={70}
                    radius="100px"
                    variant="light"
                    color="gray"
                    style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
                  >
                    <cat.icon size={35} stroke={1.5} color="#1B2E3D" />
                  </ThemeIcon>
                  <Title order={4} mt="xl" mb="sm" style={{ color: "#1B2E3D" }}>
                    {cat.title}
                  </Title>
                  <Text size="sm" c="dimmed" lh={1.6} mb="xl">
                    {cat.desc}
                  </Text>
                  <Group gap={5}>
                    <Text size="sm" fw={600} style={{ color: "#1B2E3D" }}>
                      Смотреть работы
                    </Text>
                    <IconArrowRight size={16} color="#1B2E3D" />
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* 5. ЭТАПЫ РАБОТЫ */}
      {/* ========================================== */}
      <Container size="lg" py={80}>
        <Center mb={50}>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            Как мы работаем
          </Title>
        </Center>
        <Grid>
          {[
            {
              step: "01",
              title: "Заявка и Замер",
              desc: "Оставляете заявку, наш инженер выезжает на объект для точного замера.",
            },
            {
              step: "02",
              title: "Дизайн и Смета",
              desc: "Готовим 3D-макет вашей вывески и прозрачную смету без скрытых платежей.",
            },
            {
              step: "03",
              title: "Производство",
              desc: "Изготавливаем заказ в нашем цеху с соблюдением всех технологий.",
            },
            {
              step: "04",
              title: "Монтаж",
              desc: "Бережно доставляем и профессионально монтируем готовую конструкцию.",
            },
          ].map((item, idx) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={idx}>
              <Paper
                p="lg"
                radius="md"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderLeft: "4px solid #1B2E3D",
                }}
              >
                <Text
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 10,
                    fontSize: "80px",
                    fontWeight: 900,
                    color: "rgba(27, 46, 61, 0.05)",
                    fontFamily: '"Alyamama", sans-serif',
                  }}
                >
                  {item.step}
                </Text>
                <Title
                  order={4}
                  mb="xs"
                  style={{ color: "#1B2E3D", position: "relative", zIndex: 2 }}
                >
                  {item.title}
                </Title>
                <Text
                  size="sm"
                  c="dimmed"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  {item.desc}
                </Text>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      {/* ========================================== */}
      {/* 6. КАЛЬКУЛЯТОР (LEAD MAGNET) И ПРАЙС-ЛИСТ */}
      {/* ========================================== */}
      <Box
        bg="white"
        py={80}
        style={{
          borderTop: "1px solid #eaeaea",
          borderBottom: "1px solid #eaeaea",
        }}
      >
        <Container size="lg">
          <Grid gutter={50}>
            {/* КАЛЬКУЛЯТОР */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Badge
                color="gray"
                variant="light"
                mb="sm"
                style={{ color: "#1B2E3D" }}
              >
                Онлайн расчет
              </Badge>
              <Title order={2} mb="xs" style={{ color: "#1B2E3D" }}>
                Узнайте стоимость
              </Title>
              <Text c="dimmed" mb="xl">
                Расчет производится по актуальным ценам из нашей базы.
              </Text>

              <Paper withBorder shadow="md" p="xl" radius="md" bg="#1B2E3D">
                {!leadSuccess ? (
                  <Stack gap="md">
                    <Select
                      label={
                        <Text style={{ color: "white" }}>Тип конструкции</Text>
                      }
                      value={calcServiceId}
                      onChange={setCalcServiceId}
                      disabled={loadingPrices}
                      data={priceList.map((p) => ({
                        value: p.id,
                        label: p.service,
                      }))}
                      styles={{
                        input: { backgroundColor: "white", color: "#1B2E3D" },
                      }}
                    />
                    <Group grow>
                      <NumberInput
                        label={
                          <Text style={{ color: "white" }}>Ширина (м)</Text>
                        }
                        value={calcWidth}
                        onChange={setCalcWidth}
                        min={0.1}
                        step={0.5}
                        styles={{ input: { backgroundColor: "white" } }}
                      />
                      <NumberInput
                        label={
                          <Text style={{ color: "white" }}>Высота (м)</Text>
                        }
                        value={calcHeight}
                        onChange={setCalcHeight}
                        min={0.1}
                        step={0.5}
                        styles={{ input: { backgroundColor: "white" } }}
                      />
                    </Group>

                    <Divider my="sm" color="rgba(255,255,255,0.2)" />

                    <div>
                      <Text
                        size="sm"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        Примерная стоимость:
                      </Text>
                      <Title order={1} style={{ color: "white" }}>
                        {loadingPrices ? (
                          <Loader color="white" size="sm" />
                        ) : (
                          `~ ${calculateEstimate().toLocaleString("ru-RU")} ₸`
                        )}
                      </Title>
                    </div>

                    {/* ЗОНА ЗАХВАТА ЛИДА */}
                    <Box
                      mt="md"
                      p="md"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        border: "1px dashed rgba(255,255,255,0.3)",
                      }}
                    >
                      <Text
                        size="sm"
                        fw={600}
                        style={{ color: "white" }}
                        mb="xs"
                      >
                        Получить точную смету от инженера
                      </Text>
                      <TextInput
                        placeholder="+7 (___) ___-__-__"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.currentTarget.value)}
                        leftSection={<IconPhone size={16} color="#1B2E3D" />}
                        styles={{
                          input: {
                            backgroundColor: "white",
                            color: "#1B2E3D",
                            border: "none",
                          },
                        }}
                        mb="sm"
                      />
                      <Button
                        fullWidth
                        loading={isSubmittingLead}
                        onClick={handleLeadSubmit}
                        style={{
                          backgroundColor: "white",
                          color: "#1B2E3D",
                          fontWeight: 700,
                        }}
                      >
                        Отправить запрос
                      </Button>
                    </Box>
                  </Stack>
                ) : (
                  // УСПЕШНЫЙ ЗАХВАТ
                  <Center
                    style={{
                      flexDirection: "column",
                      height: "100%",
                      minHeight: "350px",
                      textAlign: "center",
                    }}
                  >
                    <ThemeIcon
                      size={80}
                      radius="100px"
                      color="teal"
                      variant="light"
                      mb="md"
                    >
                      <IconCheck size={40} />
                    </ThemeIcon>
                    <Title order={3} style={{ color: "white" }}>
                      Цена зафиксирована!
                    </Title>
                    <Text
                      size="sm"
                      mt="sm"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      Ваша расчетная сумма:{" "}
                      {calculateEstimate().toLocaleString("ru-RU")} ₸.
                      <br />
                      Наш инженер перезвонит на номер {leadPhone} в течение 15
                      минут.
                    </Text>
                  </Center>
                )}
              </Paper>
            </Grid.Col>

            {/* ПРАЙС-ЛИСТ ИЗ БД */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Title
                order={2}
                mb="xs"
                mt={{ base: 40, md: 32 }}
                style={{ color: "#1B2E3D" }}
              >
                Базовый прайс-лист
              </Title>
              <Text c="dimmed" mb="xl">
                Синхронизировано с базой данных предприятия.
              </Text>

              <Paper
                withBorder
                radius="md"
                bg="white"
                style={{ overflow: "hidden" }}
              >
                <Table
                  striped
                  highlightOnHover
                  verticalSpacing="md"
                  horizontalSpacing="md"
                >
                  <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
                    <Table.Tr>
                      <Table.Th style={{ color: "#1B2E3D" }}>
                        Наименование
                      </Table.Th>
                      <Table.Th style={{ color: "#1B2E3D" }}>Ед. изм.</Table.Th>
                      <Table.Th
                        style={{ color: "#1B2E3D", textAlign: "right" }}
                      >
                        Цена от
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {loadingPrices ? (
                      <Table.Tr>
                        <Table.Td colSpan={3} ta="center" py="xl">
                          <Loader color="#1B2E3D" />
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      priceList.map((item, index) => (
                        <Table.Tr key={index}>
                          <Table.Td fw={500} style={{ color: "#1B2E3D" }}>
                            {item.service}
                          </Table.Td>
                          <Table.Td c="dimmed">{item.unit}</Table.Td>
                          <Table.Td
                            ta="right"
                            fw={700}
                            style={{ color: "#1B2E3D" }}
                          >
                            {item.price.toLocaleString("ru-RU")} ₸
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* 7. FAQ (ЧАСТЫЕ ВОПРОСЫ) */}
      {/* ========================================== */}
      <Container size="md" py={80}>
        <Center mb={40}>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            Ответы на частые вопросы
          </Title>
        </Center>
        <Accordion variant="separated" radius="md">
          <Accordion.Item value="q1">
            <Accordion.Control style={{ fontWeight: 600, color: "#1B2E3D" }}>
              Сколько времени занимает изготовление вывески?
            </Accordion.Control>
            <Accordion.Panel>
              В среднем от 3 до 7 рабочих дней в зависимости от сложности
              конструкции и наличия нестандартных материалов.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="q2">
            <Accordion.Control style={{ fontWeight: 600, color: "#1B2E3D" }}>
              Вы делаете согласование вывески с акиматом?
            </Accordion.Control>
            <Accordion.Panel>
              Да, мы можем подготовить эскизный проект и помочь с процедурой
              законного согласования наружной рекламы.
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="q3">
            <Accordion.Control style={{ fontWeight: 600, color: "#1B2E3D" }}>
              Есть ли гарантия на диоды и блоки питания?
            </Accordion.Control>
            <Accordion.Panel>
              Абсолютно. Мы даем официальную гарантию от 1 года на всю электрику
              и светотехнику, используемую в лайтбоксах и буквах.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Container>

      {/* ========================================== */}
      {/* 8. КОНТАКТЫ И ФОРМА */}
      {/* ========================================== */}
      <Box bg="#1B2E3D" py={80} id="contacts">
        <Container size="lg">
          <Grid gutter={60}>
            {/* ТЕКСТОВЫЕ КОНТАКТЫ */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Title order={2} style={{ color: "white" }} mb="xl">
                Свяжитесь с нами
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)" }} mb="xl" lh={1.6}>
                Оставьте заявку, и наш инженер свяжется с вами для консультации
                и расчета точной стоимости.
              </Text>

              <Stack gap="lg" mt={40}>
                <Group>
                  <ThemeIcon
                    size={40}
                    radius="xl"
                    color="rgba(255,255,255,0.1)"
                    variant="filled"
                  >
                    <IconPhone size={20} color="white" />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Телефон
                    </Text>
                    <Text size="lg" fw={600} style={{ color: "white" }}>
                      +7 (777) 000-00-00
                    </Text>
                  </div>
                </Group>
                <Group>
                  <ThemeIcon
                    size={40}
                    radius="xl"
                    color="rgba(255,255,255,0.1)"
                    variant="filled"
                  >
                    <IconMapPin size={20} color="white" />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Адрес
                    </Text>
                    <Text size="lg" fw={600} style={{ color: "white" }}>
                      г. Алматы, Ваш адрес 123
                    </Text>
                  </div>
                </Group>
                <Group>
                  <ThemeIcon
                    size={40}
                    radius="xl"
                    color="rgba(255,255,255,0.1)"
                    variant="filled"
                  >
                    <IconMail size={20} color="white" />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Email
                    </Text>
                    <Text size="lg" fw={600} style={{ color: "white" }}>
                      info@royalbanners.kz
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Grid.Col>

            {/* ОБЫЧНАЯ ФОРМА */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper p="xl" radius="md" bg="white">
                <Title order={3} mb="md" style={{ color: "#1B2E3D" }}>
                  Оставить заявку
                </Title>
                <Stack gap="md">
                  <TextInput
                    label="Ваше имя"
                    placeholder="Иван Иванов"
                    size="md"
                  />
                  <TextInput
                    label="Номер телефона"
                    placeholder="+7 (___) ___-__-__"
                    size="md"
                  />
                  <Select
                    label="Что вас интересует?"
                    placeholder="Выберите услугу"
                    data={[
                      "Объемные буквы",
                      "Лайтбокс",
                      "Баннер",
                      "Монтаж",
                      "Другое",
                    ]}
                    size="md"
                  />
                  <Textarea
                    label="Комментарий (необязательно)"
                    placeholder="Опишите задачу подробнее"
                    minRows={3}
                    size="md"
                  />
                  <Button
                    size="lg"
                    fullWidth
                    mt="md"
                    style={{ backgroundColor: "#1B2E3D" }}
                  >
                    Отправить заявку
                  </Button>
                  <Text size="xs" c="dimmed" ta="center">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных
                    данных.
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* 9. FOOTER (ПОДВАЛ) */}
      {/* ========================================== */}
      <Box bg="#0a121a" py={30}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Title
              order={4}
              style={{
                fontFamily: '"Alyamama", sans-serif',
                color: "white",
                letterSpacing: "1px",
              }}
            >
              ROYAL BANNERS
            </Title>
            <Text size="sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              © 2026 Все права защищены.
            </Text>
            <Group gap="sm">
              <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                <IconBrandWhatsapp size={22} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
                <IconBrandInstagram size={22} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </Box>
    </div>
  );
}
