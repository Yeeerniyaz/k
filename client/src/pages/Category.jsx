import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Title, Text, Grid, Card, Image, Button, Group, 
  Center, Skeleton, Modal, Box, ActionIcon, Badge, Affix, Transition, rem
} from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { IconArrowLeft, IconZoomIn, IconPhotoOff, IconArrowUp } from '@tabler/icons-react';
import api from '../api/index.js';

export default function Category() {
  const { id } = useParams(); // Получаем ID категории из URL
  const navigate = useNavigate();
  const [scroll, scrollTo] = useWindowScroll();

  // ==========================================
  // СЛОВАРЬ КАТЕГОРИЙ (Метаданные для шапки)
  // ==========================================
  const categoryMeta = {
    'banners': { title: 'Баннеры', desc: 'Примеры нашей широкоформатной и интерьерной печати.' },
    'lightboxes': { title: 'Лайтбоксы', desc: 'Галерея световых коробов различной сложности.' },
    'signboards': { title: 'Вывески', desc: 'Фасадные и интерьерные вывески премиум-класса.' },
    '3d-figures': { title: 'Объемные фигуры', desc: 'Реализованные проекты объемных световых и несветовых букв.' },
    'metal-frames': { title: 'Металлокаркасы', desc: 'Надежные несущие конструкции и сварные работы.' },
    'pos-materials': { title: 'ПОС материалы', desc: 'Оформление витрин, ролл-апы и промо-столы.' }
  };

  const currentMeta = categoryMeta[id] || { title: 'Наши работы', desc: 'Галерея выполненных проектов.' };

  // ==========================================
  // СОСТОЯНИЯ ДАННЫХ
  // ==========================================
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для Lightbox (увеличенного просмотра)
  const [selectedImage, setSelectedImage] = useState(null);

  // ==========================================
  // ЗАГРУЗКА И ФИЛЬТРАЦИЯ ПОРТФОЛИО
  // ==========================================
  useEffect(() => {
    const fetchCategoryItems = async () => {
      try {
        setLoading(true);
        const response = await api.get('/portfolio');
        const allItems = response.data.data || [];
        
        // Фильтруем работы, оставляем только те, что относятся к текущей категории
        const filteredItems = allItems.filter(item => item.category === id);
        setItems(filteredItems);
      } catch (err) {
        console.error('Ошибка загрузки галереи:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryItems();
  }, [id]);

  return (
    <div style={{ fontFamily: '"Google Sans", sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* ========================================== */}
      {/* ПЛАВАЮЩАЯ КНОПКА "НАВЕРХ" */}
      {/* ========================================== */}
      <Affix position={{ bottom: rem(20), right: rem(20) }}>
        <Transition transition="slide-up" mounted={scroll.y > 300}>
          {(transitionStyles) => (
            <ActionIcon
              style={{ ...transitionStyles, backgroundColor: '#1B2E3D', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(27, 46, 61, 0.3)' }}
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

      {/* ========================================== */}
      {/* ШАПКА ГАЛЕРЕИ */}
      {/* ========================================== */}
      <Box bg="white" pt={60} pb={40} style={{ borderBottom: '1px solid #eaeaea' }}>
        <Container size="lg">
          <Group mb="xl">
            <Button 
              variant="subtle" 
              color="gray" 
              leftSection={<IconArrowLeft size={16} />} 
              onClick={() => navigate('/')}
              style={{ color: '#1B2E3D' }}
            >
              Вернуться на главную
            </Button>
          </Group>
          
          <Center style={{ flexDirection: 'column' }}>
            <Badge size="lg" variant="light" color="gray" mb="md" radius="sm" style={{ color: '#1B2E3D' }}>
              Галерея проектов
            </Badge>
            <Title 
              order={1} 
              ta="center"
              style={{ color: '#1B2E3D', fontFamily: '"Alyamama", sans-serif', letterSpacing: '1px', fontSize: 'clamp(32px, 5vw, 48px)' }}
            >
              {currentMeta.title}
            </Title>
            <Text c="dimmed" size="lg" ta="center" mt="sm" maw={600}>
              {currentMeta.desc}
            </Text>
          </Center>
        </Container>
      </Box>

      {/* ========================================== */}
      {/* СЕТКА ФОТОГРАФИЙ */}
      {/* ========================================== */}
      <Container size="lg" py={60}>
        {loading ? (
          <Grid gutter="xl">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton height={300} radius="md" />
              </Grid.Col>
            ))}
          </Grid>
        ) : items.length > 0 ? (
          <Grid gutter="xl">
            {items.map((item) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={item.id}>
                <Card 
                  shadow="sm" 
                  padding={0} 
                  radius="md" 
                  withBorder 
                  style={{ cursor: 'pointer', overflow: 'hidden', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(27, 46, 61, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'; }}
                  onClick={() => setSelectedImage(item)}
                >
                  <Box style={{ position: 'relative' }}>
                    <Image
                      src={item.imageUrl}
                      height={300}
                      alt={item.title}
                      fallbackSrc="https://placehold.co/600x400?text=Нет+Изображения"
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Overlay, который появляется при наведении (через CSS) */}
                    <Center 
                      style={{ 
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: 'rgba(27, 46, 61, 0.6)', opacity: 0, transition: 'opacity 0.2s',
                        color: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    >
                      <IconZoomIn size={48} stroke={1.5} />
                    </Center>
                  </Box>
                  <Box p="md" bg="white">
                    <Text fw={600} style={{ color: '#1B2E3D' }} lineClamp={1}>
                      {item.title}
                    </Text>
                  </Box>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Center style={{ flexDirection: 'column', padding: '100px 0' }}>
            <IconPhotoOff size={60} color="#e0e0e0" stroke={1} />
            <Title order={3} mt="md" style={{ color: '#1B2E3D' }}>Работ пока нет</Title>
            <Text c="dimmed" mt="sm" ta="center">Мы еще не загрузили фотографии в этот раздел.<br/> Возвращайтесь немного позже!</Text>
            <Button mt="xl" size="md" variant="default" onClick={() => navigate('/')} style={{ color: '#1B2E3D', borderColor: '#1B2E3D' }}>
              Вернуться в каталог
            </Button>
          </Center>
        )}
      </Container>

      {/* ========================================== */}
      {/* LIGHTBOX (МОДАЛЬНОЕ ОКНО ПРОСМОТРА) */}
      {/* ========================================== */}
      <Modal
        opened={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        withCloseButton={false}
        size="80%"
        centered
        padding={0}
        styles={{ 
          content: { backgroundColor: 'transparent', boxShadow: 'none' },
          inner: { padding: 0 } 
        }}
        overlayProps={{ backgroundOpacity: 0.85, blur: 5 }}
      >
        {selectedImage && (
          <Box style={{ position: 'relative', textAlign: 'center' }}>
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.title}
              fit="contain"
              style={{ maxHeight: '85vh', width: '100%', borderRadius: '8px' }}
            />
            <Paper p="md" mt="sm" radius="md" bg="#1B2E3D" style={{ display: 'inline-block', maxWidth: '100%' }}>
              <Title order={4} style={{ color: 'white' }}>{selectedImage.title}</Title>
              {selectedImage.description && (
                <Text size="sm" mt="xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedImage.description}</Text>
              )}
              <Button mt="md" fullWidth variant="white" color="dark" onClick={() => { setSelectedImage(null); navigate('/'); }}>
                Хочу так же (Заказать)
              </Button>
            </Paper>
          </Box>
        )}
      </Modal>

    </div>
  );
}