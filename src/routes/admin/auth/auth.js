/**
 * **Авторизация администратора**: проверка логина/пароля и выдача JWT.
 *
 * @module routes/admin/auth
 *
 * @description
 *
 * Монтируется на **`/api/v1/admin/auth`** **без** `tokenAdminController` — это единственная админская точка входа без токена.
 *
 * | Метод | Путь | Body | Успех |
 * |-------|------|------|--------|
 * | POST | `/` | `login`, `password` | **200**, JSON `{ token_admin }` |
 *
 * Пароль сверяется через `bcrypt.compare` с полем в таблице `admins`. Токен подписывается **`JWT_SECRET_ADMIN`**, срок **7 дней** (`expiresIn: '7d'`), payload содержит `{ admin: { id } }`.
 *
 * Ошибки: **404** — нет админа; **400** — неверный пароль; **500** — внутренняя ошибка.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../../db/db');

/**
 * Асинхронно подписывает JWT для сессии администратора.
 *
 * @param {number|string} id первичный ключ записи в `admins`
 * @returns {Promise<string>} строка JWT
 */
const createJwtToken = (id) => {
    const payload = { admin: { id } };
    const secret = process.env.JWT_SECRET_ADMIN;
    const options = { expiresIn: '7d' };

    return new Promise((resolve, reject) => {
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                console.error('Ошибка при создании JWT-токена:', err);
                reject(err);
            } else {
                resolve(token);
            }
        });
    });
};

router.post('/', async (req, res) => {
    const { login, password } = req.body;

    try {
        const admin = await query('SELECT * FROM admins WHERE login = $1', [login]);
        if (admin.rows.length === 0) return res.status(404).json({ msg: "Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.rows[0].password);
        if (!isMatch) return res.status(400).json({ msg: "Password is wrong" });

        const jwtToken = await createJwtToken(admin.rows[0].id);
        res.status(200).json({ token_admin: jwtToken });
        
        // await query('INSERT INTO admins (login, password) VALUES ($1, $2)', [login, await bcrypt.hash(password, 10)]);
        // res.status(200).json(200)
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;