import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Table,
  Badge,
  Group,
  Stack,
  Box,
  ActionIcon,
  Loader,
  Center,
  Modal,
  Select,
  Switch,
  JsonInput,
  Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconEyeOff,
  IconLayoutBoard,
} from "@tabler/icons-react";
import api from "../api/axios.js";

// ==========================================
// ШАБЛОНЫ ДАННЫХ ДЛЯ НОВЫХ БЛОКОВ
// ==========================================
const DEFAULT_DATA_TEMPLATES = {
  Hero: {
    badgeText: "Собственное производство в Алматы",
    title: "РЕКЛАМА,\nКОТОРАЯ\nПРИНОСИТ ДЕНЬГИ",
    subtitle: "Изготавливаем вывески, лайтбоксы и металлоконструкции премиум-класса. Даем гарантию до 2 лет и монтируем точно в срок.",
  },
  Catalog: {
    title: "Наши возможности",
  },
  Stats: {
    items: [
      { count: "100%", text: "Контроль качества" },
      { count: "0 ₸", text: "Выезд на замер" },
      { count: "12 мес", text: "Гарантия на работы" },
      { count: "24/7", text: "Прием заявок" },
    ],
  },
  WorkProcess: {
    badgeText: "Прозрачный процесс",
    title: "Как мы работаем",
    items: [
      { step: "01", title: "Заявка", desc: "Оставляете заявку" },
      { step: "02", title: "Смета", desc: "Считаем проект" },
      { step: "03", title: "Производство", desc: "Делаем вывеску" },
      { step: "04", title: "Монтаж", desc: "Устанавливаем на объекте" },
    ],
  },
  Calculator: {
    title: "Смета проекта",
    subtitle: "Выберите параметры для предварительного расчета.",
  },
  Faq: {
    title: "Частые вопросы",
    items: [
      { q: "Сроки?", a: "От 1 до 3 рабочих дней." },
      { q: "Гарантия?", a: "1 год на всю электронику." },
    ],
  },
  Contacts: {
    title: "Обсудим ваш проект?",
    subtitle: "Оставьте заявку, и наш специалист свяжется с вами.",
  },
};

const BLOCK_TYPES = Object.keys(DEFAULT_DATA_TEMPLATES);

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ: КОНСТРУКТОР СТРАНИЦ
// ==========================================
export default function PageBuilder() {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Модалка для редактирования/создания
  const [opened, { open, close }] = useDisclosure(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [formData, setFormData] = useState({ type: "Hero", data: "{}", isActive: true });
  const [jsonError, setJsonError] = useState("");

  // ==========================================
  // 1. ЗАГРУЗКА БЛОКОВ
  // ==========================================
  const fetchBlocks = async () => {
    try {
      setIsLoading(true);
      // OWNER видит все блоки (защищенный роут)
      const res = await api.get("/pages/blocks");
      if (res.data?.data) {
        // Сортируем на клиенте на всякий случай
        const sorted = res.data.data.sort((a, b) => a.order - b.order);
        setBlocks(sorted);
      }
    } catch (error) {
      console.error("Ошибка загрузки блоков:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  // ==========================================
  // 2. ОТКРЫТИЕ МОДАЛКИ (НОВЫЙ ИЛИ РЕДАКТИРОВАНИЕ)
  // ==========================================
  const handleOpenModal = (block = null) => {
    setJsonError("");
    if (block) {
      setEditingBlock(block);
      setFormData({
        type: block.type,
        data: JSON.stringify(block.data, null, 2),
        isActive: block.isActive,
      });
    } else {
      setEditingBlock(null);
      setFormData({
        type: "Hero",
        data: JSON.stringify(DEFAULT_DATA_TEMPLATES["Hero"], null, 2),
        isActive: true,
      });
    }
    open();
  };

  // Автозаполнение шаблона при смене типа (для новых блоков)
  const handleTypeChange = (type) => {
    if (!editingBlock) {
      setFormData({
        type,
        data: JSON.stringify(DEFAULT_DATA_TEMPLATES[type], null, 2),
        isActive: true,
      });
    } else {
      setFormData({ ...formData, type });
    }
  };

  // ==========================================
  // 3. СОХРАНЕНИЕ БЛОКА
  // ==========================================
  const handleSave = async () => {
    try {
      setJsonError("");
      setIsSaving(true);
      
      // Валидация JSON
      let parsedData;
      try {
        parsedData = JSON.parse(formData.data);
      } catch (e) {
        setJsonError("Ошибка формата JSON. Проверьте кавычки и запятые.");
        setIsSaving(false);
        return;
      }

      if (editingBlock) {
        // Обновление
        await api.patch(`/pages/blocks/${editingBlock.id}`, {
          type: formData.type,
          data: parsedData,
          isActive: formData.isActive,
        });
      } else {
        // Создание нового. Ставим его в конец (максимальный order + 1)
        const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.order)) : -1;
        await api.post("/pages/blocks", {
          type: formData.type,
          data: parsedData,
          isActive: formData.isActive,
          order: maxOrder + 1,
        });
      }

      await fetchBlocks();
      close();
    } catch (error) {
      console.error("Ошибка сохранения блока:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // 4. УДАЛЕНИЕ БЛОКА
  // ==========================================
  const handleDelete = async (id) => {
    if (!window.confirm("Удалить этот блок навсегда?")) return;
    try {
      await api.delete(`/pages/blocks/${id}`);
      setBlocks(blocks.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  };

  // ==========================================
  // 5. БЫСТРОЕ ВКЛ/ВЫКЛ БЛОКА
  // ==========================================
  const handleToggleActive = async (id, currentStatus) => {
    try {
      // Оптимистичное обновление UI
      setBlocks(blocks.map((b) => (b.id === id ? { ...b, isActive: !currentStatus } : b)));
      await api.patch(`/pages/blocks/${id}`, { isActive: !currentStatus });
    } catch (error) {
      console.error("Ошибка переключения статуса:", error);
      fetchBlocks(); // Откат при ошибке
    }
  };

  // ==========================================
  // 6. ПЕРЕМЕЩЕНИЕ БЛОКОВ (ВВЕРХ / ВНИЗ)
  // ==========================================
  const moveBlock = async (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Меняем местами локально
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    // Пересчитываем order
    const reorderedData = newBlocks.map((block, idx) => ({
      id: block.id,
      order: idx,
    }));

    // Обновляем стейт сразу для плавности UI
    setBlocks(newBlocks.map((block, idx) => ({ ...block, order: idx })));

    // Отправляем массив на сервер
    try {
      await api.post("/pages/blocks/reorder", { blocks: reorderedData });
    } catch (error) {
      console.error("Ошибка сортировки:", error);
      fetchBlocks(); // Откат при ошибке
    }
  };

  // ==========================================
  // РЕНДЕР
  // ==========================================
  if (isLoading) {
    return (
      <Center style={{ height: "70vh" }}>
        <Loader size="xl" color="orange" />
      </Center>
    );
  }

  return (
    <Box p="md" bg="#f8f9fa" style={{ minHeight: "100vh" }}>
      <Container size="xl">
        {/* Заголовок */}
        <Group justify="space-between" mb="xl">
          <Group>
            <ThemeIcon size={50} radius="md" color="#1B2E3D">
              <IconLayoutBoard size={30} />
            </ThemeIcon>
            <Box>
              <Title order={2} style={{ color: "#1B2E3D" }}>Конструктор Главной Страницы</Title>
              <Text c="dimmed">Управляйте блоками, контентом и порядком отображения</Text>
            </Box>
          </Group>
          <Button
            leftSection={<IconPlus size={18} />}
            color="orange"
            size="md"
            radius="md"
            onClick={() => handleOpenModal()}
          >
            Добавить Блок
          </Button>
        </Group>

        {/* Таблица блоков */}
        <Paper withBorder shadow="sm" radius="md" p="md" bg="white">
          {blocks.length === 0 ? (
            <Center p="xl">
              <Text c="dimmed">На странице пока нет блоков. Нажмите "Добавить Блок".</Text>
            </Center>
          ) : (
            <Table highlightOnHover verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Порядок</Table.Th>
                  <Table.Th>Тип компонента</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Краткие данные (JSON)</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Действия</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {blocks.map((block, index) => (
                  <Table.Tr key={block.id}>
                    {/* Сортировка */}
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          disabled={index === 0}
                          onClick={() => moveBlock(index, "up")}
                        >
                          <IconArrowUp size={18} />
                        </ActionIcon>
                        <Badge color="gray" variant="light" size="lg" w={30} p={0} style={{ textAlign: "center" }}>
                          {index + 1}
                        </Badge>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          disabled={index === blocks.length - 1}
                          onClick={() => moveBlock(index, "down")}
                        >
                          <IconArrowDown size={18} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>

                    {/* Тип */}
                    <Table.Td>
                      <Badge color="dark" size="lg" radius="sm">
                        {block.type}
                      </Badge>
                    </Table.Td>

                    {/* Статус */}
                    <Table.Td>
                      <Switch
                        checked={block.isActive}
                        onChange={() => handleToggleActive(block.id, block.isActive)}
                        color="teal"
                        size="md"
                        onLabel={<IconEye size={14} />}
                        offLabel={<IconEyeOff size={14} />}
                      />
                    </Table.Td>

                    {/* Данные (превью) */}
                    <Table.Td>
                      <Text size="xs" c="dimmed" lineClamp={1} maw={300} style={{ fontFamily: "monospace" }}>
                        {JSON.stringify(block.data)}
                      </Text>
                    </Table.Td>

                    {/* Действия */}
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <ActionIcon variant="light" color="blue" size="lg" onClick={() => handleOpenModal(block)}>
                          <IconEdit size={20} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="red" size="lg" onClick={() => handleDelete(block.id)}>
                          <IconTrash size={20} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Container>

      {/* Модальное окно создания/редактирования */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Title order={3} style={{ color: "#1B2E3D" }}>
            {editingBlock ? "Редактировать Блок" : "Новый Блок"}
          </Title>
        }
        size="lg"
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="md">
          <Select
            label="Тип компонента"
            data={BLOCK_TYPES}
            value={formData.type}
            onChange={handleTypeChange}
            disabled={!!editingBlock} // После создания тип менять нельзя, чтобы не сломать пропсы
            required
            size="md"
          />

          <Switch
            label={<Text fw={600}>Показывать на сайте (Активен)</Text>}
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.currentTarget.checked })}
            color="teal"
            size="md"
          />

          <JsonInput
            label={<Text fw={600}>Контент блока (JSON)</Text>}
            description="Здесь лежат тексты и настройки. Осторожно с кавычками!"
            validationError={jsonError ? "Неверный формат JSON" : undefined}
            formatOnBlur
            autosize
            minRows={8}
            maxRows={15}
            value={formData.data}
            onChange={(val) => {
              setFormData({ ...formData, data: val });
              setJsonError("");
            }}
            styles={{ input: { fontFamily: "monospace", fontSize: "14px" } }}
          />
          {jsonError && <Text color="red" size="sm">{jsonError}</Text>}

          <Button
            size="md"
            fullWidth
            mt="md"
            loading={isSaving}
            onClick={handleSave}
            style={{ backgroundColor: "#FF6B00" }} // Оранжевый акцент
          >
            Сохранить настройки блока
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
}