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
        overflowX: "hidden",
        width: "100%",
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
                  href="https://wa.me/77089321854"
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
                  href="https://instagram.com/royal.banners.almaty"
                  target="_blank"
                  variant="transparent"
                  color="gray"
                  size="lg"
                >
                  <IconBrandInstagram size={24} stroke={1.5} />
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
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "white",
                                border: "1px solid rgba(255,255,255,0.2)",
                              },
                              dropdown: { backgroundColor: "white" },
                            }}
                          />

                          {availablePrices.length > 0 && (
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
                                label: `${p.service} (${p.price} ₸/${p.unit})`,
                              }))}
                              styles={{
                                input: {
                                  backgroundColor: "rgba(255,255,255,0.1)",
                                  color: "white",
                                  border: "1px solid rgba(255,255,255,0.2)",
                                },
                                dropdown: { backgroundColor: "white" },
                              }}
                            />
                          )}

                          {activeConfig?.fields.length > 0 && (
                            <Group grow>
                              {activeConfig.fields.map((f, idx) => (
                                <NumberInput
                                  key={idx}
                                  label={
                                    <Text style={{ color: "white" }}>
                                      {f.label}
                                    </Text>
                                  }
                                  min={0}
                                  value={fieldValues[f.name] || 0}
                                  onChange={(val) =>
                                    handleFieldChange(f.name, val)
                                  }
                                  styles={{
                                    input: {
                                      backgroundColor: "rgba(255,255,255,0.1)",
                                      color: "white",
                                      border: "1px solid rgba(255,255,255,0.2)",
                                    },
                                  }}
                                />
                              ))}
                            </Group>
                          )}

                          {activeConfig?.addons?.length > 0 && (
                            <Box mt="xs">
                              <Text
                                size="sm"
                                mb="xs"
                                style={{ color: "white" }}
                              >
                                Дополнительно:
                              </Text>
                              <Stack gap="xs">
                                {activeConfig.addons.map((addon) => (
                                  <Checkbox
                                    key={addon.id}
                                    label={
                                      <Text style={{ color: "white" }}>
                                        {addon.name}
                                      </Text>
                                    }
                                    color="orange"
                                    checked={selectedAddons.includes(addon.id)}
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

                          <Divider color="rgba(255,255,255,0.1)" my="sm" />

                          <Group justify="space-between" align="flex-end">
                            <Box>
                              <Text
                                size="xs"
                                tt="uppercase"
                                style={{ color: "rgba(255,255,255,0.6)" }}
                              >
                                Примерная цена
                              </Text>
                              <Text
                                size="xl"
                                fw={800}
                                style={{ color: "white" }}
                              >
                                ~{calculateEstimate().toLocaleString("ru-RU")} ₸
                              </Text>
                            </Box>
                          </Group>

                          <Paper
                            p="md"
                            radius="md"
                            bg="rgba(255,255,255,0.05)"
                            mt="sm"
                          >
                            <Text size="sm" style={{ color: "white" }} mb="xs">
                              Оставьте номер для точного расчета:
                            </Text>
                            <TextInput
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
                              Отправить смету менеджеру
                            </Button>
                          </Paper>
                        </>
                      ) : !isDbConnected ? (
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
                          <Text style={{ color: "white" }} mt="md">
                            Нет связи с сервером.
                          </Text>
                          <Text size="sm" c="dimmed">
                            Калькулятор временно недоступен.
                          </Text>
                        </Center>
                      ) : (
                        <Text style={{ color: "white" }} ta="center">
                          Калькулятор настраивается...
                        </Text>
                      )}
                    </Stack>
                  ) : (
                    <Center
                      p="xl"
                      style={{ flexDirection: "column", textAlign: "center" }}
                    >
                      <ThemeIcon
                        size={60}
                        radius="100px"
                        color="green"
                        variant="light"
                        mb="md"
                      >
                        <IconCheck size={30} />
                      </ThemeIcon>
                      <Title order={3} style={{ color: "white" }}>
                        Заявка принята!
                      </Title>
                      <Text style={{ color: "rgba(255,255,255,0.7)" }} mt="sm">
                        Мы получили ваш запрос. Менеджер свяжется с вами в
                        течение 15 минут для уточнения деталей.
                      </Text>
                      <Button
                        mt="xl"
                        variant="subtle"
                        color="gray"
                        onClick={() => setLeadSuccess(false)}
                      >
                        Рассчитать еще
                      </Button>
                    </Center>
                  )}
                </Paper>
              </Grid.Col>

              {/* ПРАЙС-ЛИСТ */}
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Title order={3} mb="lg" style={{ color: "#1B2E3D" }}>
                  Открытый прайс-лист
                </Title>
                <Paper
                  withBorder
                  radius="md"
                  p={0}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                    <Table striped highlightOnHover verticalSpacing="sm">
                      <Table.Thead
                        style={{
                          position: "sticky",
                          top: 0,
                          backgroundColor: "#f8f9fa",
                          zIndex: 1,
                        }}
                      >
                        <Table.Tr>
                          <Table.Th style={{ color: "#1B2E3D" }}>
                            Наименование
                          </Table.Th>
                          <Table.Th style={{ color: "#1B2E3D" }}>Ед.</Table.Th>
                          <Table.Th
                            style={{ color: "#1B2E3D", textAlign: "right" }}
                          >
                            Цена (от)
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {loadingData ? (
                          <Table.Tr>
                            <Table.Td colSpan={3}>
                              <Center p="xl">
                                <Loader size="sm" color="gray" />
                              </Center>
                            </Table.Td>
                          </Table.Tr>
                        ) : !isDbConnected ? (
                          <Table.Tr>
                            <Table.Td colSpan={3} align="center">
                              <Text c="dimmed" size="sm" py="md">
                                Прайс-лист загружается или временно недоступен
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : priceList.length > 0 ? (
                          priceList.map((item, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td>
                                <Text fw={500} size="sm">
                                  {item.service}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge color="gray" variant="light">
                                  {item.unit}
                                </Badge>
                              </Table.Td>
                              <Table.Td style={{ textAlign: "right" }}>
                                <Text fw={700} style={{ color: "#1B2E3D" }}>
                                  {item.price.toLocaleString("ru-RU")} ₸
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        ) : (
                          <Table.Tr>
                            <Table.Td colSpan={3} align="center">
                              <Text c="dimmed" size="sm" py="md">
                                Прайс-лист пуст
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </div>
                </Paper>
              </Grid.Col>
            </Grid>
          </Container>
        </Box>

        {/* 5. ЧАСТЫЕ ВОПРОСЫ */}
        <Container size="md" py={80}>
          <Center mb={50}>
            <Title order={2} style={{ color: "#1B2E3D" }}>
              Частые вопросы
            </Title>
          </Center>
          <Accordion
            variant="separated"
            radius="md"
            styles={{
              item: { border: "1px solid #eaeaea" },
              control: { fontWeight: 600, color: "#1B2E3D" },
            }}
          >
            {[
              {
                q: "Сколько времени занимает изготовление вывески?",
                a: "Сроки зависят от сложности проекта. Стандартные лайтбоксы и баннеры мы изготавливаем от 1 до 3 рабочих дней. Сложные объемные буквы и крышные установки — от 5 до 10 дней.",
              },
              {
                q: "Даете ли вы гарантию на работу?",
                a: "Да, мы предоставляем официальную гарантию от 1 года на все световые элементы (диоды, блоки питания) и несущие металлоконструкции.",
              },
              {
                q: "Выезжаете ли вы на замер бесплатно?",
                a: "Да, выезд инженера-замерщика по городу Алматы осуществляется абсолютно бесплатно. Специалист оценит фасад, сделает точные замеры и проконсультирует по материалам.",
              },
              {
                q: "Делаете ли вы согласование вывесок с акиматом?",
                a: "Да, наша компания может взять на себя все бюрократические вопросы по получению разрешительных документов на размещение наружной рекламы в архитектуре города.",
              },
            ].map((faq, idx) => (
              <Accordion.Item value={`faq-${idx}`} key={idx}>
                <Accordion.Control>{faq.q}</Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" c="dimmed" lh={1.6}>
                    {faq.a}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>

        {/* 6. ФОРМА КОНТАКТОВ */}
        <Box bg="#1B2E3D" py={80} id="contacts">
          <Container size="lg">
            <Grid gutter={50}>
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Title order={2} style={{ color: "white" }} mb="md">
                  Свяжитесь с нами
                </Title>
                <Text
                  style={{ color: "rgba(255,255,255,0.7)" }}
                  mb="xl"
                  lh={1.6}
                >
                  Готовы обсудить ваш проект? Оставьте заявку, и мы перезвоним
                  вам в ближайшее время для бесплатной консультации.
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
                      <Text
                        size="xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        Телефон
                      </Text>
                      <Text size="lg" fw={600} style={{ color: "white" }}>
                        +7 708 932 1854
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
                          onChange={(e) =>
                            setContactName(e.currentTarget.value)
                          }
                        />
                        <TextInput
                          type="tel"
                          label="Номер телефона"
                          placeholder="+7 (___) ___-__-__"
                          size="md"
                          required
                          value={contactPhone}
                          onChange={(e) =>
                            setContactPhone(e.currentTarget.value)
                          }
                        />
                        <Select
                          label="Что вас интересует?"
                          placeholder="Выберите услугу"
                          size="md"
                          data={categories.map((c) => ({
                            value: c.title,
                            label: c.title,
                          }))}
                          value={contactService}
                          onChange={setContactService}
                        />
                        <Textarea
                          label="Комментарий (необязательно)"
                          placeholder="Кратко опишите задачу"
                          minRows={3}
                          value={contactComment}
                          onChange={(e) =>
                            setContactComment(e.currentTarget.value)
                          }
                        />
                        <Button
                          type="submit"
                          size="lg"
                          fullWidth
                          loading={isSubmittingContact}
                          style={{
                            backgroundColor: "#1B2E3D",
                            marginTop: "10px",
                          }}
                        >
                          Отправить запрос
                        </Button>
                      </Stack>
                    </form>
                  ) : (
                    <Center
                      style={{
                        height: "100%",
                        minHeight: "400px",
                        flexDirection: "column",
                      }}
                    >
                      <ThemeIcon
                        size={80}
                        radius="100px"
                        color="green"
                        variant="light"
                        mb="xl"
                      >
                        <IconCheck size={40} />
                      </ThemeIcon>
                      <Title order={3} style={{ color: "#1B2E3D" }}>
                        Спасибо за обращение!
                      </Title>
                      <Text c="dimmed" mt="sm" ta="center">
                        Ваша заявка успешно отправлена. Наш менеджер уже изучает
                        ее и скоро свяжется с вами.
                      </Text>
                    </Center>
                  )}
                </Paper>
              </Grid.Col>
            </Grid>
          </Container>
        </Box>

        {/* 7. ФУТЕР */}
        <Box
          bg="#0f1922"
          py={40}
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Container size="lg">
            <Group justify="space-between" align="center">
              <div>
                <Title
                  order={4}
                  style={{
                    color: "white",
                    fontFamily: '"Alyamama", sans-serif',
                    letterSpacing: "1px",
                  }}
                >
                  ROYAL BANNERS
                </Title>
                <Text
                  size="xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  mt={5}
                >
                  © {new Date().getFullYear()} Все права защищены. ERP-система
                  внедрена.
                </Text>
              </div>
              <Group gap="sm">
                <ActionIcon
                  component="a"
                  href="https://instagram.com/royal.banners.almaty"
                  target="_blank"
                  variant="subtle"
                  color="gray"
                >
                  <IconBrandInstagram size={20} />
                </ActionIcon>
                <ActionIcon
                  component="a"
                  href="https://wa.me/77089321854"
                  target="_blank"
                  variant="subtle"
                  color="gray"
                >
                  <IconBrandWhatsapp size={20} />
                </ActionIcon>
              </Group>
            </Group>
          </Container>
        </Box>
      </Container>
    </div>
  );
}
