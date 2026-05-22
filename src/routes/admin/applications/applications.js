/**
 * Просмотр и **управление заявками** (матрица 2.1).
 *
 * **`/api/v1/admin/applications`**, только с JWT администратора.
 *
 * | Метод | Путь | Запрос |
 * |-------|------|--------|
 * | GET | `/` | `?status=&date_from=&date_to=` (ISO-даты опционально) |
 * | PATCH | `/:id` | `{ "status": "new" \| "in_progress" \| "done" \| "cancelled" }` |
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../../db/db');

const ALLOWED_STATUS = new Set(['new', 'in_progress', 'done', 'cancelled']);

router.get('/', async (req, res) => {
    try {
        const { status, date_from, date_to } = req.query;
        const conditions = [];
        const params = [];

        if (status && String(status).trim()) {
            params.push(String(status).trim());
            conditions.push(`status = $${params.length}`);
        }
        if (date_from && String(date_from).trim()) {
            params.push(String(date_from).trim());
            conditions.push(`created_at >= $${params.length}::timestamptz`);
        }
        if (date_to && String(date_to).trim()) {
            params.push(String(date_to).trim());
            conditions.push(`created_at <= $${params.length}::timestamptz`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `SELECT * FROM applications ${where} ORDER BY created_at DESC NULLS LAST, id DESC`;
        const applications = await query(sql, params);
        res.status(200).json(applications.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.patch('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ msg: 'Некорректный id' });
    }
    const nextStatus = req.body?.status;
    if (!nextStatus || !ALLOWED_STATUS.has(String(nextStatus))) {
        return res.status(400).json({
            msg: `status должен быть одним из: ${[...ALLOWED_STATUS].join(', ')}`,
        });
    }

    try {
        const upd = await query(
            'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
            [String(nextStatus), id]
        );
        if (upd.rows.length === 0) {
            return res.status(404).json({ msg: 'Application not found' });
        }
        res.status(200).json(upd.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;
