/**
 * Фотоотчёты по заявке для личного кабинета клиента.
 * /api/v1/admin/applications/:applicationId/photo-reports
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { query } = require('../../../db/db');
const { buildUploadUrl } = require('../../../utils/uploadUrl');

const UPLOAD_DIR = 'uploads/';
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

async function getApplication(applicationId) {
    const res = await query('SELECT id, user_id, name, phone, email FROM applications WHERE id = $1', [
        applicationId,
    ]);
    return res.rows[0] || null;
}

router.get('/', async (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    if (Number.isNaN(applicationId)) {
        return res.status(400).json({ msg: 'Некорректный id заявки' });
    }

    try {
        const app = await getApplication(applicationId);
        if (!app) return res.status(404).json({ msg: 'Заявка не найдена' });

        const list = await query(
            `SELECT id, application_id, user_id, stage, comment, images, created_at
             FROM application_photo_reports
             WHERE application_id = $1
             ORDER BY created_at DESC, id DESC`,
            [applicationId]
        );
        res.status(200).json({ application: app, reports: list.rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка загрузки фотоотчётов' });
    }
});

router.post('/', upload.array('images', 20), async (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    if (Number.isNaN(applicationId)) {
        return res.status(400).json({ msg: 'Некорректный id заявки' });
    }

    const stage = String(req.body?.stage || 'Этап работ').trim();
    const comment = req.body?.comment ? String(req.body.comment).trim() : null;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: 'Добавьте хотя бы одно фото' });
    }

    try {
        const app = await getApplication(applicationId);
        if (!app) return res.status(404).json({ msg: 'Заявка не найдена' });

        const imageUrls = req.files.map((file) => buildUploadUrl(req, file.filename));

        let userId = app.user_id || null;
        if (!userId && app.email) {
            const byEmail = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [
                String(app.email).trim(),
            ]);
            if (byEmail.rows.length > 0) {
                userId = byEmail.rows[0].id;
                await query('UPDATE applications SET user_id = $1 WHERE id = $2 AND user_id IS NULL', [
                    userId,
                    applicationId,
                ]);
            }
        }

        const ins = await query(
            `INSERT INTO application_photo_reports (application_id, user_id, stage, comment, images)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [applicationId, userId, stage, comment, imageUrls]
        );

        res.status(201).json({
            report: ins.rows[0],
            warning: userId
                ? null
                : 'Клиент не привязан к ЛК. Фото сохранено, но в кабинете не отобразится, пока заявка не будет связана с аккаунтом (вход клиента при отправке заявки или совпадение email).',
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка сохранения фотоотчёта' });
    }
});

router.delete('/:reportId', async (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    const reportId = parseInt(req.params.reportId, 10);
    if (Number.isNaN(applicationId) || Number.isNaN(reportId)) {
        return res.status(400).json({ msg: 'Некорректный id' });
    }

    try {
        const del = await query(
            `DELETE FROM application_photo_reports
             WHERE id = $1 AND application_id = $2
             RETURNING id`,
            [reportId, applicationId]
        );
        if (del.rows.length === 0) {
            return res.status(404).json({ msg: 'Фотоотчёт не найден' });
        }
        res.status(200).json({ msg: 'Удалено', id: reportId });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка удаления' });
    }
});

module.exports = router;
