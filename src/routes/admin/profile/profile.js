/**
 * Минимальная проверка сессии администратора после входа.
 *
 * @module routes/admin/profile
 *
 * @description
 *
 * Префикс **`/api/v1/admin/profile`**, требуется JWT.
 *
 * | Метод | Путь | Поведение |
 * |-------|------|-----------|
 * | GET | `/` | Поиск админа по `req.admin.id`; при успехе ответ **200** с телом числа `200` (не сам объект админа) |
 *
 * **404** если запись не найдена. Для полноценного профиля стоит вернуть безопасное подмножество полей админа без хэша пароля.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const admin = await query('SELECT * FROM admins WHERE id = $1', [req.admin?.id]);
        if (admin.rows.length === 0) return res.status(404).json({ msg: "Admin not found" });

        res.status(200).json(200);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;