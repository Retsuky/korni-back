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

router.use('/projects', projectsRoute);
router.use('/contacts', contactsRoute);
router.use('/main', mainRoute);

router.use('/admin/auth', adminAuthRoute);
router.use('/admin/profile', tokenAdminController, adminProfileRoute);
router.use('/admin/applications', tokenAdminController, adminApplicationsRoute);
router.use('/admin/categories', tokenAdminController, adminCategoriesRoute);
router.use('/admin/projects', tokenAdminController, adminProjectsRoute);
router.use('/admin/main', tokenAdminController, adminMainRoute);
router.use('/admin/gallery', tokenAdminController, adminGalleryRoute);

router.get('/test', async (req, res) => {
    res.status(200).json(200);
})

module.exports = router;
