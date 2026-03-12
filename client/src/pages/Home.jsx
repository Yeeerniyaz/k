import { useState, useEffect, useRef } from "react";
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
  IconArrowRight,
  IconCheck,
  IconArrowUp,
  IconPhone,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconClock,
  IconServerOff,
} from "@tabler/icons-react";
import { motion, useMotionValue, useTransform } from "framer-motion"; // 🔥 Подключили библиотеку для 3D анимаций

import api from "../api/axios.js";

// ==========================================
// ИНТЕРАКТИВНЫЙ 3D-ЭЛЕМЕНТ НА FRAMER MOTION
// ==========================================
const HeroIllustration = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Вычисляем углы наклона в зависимости от положения мыши
  const rotateX = useTransform(y, [-300, 300], [20, -20]);
  const rotateY = useTransform(x, [-300, 300], [-20, 20]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Box
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "100%",
        height: 450,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        perspective: 1200, // Глубина сцены
        cursor: "pointer",
      }}
    >
      <motion.div
        style={{
          width: 280,
          height: 380,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          position: "relative",
        }}
        // Плавное парение вверх-вниз по умолчанию
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      >
        {/* Глубокая тень/свечение позади конструкции */}
        <Box
          style={{
            position: "absolute",
            inset: -30,
            background: "radial-gradient(circle, rgba(27, 46, 61, 0.3) 0%, transparent 70%)",
            transform: "translateZ(-80px)",
            filter: "blur(20px)",
            borderRadius: "50%"
          }}
        />

        {/* Главный объемный щит (Лайтбокс) */}
        <Paper
          radius="xl"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #1B2E3D 0%, #0A121A 100%)",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 30px 60px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateZ(0px)",
            overflow: "hidden"
          }}
        >
          {/* Стеклянный блик (Glassmorphism) */}
          <Box 
            style={{ 
              position: 'absolute', 
              top: '-50%', left: '-50%', width: '200%', height: '200%', 
              background: 'linear-gradient(to bottom right, rgba(255,255,255,0.15) 0%, transparent 40%)', 
              transform: 'rotate(30deg)', pointerEvents: 'none' 
            }} 
          />

          <motion.img
            src="/assets/logo.svg"
            alt="Logo"
            // Логотип выпирает на 50px вперед
            style={{ width: 90, height: 90, transform: "translateZ(50px)", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.5))" }}
          />
          <Title
            order={3}
            mt="xl"
            style={{
              color: "white",
              letterSpacing: "3px",
              fontFamily: '"Alyamama", sans-serif',
              transform: "translateZ(40px)", // Текст выпирает на 40px
              textShadow: "0 10px 15px rgba(0,0,0,0.5)"
            }}
          >
            ROYAL BANNERS
          </Title>
          <Badge 
            color="gray" 
            variant="outline" 
            mt="md" 
            style={{ transform: "translateZ(30px)", borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
          >
            3D ПРОЕКЦИЯ
          </Badge>
        </Paper>

        {/* Парящий элемент 1 (Символ 3D-букв) */}
        <motion.div
          style={{ position: "absolute", top: -20, right: -40, transform: "translateZ(90px)" }}
          animate={{ y: [0, 15, 0], rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <ThemeIcon size={70} radius="xl" color="gray" variant="filled" style={{ backgroundColor: "#2C485E", boxShadow: "0 15px 30px rgba(0,0,0,0.4)" }}>
            <IconCube size={35} color="white" />
          </ThemeIcon>
        </motion.div>

        {/* Парящий элемент 2 (Символ Лайтбоксов) */}
        <motion.div
          style={{ position: "absolute", bottom: 30, left: -50, transform: "translateZ(110px)" }}
          animate={{ y: [0, -20, 0], rotate: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        >
          <ThemeIcon size={80} radius="xl" color="dark" variant="outline" style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderWidth: 2, borderColor: "#1B2E3D", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <IconBulb size={40} color="#1B2E3D" />
          </ThemeIcon>
        </motion.div>

        {/* Парящий элемент 3 (Символ Монтажа) - Спрятан слегка позади */}
        <motion.div
          style={{ position: "absolute", top: 120, left: -30, transform: "translateZ(-40px)" }}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        >
          <ThemeIcon size={50} radius="md" color="gray" variant="light" style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
            <IconTools size={25} color="#1B2E3D" />
          </ThemeIcon>
        </motion.div>

      </motion.div>
    </Box>
  );
};

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

  const [activeConfigId, setActiveConfigId] = useState("");
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [fieldValues, setFieldValues] = useState({ val1: 1, val2: 1 });
  const [selectedAddons, setSelectedAddons] = useState([]);

  const [leadPhone, setLeadPhone] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactService, setContactService] = useState("");
  const [contactComment, setContactComment] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // ==========================================
  // ЗАГРУЗКА ДАННЫХ
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
        backgroundColor: "#FFFFFF",
        overflowX: "hidden",
        width: "100%",
        color: "#1B2E3D",
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
                boxShadow: "0 8px 20px rgba(27, 46, 61, 0.4)",
              }}
              onClick={() => scrollTo({ y: 0 })}
              size="xl"
              radius="xl"
              aria-label="Вернуться наверх"
            >
              <IconArrowUp size={24} stroke={2.5} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>

      {/* 1. HERO СЕКЦИЯ */}
      <Box
        pt={{ base: 20, md: 40 }}
        pb={{ base: 60, md: 100 }}
        style={{
          background: "linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%)",
          position: "relative",
        }}
      >
        <Container size="lg">
          {/* HEADER */}
          <Group justify="space-between" align="center" mb={{ base: 60, md: 100 }}>
            <Group gap="sm" style={{ cursor: "pointer" }} onClick={() => scrollTo({ y: 0 })}>
              <ThemeIcon size={56} radius="lg" style={{ backgroundColor: "#1B2E3D" }}>
                <img 
                  src="/assets/logo.svg" 
                  alt="Royal Banners Logo" 
                  style={{ width: "32px", height: "32px", objectFit: "contain" }} 
                />
              </ThemeIcon>
              <Stack gap={0}>
                <Title
                  order={3}
                  style={{
                    fontFamily: '"Alyamama", sans-serif',
                    color: "#1B2E3D",
                    letterSpacing: "1.5px",
                    lineHeight: 1.2,
                    fontSize: "24px"
                  }}
                >
                  ROYAL BANNERS
                </Title>
                <Text size="xs" fw={700} c="dimmed" style={{ letterSpacing: "1px" }}>
                  НАРУЖНАЯ РЕКЛАМА
                </Text>
              </Stack>
            </Group>

            <Group gap="lg">
              <Stack gap={0} align="flex-end" visibleFrom="sm">
                <Text fw={800} size="xl" style={{ color: "#1B2E3D", lineHeight: 1 }}>
                  +7 708 932 1854
                </Text>
                <Text size="sm" c="dimmed" fw={600}>
                  Звоните, мы на связи
                </Text>
              </Stack>
              <Button
                component="a"
                href="https://wa.me/77089321854"
                target="_blank"
                size="md"
                radius="xl"
                style={{ backgroundColor: "#1B2E3D" }}
                leftSection={<IconBrandWhatsapp size={20} />}
                visibleFrom="xs"
              >
                Написать
              </Button>
              <ActionIcon
                size={50}
                radius="xl"
                variant="filled"
                style={{ backgroundColor: "#1B2E3D" }}
                component="a"
                href="https://wa.me/77089321854"
                target="_blank"
                hiddenFrom="xs"
              >
                <IconBrandWhatsapp size={26} />
              </ActionIcon>
            </Group>
          </Group>

          {/* MAIN HERO CONTENT - 50/50 LAYOUT */}
          <Grid align="center" gutter={60} mb={{ base: 60, md: 100 }}>
            {/* ЛЕВАЯ ЧАСТЬ: МЕНЬШИЕ ШРИФТЫ */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Badge
                size="md"
                variant="outline"
                color="gray"
                mb="lg"
                radius="sm"
                style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 700, color: "#1B2E3D", borderColor: "#1B2E3D" }}
              >
                Собственное производство в Алматы
              </Badge>
              <Title
                order={1}
                style={{
                  color: "#1B2E3D",
                  fontFamily: '"Alyamama", sans-serif',
                  letterSpacing: "1px",
                  fontSize: "clamp(24px, 3.5vw, 42px)", // Максимально аккуратный и читаемый размер
                  lineHeight: 1.2,
                }}
              >
                РЕКЛАМА, КОТОРАЯ<br />ПРИНОСИТ ДЕНЬГИ
              </Title>
              <Text c="dimmed" size="md" mt="md" maw={400} lh={1.6}>
                Изготавливаем вывески, лайтбоксы и металлоконструкции премиум-класса. 
                Даем гарантию до 2 лет и монтируем точно в срок.
              </Text>

              <Group mt={30} gap="sm">
                <Button
                  size="md"
                  radius="md"
                  style={{
                    backgroundColor: "#1B2E3D",
                    transition: "transform 0.2s",
                  }}
                  onClick={() => document.getElementById("contacts").scrollIntoView({ behavior: "smooth" })}
                >
                  Оставить заявку
                </Button>
                <Button
                  size="md"
                  radius="md"
                  variant="outline"
                  style={{ color: "#1B2E3D", borderColor: "#1B2E3D", borderWidth: "2px" }}
                  onClick={() => document.getElementById("catalog").scrollIntoView({ behavior: "smooth" })}
                >
                  Наши услуги
                </Button>
              </Group>
              <Button
                  mt="sm"
                  size="sm"
                  radius="md"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconPhoto size={18} />}
                  onClick={() => navigate("/portfolio")}
                  style={{ color: "#1B2E3D", paddingLeft: 0 }}
                >
                  Наше портфолио
              </Button>
            </Grid.Col>

            {/* ПРАВАЯ ЧАСТЬ: ИНТЕРАКТИВНЫЙ 3D КОМПОНЕНТ */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <HeroIllustration />
            </Grid.Col>
          </Grid>

          {/* КАТАЛОГ (РАЗДЕЛЫ) */}
          <Box id="catalog">
            <Center mb={40}>
               <Title order={3} style={{ color: "#1B2E3D", textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Наши возможности
               </Title>
            </Center>
            <Grid gutter="xl">
              {categories.map((cat) => (
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={cat.id}>
                  <Card
                    padding="xl"
                    radius="lg"
                    bg="white"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                      border: "1px solid #EAEAEA",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-10px)";
                      e.currentTarget.style.boxShadow = "0 20px 40px rgba(27, 46, 61, 0.08)";
                      e.currentTarget.style.borderColor = "#1B2E3D";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "#EAEAEA";
                    }}
                    onClick={() => navigate(`/category/${cat.id}`)}
                  >
                    <ThemeIcon
                      size={80}
                      radius="xl"
                      variant="light"
                      color="gray"
                      mb="lg"
                    >
                      <cat.icon size={40} stroke={1.5} color="#1B2E3D" />
                    </ThemeIcon>
                    <Title order={3} mb="sm" style={{ color: "#1B2E3D", fontSize: "22px" }}>
                      {cat.title}
                    </Title>
                    <Text size="sm" c="dimmed" lh={1.6} mb="xl">
                      {cat.desc}
                    </Text>
                    <Group gap={8}>
                      <Text size="sm" fw={700} style={{ color: "#1B2E3D", textTransform: "uppercase" }}>
                        Подробнее
                      </Text>
                      <IconArrowRight size={18} color="#1B2E3D" />
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* 2. БЛОК ФАКТОВ */}
      <Box bg="#1B2E3D" py={60}>
        <Container size="lg">
          <Grid align="center" justify="center" gutter={40}>
            {[
              { count: "100%", text: "Контроль качества" },
              { count: "0 ₸", text: "Выезд на замер" },
              { count: "12 мес", text: "Гарантия на работы" },
              { count: "24/7", text: "Прием заявок" },
            ].map((stat, idx) => (
              <Grid.Col span={{ base: 6, sm: 3 }} key={idx}>
                <Stack gap={5} align="center">
                  <Title order={1} style={{ color: "white", fontSize: "48px", fontWeight: 900 }}>
                    {stat.count}
                  </Title>
                  <Text
                    size="sm"
                    fw={600}
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

      {/* 3. КАК МЫ РАБОТАЕМ */}
      <Box bg="#F8F9FA" py={100}>
        <Container size="lg">
          <Center mb={60} style={{ flexDirection: "column" }}>
            <Badge color="gray" variant="outline" mb="md" radius="sm" style={{ borderColor: "#1B2E3D", color: "#1B2E3D" }}>
              Прозрачный процесс
            </Badge>
            <Title order={2} style={{ color: "#1B2E3D", fontSize: "36px" }}>
              Как мы работаем
            </Title>
          </Center>
          <Grid gutter={40}>
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
                  p="xl"
                  radius="lg"
                  bg="white"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid #EAEAEA",
                    height: "100%"
                  }}
                >
                  <Text
                    style={{
                      position: "absolute",
                      top: "-15px",
                      right: "10px",
                      fontSize: "100px",
                      fontWeight: 900,
                      color: "rgba(27, 46, 61, 0.05)",
                      fontFamily: '"Alyamama", sans-serif',
                      lineHeight: 1,
                    }}
                  >
                    {item.step}
                  </Text>
                  <ThemeIcon size={40} radius="md" color="dark" variant="light" mb="lg">
                    <Text fw={900}>{item.step}</Text>
                  </ThemeIcon>
                  <Title order={4} mb="sm" style={{ color: "#1B2E3D", position: "relative", zIndex: 2 }}>
                    {item.title}
                  </Title>
                  <Text size="sm" c="dimmed" lh={1.6} style={{ position: "relative", zIndex: 2 }}>
                    {item.desc}
                  </Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 4. СМАРТ-КАЛЬКУЛЯТОР И ПРАЙС */}
      <Box py={100} bg="white">
        <Container size="lg">
          <Grid gutter={60}>
            {/* КАЛЬКУЛЯТОР */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Badge color="gray" variant="outline" mb="md" radius="sm" style={{ borderColor: "#1B2E3D", color: "#1B2E3D" }}>
                Умный расчет
              </Badge>
              <Title order={2} mb="md" style={{ color: "#1B2E3D", fontSize: "36px" }}>
                Смета проекта
              </Title>
              <Text c="dimmed" mb="xl" lh={1.6}>
                Выберите параметры для предварительного расчета. Окончательная стоимость формируется после замера.
              </Text>

              <Paper
                withBorder
                shadow="xl"
                p="xl"
                radius="lg"
                bg="#1B2E3D"
                style={{ borderColor: "#1B2E3D" }}
              >
                {!leadSuccess ? (
                  <Stack gap="lg">
                    {loadingData ? (
                      <Center p="xl">
                        <Loader color="white" />
                      </Center>
                    ) : calcConfigs.length > 0 ? (
                      <>
                        <Select
                          label={<Text fw={600} style={{ color: "white" }}>Что будем считать?</Text>}
                          value={activeConfigId}
                          onChange={setActiveConfigId}
                          data={calcConfigs.map((c) => ({
                            value: c.id,
                            label: c.title,
                          }))}
                          size="md"
                          radius="md"
                          styles={{
                            input: {
                              backgroundColor: "rgba(255,255,255,0.05)",
                              color: "white",
                              border: "1px solid rgba(255,255,255,0.1)",
                            },
                            dropdown: { backgroundColor: "white", color: "#1B2E3D" },
                          }}
                        />

                        {availablePrices.length > 0 && (
                          <Select
                            label={<Text fw={600} style={{ color: "white" }}>Материал / Тип</Text>}
                            value={selectedPriceId}
                            onChange={setSelectedPriceId}
                            data={availablePrices.map((p) => ({
                              value: p.id || p.service,
                              label: `${p.service} (${p.price} ₸/${p.unit})`,
                            }))}
                            size="md"
                            radius="md"
                            styles={{
                              input: {
                                backgroundColor: "rgba(255,255,255,0.05)",
                                color: "white",
                                border: "1px solid rgba(255,255,255,0.1)",
                              },
                              dropdown: { backgroundColor: "white", color: "#1B2E3D" },
                            }}
                          />
                        )}

                        {activeConfig?.fields.length > 0 && (
                          <Group grow>
                            {activeConfig.fields.map((f, idx) => (
                              <NumberInput
                                key={idx}
                                label={<Text fw={600} style={{ color: "white" }}>{f.label}</Text>}
                                min={0}
                                size="md"
                                radius="md"
                                value={fieldValues[f.name] || 0}
                                onChange={(val) => handleFieldChange(f.name, val)}
                                styles={{
                                  input: {
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    color: "white",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                  },
                                }}
                              />
                            ))}
                          </Group>
                        )}

                        {activeConfig?.addons?.length > 0 && (
                          <Box>
                            <Text size="sm" fw={600} mb="sm" style={{ color: "white" }}>
                              Дополнительные опции:
                            </Text>
                            <Stack gap="xs">
                              {activeConfig.addons.map((addon) => (
                                <Checkbox
                                  key={addon.id}
                                  label={<Text style={{ color: "white" }}>{addon.name}</Text>}
                                  color="dark"
                                  size="md"
                                  checked={selectedAddons.includes(addon.id)}
                                  onChange={(event) =>
                                    handleAddonChange(addon.id, event.currentTarget.checked)
                                  }
                                />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        <Divider color="rgba(255,255,255,0.1)" my="sm" />

                        <Group justify="space-between" align="center">
                          <Box>
                            <Text size="xs" tt="uppercase" fw={700} style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>
                              Примерная цена
                            </Text>
                            <Text size="xl" fw={900} style={{ color: "white", fontSize: "32px" }}>
                              ~{calculateEstimate().toLocaleString("ru-RU")} ₸
                            </Text>
                          </Box>
                        </Group>

                        <Paper p="lg" radius="md" bg="rgba(255,255,255,0.05)" mt="md" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                          <Text size="sm" fw={600} style={{ color: "white" }} mb="md">
                            Оставьте номер для точного расчета:
                          </Text>
                          <TextInput
                            placeholder="+7 (___) ___-__-__"
                            size="md"
                            radius="md"
                            value={leadPhone}
                            onChange={(e) => setLeadPhone(e.currentTarget.value)}
                            required
                            leftSection={<IconPhone size={18} color="#1B2E3D" />}
                            styles={{
                              input: {
                                backgroundColor: "white",
                                color: "#1B2E3D",
                                border: "none",
                                fontWeight: 600,
                              },
                            }}
                            mb="md"
                          />
                          <Button
                            fullWidth
                            size="md"
                            radius="md"
                            loading={isSubmittingLead}
                            onClick={handleLeadSubmit}
                            disabled={!leadPhone || leadPhone.trim() === ""}
                            style={{ backgroundColor: "white", color: "#1B2E3D", fontWeight: 700 }}
                          >
                            Отправить смету менеджеру
                          </Button>
                        </Paper>
                      </>
                    ) : !isDbConnected ? (
                      <Center p="xl" style={{ flexDirection: "column", textAlign: "center" }}>
                        <IconServerOff size={50} color="rgba(255,255,255,0.3)" />
                        <Text style={{ color: "white" }} fw={600} mt="md" size="lg">
                          Связь с сервером прервана
                        </Text>
                        <Text size="sm" style={{ color: "rgba(255,255,255,0.6)" }} mt="sm">
                          Калькулятор временно недоступен.
                        </Text>
                      </Center>
                    ) : (
                      <Text style={{ color: "white" }} ta="center">Загрузка настроек...</Text>
                    )}
                  </Stack>
                ) : (
                  <Center p="xl" style={{ flexDirection: "column", textAlign: "center", minHeight: "300px" }}>
                    <ThemeIcon size={80} radius="100px" color="teal" variant="light" mb="lg">
                      <IconCheck size={40} />
                    </ThemeIcon>
                    <Title order={3} style={{ color: "white" }}>
                      Смета отправлена!
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.7)" }} mt="md" lh={1.6}>
                      Мы получили ваш запрос. Менеджер свяжется с вами в течение 15 минут.
                    </Text>
                    <Button mt="xl" variant="subtle" color="gray" onClick={() => setLeadSuccess(false)}>
                      Сделать новый расчет
                    </Button>
                  </Center>
                )}
              </Paper>
            </Grid.Col>

            {/* ПРАЙС-ЛИСТ */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Title order={3} mb="xl" style={{ color: "#1B2E3D", fontSize: "28px" }}>
                Открытый прайс-лист
              </Title>
              <Paper
                withBorder
                radius="lg"
                p={0}
                style={{ overflow: "hidden", borderColor: "#EAEAEA", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}
              >
                <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                  <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                    <Table.Thead style={{ position: "sticky", top: 0, backgroundColor: "#F8F9FA", zIndex: 1, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                      <Table.Tr>
                        <Table.Th style={{ color: "#1B2E3D", fontWeight: 700, textTransform: "uppercase", fontSize: "12px" }}>Услуга / Материал</Table.Th>
                        <Table.Th style={{ color: "#1B2E3D", fontWeight: 700, textTransform: "uppercase", fontSize: "12px" }}>Ед. изм.</Table.Th>
                        <Table.Th style={{ color: "#1B2E3D", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", textAlign: "right" }}>Стоимость от</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {loadingData ? (
                        <Table.Tr>
                          <Table.Td colSpan={3}>
                            <Center p="xl">
                              <Loader size="md" color="dark" />
                            </Center>
                          </Table.Td>
                        </Table.Tr>
                      ) : !isDbConnected ? (
                        <Table.Tr>
                          <Table.Td colSpan={3} align="center">
                            <Text c="dimmed" size="sm" py="xl">Прайс-лист временно недоступен</Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : priceList.length > 0 ? (
                        priceList.map((item, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>
                              <Text fw={600} size="sm" style={{ color: "#1B2E3D" }}>{item.service}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="gray" variant="light" radius="sm">{item.unit}</Badge>
                            </Table.Td>
                            <Table.Td style={{ textAlign: "right" }}>
                              <Text fw={800} style={{ color: "#1B2E3D" }}>
                                {item.price.toLocaleString("ru-RU")} ₸
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={3} align="center">
                            <Text c="dimmed" size="sm" py="xl">Прайс-лист пуст</Text>
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
      <Box bg="#F8F9FA" py={100}>
        <Container size="md">
          <Center mb={60}>
            <Title order={2} style={{ color: "#1B2E3D", fontSize: "36px" }}>
              Частые вопросы
            </Title>
          </Center>
          <Accordion
            variant="separated"
            radius="lg"
            styles={{
              item: { border: "1px solid #EAEAEA", backgroundColor: "white", marginBottom: "16px" },
              control: { fontWeight: 700, color: "#1B2E3D", padding: "20px" },
              content: { padding: "0 20px 20px 20px", color: "#666" }
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
                  <Text size="sm" lh={1.6}>
                    {faq.a}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </Box>

      {/* 6. КОНТАКТЫ И ФОРМА */}
      <Box bg="#1B2E3D" py={100} id="contacts">
        <Container size="lg">
          <Grid gutter={80}>
            {/* ЛЕВАЯ ЧАСТЬ - КОНТАКТЫ */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Badge color="gray" variant="light" mb="md" radius="sm">Контакты</Badge>
              <Title order={2} style={{ color: "white", fontSize: "36px" }} mb="xl">
                Обсудим ваш проект?
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)" }} mb="xl" lh={1.6} size="lg">
                Оставьте заявку, и наш специалист свяжется с вами для подробной и бесплатной консультации.
              </Text>

              <Stack gap="xl" mt={50}>
                <Group wrap="nowrap">
                  <ThemeIcon size={60} radius="xl" color="rgba(255,255,255,0.05)" variant="filled">
                    <IconPhone size={28} color="white" />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>
                      Телефон / WhatsApp
                    </Text>
                    <Text size="xl" fw={800} style={{ color: "white" }}>
                      +7 708 932 1854
                    </Text>
                  </div>
                </Group>

                <Group wrap="nowrap">
                  <ThemeIcon size={60} radius="xl" color="rgba(255,255,255,0.05)" variant="filled">
                    <IconBrandInstagram size={28} color="white" />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>
                      Наш Instagram
                    </Text>
                    <Text
                      size="xl"
                      fw={800}
                      style={{ color: "white", textDecoration: "none" }}
                      component="a"
                      href="https://instagram.com/royal.banners.almaty"
                      target="_blank"
                    >
                      @royal.banners.almaty
                    </Text>
                  </div>
                </Group>

                <Group wrap="nowrap">
                  <ThemeIcon size={60} radius="xl" color="rgba(255,255,255,0.05)" variant="filled">
                    <IconClock size={28} color="white" />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" tt="uppercase" fw={700} style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>
                      Режим работы
                    </Text>
                    <Text size="xl" fw={800} style={{ color: "white" }}>
                      Пн-Пт: 09:00 - 18:00
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Grid.Col>

            {/* ПРАВАЯ ЧАСТЬ - ФОРМА */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper p={{ base: "xl", md: 50 }} radius="lg" bg="white" shadow="xl">
                {!contactSuccess ? (
                  <form onSubmit={handleContactSubmit}>
                    <Title order={3} mb="xl" style={{ color: "#1B2E3D", fontSize: "28px" }}>
                      Оставить заявку
                    </Title>
                    <Stack gap="lg">
                      <TextInput
                        label={<Text fw={600} style={{ color: "#1B2E3D" }}>Ваше имя</Text>}
                        placeholder="Как к вам обращаться?"
                        size="md"
                        radius="md"
                        maxLength={50}
                        value={contactName}
                        onChange={(e) => setContactName(e.currentTarget.value)}
                      />
                      <TextInput
                        type="tel"
                        label={<Text fw={600} style={{ color: "#1B2E3D" }}>Номер телефона</Text>}
                        placeholder="+7 (___) ___-__-__"
                        size="md"
                        radius="md"
                        required
                        maxLength={20}
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.currentTarget.value)}
                      />
                      <Select
                        label={<Text fw={600} style={{ color: "#1B2E3D" }}>Что вас интересует?</Text>}
                        placeholder="Выберите услугу"
                        data={[
                          "Объемные буквы",
                          "Лайтбокс",
                          "Баннер",
                          "Монтаж",
                          "Другое",
                        ]}
                        size="md"
                        radius="md"
                        value={contactService}
                        onChange={setContactService}
                      />
                      <Textarea
                        label={<Text fw={600} style={{ color: "#1B2E3D" }}>Комментарий</Text>}
                        placeholder="Опишите задачу подробнее (необязательно)"
                        minRows={4}
                        radius="md"
                        maxLength={500}
                        size="md"
                        value={contactComment}
                        onChange={(e) => setContactComment(e.currentTarget.value)}
                      />
                      <Button
                        type="submit"
                        size="lg"
                        radius="md"
                        fullWidth
                        mt="md"
                        loading={isSubmittingContact}
                        disabled={!contactPhone || contactPhone.trim() === ""}
                        style={{ backgroundColor: "#1B2E3D" }}
                      >
                        Отправить заявку
                      </Button>
                      <Text size="xs" c="dimmed" ta="center" mt="sm">
                        Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
                      </Text>
                    </Stack>
                  </form>
                ) : (
                  <Center style={{ flexDirection: "column", padding: "80px 20px", textAlign: "center" }}>
                    <ThemeIcon size={100} radius="100px" color="teal" variant="light" mb="xl">
                      <IconCheck size={50} />
                    </ThemeIcon>
                    <Title order={2} style={{ color: "#1B2E3D" }}>
                      Спасибо за заявку!
                    </Title>
                    <Text size="lg" mt="md" c="dimmed" lh={1.6}>
                      Мы получили ваши данные и скоро свяжемся с вами для обсуждения деталей.
                    </Text>
                  </Center>
                )}
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* 7. FOOTER */}
      <Box bg="#0a121a" py={40}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <img src="/assets/logo.svg" alt="Logo" style={{ width: "24px", height: "24px", opacity: 0.8 }} />
              <Title order={4} style={{ fontFamily: '"Alyamama", sans-serif', color: "white", letterSpacing: "1px" }}>
                ROYAL BANNERS
              </Title>
            </Group>
            <Text size="sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              © 2026 Все права защищены. ERP-система внедрена.
            </Text>

            <Group gap="md">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                radius="xl"
                component="a"
                href="https://wa.me/77089321854"
                target="_blank"
              >
                <IconBrandWhatsapp size={24} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                radius="xl"
                component="a"
                href="https://instagram.com/royal.banners.almaty"
                target="_blank"
              >
                <IconBrandInstagram size={24} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </Box>
    </div>
  );
}