/**
 * Переписка по заявке: менеджер ↔ клиент.
 * /api/v1/admin/applications/:applicationId/messages
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { query } = require('../../../db/db');

async function getApplication(applicationId) {
    const res = await query(
        'SELECT id, user_id, name, phone, email FROM applications WHERE id = $1',
        [applicationId]
    );
    return res.rows[0] || null;
}

async function resolveUserId(app) {
    if (app.user_id) return app.user_id;
    if (!app.email) return null;
    const byEmail = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [
        String(app.email).trim(),
    ]);
    if (byEmail.rows.length === 0) return null;
    const userId = byEmail.rows[0].id;
    await query('UPDATE applications SET user_id = $1 WHERE id = $2 AND user_id IS NULL', [
        userId,
        app.id,
    ]);
    return userId;
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
            `SELECT id, application_id, user_id, sender_role, body, created_at
             FROM application_messages
             WHERE application_id = $1
             ORDER BY created_at ASC, id ASC`,
            [applicationId]
        );
        res.status(200).json({ application: app, messages: list.rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка загрузки сообщений' });
    }
});

router.post('/', async (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    if (Number.isNaN(applicationId)) {
        return res.status(400).json({ msg: 'Некорректный id заявки' });
    }

    const body = String(req.body?.body || '').trim();
    if (!body) {
        return res.status(400).json({ msg: 'Введите текст сообщения' });
    }
    if (body.length > 4000) {
        return res.status(400).json({ msg: 'Сообщение слишком длинное' });
    }

    try {
        const app = await getApplication(applicationId);
        if (!app) return res.status(404).json({ msg: 'Заявка не найдена' });

        const userId = await resolveUserId(app);

        const ins = await query(
            `INSERT INTO application_messages (application_id, user_id, sender_role, body)
             VALUES ($1, $2, 'manager', $3)
             RETURNING *`,
            [applicationId, userId, body]
        );

        res.status(201).json({
            message: ins.rows[0],
            warning: userId
                ? null
                : 'Клиент не привязан к ЛК — сообщение сохранено, но в кабинете не отобразится, пока заявка не связана с аккаунтом.',
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка отправки' });
    }
});

module.exports = router;
