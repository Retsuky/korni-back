/**
 * Управление пользователями сайта (личный кабинет).
 * **`/api/v1/admin/users`**, JWT администратора.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { query } = require('../../../db/db');

const userListSql = `
    SELECT
        u.id,
        u.email,
        u.phone,
        u.created_at,
        (SELECT COUNT(*)::int FROM applications a WHERE a.user_id = u.id) AS applications_count
    FROM users u
`;

router.get('/', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim().toLowerCase();
        if (q) {
            const result = await query(
                `${userListSql}
                 WHERE LOWER(u.email) LIKE $1 OR COALESCE(u.phone, '') LIKE $1
                 ORDER BY u.created_at DESC NULLS LAST, u.id DESC`,
                [`%${q}%`]
            );
            return res.status(200).json(result.rows);
        }
        const result = await query(
            `${userListSql} ORDER BY u.created_at DESC NULLS LAST, u.id DESC`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка загрузки пользователей' });
    }
});

router.post('/', async (req, res) => {
    const { email, password, phone } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ msg: 'Укажите email и пароль' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ msg: 'Пароль не короче 6 символов' });
    }

    try {
        const hash = await bcrypt.hash(String(password), 10);
        const ins = await query(
            `INSERT INTO users (email, password, phone)
             VALUES ($1, $2, $3)
             RETURNING id, email, phone, created_at`,
            [String(email).trim().toLowerCase(), hash, phone ? String(phone).trim() : null]
        );
        const row = ins.rows[0];
        res.status(201).json({ ...row, applications_count: 0 });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ msg: 'Пользователь с таким email уже есть' });
        }
        console.log(error);
        res.status(500).json({ msg: 'Ошибка создания пользователя' });
    }
});

router.patch('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ msg: 'Некорректный id' });
    }

    const { email, phone, password } = req.body || {};
    const sets = [];
    const params = [];

    if (email !== undefined) {
        params.push(String(email).trim().toLowerCase());
        sets.push(`email = $${params.length}`);
    }
    if (phone !== undefined) {
        params.push(phone ? String(phone).trim() : null);
        sets.push(`phone = $${params.length}`);
    }
    if (password !== undefined) {
        if (String(password).length < 6) {
            return res.status(400).json({ msg: 'Пароль не короче 6 символов' });
        }
        const hash = await bcrypt.hash(String(password), 10);
        params.push(hash);
        sets.push(`password = $${params.length}`);
    }

    if (sets.length === 0) {
        return res.status(400).json({ msg: 'Нет полей для обновления' });
    }

    params.push(id);
    try {
        const upd = await query(
            `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length}
             RETURNING id, email, phone, created_at`,
            params
        );
        if (upd.rows.length === 0) {
            return res.status(404).json({ msg: 'Пользователь не найден' });
        }
        const count = await query(
            'SELECT COUNT(*)::int AS c FROM applications WHERE user_id = $1',
            [id]
        );
        res.status(200).json({
            ...upd.rows[0],
            applications_count: count.rows[0].c,
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ msg: 'Email уже занят' });
        }
        console.log(error);
        res.status(500).json({ msg: 'Ошибка обновления' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ msg: 'Некорректный id' });
    }

    try {
        const del = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (del.rows.length === 0) {
            return res.status(404).json({ msg: 'Пользователь не найден' });
        }
        res.status(200).json({ msg: 'Удалён', id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка удаления' });
    }
});

module.exports = router;
