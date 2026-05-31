/**
 * Личный кабинет пользователя: /api/v1/user/* (JWT обязателен).
 */
const express = require('express');
const router = express.Router();
const { query } = require('../../db/db');

function estimateText(row) {
    let c = row.config_json || {};
    if (typeof c === 'string') {
        try {
            c = JSON.parse(c);
        } catch {
            c = {};
        }
    }
    const lines = [
        `Предварительная смета (заявка №${row.id})`,
        `Клиент: ${row.name}`,
        `Телефон: ${row.phone}`,
        `Email: ${row.email || '—'}`,
        '',
        `Проект: ${c.projectName || '—'}`,
        `Материал (опция): ${c.materialLabel || c.materialKey || '—'}`,
        `Кровля: ${c.roofLabel || '—'}`,
        `Терраса: ${c.terrace || '—'}`,
        `Отделка: ${c.finishingLabel || '—'}`,
        '',
        `Расчётная стоимость: ${row.estimated_total != null ? `${Number(row.estimated_total).toLocaleString('ru-RU')} ₽` : '—'}`,
        '',
        'Документ носит информационный характер; итоговая смета и договор оформляются менеджером.',
    ];
    return lines.join('\n');
}

router.get('/me', async (req, res) => {
    try {
        const found = await query('SELECT id, email, phone, created_at FROM users WHERE id = $1', [
            req.user.id,
        ]);
        if (found.rows.length === 0) {
            return res.status(404).json({ msg: 'Пользователь не найден' });
        }
        res.status(200).json(found.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка' });
    }
});

router.get('/applications', async (req, res) => {
    try {
        const apps = await query(
            `SELECT id, name, phone, email, text, status, created_at, config_json, estimated_total
             FROM applications WHERE user_id = $1 ORDER BY created_at DESC NULLS LAST, id DESC`,
            [req.user.id]
        );
        res.status(200).json(apps.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка' });
    }
});

router.get('/photo-reports', async (req, res) => {
    try {
        const reports = await query(
            `SELECT r.id, r.application_id, r.stage, r.comment, r.images, r.created_at,
                    a.name AS application_name, a.status AS application_status
             FROM application_photo_reports r
             INNER JOIN applications a ON a.id = r.application_id
             WHERE a.user_id = $1
             ORDER BY r.created_at DESC, r.id DESC`,
            [req.user.id]
        );
        res.status(200).json(reports.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка загрузки фотоотчётов' });
    }
});

router.get('/applications/:id/messages', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ msg: 'Некорректный id' });
    }
    try {
        const app = await query('SELECT id FROM applications WHERE id = $1 AND user_id = $2', [
            id,
            req.user.id,
        ]);
        if (app.rows.length === 0) {
            return res.status(404).json({ msg: 'Заявка не найдена' });
        }
        const messages = await query(
            `SELECT id, application_id, sender_role, body, created_at
             FROM application_messages
             WHERE application_id = $1
             ORDER BY created_at ASC, id ASC`,
            [id]
        );
        res.status(200).json(messages.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка загрузки сообщений' });
    }
});

router.post('/applications/:id/messages', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ msg: 'Некорректный id' });
    }
    const body = String(req.body?.body || '').trim();
    if (!body) {
        return res.status(400).json({ msg: 'Введите текст сообщения' });
    }
    if (body.length > 4000) {
        return res.status(400).json({ msg: 'Сообщение слишком длинное' });
    }
    try {
        const app = await query('SELECT id FROM applications WHERE id = $1 AND user_id = $2', [
            id,
            req.user.id,
        ]);
        if (app.rows.length === 0) {
            return res.status(404).json({ msg: 'Заявка не найдена' });
        }
        const ins = await query(
            `INSERT INTO application_messages (application_id, user_id, sender_role, body)
             VALUES ($1, $2, 'client', $3)
             RETURNING *`,
            [id, req.user.id, body]
        );
        res.status(201).json(ins.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка отправки' });
    }
});

router.get('/applications/:id/estimate', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ msg: 'Некорректный id' });
    }
    try {
        const apps = await query(
            `SELECT * FROM applications WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );
        if (apps.rows.length === 0) {
            return res.status(404).json({ msg: 'Заявка не найдена' });
        }
        const body = estimateText(apps.rows[0]);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(body);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка' });
    }
});

module.exports = router;
