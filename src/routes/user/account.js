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
