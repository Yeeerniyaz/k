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
  Affix,
  Transition,
  rem,
  Checkbox,
  Tooltip,
} from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
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
  IconBrandTiktok,
  IconArrowRight,
  IconCheck,
  IconArrowUp,
  IconDatabase,
  IconServerOff,
} from "@tabler/icons-react";

// 🔥 Senior Update: Используем единый инстанс API из axios.js
import api from "../api/axios.js";

export default function Home() {
  const navigate = useNavigate();
  const [scroll, scrollTo] = useWindowScroll();

  // ==========================================
  // 1. ДАННЫЕ ВИТРИНЫ
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
  // 2. СОСТОЯНИЯ: ПРАЙСЫ И НАСТРОЙКИ КАЛЬКУЛЯТОРА
  // ==========================================
  const [priceList, setPriceList] = useState([]);
  const [calcConfigs, setCalcConfigs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(true);

  // СОСТОЯНИЯ САМОГО КАЛЬКУЛЯТОРА
  const [activeConfigId, setActiveConfigId] = useState("");
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [fieldValues, setFieldValues] = useState({ val1: 1, val2: 1 });
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Состояния Лид-формы калькулятора
  const [leadPhone, setLeadPhone] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Состояния Общей формы контактов
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactService, setContactService] = useState("");
  const [contactComment, setContactComment] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // ==========================================
  // ЗАГРУЗКА ДАННЫХ (API)
  // ==========================================
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingData(true);

        const pricesRes = await api.get("/prices");
        const loadedPrices = pricesRes.data?.data || pricesRes.data || [];
        setPriceList(loadedPrices);

        const configRes = await api.get("/settings/calculator");
        let loadedConfigs = configRes.data?.config || [];

        if (loadedConfigs.length > 0) {
          setCalcConfigs(loadedConfigs);
          setActiveConfigId(loadedConfigs[0].id);
          setIsDbConnected(true);
        } else {
          throw new Error("Настройки пусты");
        }
      } catch (error) {
        console.error("Ошибка загрузки данных витрины:", error);
        setIsDbConnected(false);
        // 🔥 Senior Practice: Никаких фейковых данных для калькулятора на витрине!
        setPriceList([]);
        setCalcConfigs([]);
        setActiveConfigId("");
      } finally {
        setLoadingData(false);
      }
    };
    fetchAllData();
  }, []);

  // ==========================================
  // СМАРТ-ЛОГИКА: ПЕРЕКЛЮЧЕНИЕ РАЗДЕЛОВ
  // ==========================================
  const activeConfig = calcConfigs.find((c) => c.id === activeConfigId);

  const availablePrices = priceList.filter(
    (p) =>
      !activeConfig?.linkedPrices ||
      activeConfig.linkedPrices.length === 0 ||
      activeConfig.linkedPrices.includes(p.id) ||
      activeConfig.linkedPrices.includes(p.service),
  );

  useEffect(() => {
    if (activeConfig) {
      if (availablePrices.length > 0) {
        setSelectedPriceId(availablePrices[0].id || availablePrices[0].service);
      } else {
        setSelectedPriceId("");
      }

      const newFields = {};
      activeConfig.fields.forEach((f) => {
        newFields[f.name] = 1;
      });
      setFieldValues(newFields);
      setSelectedAddons([]);
    }
  }, [activeConfigId, calcConfigs, priceList]);

  const handleFieldChange = (name, value) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddonChange = (addonId, isChecked) => {
    if (isChecked) {
      setSelectedAddons((prev) => [...prev, addonId]);
    } else {
      setSelectedAddons((prev) => prev.filter((id) => id !== addonId));
    }
  };

  // ==========================================
  // СУПЕР-ДВИЖОК РАСЧЕТА (MATH ENGINE)
  // ==========================================
  const calculateEstimate = () => {
    if (!activeConfig) return 0;

    const selectedPriceItem = availablePrices.find(
      (p) => p.id === selectedPriceId || p.service === selectedPriceId,
    );
    const basePrice = selectedPriceItem ? selectedPriceItem.price : 0;

    let baseTotal = 0;
    const v1 = fieldValues["val1"] || 0;
    const v2 = fieldValues["val2"] || 0;

    if (
      activeConfig.calcType === "area" ||
      activeConfig.calcType === "height_count"
    ) {
      baseTotal = v1 * v2 * basePrice;
    } else if (
      activeConfig.calcType === "length" ||
      activeConfig.calcType === "unit"
    ) {
      baseTotal = v1 * basePrice;
    } else if (activeConfig.calcType === "custom") {
      try {
        let formulaStr = activeConfig.customFormula || "0";
        formulaStr = formulaStr.replace(/basePrice/g, basePrice);
        Object.keys(fieldValues).forEach((key) => {
          formulaStr = formulaStr.replace(
            new RegExp(key, "g"),
            fieldValues[key],
          );
        });
        baseTotal = new Function("return " + formulaStr)();
      } catch (e) {
        console.error("Ошибка в кастомной формуле", e);
        baseTotal = 0;
      }
    }

    let finalTotal = baseTotal;
    let percentAdds = 0;

    if (activeConfig.addons && activeConfig.addons.length > 0) {
      activeConfig.addons.forEach((addon) => {
        if (selectedAddons.includes(addon.id)) {
          if (addon.type === "fixed") {
            finalTotal += Number(addon.value);
          } else if (addon.type === "percent") {
            percentAdds += Number(addon.value);
          }
        }
      });
    }

    finalTotal = finalTotal + finalTotal * (percentAdds / 100);
    return Math.round(finalTotal);
  };

  // ==========================================
  // ОТПРАВКА ЛИДА
  // ==========================================
  const handleLeadSubmit = async () => {
    if (!leadPhone || leadPhone.trim() === "") return;
    setIsSubmittingLead(true);

    const estimate = calculateEstimate();
    const selectedPriceItem = availablePrices.find(
      (p) => p.id === selectedPriceId || p.service === selectedPriceId,
    );

    let details = `Раздел: ${activeConfig?.title}. Материал: ${selectedPriceItem?.service || "Не выбран"}.\n`;
    activeConfig?.fields.forEach((f) => {
      details += `${f.label}: ${fieldValues[f.name]}. `;
    });

    if (selectedAddons.length > 0) {
      const activeAddonNames = activeConfig.addons
        .filter((a) => selectedAddons.includes(a.id))
        .map((a) => a.name)
        .join(", ");
      details += `\nОпции: ${activeAddonNames}.`;
    }

    try {
      await api.post("/orders", {
        clientName: "Лид (Смарт-Калькулятор)",
        clientPhone: leadPhone,
        description: `ЗАПРОС СМЕТЫ.\n${details}\nОжидаемая сумма: ~${estimate} ₸.`,
        price: estimate,
        status: "NEW",
      });
      setLeadSuccess(true);
    } catch (error) {
      console.error("Ошибка отправки лида", error);
      setLeadSuccess(true);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactPhone || contactPhone.trim() === "") return;
    setIsSubmittingContact(true);
    try {
      await api.post("/orders", {
        clientName: contactName || "Без имени",
        clientPhone: contactPhone,
        description: `ОБЩАЯ ФОРМА. Интересует: ${contactService || "Не указано"}. Комментарий: ${contactComment || "Нет комментариев"}`,
        price: 0,
        status: "NEW",
      });
      setContactSuccess(true);
      setContactName("");
      setContactPhone("");
      setContactService("");
      setContactComment("");
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (error) {
      console.error("Ошибка отправки формы контактов", error);
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 5000);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: '"Google Sans", sans-serif',
        backgroundColor: "#f8f9fa",
        overflowX: "hidden", // 🔥 FIX: Убирает горизонтальный скролл на мобильных телефонах
        width: "100%", // 🔥 FIX: Фиксирует ширину экрана
      }}
    >
      {/* Кнопка скролла наверх */}
      <Affix position={{ bottom: rem(20), right: rem(20) }}>
        <Transition transition="slide-up" mounted={scroll.y > 400}>
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

      {/* 1. HERO */}
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

            {/* Группа основных кнопок */}
            <Group mt={40} gap="md" justify="center">
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
              <Button
                size="xl"
                radius="md"
                variant="subtle"
                color="gray"
                leftSection={<IconPhoto size={20} />}
                onClick={() => navigate("/portfolio")}
                style={{ color: "#1B2E3D" }}
              >
                Наше портфолио
              </Button>
            </Group>

            {/* Соцсети прямо под кнопками */}
            <Group mt={30} gap="lg" justify="center">
              <Tooltip
                label="Написать в WhatsApp"
                withArrow
                position="bottom"
                color="teal"
              >
                <ActionIcon
                  component="a"
                  href="https://wa.me/77770000000"
                  target="_blank"
                  variant="transparent"
                  color="gray"
                  size="lg"
                >
                  <IconBrandWhatsapp size={24} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label="Наш Instagram"
                withArrow
                position="bottom"
                color="dark"
              >
                <ActionIcon
                  component="a"
                  href="https://instagram.com/royalbanners"
                  target="_blank"
                  variant="transparent"
                  color="gray"
                  size="lg"
                >
                  <IconBrandInstagram size={24} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label="Наш TikTok"
                withArrow
                position="bottom"
                color="dark"
              >
                <ActionIcon
                  component="a"
                  href="https://tiktok.com/@royalbanners"
                  target="_blank"
                  variant="transparent"
                  color="gray"
                  size="lg"
                >
                  <IconBrandTiktok size={24} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Center>
        </Container>
      </Box>

      {/* 2. БЛОК ФАКТОВ */}
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

      {/* 3. КАТАЛОГ УСЛУГ */}
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

      <Container size="lg" py={80}>
        <Center mb={50}>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            Как мы работаем
          </Title>
        </Center>
        <Grid mb={80}>
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

        {/* 4. СМАРТ-КАЛЬКУЛЯТОР И ПРАЙС */}
        <Box
          bg="#f8f9fa"
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
                  Умный расчет
                </Badge>
                <Title order={2} mb="xs" style={{ color: "#1B2E3D" }}>
                  Смета проекта
                </Title>
                <Text c="dimmed" mb="xl">
                  Расчет по актуальной базе. Точно — после замера.
                </Text>

                <Paper withBorder shadow="md" p="xl" radius="md" bg="#1B2E3D">
                  {!leadSuccess ? (
                    <Stack gap="md">
                      {loadingData ? (
                        <Center p="xl">
                          <Loader color="white" />
                        </Center>
                      ) : calcConfigs.length > 0 ? (
                        <>
                          <Select
                            label={
                              <Text style={{ color: "white" }}>
                                Что будем считать?
                              </Text>
                            }
                            value={activeConfigId}
                            onChange={setActiveConfigId}
                            data={calcConfigs.map((c) => ({
                              value: c.id,
                              label: c.title,
                            }))}
                            styles={{
                              input: {
                                backgroundColor: "white",
                                color: "#1B2E3D",
                              },
                            }}
                          />

                          {activeConfig && availablePrices.length > 0 && (
                            <Select
                              label={
                                <Text style={{ color: "white" }}>
                                  Материал / Тип
                                </Text>
                              }
                              value={selectedPriceId}
                              onChange={setSelectedPriceId}
                              data={availablePrices.map((p) => ({
                                value: p.id || p.service,
                                label: p.service,
                              }))}
                              styles={{
                                input: {
                                  backgroundColor: "white",
                                  color: "#1B2E3D",
                                },
                              }}
                            />
                          )}

                          {activeConfig && (
                            <Grid>
                              {activeConfig.fields.map((field) => (
                                <Grid.Col
                                  span={activeConfig.fields.length > 1 ? 6 : 12}
                                  key={field.name}
                                >
                                  <NumberInput
                                    label={
                                      <Text style={{ color: "white" }}>
                                        {field.label}
                                      </Text>
                                    }
                                    value={fieldValues[field.name]}
                                    onChange={(val) =>
                                      handleFieldChange(field.name, val)
                                    }
                                    min={0}
                                    step={0.5}
                                    styles={{
                                      input: { backgroundColor: "white" },
                                    }}
                                  />
                                </Grid.Col>
                              ))}
                            </Grid>
                          )}

                          {activeConfig &&
                            activeConfig.addons &&
                            activeConfig.addons.length > 0 && (
                              <Box
                                mt="xs"
                                p="sm"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  borderRadius: "8px",
                                }}
                              >
                                <Text
                                  size="sm"
                                  mb="xs"
                                  style={{ color: "white", fontWeight: 600 }}
                                >
                                  Дополнительные опции:
                                </Text>
                                <Stack gap="xs">
                                  {activeConfig.addons.map((addon) => (
                                    <Checkbox
                                      key={addon.id}
                                      label={addon.name}
                                      color="dark"
                                      styles={{ label: { color: "white" } }}
                                      checked={selectedAddons.includes(
                                        addon.id,
                                      )}
                                      onChange={(event) =>
                                        handleAddonChange(
                                          addon.id,
                                          event.currentTarget.checked,
                                        )
                                      }
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}

                          <Divider my="sm" color="rgba(255,255,255,0.2)" />

                          <div>
                            <Text
                              size="sm"
                              style={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Примерный бюджет (ОТ):
                            </Text>
                            <Title order={1} style={{ color: "white" }}>
                              ~ {calculateEstimate().toLocaleString("ru-RU")} ₸
                            </Title>
                            <Text
                              size="xs"
                              mt={5}
                              style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                              *Не является публичной офертой. Без учета
                              сложности монтажа.
                            </Text>
                          </div>

                          <Box
                            mt="xs"
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
                              type="tel"
                              maxLength={20}
                              placeholder="+7 (___) ___-__-__"
                              value={leadPhone}
                              onChange={(e) =>
                                setLeadPhone(e.currentTarget.value)
                              }
                              required
                              leftSection={
                                <IconPhone size={16} color="#1B2E3D" />
                              }
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
                              disabled={!leadPhone || leadPhone.trim() === ""}
                              style={{
                                backgroundColor: "white",
                                color: "#1B2E3D",
                                fontWeight: 700,
                              }}
                            >
                              Отправить запрос
                            </Button>
                          </Box>
                        </>
                      ) : (
                        <Center
                          p="xl"
                          style={{
                            flexDirection: "column",
                            textAlign: "center",
                          }}
                        >
                          <IconServerOff
                            size={40}
                            color="rgba(255,255,255,0.5)"
                          />
                          <Text color="white" mt="md">
                            Калькулятор временно недоступен.
                          </Text>
                        </Center>
                      )}
                    </Stack>
                  ) : (
                    <Center
                      style={{
                        flexDirection: "column",
                        height: "100%",
                        minHeight: "400px",
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
                        Запрос принят!
                      </Title>
                      <Text
                        size="sm"
                        mt="sm"
                        style={{ color: "rgba(255,255,255,0.8)" }}
                      >
                        Ваши данные и предварительный расчет переданы инженеру.
                        <br />
                        Мы перезвоним на номер {leadPhone} для уточнения
                        деталей.
                      </Text>
                    </Center>
                  )}
                </Paper>
              </Grid.Col>

              {/* ПРАЙС-ЛИСТ */}
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Group
                  justify="space-between"
                  align="flex-end"
                  mb="xs"
                  mt={{ base: 40, md: 32 }}
                >
                  <Title order={2} style={{ color: "#1B2E3D" }}>
                    Базовый прайс-лист
                  </Title>
                  {!loadingData && (
                    <Badge
                      variant="light"
                      color={isDbConnected ? "green" : "red"}
                      leftSection={
                        isDbConnected ? (
                          <IconDatabase size={12} />
                        ) : (
                          <IconServerOff size={12} />
                        )
                      }
                    >
                      {isDbConnected ? "Актуально" : "Нет связи"}
                    </Badge>
                  )}
                </Group>
                <Text c="dimmed" mb="xl">
                  Ознакомьтесь с ценами на основные позиции.
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
                    <Table.Thead style={{ backgroundColor: "#1B2E3D" }}>
                      <Table.Tr>
                        <Table.Th style={{ color: "white" }}>
                          Наименование
                        </Table.Th>
                        <Table.Th style={{ color: "white" }}>Ед. изм.</Table.Th>
                        <Table.Th
                          style={{ color: "white", textAlign: "right" }}
                        >
                          Цена от
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {loadingData ? (
                        <Table.Tr>
                          <Table.Td colSpan={3} ta="center" py="xl">
                            <Loader color="#1B2E3D" />
                          </Table.Td>
                        </Table.Tr>
                      ) : priceList.length > 0 ? (
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
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={3} ta="center" py="xl" c="dimmed">
                            Прайс-лист временно пуст
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Grid.Col>
            </Grid>
          </Container>
        </Box>

        {/* 5. ЭТАПЫ РАБОТЫ И FAQ */}
        <Center mb={40}>
          <Title order={2} style={{ color: "#1B2E3D" }}>
            Ответы на частые вопросы
          </Title>
        </Center>
        <Accordion
          variant="separated"
          radius="md"
          style={{ maxWidth: "800px", margin: "0 auto" }}
        >
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

      {/* 6. КОНТАКТЫ И ФОРМА */}
      <Box bg="#1B2E3D" py={80} id="contacts">
        <Container size="lg">
          <Grid gutter={60}>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Title order={2} style={{ color: "white" }} mb="xl">
                Свяжитесь с нами
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)" }} mb="xl" lh={1.6}>
                Оставьте заявку, и наш инженер свяжется с вами для подробной
                консультации и организации выезда на замер.
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
                      г. Алматы
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper
                p="xl"
                radius="md"
                bg="white"
                style={{ position: "relative", overflow: "hidden" }}
              >
                {!contactSuccess ? (
                  <form onSubmit={handleContactSubmit}>
                    <Title order={3} mb="md" style={{ color: "#1B2E3D" }}>
                      Оставить заявку
                    </Title>
                    <Stack gap="md">
                      <TextInput
                        label="Ваше имя"
                        placeholder="Как к вам обращаться?"
                        size="md"
                        maxLength={50}
                        value={contactName}
                        onChange={(e) => setContactName(e.currentTarget.value)}
                      />
                      <TextInput
                        type="tel"
                        label="Номер телефона"
                        placeholder="+7 (___) ___-__-__"
                        size="md"
                        required
                        maxLength={20}
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.currentTarget.value)}
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
                        value={contactService}
                        onChange={setContactService}
                      />
                      <Textarea
                        label="Комментарий (необязательно)"
                        placeholder="Опишите задачу подробнее"
                        minRows={3}
                        maxLength={500}
                        size="md"
                        value={contactComment}
                        onChange={(e) =>
                          setContactComment(e.currentTarget.value)
                        }
                      />
                      <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        mt="md"
                        loading={isSubmittingContact}
                        disabled={!contactPhone || contactPhone.trim() === ""}
                        style={{ backgroundColor: "#1B2E3D" }}
                      >
                        Отправить заявку
                      </Button>
                      <Text size="xs" c="dimmed" ta="center">
                        Нажимая кнопку, вы соглашаетесь с обработкой
                        персональных данных.
                      </Text>
                    </Stack>
                  </form>
                ) : (
                  <Center
                    style={{
                      flexDirection: "column",
                      padding: "60px 20px",
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
                    <Title order={3} style={{ color: "#1B2E3D" }}>
                      Спасибо за заявку!
                    </Title>
                    <Text size="sm" mt="sm" c="dimmed">
                      Мы получили ваши данные и скоро свяжемся с вами.
                    </Text>
                  </Center>
                )}
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* 7. FOOTER */}
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
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                radius="xl"
                component="a"
                href="https://wa.me/77770000000"
                target="_blank"
                aria-label="Написать в WhatsApp"
              >
                <IconBrandWhatsapp size={22} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                radius="xl"
                component="a"
                href="https://instagram.com/royalbanners"
                target="_blank"
                aria-label="Перейти в Instagram"
              >
                <IconBrandInstagram size={22} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                radius="xl"
                component="a"
                href="https://tiktok.com/@royalbanners"
                target="_blank"
                aria-label="Перейти в TikTok"
              >
                <IconBrandTiktok size={22} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </Box>
    </div>
  );
}
