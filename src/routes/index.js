/**
 * Сборка всех HTTP-маршрутов API версии **v1**.
 *
 * @module routes/index
 *
 * @description
 *
 * ## Где монтируется
 *
 * В `{@link module:server}` роутер подключается как `app.use('/api/v1', routes)`, поэтому все пути ниже — **дополнение** к `/api/v1`.
 *
 * ## Публичные сегменты (без JWT)
 *
 * | Mount | Модуль | Комментарий |
 * |-------|--------|-------------|
 * | `/projects` | `{@link module:routes/projects}` | Каталог проектов, типы |
 * | `/contacts` | `{@link module:routes/contacts}` | Заявки с сайта |
 * | `/main` | `{@link module:routes/main}` | Главная: слайды, галерея, подборки |
 * | `/admin/auth` | `{@link module:routes/admin/auth}` | Логин админа, выдача токена |
 *
 * ## Админские сегменты (JWT)
 *
 * Перед роутером стоит `{@link module:middleware/tokenAdminController}` — нужен заголовок `Authorization: Bearer &lt;token&gt;`.
 *
 * | Mount | Модуль |
 * |-------|--------|
 * | `/admin/profile` | `{@link module:routes/admin/profile}` |
 * | `/admin/applications` | `{@link module:routes/admin/applications}` |
 * | `/admin/categories` | `{@link module:routes/admin/categories}` |
 * | `/admin/projects` | `{@link module:routes/admin/projects}` |
 * | `/admin/main` | `{@link module:routes/admin/main}` |
 * | `/admin/gallery` | `{@link module:routes/admin/gallery}` |
 *
 * Дополнительно на этом роутере: `GET /test` → ответ `200` с телом `200` (проверка доступности API).
 */

const express = require('express');
const router = express.Router();
const tokenAdminController = require('../middleware/tokenAdminController');

const projectsRoute = require('./projects/projects');
const contactsRoute = require('./contacts/contacts');
const mainRoute = require('./main/main');
const adminAuthRoute = require('./admin/auth/auth');
const adminProfileRoute = require('./admin/profile/profile');
const adminApplicationsRoute = require('./admin/applications/applications');
const adminCategoriesRoute = require('./admin/categories/categories');
const adminProjectsRoute = require('./admin/projects/projects');
const adminMainRoute = require('./admin/main/main');
const adminGalleryRoute = require('./admin/gallery/gallery');
const adminUsersRoute = require('./admin/users/users');
const adminPhotoReportsRoute = require('./admin/photoReports/photoReports');
const adminApplicationMessagesRoute = require('./admin/applicationMessages/applicationMessages');
const userAuthRoute = require('./auth/userAuth');
const userAccountRoute = require('./user/account');
const paymentsRoute = require('./payments/payments');
const tokenUser = require('../middleware/tokenUser');

router.use('/projects', projectsRoute);
router.use('/contacts', contactsRoute);
router.use('/main', mainRoute);
router.use('/payments', paymentsRoute);
router.use('/auth/user', userAuthRoute);
router.use('/user', tokenUser, userAccountRoute);

router.use('/admin/auth', adminAuthRoute);
router.use('/admin/profile', tokenAdminController, adminProfileRoute);
router.use('/admin/applications', tokenAdminController, adminApplicationsRoute);
router.use(
    '/admin/applications/:applicationId/photo-reports',
    tokenAdminController,
    adminPhotoReportsRoute
);
router.use(
    '/admin/applications/:applicationId/messages',
    tokenAdminController,
    adminApplicationMessagesRoute
);
router.use('/admin/categories', tokenAdminController, adminCategoriesRoute);
router.use('/admin/projects', tokenAdminController, adminProjectsRoute);
router.use('/admin/main', tokenAdminController, adminMainRoute);
router.use('/admin/gallery', tokenAdminController, adminGalleryRoute);
router.use('/admin/users', tokenAdminController, adminUsersRoute);

router.get('/test', async (req, res) => {
    res.status(200).json(200);
})

module.exports = router;
