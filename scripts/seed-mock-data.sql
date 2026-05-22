-- Демо-данные для локальной разработки (главная, проекты, построенные дома, заявки).
-- Очищает и заново заполняет контентные таблицы. Админов не трогает.
-- Запуск: pnpm run db:seed (из korni-back или корня монорепозитория)

BEGIN;

TRUNCATE TABLE
    applications,
    gallery,
    projects,
    slides,
    categories,
    stages,
    types
RESTART IDENTITY;

INSERT INTO categories (name_ru, name_en, priority) VALUES
    ('Клееный брус', 'beam', 1),
    ('Кирпич', 'brick', 2),
    ('Комбинированный', 'combined', 3);

INSERT INTO stages (name_ru, name_en, priority) VALUES
    ('Фундамент', 'foundation', 1),
    ('Коробка', 'box', 2),
    ('Отделка', 'finishing', 3);

INSERT INTO types (name_ru, name_en, title, description, priority) VALUES
    ('Барнхаус', 'barnhouse', 'Стиль барнхаус', 'Современные дома в стиле барнхаус', 1),
    ('Норвежский', 'norwegian', 'Норвежский дом', 'Скандинавская традиция', 2);

INSERT INTO slides (slide_order, image_url, title, subtitle) VALUES
    (0, 'https://picsum.photos/seed/korni-slide1/1920/1080', 'Современные дома KORNI', 'Строительство под ключ'),
    (1, 'https://picsum.photos/seed/korni-slide2/1920/1080', 'Технология вертикального бруса', 'Надёжность и скорость'),
    (2, 'https://picsum.photos/seed/korni-slide3/1920/1080', 'Более 300 объектов', 'Опыт и качество');

INSERT INTO projects (
    name, cost, square, floors, terraces, bedrooms, bathrooms,
    plans, images, description, style, material, cover, popular, sections, priority
) VALUES
(
    'Барнхаус Альфа',
    '18500000',
    185,
    2, 1, 4, 3,
    ARRAY['https://picsum.photos/seed/korni-p1-plan/1200/800']::text[],
    ARRAY[
        'https://picsum.photos/seed/korni-p1-a/1200/800',
        'https://picsum.photos/seed/korni-p1-b/1200/800'
    ]::text[],
    'Двухэтажный дом с панорамными окнами и террасой. Мок-описание для витрины.',
    'barnhouse',
    'beam',
    'https://picsum.photos/seed/korni-p1-cover/800/600',
    TRUE,
    '[{"id":"s1","title":"Первый этаж","description":"Кухня-гостиная и санузел"},{"id":"s2","title":"Второй этаж","description":"Спальни и кабинет"}]'::jsonb,
    1
),
(
    'Норвежский Хольм',
    '22100000',
    210,
    2, 0, 3, 2,
    ARRAY['https://picsum.photos/seed/korni-p2-plan/1200/800']::text[],
    ARRAY['https://picsum.photos/seed/korni-p2-a/1200/800']::text[],
    'Уютный дом в скандинавском стиле. Мок-описание.',
    'norwegian',
    'brick',
    'https://picsum.photos/seed/korni-p2-cover/800/600',
    TRUE,
    '[{"id":"s1","title":"Фасад","description":"Натуральное дерево и камень"}]'::jsonb,
    2
),
(
    'Барнхаус Компакт',
    '12900000',
    120,
    1, 1, 2, 1,
    ARRAY['https://picsum.photos/seed/korni-p3-plan/1200/800']::text[],
    ARRAY['https://picsum.photos/seed/korni-p3-a/1200/800']::text[],
    'Одноэтажный проект для небольшого участка.',
    'barnhouse',
    'brickBeam',
    'https://picsum.photos/seed/korni-p3-cover/800/600',
    FALSE,
    '[]'::jsonb,
    3
),
(
    'Норвежский Вида',
    '17500000',
    195,
    2, 1, 3, 2,
    ARRAY['https://picsum.photos/seed/korni-p4-plan/1200/800']::text[],
    ARRAY[
        'https://picsum.photos/seed/korni-p4-a/1200/800',
        'https://picsum.photos/seed/korni-p4-b/1200/800'
    ]::text[],
    'Проект с увеличенной гостиной и вторым светом.',
    'norwegian',
    'beam',
    'https://picsum.photos/seed/korni-p4-cover/800/600',
    TRUE,
    '[{"id":"s1","title":"Инженерия","description":"Тёплые полы, рекуперация"}]'::jsonb,
    4
);

INSERT INTO gallery (title, description, category, images, stage) VALUES
(
    'Дом в Подмосковье',
    'Строительство из клееного бруса, мок-история объекта.',
    'beam',
    ARRAY[
        'https://picsum.photos/seed/korni-g1-a/1200/800',
        'https://picsum.photos/seed/korni-g1-b/1200/800'
    ]::text[],
    'box'
),
(
    'Объект «Сосновый»',
    'Комбинированные материалы, этап фундамента.',
    'combined',
    ARRAY['https://picsum.photos/seed/korni-g2-a/1200/800']::text[],
    'foundation'
),
(
    'Финишная отделка',
    'Внутренние работы в норвежском проекте.',
    'brick',
    ARRAY[
        'https://picsum.photos/seed/korni-g3-a/1200/800',
        'https://picsum.photos/seed/korni-g3-b/1200/800'
    ]::text[],
    'finishing'
),
(
    'Брусовой короб',
    'Монтаж стен, этап коробки.',
    'beam',
    ARRAY['https://picsum.photos/seed/korni-g4-a/1200/800']::text[],
    'box'
);

INSERT INTO applications (name, phone, email, text) VALUES
    ('Иван Тестовый', '+79990001122', 'ivan@example.com', 'Хочу консультацию по проекту барнхаус'),
    ('Мария Демо', '+79995556677', NULL, 'Короткая заявка с сайта');

COMMIT;
