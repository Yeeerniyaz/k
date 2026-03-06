import { useState, useEffect } from 'react';
import {
  Title, Text, Paper, Button, Group, ActionIcon, 
  Skeleton, Alert, Select, TextInput, Badge, Center, 
  Stack, Accordion, Divider, Grid, ThemeIcon, MultiSelect, 
  Tooltip, NumberInput, Table, Box // 🔥 Добавили Box сюда!
} from '@mantine/core';
import { 
  IconPlus, IconTrash, IconAlertCircle, IconRefresh, 
  IconCalculator, IconMathFunction, IconSettings, 
  IconDeviceFloppy, IconCode, IconChecklist
} from '@tabler/icons-react';
import api from '../api/index.js';

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
    { value: 'area', label: 'Площадь (X × Y × Базовая Цена)' },
    { value: 'height_count', label: 'Размер × Количество (X × Y × Базовая Цена)' },
    { value: 'length', label: 'Погонный метр (X × Базовая Цена)' },
    { value: 'unit', label: 'Поштучно (Количество × Базовая Цена)' },
    { value: 'custom', label: 'Своя сложная формула (Custom Math)' } 
  ];

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ДАННЫХ
  // ==========================================
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pricesRes = await api.get('/prices');
      const loadedPrices = pricesRes.data.data || pricesRes.data || [];
      setPrices(loadedPrices.map(p => ({ value: p.id || p.service, label: `${p.service} (${p.price} ₸)` })));

      const configRes = await api.get('/settings/calculator');
      if (configRes.data && configRes.data.config) {
        // Убеждаемся, что у всех есть массив addons
        const loadedConfigs = configRes.data.config.map(c => ({ ...c, addons: c.addons || [] }));
        setConfigs(loadedConfigs);
      } else {
        setConfigs([]);
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      // Сеньорский фоллбэк с супер-настройками
      setConfigs([
        {
          id: 'banners',
          title: 'Баннеры',
          calcType: 'area',
          customFormula: '',
          fields: [{ name: 'val1', label: 'Ширина (м)' }, { name: 'val2', label: 'Высота (м)' }],
          linkedPrices: [],
          addons: [
            { id: 'add-1', name: 'Усиленная проклейка краев', type: 'fixed', value: 1500 },
            { id: 'add-2', name: 'Срочная печать (24 часа)', type: 'percent', value: 30 }
          ]
        },
        {
          id: 'complex_lightbox',
          title: 'Сложный Лайтбокс',
          calcType: 'custom',
          customFormula: '(val1 * val2 * basePrice) + ((val1 * 2 + val2 * 2) * 2500)', // Площадь + Периметр (профиль)
          fields: [{ name: 'val1', label: 'Ширина (м)' }, { name: 'val2', label: 'Высота (м)' }],
          linkedPrices: [],
          addons: [
            { id: 'add-3', name: 'Сложный монтаж (вышка)', type: 'fixed', value: 25000 }
          ]
        }
      ]);
      setError('Автономный режим. Загружен демонстрационный Advanced конструктор.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // ФУНКЦИИ КОНСТРУКТОРА: БЛОКИ
  // ==========================================
  const handleAddConfig = () => {
    setConfigs([
      ...configs,
      {
        id: `section_${Date.now()}`,
        title: 'Новый раздел',
        calcType: 'area',
        customFormula: '',
        fields: [{ name: 'val1', label: 'Поле 1' }],
        linkedPrices: [],
        addons: []
      }
    ]);
  };

  const handleRemoveConfig = (index) => {
    if (!window.confirm('Удалить этот раздел калькулятора?')) return;
    const newConfigs = [...configs];
    newConfigs.splice(index, 1);
    setConfigs(newConfigs);
  };

  const handleChangeConfig = (index, key, value) => {
    const newConfigs = [...configs];
    newConfigs[index][key] = value;

    if (key === 'calcType') {
      if (value === 'length' || value === 'unit') {
        newConfigs[index].fields = [{ name: 'val1', label: 'Значение' }];
      } else if (value === 'area' || value === 'height_count') {
        newConfigs[index].fields = [
          { name: 'val1', label: 'Ширина / Размер' },
          { name: 'val2', label: 'Высота / Количество' }
        ];
      }
      // При кастомном типе поля не трогаем, даем юзеру самому добавлять
    }
    
    setConfigs(newConfigs);
  };

  // ==========================================
  // ФУНКЦИИ КОНСТРУКТОРА: ПОЛЯ ВВОДА (ДЛЯ КАСТОМА)
  // ==========================================
  const handleAddField = (cIndex) => {
    const newConfigs = [...configs];
    const fieldsCount = newConfigs[cIndex].fields.length;
    newConfigs[cIndex].fields.push({ name: `val${fieldsCount + 1}`, label: `Новое поле ${fieldsCount + 1}` });
    setConfigs(newConfigs);
  };

  const handleRemoveField = (cIndex, fIndex) => {
    const newConfigs = [...configs];
    newConfigs[cIndex].fields.splice(fIndex, 1);
    // Пересчитываем имена переменных
    newConfigs[cIndex].fields.forEach((f, i) => { f.name = `val${i + 1}` });
    setConfigs(newConfigs);
  };

  const handleChangeField = (cIndex, fIndex, newLabel) => {
    const newConfigs = [...configs];
    newConfigs[cIndex].fields[fIndex].label = newLabel;
    setConfigs(newConfigs);
  };

  // ==========================================
  // ФУНКЦИИ КОНСТРУКТОРА: НАДБАВКИ (ADDONS)
  // ==========================================
  const handleAddAddon = (cIndex) => {
    const newConfigs = [...configs];
    if (!newConfigs[cIndex].addons) newConfigs[cIndex].addons = [];
    newConfigs[cIndex].addons.push({ id: `add_${Date.now()}`, name: 'Новая опция', type: 'fixed', value: 0 });
    setConfigs(newConfigs);
  };

  const handleRemoveAddon = (cIndex, aIndex) => {
    const newConfigs = [...configs];
    newConfigs[cIndex].addons.splice(aIndex, 1);
    setConfigs(newConfigs);
  };

  const handleChangeAddon = (cIndex, aIndex, key, val) => {
    const newConfigs = [...configs];
    newConfigs[cIndex].addons[aIndex][key] = val;
    setConfigs(newConfigs);
  };

  // ==========================================
  // СОХРАНЕНИЕ
  // ==========================================
  const handleSaveConfigs = async () => {
    setIsSaving(true);
    try {
      await api.post('/settings/calculator', { config: configs });
      alert('Сложная архитектура калькулятора успешно сохранена!');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      if (error) {
        alert('Демо-режим: настройки визуально сохранены (бэкенд не подключен).');
      } else {
        alert('Не удалось сохранить настройки.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif', paddingBottom: '100px' }}>
      
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#1B2E3D' }}>Enterprise Конструктор</Title>
          <Text c="dimmed" mt={5}>Сложные формулы, модификаторы цен и динамические инпуты</Text>
        </div>
        
        <Group>
          <Tooltip label="Сбросить изменения">
            <ActionIcon variant="default" size="lg" onClick={fetchData} loading={loading}>
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Button 
            leftSection={<IconDeviceFloppy size={16} />} 
            onClick={handleSaveConfigs}
            loading={isSaving}
            style={{ backgroundColor: '#1B2E3D', color: 'white', fontWeight: 600 }}
          >
            Сохранить архитектуру
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Инженерный режим" color="blue" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton height={400} radius="md" />
      ) : (
        <Paper withBorder radius="md" p="md" bg="white" shadow="sm">
          <Group justify="space-between" mb="lg">
            <Group gap="sm">
              <ThemeIcon size={40} radius="md" color="royalBlue" variant="light">
                <IconSettings size={24} color="#1B2E3D" />
              </ThemeIcon>
              <div>
                <Title order={4} style={{ color: '#1B2E3D' }}>Блоки калькулятора</Title>
                <Text size="xs" c="dimmed">Каждый блок — это отдельная логика на сайте.</Text>
              </div>
            </Group>
            <Button variant="light" color="blue" leftSection={<IconPlus size={16} />} onClick={handleAddConfig}>
              Добавить логический блок
            </Button>
          </Group>

          {configs.length === 0 ? (
            <Center p="xl"><Text c="dimmed">Калькулятор пуст. Добавьте первый блок.</Text></Center>
          ) : (
            <Accordion variant="separated" radius="md">
              {configs.map((config, cIndex) => (
                <Accordion.Item key={config.id} value={config.id} style={{ border: '1px solid #eaeaea' }}>
                  
                  {/* ЗАГОЛОВОК АККОРДЕОНА */}
                  <Accordion.Control>
                    <Group justify="space-between">
                      <Group gap="md">
                        <IconCalculator size={20} color={config.calcType === 'custom' ? 'orange' : '#1B2E3D'} />
                        <Text fw={600} style={{ color: '#1B2E3D' }}>{config.title || 'Безымянный раздел'}</Text>
                      </Group>
                      <Badge color={config.calcType === 'custom' ? 'orange' : 'gray'} variant="light">
                        {formulaTypes.find(f => f.value === config.calcType)?.label || 'Формула'}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  
                  {/* ТЕЛО НАСТРОЕК */}
                  <Accordion.Panel>
                    <Stack gap="xl" mt="md">
                      
                      {/* 1. БАЗОВАЯ ЛОГИКА */}
                      <Paper p="md" bg="#f8f9fa" radius="md" withBorder>
                        <Title order={6} mb="md" style={{ color: '#1B2E3D' }}>Основная логика</Title>
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <TextInput
                              label="Название раздела (видит клиент)"
                              placeholder="Например: Баннеры"
                              value={config.title}
                              onChange={(e) => handleChangeConfig(cIndex, 'title', e.currentTarget.value)}
                              fw={600}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <Select
                              label="Движок расчета"
                              data={formulaTypes}
                              value={config.calcType}
                              onChange={(val) => handleChangeConfig(cIndex, 'calcType', val)}
                              leftSection={<IconMathFunction size={16} />}
                              fw={600}
                            />
                          </Grid.Col>
                        </Grid>

                        {/* КАСТОМНАЯ ФОРМУЛА (Только если выбран тип custom) */}
                        {config.calcType === 'custom' && (
                          <Box mt="md" p="md" style={{ backgroundColor: '#fff', border: '1px dashed orange', borderRadius: '8px' }}>
                            <Group gap="xs" mb="xs">
                              <IconCode size={18} color="orange" />
                              <Text fw={600} size="sm" color="orange">Синтаксис кастомной формулы</Text>
                            </Group>
                            <Text size="xs" c="dimmed" mb="md">
                              Используйте математические операторы <b>+, -, *, /, ()</b>. Переменные: <b>basePrice</b> (выбранная цена материала), <b>val1, val2...</b> (поля ввода пользователя).
                            </Text>
                            <TextInput
                              placeholder="Например: (val1 * val2 * basePrice) + 5000"
                              value={config.customFormula}
                              onChange={(e) => handleChangeConfig(cIndex, 'customFormula', e.currentTarget.value)}
                              styles={{ input: { fontFamily: 'monospace', color: '#1B2E3D' } }}
                            />
                          </Box>
                        )}
                      </Paper>

                      {/* 2. ПОЛЯ ВВОДА (INPUTS) */}
                      <Paper p="md" bg="#f8f9fa" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                          <div>
                            <Title order={6} style={{ color: '#1B2E3D' }}>Поля ввода для клиента</Title>
                            <Text size="xs" c="dimmed">Какие размеры или параметры должен ввести клиент?</Text>
                          </div>
                          {config.calcType === 'custom' && (
                            <Button size="xs" variant="light" onClick={() => handleAddField(cIndex)}>
                              + Добавить переменную
                            </Button>
                          )}
                        </Group>
                        
                        <Grid>
                          {config.fields.map((field, fIndex) => (
                            <Grid.Col span={{ base: 12, md: 6 }} key={fIndex}>
                              <TextInput
                                label={config.calcType === 'custom' ? `Переменная: ${field.name}` : `Метка поля`}
                                value={field.label}
                                onChange={(e) => handleChangeField(cIndex, fIndex, e.currentTarget.value)}
                                description={`Внутреннее имя: ${field.name}`}
                                rightSection={
                                  config.calcType === 'custom' && config.fields.length > 1 ? (
                                    <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveField(cIndex, fIndex)}>
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  ) : null
                                }
                              />
                            </Grid.Col>
                          ))}
                        </Grid>
                      </Paper>

                      {/* 3. ДОПОЛНИТЕЛЬНЫЕ ОПЦИИ (ADD-ONS) */}
                      <Paper p="md" bg="#f8f9fa" radius="md" withBorder style={{ borderLeft: '4px solid #339af0' }}>
                        <Group justify="space-between" mb="md">
                          <Group gap="xs">
                            <IconChecklist size={20} color="#339af0" />
                            <div>
                              <Title order={6} style={{ color: '#1B2E3D' }}>Надбавки и Опции (Add-ons)</Title>
                              <Text size="xs" c="dimmed">Чекбоксы для доп. услуг (Срочность, Монтаж, Усиление)</Text>
                            </div>
                          </Group>
                          <Button size="xs" color="blue" variant="light" leftSection={<IconPlus size={14}/>} onClick={() => handleAddAddon(cIndex)}>
                            Добавить опцию
                          </Button>
                        </Group>

                        {config.addons && config.addons.length > 0 ? (
                          <Table verticalSpacing="sm">
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>Название опции</Table.Th>
                                <Table.Th>Тип надбавки</Table.Th>
                                <Table.Th>Значение</Table.Th>
                                <Table.Th></Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {config.addons.map((addon, aIndex) => (
                                <Table.Tr key={addon.id}>
                                  <Table.Td>
                                    <TextInput 
                                      placeholder="Например: Монтаж" 
                                      value={addon.name} 
                                      onChange={(e) => handleChangeAddon(cIndex, aIndex, 'name', e.currentTarget.value)}
                                    />
                                  </Table.Td>
                                  <Table.Td>
                                    <Select 
                                      data={[
                                        { value: 'fixed', label: 'Фикс. сумма (₸)' },
                                        { value: 'percent', label: 'Процент от итога (%)' }
                                      ]}
                                      value={addon.type}
                                      onChange={(val) => handleChangeAddon(cIndex, aIndex, 'type', val)}
                                    />
                                  </Table.Td>
                                  <Table.Td>
                                    <NumberInput 
                                      min={0} 
                                      value={addon.value}
                                      onChange={(val) => handleChangeAddon(cIndex, aIndex, 'value', val)}
                                    />
                                  </Table.Td>
                                  <Table.Td ta="right">
                                    <ActionIcon color="red" variant="subtle" onClick={() => handleRemoveAddon(cIndex, aIndex)}>
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        ) : (
                          <Text size="sm" c="dimmed" ta="center" py="sm">Нет дополнительных опций</Text>
                        )}
                      </Paper>

                      {/* 4. ПРИВЯЗКА БАЗОВЫХ ЦЕН */}
                      <Paper p="md" bg="#f8f9fa" radius="md" withBorder>
                        <Title order={6} mb="md" style={{ color: '#1B2E3D' }}>Привязка базовых цен (Прайс-лист)</Title>
                        <MultiSelect
                          label="Доступные материалы для этого раздела (Это будет переменная basePrice)"
                          placeholder="Выберите цены из базы данных"
                          data={prices}
                          searchable
                          value={config.linkedPrices || []}
                          onChange={(val) => handleChangeConfig(cIndex, 'linkedPrices', val)}
                        />
                      </Paper>

                      {/* 5. УДАЛЕНИЕ БЛОКА */}
                      <Group justify="flex-end">
                        <Button variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={() => handleRemoveConfig(cIndex)}>
                          Удалить раздел полностью
                        </Button>
                      </Group>

                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Paper>
      )}
    </div>
  );
}