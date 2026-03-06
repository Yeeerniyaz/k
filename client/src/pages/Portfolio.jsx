import { useState, useEffect } from 'react';
import {
  Title, Text, Paper, Grid, Card, Image, Button, Group, 
  ActionIcon, Skeleton, Alert, Tooltip, Modal, TextInput, 
  Select, Textarea, FileInput, Badge, Center, Stack // 🔥 Добавили Stack сюда!
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, IconTrash, IconAlertCircle, IconRefresh, 
  IconUpload, IconPhoto
} from '@tabler/icons-react';
import api from '../api/index.js';

export default function Portfolio() {
  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // СОСТОЯНИЯ МОДАЛЬНОГО ОКНА (ДОБАВЛЕНИЕ)
  // ==========================================
  const [opened, { open, close }] = useDisclosure(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Категории должны совпадать с теми, что мы используем на витрине
  const categoryOptions = [
    { value: 'banners', label: 'Баннеры' },
    { value: 'lightboxes', label: 'Лайтбоксы' },
    { value: 'signboards', label: 'Вывески' },
    { value: '3d-figures', label: 'Объемные фигуры' },
    { value: 'metal-frames', label: 'Металлокаркасы' },
    { value: 'pos-materials', label: 'ПОС материалы' },
  ];

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ЗАГРУЗКА ПОРТФОЛИО
  // ==========================================
  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/portfolio');
      setItems(response.data.data || []);
    } catch (err) {
      console.error('Ошибка загрузки портфолио:', err);
      setError('Не удалось загрузить работы. Проверьте соединение с сервером.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // ==========================================
  // БИЗНЕС-ЛОГИКА: ДОБАВЛЕНИЕ НОВОЙ РАБОТЫ
  // ==========================================
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !category || !file) return;

    setIsSubmitting(true);
    
    // Для отправки файлов используем FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('image', file);

    try {
      // Отправляем мультипарт-запрос через наш смарт-клиент
      await api.post('/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Очищаем форму и закрываем модалку
      setTitle('');
      setCategory('');
      setDescription('');
      setFile(null);
      close();
      
      // Обновляем список работ
      fetchPortfolio();
    } catch (err) {
      console.error('Ошибка при создании работы:', err);
      alert(err.response?.data?.message || 'Ошибка при загрузке работы. Возможно, файл слишком большой.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // БИЗНЕС-ЛОГИКА: УДАЛЕНИЕ РАБОТЫ
  // ==========================================
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту работу из портфолио?')) return;
    
    try {
      await api.delete(`/portfolio/${id}`);
      // Локально удаляем из стейта, чтобы не делать лишний запрос к БД
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      alert('Не удалось удалить работу.');
    }
  };

  // Вспомогательная функция для красивого названия категории
  const getCategoryLabel = (val) => {
    const cat = categoryOptions.find(c => c.value === val);
    return cat ? cat.label : val;
  };

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif' }}>
      
      {/* ========================================== */}
      {/* ШАПКА СТРАНИЦЫ */}
      {/* ========================================== */}
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} style={{ color: '#1B2E3D' }}>Управление портфолио</Title>
          <Text c="dimmed" mt={5}>Добавляйте фотографии выполненных проектов для витрины</Text>
        </div>
        
        <Group>
          <Tooltip label="Обновить данные">
            <ActionIcon variant="default" size="lg" onClick={fetchPortfolio} loading={loading}>
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={open}
            style={{ backgroundColor: '#1B2E3D', color: 'white', fontWeight: 600 }}
          >
            Добавить работу
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Ошибка API" color="red" mb="xl" radius="md">
          {error}
        </Alert>
      )}

      {/* ========================================== */}
      {/* СЕТКА ПОРТФОЛИО */}
      {/* ========================================== */}
      {loading ? (
        <Grid gutter="md">
          {[1, 2, 3, 4].map((i) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Skeleton height={250} radius="md" />
            </Grid.Col>
          ))}
        </Grid>
      ) : items.length > 0 ? (
        <Grid gutter="md">
          {items.map((item) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
              <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Section style={{ position: 'relative' }}>
                  <Image
                    src={item.imageUrl}
                    height={200}
                    alt={item.title}
                    fallbackSrc="https://placehold.co/600x400?text=Нет+Изображения"
                  />
                  <Badge 
                    variant="filled" 
                    style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#1B2E3D' }}
                  >
                    {getCategoryLabel(item.category)}
                  </Badge>
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={600} style={{ color: '#1B2E3D' }} lineClamp={1} title={item.title}>
                    {item.title}
                  </Text>
                </Group>

                <Text size="sm" c="dimmed" lineClamp={2} style={{ flexGrow: 1 }}>
                  {item.description || 'Нет описания'}
                </Text>

                <Button 
                  variant="light" 
                  color="red" 
                  fullWidth 
                  mt="md" 
                  radius="md"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => handleDelete(item.id)}
                >
                  Удалить
                </Button>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Paper withBorder p={60} radius="md" bg="white">
          <Center style={{ flexDirection: 'column' }}>
            <IconPhoto size={60} color="#e0e0e0" stroke={1} />
            <Text size="lg" fw={500} mt="md" style={{ color: '#1B2E3D' }}>Портфолио пусто</Text>
            <Text c="dimmed" mt={5}>Загрузите первую фотографию, чтобы клиенты увидели ваши работы.</Text>
            <Button mt="lg" style={{ backgroundColor: '#1B2E3D' }} onClick={open}>
              Загрузить работу
            </Button>
          </Center>
        </Paper>
      )}

      {/* ========================================== */}
      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ */}
      {/* ========================================== */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={<Title order={3} style={{ color: '#1B2E3D' }}>Новая работа</Title>}
        size="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="Название проекта"
              placeholder="Например: Световая вывеска для ресторана"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <Select
              label="Категория"
              placeholder="Выберите раздел"
              data={categoryOptions}
              required
              value={category}
              onChange={setCategory}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <FileInput
              label="Фотография работы"
              placeholder="Нажмите, чтобы выбрать файл"
              required
              accept="image/png,image/jpeg,image/webp"
              leftSection={<IconUpload size={16} />}
              value={file}
              onChange={setFile}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <Textarea
              label="Описание (необязательно)"
              placeholder="Кратко опишите материалы и особенности монтажа"
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              styles={{ label: { color: '#1B2E3D', fontWeight: 600 } }}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={close}>Отмена</Button>
              <Button type="submit" loading={isSubmitting} style={{ backgroundColor: '#1B2E3D' }}>
                Сохранить
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

    </div>
  );
}