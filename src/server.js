/**
 * Точка входа процесса: создаёт приложение Express, подключает middleware и API.
 *
 * @module server
 *
 * @description
 *
 * ## Порт и запуск
 *
 * Прослушивание **`3020`** (константа `PORT`). В продакшене при использовании PM2 см. также `{@link module:ecosystem}`.
 *
 * ## Middleware и поведение
 *
 * - **JSON / urlencoded** с лимитом тела **50mb** — для загрузки тяжёлых данных с фронта.
 * - Заголовки **CORS** (дублирующе с пакетом `cors`): разрешённые методы включают `PATCH` для админских приоритетов.
 * - Пакет **cors** с `credentials: true` и `origin: true`.
 * - Статическая раздача каталога **`/uploads`** → папка `uploads/` в корне репозитория (multer складывает файлы туда из админских роутов).
 *
 * ## Маршруты
 *
 * - `GET /test` — ответ `200` в теле JSON для быстрой проверки.
 * - `GET /api/v1/*` — основное REST API, см. `{@link module:routes/index}`.
 *
 * Перед разработкой нужен настроенный `.env` (БД и секрет JWT для админки — см. `DEVELOPER.md`).
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors({
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));

app.get('/test', async (req, res) => {
  res.status(200).json(200);
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const routes = require('./routes');
app.use('/api/v1', routes);

const PORT = 3020;

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
