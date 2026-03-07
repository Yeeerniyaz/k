import { useState, useEffect } from "react";
import {
  Title,
  Text,
  Paper,
  Button,
  Group,
  ActionIcon,
  Skeleton,
  Alert,
  Select,
  TextInput,
  Badge,
  Center,
  Stack,
  Accordion,
  Divider,
  Grid,
  ThemeIcon,
  MultiSelect,
  Tooltip,
  NumberInput,
  Table,
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconCalculator,
  IconMathFunction,
  IconSettings,
  IconDeviceFloppy,
  IconCode,
  IconChecklist,
  IconCopy,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";

// 🔥 Senior Update: Используем единый инстанс API из axios.js
import api from "../api/axios.js";

export default function CalculatorSettings() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [configs, setConfigs] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Расширенные математические формулы
  const formulaTypes = [
    { value: "area", label: "Площадь (X × Y × Базовая Цена)" },
    {
      value: "height_count",
      label: "Размер × Количество (X × Y × Базовая Цена)",
    },
    { value: "length", label: "Погонный метр (X × Базовая Цена)" },
    { value: "unit", label: "Поштучно (Количество × Базовая Цена)" },
    { value: "custom", label: "Своя сложная формула (Custom Math)" },
  ];

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ДАННЫХ (REAL DATA)
  // ==========================================
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем актуальные цены для связи с формулами
      const pricesRes = await api.get("/prices");
      const loadedPrices = pricesRes.data.data || pricesRes.data || [];
      setPrices(
        loadedPrices.map((p) => ({
          value: p.id || p.service,
          label: `${p.service} (${p.price} ₸)`,
        })),
      );

      // Загружаем сохраненную конфигурацию калькулятора
      const configRes = await api.get("/settings/calculator");
      if (configRes.data && configRes.data.config) {
        // Убеждаемся, что у всех есть массив addons (доп. опции)
        const loadedConfigs = configRes.data.config.map((c) => ({
          ...c,
          addons: c.addons || [],
        }));
        setConfigs(loadedConfigs);
      } else {
        setConfigs([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки настроек:", err);
      // 🔥 Senior Practice: Никаких фейковых данных! Если сервер недоступен, ставим пустой массив
      setConfigs([]);
      setError(
        "Не удалось загрузить настройки калькулятора. Проверьте соединение с сервером.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // ФУНКЦИИ КОНСТРУКТОРА: УПРАВЛЕНИЕ БЛОКАМИ
  // ==========================================
  const handleAddConfig = () => {
    setConfigs([
      ...configs,
      {
        id: `config_${Date.now()}`,
        title: "Новый раздел",
        calcType: "area",
        customFormula: "",
        fields: [{ name: "val1", label: "Поле 1" }],
        linkedPrices: [],
        addons: [],
      },
    ]);
  };

  const handleRemoveConfig = (id) => {
    if (
      !window.confirm(
        "Точно удалить этот раздел? Он пропадет из калькулятора на сайте.",
      )
    )
      return;
    setConfigs(configs.filter((c) => c.id !== id));
  };

  const updateConfig = (id, key, value) => {
    setConfigs(configs.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
  };

  // ==========================================
  // ФУНКЦИИ КОНСТРУКТОРА: ПОЛЯ (ВВОД КЛИЕНТА)
  // ==========================================
  const handleAddField = (configId) => {
    setConfigs(
      configs.map((c) => {
        if (c.id === configId) {
          const newFieldName = `val${c.fields.length + 1}`;
          return {
            ...c,
            fields: [
              ...c.fields,
              {
                name: newFieldName,
                label: `Новое поле ${c.fields.length + 1}`,
              },
            ],
          };
        }
        return c;
      }),
    );
  };

  const handleRemoveField = (configId, index) => {
    setConfigs(
      configs.map((c) => {
        if (c.id === configId) {
          const newFields = [...c.fields];
          newFields.splice(index, 1);
          return { ...c, fields: newFields };
        }
        return c;
      }),
    );
  };

  const updateField = (configId, index, newLabel) => {
    setConfigs(
      configs.map((c) => {
        if (c.id === configId) {
          const newFields = [...c.fields];
          newFields[index].label = newLabel;
          return { ...c, fields: newFields };
        }
        return c;
      }),
    );
  };

  // ==========================================
  // ФУНКЦИИ КОНСТРУКТОРА: ДОП. ОПЦИИ (ADDONS)
  // ==========================================
  const handleAddAddon = (configId) => {
    setConfigs(
      configs.map((c) => {
        if (c.id === configId) {
          const currentAddons = c.addons || [];
          return {
            ...c,
            addons: [
              ...currentAddons,
              {
                id: `add_${Date.now()}`,
                name: "Новая опция",
                type: "fixed",
                value: 0,
              },
            ],
          };
        }
        return c;
      }),
    );
  };

  const handleRemoveAddon = (configId, addonId) => {
    setConfigs(
      configs.map((c) => {
        if (c.id === configId) {
          return { ...c, addons: c.addons.filter((a) => a.id !== addonId) };
        }
        return c;
      }),
    );
  };

  const updateAddon = (configId, addonId, key, val) => {
    setConfigs(
      configs.map((c) => {
        if (c.id === configId) {
          return {
            ...c,
            addons: c.addons.map((a) =>
              a.id === addonId ? { ...a, [key]: val } : a,
            ),
          };
        }
        return c;
      }),
    );
  };

  // ==========================================
  // СОРТИРОВКА И ДУБЛИРОВАНИЕ БЛОКОВ
  // ==========================================
  const moveConfigUp = (index) => {
    if (index === 0) return;
    const newConfigs = [...configs];
    const temp = newConfigs[index - 1];
    newConfigs[index - 1] = newConfigs[index];
    newConfigs[index] = temp;
    setConfigs(newConfigs);
  };

  const moveConfigDown = (index) => {
    if (index === configs.length - 1) return;
    const newConfigs = [...configs];
    const temp = newConfigs[index + 1];
    newConfigs[index + 1] = newConfigs[index];
    newConfigs[index] = temp;
    setConfigs(newConfigs);
  };

  const handleDuplicateConfig = (config) => {
    const duplicatedConfig = {
      ...config,
      id: `config_${Date.now()}`, // Создаем новый уникальный ID
      title: `${config.title} (Копия)`,
    };
    setConfigs([...configs, duplicatedConfig]);
  };

  // ==========================================
  // СОХРАНЕНИЕ НА БЭКЕНД (REAL DATA)
  // ==========================================
  const handleSaveConfigs = async () => {
    setIsSaving(true);
    try {
      await api.post("/settings/calculator", { config: configs });
      alert("Сложная архитектура калькулятора успешно сохранена!");
    } catch (err) {
      console.error("Ошибка сохранения:", err);
      // 🔥 Senior Update: Показываем реальную ошибку с сервера
      alert(
        err.response?.data?.message ||
          "Не удалось сохранить настройки калькулятора. Проверьте соединение с сервером.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: '"Google Sans", sans-serif',
        paddingBottom: "100px",
      }}
    >
      {/* ========================================== */}
      {/* ШАПКА */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="xs" mb="xs">
            <IconCalculator size={28} color="#1B2E3D" stroke={1.5} />
            <Title order={2} style={{ color: "#1B2E3D" }}>
              Архитектура Калькулятора
            </Title>
            <Badge color="orange" variant="light" size="lg">
              Enterprise Editor
            </Badge>
          </Group>
          <Text c="dimmed">
            Конструируйте сложную логику расчетов, формулы и дополнительные
            опции для витрины.
          </Text>
        </div>

        <Group>
          <Tooltip label="Сбросить и обновить из базы">
            <ActionIcon
              variant="default"
              size="lg"
              onClick={fetchData}
              loading={loading}
            >
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSaveConfigs}
            loading={isSaving}
            style={{
              backgroundColor: "#1B2E3D",
              color: "white",
              fontWeight: 600,
            }}
            size="md"
          >
            Сохранить архитектуру
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Внимание"
          color="red"
          mb="xl"
          radius="md"
        >
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* ГЛАВНЫЙ КОНСТРУКТОР */}
      {/* ========================================== */}
      {loading ? (
        <Stack>
          <Skeleton height={80} radius="md" />
          <Skeleton height={80} radius="md" />
          <Skeleton height={80} radius="md" />
        </Stack>
      ) : configs.length === 0 ? (
        <Paper withBorder p={60} radius="md" bg="white">
          <Center style={{ flexDirection: "column" }}>
            <IconMathFunction size={60} color="#e0e0e0" stroke={1} />
            <Text size="lg" fw={500} mt="md" style={{ color: "#1B2E3D" }}>
              Калькулятор пуст
            </Text>
            <Text c="dimmed" mt={5}>
              Создайте первый раздел, чтобы начать настройку расчетов.
            </Text>
            <Button
              mt="lg"
              leftSection={<IconPlus size={16} />}
              onClick={handleAddConfig}
              style={{ backgroundColor: "#1B2E3D" }}
            >
              Создать блок
            </Button>
          </Center>
        </Paper>
      ) : (
        <>
          <Accordion
            variant="separated"
            radius="md"
            multiple
            defaultValue={configs.length > 0 ? [configs[0].id] : []}
          >
            {configs.map((config, index) => (
              <Accordion.Item
                key={config.id}
                value={config.id}
                style={{
                  border: "1px solid #dee2e6",
                  backgroundColor: "white",
                  marginBottom: "15px",
                }}
              >
                {/* ЗАГОЛОВОК АККОРДЕОНА */}
                <Accordion.Control>
                  <Group
                    justify="space-between"
                    wrap="nowrap"
                    style={{ width: "100%", paddingRight: "20px" }}
                  >
                    <Group>
                      <ThemeIcon
                        color={config.calcType === "custom" ? "orange" : "blue"}
                        variant="light"
                        size="lg"
                        radius="md"
                      >
                        {config.calcType === "custom" ? (
                          <IconCode size={20} />
                        ) : (
                          <IconCalculator size={20} />
                        )}
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="lg" style={{ color: "#1B2E3D" }}>
                          {config.title || "Безымянный раздел"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          ID: {config.id} | Логика: {config.calcType}
                        </Text>
                      </div>
                    </Group>

                    {/* УПРАВЛЕНИЕ БЛОКОМ (СТРЕЛКИ И УДАЛЕНИЕ) */}
                    <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                      <Tooltip label="Вверх">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => moveConfigUp(index)}
                          disabled={index === 0}
                        >
                          <IconArrowUp size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Вниз">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => moveConfigDown(index)}
                          disabled={index === configs.length - 1}
                        >
                          <IconArrowDown size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Дублировать блок">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleDuplicateConfig(config)}
                        >
                          <IconCopy size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить раздел">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleRemoveConfig(config.id)}
                        >
                          <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Accordion.Control>

                {/* СОДЕРЖИМОЕ АККОРДЕОНА (НАСТРОЙКИ) */}
                <Accordion.Panel>
                  <Stack gap="xl" p="md">
                    {/* ОСНОВНЫЕ НАСТРОЙКИ */}
                    <Paper p="md" withBorder radius="md" bg="#f8f9fa">
                      <Title order={5} mb="md" style={{ color: "#1B2E3D" }}>
                        <IconSettings
                          size={16}
                          style={{ verticalAlign: "middle", marginRight: 5 }}
                        />
                        Базовые настройки
                      </Title>
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            label="Название раздела (Для клиента)"
                            value={config.title}
                            onChange={(e) =>
                              updateConfig(
                                config.id,
                                "title",
                                e.currentTarget.value,
                              )
                            }
                            styles={{ label: { fontWeight: 600 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Select
                            label="Алгоритм расчета"
                            data={formulaTypes}
                            value={config.calcType}
                            onChange={(val) =>
                              updateConfig(config.id, "calcType", val)
                            }
                            styles={{ label: { fontWeight: 600 } }}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <MultiSelect
                            label="Доступные материалы (Прайс)"
                            placeholder="Выберите связанные услуги"
                            data={prices}
                            searchable
                            clearable
                            value={config.linkedPrices || []}
                            onChange={(val) =>
                              updateConfig(config.id, "linkedPrices", val)
                            }
                            styles={{ label: { fontWeight: 600 } }}
                          />
                        </Grid.Col>
                      </Grid>
                    </Paper>

                    {/* КАСТОМНАЯ ФОРМУЛА (ЕСЛИ ВЫБРАНА) */}
                    {config.calcType === "custom" && (
                      <Paper
                        p="md"
                        withBorder
                        radius="md"
                        style={{
                          borderLeft: "4px solid #f08c00",
                          backgroundColor: "#fffcf5",
                        }}
                      >
                        <Title order={5} mb="xs" style={{ color: "#d9480f" }}>
                          <IconCode
                            size={16}
                            style={{ verticalAlign: "middle", marginRight: 5 }}
                          />
                          Кастомная математика (JS Eval)
                        </Title>
                        <Text size="sm" c="dimmed" mb="md">
                          Используйте переменные <b>val1, val2...</b> (поля
                          ввода) и <b>basePrice</b> (выбранный прайс).
                          Поддерживаются скобки (), +, -, *, /.
                        </Text>
                        <TextInput
                          placeholder="Например: (val1 * val2 * basePrice) + ((val1 * 2 + val2 * 2) * 1500)"
                          value={config.customFormula}
                          onChange={(e) =>
                            updateConfig(
                              config.id,
                              "customFormula",
                              e.currentTarget.value,
                            )
                          }
                          styles={{
                            input: {
                              fontFamily: "monospace",
                              fontSize: "14px",
                              backgroundColor: "#343a40",
                              color: "#69db7c",
                            },
                          }}
                        />
                      </Paper>
                    )}

                    {/* ПОЛЯ ВВОДА */}
                    <Paper p="md" withBorder radius="md">
                      <Group justify="space-between" mb="md">
                        <Title order={5} style={{ color: "#1B2E3D" }}>
                          Поля для ввода (X, Y, Кол-во)
                        </Title>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={() => handleAddField(config.id)}
                        >
                          Добавить переменную
                        </Button>
                      </Group>

                      {config.fields.length === 0 ? (
                        <Text size="sm" c="dimmed">
                          Нет полей. Калькулятор будет использовать только
                          базовую цену.
                        </Text>
                      ) : (
                        <Grid>
                          {config.fields.map((field, fIndex) => (
                            <Grid.Col
                              span={{ base: 12, sm: 6, md: 4 }}
                              key={fIndex}
                            >
                              <Group align="flex-end">
                                <TextInput
                                  label={`Переменная ${field.name}`}
                                  value={field.label}
                                  onChange={(e) =>
                                    updateField(
                                      config.id,
                                      fIndex,
                                      e.currentTarget.value,
                                    )
                                  }
                                  style={{ flexGrow: 1 }}
                                />
                                <ActionIcon
                                  color="red"
                                  variant="subtle"
                                  onClick={() =>
                                    handleRemoveField(config.id, fIndex)
                                  }
                                  mb={5}
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Group>
                            </Grid.Col>
                          ))}
                        </Grid>
                      )}
                    </Paper>

                    {/* ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ (ЧЕКБОКСЫ) */}
                    <Paper
                      p="md"
                      withBorder
                      radius="md"
                      style={{ borderLeft: "4px solid #1B2E3D" }}
                    >
                      <Group justify="space-between" mb="md">
                        <div>
                          <Title order={5} style={{ color: "#1B2E3D" }}>
                            Дополнительные опции (Add-ons)
                          </Title>
                          <Text size="xs" c="dimmed">
                            Чекбоксы, которые увеличивают итоговую стоимость
                            (например: "Монтаж", "Срочность")
                          </Text>
                        </div>
                        <Button
                          size="xs"
                          variant="light"
                          color="indigo"
                          leftSection={<IconChecklist size={14} />}
                          onClick={() => handleAddAddon(config.id)}
                        >
                          Добавить опцию
                        </Button>
                      </Group>

                      {!config.addons || config.addons.length === 0 ? (
                        <Text size="sm" c="dimmed">
                          Дополнительные опции не настроены.
                        </Text>
                      ) : (
                        <Table striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Название опции</Table.Th>
                              <Table.Th>Тип наценки</Table.Th>
                              <Table.Th>Значение (₸ / %)</Table.Th>
                              <Table.Th w={50}></Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {config.addons.map((addon) => (
                              <Table.Tr key={addon.id}>
                                <Table.Td>
                                  <TextInput
                                    placeholder="Название (напр. Срочность)"
                                    value={addon.name}
                                    onChange={(e) =>
                                      updateAddon(
                                        config.id,
                                        addon.id,
                                        "name",
                                        e.currentTarget.value,
                                      )
                                    }
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <Select
                                    data={[
                                      {
                                        value: "fixed",
                                        label: "Фиксированная сумма (₸)",
                                      },
                                      {
                                        value: "percent",
                                        label: "Процент от итога (%)",
                                      },
                                    ]}
                                    value={addon.type}
                                    onChange={(val) =>
                                      updateAddon(
                                        config.id,
                                        addon.id,
                                        "type",
                                        val,
                                      )
                                    }
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <NumberInput
                                    value={addon.value}
                                    onChange={(val) =>
                                      updateAddon(
                                        config.id,
                                        addon.id,
                                        "value",
                                        val,
                                      )
                                    }
                                    min={0}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() =>
                                      handleRemoveAddon(config.id, addon.id)
                                    }
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      )}
                    </Paper>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>

          <Center mt="xl">
            <Button
              variant="outline"
              color="gray"
              leftSection={<IconPlus size={16} />}
              onClick={handleAddConfig}
              size="md"
            >
              Добавить еще один раздел
            </Button>
          </Center>
        </>
      )}

      {/* ПЛАВАЮЩАЯ ПАНЕЛЬ СОХРАНЕНИЯ (Для удобства при долгом скролле) */}
      <Box
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid #eaeaea",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 100,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <Button
          leftSection={<IconDeviceFloppy size={18} />}
          onClick={handleSaveConfigs}
          loading={isSaving}
          style={{ backgroundColor: "#1B2E3D", color: "white" }}
          size="lg"
        >
          Сохранить изменения
        </Button>
      </Box>
    </div>
  );
}
