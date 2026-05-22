/**
 * Регистрация и вход **пользователя** (не админа).
 * Публично: POST /api/v1/auth/user/register, POST /api/v1/auth/user/login
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../db/db');

const createJwtToken = (user) =>
    new Promise((resolve, reject) => {
        const payload = { user: { id: user.id, email: user.email } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET_USER,
            { expiresIn: '30d' },
            (err, token) => (err ? reject(err) : resolve(token))
        );
    });

router.post('/register', async (req, res) => {
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
             RETURNING id, email`,
            [String(email).trim().toLowerCase(), hash, phone || null]
        );
        const row = ins.rows[0];
        const token_user = await createJwtToken(row);
        res.status(201).json({ token_user, user: { id: row.id, email: row.email } });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ msg: 'Пользователь с таким email уже есть' });
        }
        console.log(error);
        res.status(500).json({ msg: 'Ошибка регистрации' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ msg: 'Укажите email и пароль' });
    }

    try {
        const found = await query('SELECT * FROM users WHERE email = $1', [
            String(email).trim().toLowerCase(),
        ]);
        if (found.rows.length === 0) {
            return res.status(404).json({ msg: 'Пользователь не найден' });
        }
        const row = found.rows[0];
        const ok = await bcrypt.compare(String(password), row.password);
        if (!ok) {
            return res.status(400).json({ msg: 'Неверный пароль' });
        }
        const token_user = await createJwtToken({ id: row.id, email: row.email });
        res.status(200).json({ token_user, user: { id: row.id, email: row.email } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Ошибка входа' });
    }
});

module.exports = router;
