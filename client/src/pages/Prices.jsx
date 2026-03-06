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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconEdit,
  IconReportMoney,
  IconDatabase,
} from "@tabler/icons-react";
import api from "../api/index.js";

export default function Prices() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (СОЗДАНИЕ / РЕДАКТИРОВАНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState(null); // Если null - создаем новое, если есть ID - редактируем

  // Поля формы
  const [service, setService] = useState("");
  const [unit, setUnit] = useState("1 кв.м");
  const [priceValue, setPriceValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ПРАЙС-ЛИСТА
  // ==========================================
  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/prices");
      // Ожидаем, что бэкенд вернет массив данных
      setPrices(response.data || response.data?.data || []);
    } catch (err) {
      console.error("Ошибка загрузки прайсов:", err);
      // Сеньорский фоллбэк: если бэкенд еще не готов, показываем демо-данные, чтобы не ломать UI
      setPrices([
        {
          id: "1",
          service: "Печать баннера (Китай 340гр)",
          unit: "1 кв.м",
          price: 1500,
        },
        {
          id: "2",
          service: "Изготовление лайтбокса (стандарт)",
          unit: "1 кв.м",
          price: 45000,
        },
        {
          id: "3",
          service: "Несветовая вывеска",
          unit: "1 кв.м",
          price: 25000,
        },
        {
          id: "4",
          service: "Объемные световые буквы",
          unit: "1 кв.м",
          price: 35000,
        },
        {
          id: "5",
          service: "Монтаж/Демонтаж (базовый)",
          unit: "услуга",
          price: 15000,
        },
        { id: "6", service: "Разработка дизайна", unit: "услуга", price: 5000 },
      ]);
      setError(
        "Нет подключения к базе цен. Показаны демонстрационные данные для теста интерфейса.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // ==========================================
  // ОТКРЫТИЕ МОДАЛКИ (СМАРТ-РЕЖИМ)
  // ==========================================
  const handleOpenModal = (item = null) => {
    if (item) {
      // Режим редактирования: заполняем поля текущими данными
      setEditingId(item.id);
      setService(item.service);
      setUnit(item.unit);
      setPriceValue(item.price);
    } else {
      // Режим создания: очищаем поля
      setEditingId(null);
      setService("");
      setUnit("1 кв.м");
      setPriceValue(0);
    }
    open();
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: СОХРАНЕНИЕ (СОЗДАНИЕ ИЛИ ОБНОВЛЕНИЕ)
  // ==========================================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!service || !unit || priceValue === undefined) return;

    setIsSubmitting(true);
    const payload = { service, unit, price: priceValue };

    try {
      if (editingId) {
        // Обновляем существующую запись
        await api.put(`/prices/${editingId}`, payload);
      } else {
        // Создаем новую запись
        await api.post("/prices", payload);
      }

      close();
      fetchPrices(); // Перезапрашиваем актуальные данные с сервера
    } catch (err) {
      console.error("Ошибка при сохранении:", err);

      // Имитация работы для демо-режима, если бэкенд выключен
      if (error) {
        if (editingId) {
          setPrices((prev) =>
            prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)),
          );
        } else {
          setPrices((prev) => [
            ...prev,
            { id: Date.now().toString(), ...payload },
          ]);
        }
        close();
      } else {
        alert(err.response?.data?.message || "Ошибка при сохранении позиции.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УДАЛЕНИЕ
  // ==========================================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Вы уверены, что хотите удалить эту позицию из прайса? Она исчезнет из калькулятора на сайте.",
      )
    )
      return;

    try {
      await api.delete(`/prices/${id}`);
      setPrices((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      // Имитация для демо-режима
      if (error) {
        setPrices((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Не удалось удалить позицию.");
      }
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
            Управление прайс-листом
          </Title>
          <Text c="dimmed" mt={5}>
            Эти данные напрямую используются в калькуляторе на сайте
          </Text>
        </div>

        <Group>
          <Tooltip label="Синхронизировать с базой">
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
            }}
          >
            Добавить услугу
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Внимание (Режим разработки)"
          color="orange"
          mb="xl"
          radius="md"
        >
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* ТАБЛИЦА ЦЕН */}
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
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} />
          </div>
        ) : prices.length > 0 ? (
          <Table
            striped
            highlightOnHover
            verticalSpacing="md"
            horizontalSpacing="lg"
          >
            <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
              <Table.Tr>
                <Table.Th style={{ color: "#1B2E3D" }}>
                  Наименование услуги
                </Table.Th>
                <Table.Th style={{ color: "#1B2E3D" }}>
                  Единица измерения
                </Table.Th>
                <Table.Th style={{ color: "#1B2E3D", textAlign: "right" }}>
                  Базовая цена (₸)
                </Table.Th>
                <Table.Th style={{ color: "#1B2E3D", textAlign: "right" }}>
                  Действия
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {prices.map((item) => (
                <Table.Tr key={item.id}>
                  {/* Название услуги */}
                  <Table.Td>
                    <Group gap="sm">
                      <Center
                        w={32}
                        h={32}
                        bg="#f1f3f5"
                        style={{ borderRadius: "8px" }}
                      >
                        <IconDatabase size={16} color="#1B2E3D" />
                      </Center>
                      <Text fw={600} size="sm" style={{ color: "#1B2E3D" }}>
                        {item.service}
                      </Text>
                    </Group>
                  </Table.Td>

                  {/* Ед. измерения */}
                  <Table.Td>
                    <Badge
                      color="gray"
                      variant="light"
                      style={{ color: "#1B2E3D", textTransform: "none" }}
                    >
                      {item.unit}
                    </Badge>
                  </Table.Td>

                  {/* Цена */}
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fw={700} style={{ color: "#1B2E3D" }}>
                      {item.price.toLocaleString("ru-RU")} ₸
                    </Text>
                  </Table.Td>

                  {/* Действия */}
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Редактировать">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleOpenModal(item)}
                        >
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить">
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
              Добавьте услуги, чтобы они появились в калькуляторе на сайте.
            </Text>
            <Button mt="md" variant="default" onClick={() => handleOpenModal()}>
              Добавить первую услугу
            </Button>
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
            {editingId ? "Редактировать услугу" : "Новая услуга"}
          </Title>
        }
        size="md"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleSave}>
          <Stack gap="md">
            <TextInput
              label="Наименование услуги"
              placeholder="Например: Объемные световые буквы"
              required
              value={service}
              onChange={(e) => setService(e.currentTarget.value)}
              styles={{ label: { color: "#1B2E3D", fontWeight: 600 } }}
            />

            <TextInput
              label="Единица измерения"
              placeholder="1 кв.м, 1 шт., 1 см высоты"
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
                style={{ backgroundColor: "#1B2E3D" }}
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
