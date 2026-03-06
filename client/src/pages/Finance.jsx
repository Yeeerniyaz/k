import { useState, useEffect } from 'react';
import {
  Title, Text, Paper, Table, Button, Group, ActionIcon, 
  Skeleton, Alert, Tooltip, Modal, Select, NumberInput, 
  TextInput, Badge, Center, Stack, Grid, Card, ThemeIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, IconTrash, IconAlertCircle, IconRefresh, 
  IconEdit, IconReceipt2, IconWallet, IconCalendarStats
} from '@tabler/icons-react';
import api from '../api/index.js';

export default function Finance() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (СОЗДАНИЕ / РЕДАКТИРОВАНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState(null);
  
  // Поля формы
  const [category, setCategory] = useState('Аренда');
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Категории общих расходов
  const expenseCategories = [
    'Аренда помещений',
    'Налоги и сборы',
    'Зарплата (Оклад)',
    'Реклама и Маркетинг',
    'Связь и Интернет',
    'Хозяйственные нужды',
    'Транспорт (ГСМ)',
    'Прочее'
  ];

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА РАСХОДОВ
  // ==========================================
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/finance/expenses');
      setExpenses(response.data.data || response.data || []);
    } catch (err) {
      console.error('Ошибка загрузки общих расходов:', err);
      // Сеньорский фоллбэк: демо-данные, пока бэкенд не готов
      setExpenses([
        { id: 'exp-1', category: 'Аренда помещений', amount: 350000, comment: 'Оплата цеха за текущий месяц', date: new Date().toISOString() },
        { id: 'exp-2', category: 'Реклама и Маркетинг', amount: 50000, comment: 'Таргет в Instagram', date: new Date(Date.now() - 86400000).toISOString() },
        { id: 'exp-3', category: 'Связь и Интернет', amount: 15000, comment: 'Оплата за корпоративные номера и Wi-Fi', date: new Date(Date.now() - 172800000).toISOString() },
      ]);
      setError('Не удалось подключиться к финансовой базе. Показаны демонстрационные данные.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ОТКРЫТИЕ МОДАЛКИ
  // ==========================================
  const handleOpenModal = (item = null) => {
    if (item) {
      // Режим редактирования
      setEditingId(item.id);
      setCategory(item.category);
      setAmount(item.amount);
      setComment(item.comment || '');
    } else {
      // Режим создания
      setEditingId(null);
      setCategory('Аренда помещений');
      setAmount(0);
      setComment('');
    }
    open();
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: СОХРАНЕНИЕ РАСХОДА
  // ==========================================
  const handleSave = async (e) => {
    e.preventDefault();
    if (!category || amount <= 0) {
      alert('Пожалуйста, выберите категорию и укажите сумму больше нуля.');
      return;
    }

    setIsSubmitting(true);
    const payload = { category, amount, comment };

    try {
      if (editingId) {
        await api.put(`/finance/expenses/${editingId}`, payload);
      } else {
        await api.post('/finance/expenses', payload);
      }
      
      close();
      fetchExpenses(); 
    } catch (err) {
      console.error('Ошибка при сохранении расхода:', err);
      // Имитация для демо-режима
      if (error) {
        if (editingId) {
          setExpenses(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } : p));
        } else {
          setExpenses(prev => [{ id: Date.now().toString(), ...payload, date: new Date().toISOString() }, ...prev]);
        }
        close();
      } else {
        alert(err.response?.data?.message || 'Ошибка при сохранении транзакции.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УДАЛЕНИЕ
  // ==========================================
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту транзакцию? Это повлияет на общую аналитику.')) return;
    
    try {
      await api.delete(`/finance/expenses/${id}`);
      setExpenses(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      if (error) {
        setExpenses(prev => prev.filter(item => item.id !== id));
      } else {
        alert('Не удалось удалить транзакцию.');
      }
    }
  };

  // ==========================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ==========================================
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Расчет итогов для верхних карточек
  const totalExpensesAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      
      {/* ========================================== */}
      {/* ШАПКА СТРАНИЦЫ */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#1B2E3D' }}>Общие расходы компании</Title>
          <Text c="dimmed" mt={5}>Учет операционных затрат (аренда, налоги, маркетинг)</Text>
        </div>
        
        <Group>
          <Tooltip label="Обновить данные">
            <ActionIcon variant="default" size="lg" onClick={fetchExpenses} loading={loading}>
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={() => handleOpenModal()}
            style={{ backgroundColor: '#1B2E3D', color: 'white', fontWeight: 600 }}
          >
            Зафиксировать расход
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Внимание (Режим разработки)" color="orange" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* МИНИ-ДАШБОРД РАСХОДОВ */}
      {/* ========================================== */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" radius="md" shadow="sm" style={{ borderLeft: '4px solid #fa5252' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={600} tt="uppercase">Сумма общих расходов</Text>
              <ThemeIcon color="red" variant="light" size={38} radius="md">
                <IconWallet size={20} stroke={1.5} />
              </ThemeIcon>
            </Group>
            <Group align="flex-end" gap="xs" mt={25}>
              <Text style={{ fontSize: '28px', fontWeight: 700, color: '#fa5252' }}>
                {totalExpensesAmount.toLocaleString('ru-RU')} ₸
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={7}>За весь период учета</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" radius="md" shadow="sm" style={{ borderLeft: '4px solid #1B2E3D' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed" fw={600} tt="uppercase">Количество транзакций</Text>
              <ThemeIcon style={{ backgroundColor: '#1B2E3D' }} variant="filled" size={38} radius="md">
                <IconReceipt2 size={20} stroke={1.5} />
              </ThemeIcon>
            </Group>
            <Group align="flex-end" gap="xs" mt={25}>
              <Text style={{ fontSize: '28px', fontWeight: 700, color: '#1B2E3D' }}>
                {expenses.length}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" mt={7}>Записей в базе данных</Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* ========================================== */}
      {/* ТАБЛИЦА РАСХОДОВ */}
      {/* ========================================== */}
      <Title order={4} mb="md" style={{ color: '#1B2E3D' }}>История транзакций</Title>
      <Paper withBorder radius="md" shadow="sm" p={0} style={{ overflow: 'hidden', backgroundColor: 'white' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} mb="sm" />
            <Skeleton height={40} />
          </div>
        ) : expenses.length > 0 ? (
          <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
              <Table.Tr>
                <Table.Th style={{ color: '#1B2E3D' }}>Дата и Время</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Категория</Table.Th>
                <Table.Th style={{ color: '#1B2E3D' }}>Комментарий / Детали</Table.Th>
                <Table.Th style={{ color: '#1B2E3D', textAlign: 'right' }}>Сумма</Table.Th>
                <Table.Th style={{ color: '#1B2E3D', textAlign: 'right' }}>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {expenses.map((item) => (
                <Table.Tr key={item.id}>
                  {/* Дата */}
                  <Table.Td>
                    <Group gap="xs">
                      <IconCalendarStats size={16} color="gray" />
                      <Text size="sm" fw={500} style={{ color: '#1B2E3D' }}>{formatDate(item.date)}</Text>
                    </Group>
                  </Table.Td>
                  
                  {/* Категория */}
                  <Table.Td>
                    <Badge color="gray" variant="light" style={{ color: '#1B2E3D' }}>
                      {item.category}
                    </Badge>
                  </Table.Td>

                  {/* Комментарий */}
                  <Table.Td>
                    <Text size="sm" lineClamp={2} maw={300}>
                      {item.comment || <Text fs="italic" c="dimmed">Нет комментария</Text>}
                    </Text>
                  </Table.Td>
                  
                  {/* Сумма */}
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Text fw={700} color="red">
                      -{item.amount.toLocaleString('ru-RU')} ₸
                    </Text>
                  </Table.Td>

                  {/* Действия */}
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Редактировать">
                        <ActionIcon variant="light" color="blue" onClick={() => handleOpenModal(item)}>
                          <IconEdit size={16} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить транзакцию">
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(item.id)}>
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
          <Center style={{ padding: '60px 20px', flexDirection: 'column' }}>
            <IconReceipt2 size={48} color="#e0e0e0" stroke={1.5} />
            <Text size="lg" fw={500} mt="md" style={{ color: '#1B2E3D' }}>Нет записанных расходов</Text>
            <Text c="dimmed" mt={5}>Добавьте операционные затраты для точного расчета прибыли.</Text>
            <Button mt="md" variant="default" onClick={() => handleOpenModal()}>Добавить транзакцию</Button>
          </Center>
        )}
      </Paper>

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО: ДОБАВИТЬ / РЕДАКТИРОВАТЬ */}
      {/* ========================================== */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={<Title order={3} style={{ color: '#1B2E3D' }}>{editingId ? 'Редактировать транзакцию' : 'Новый операционный расход'}</Title>}
        size="md"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleSave}>
          <Stack gap="md">
            
            <Select
              label="Категория расхода"
              placeholder="Выберите из списка"
              data={expenseCategories}
              required
              value={category}
              onChange={setCategory}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <NumberInput
              label="Сумма (₸)"
              placeholder="Сколько потрачено"
              required
              min={0}
              step={1000}
              value={amount}
              onChange={setAmount}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
              leftSection={<Text fw={700} c="dimmed" ml="xs">₸</Text>}
            />

            <TextInput
              label="Детали / Комментарий"
              placeholder="Например: Аренда за март 2026"
              value={comment}
              onChange={(e) => setComment(e.currentTarget.value)}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="default" onClick={close}>Отмена</Button>
              <Button type="submit" loading={isSubmitting} color="red">
                {editingId ? 'Сохранить изменения' : 'Списать средства'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

    </div>
  );
}