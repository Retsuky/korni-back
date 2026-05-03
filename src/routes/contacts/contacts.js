/**
 * Приём **заявок (applications)** с публичного сайта без JWT.
 *
 * @module routes/contacts
 *
 * @description
 *
 * Префикс **`/api/v1/contacts`**. Body ожидается в виде **`{ data: { ... } }`**.
 *
 * | Метод | Путь | Body `data` | Таблица |
 * |-------|------|-------------|---------|
 * | POST | `/create` | `name`, `phone`, `email`, `text` | Вставка в `applications` |
 * | POST | `/create-short` | `name`, `phone` | Укороченная заявка |
 *
 * Успех: **200** и сообщение об успешном создании. Ошибки — коды **400** и **500**. В коде есть опечатка `rows.legth` вместо `length`; при ошибке может вести себя неочевидно.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../db/db');

router.post('/create', async (req, res) => {
    const { data } = req.body;

    try {
        const newApplication = await query(
            'INSERT INTO applications (name, phone, email, text) VALUES ($1,$2,$3,$4) RETURNING *',
            [data.name, data.phone, data.email, data.text]
        );

        if (newApplication.rows.legth === 0) return res.status(400).json({ msg: "Произошла ошибка при создании" });

        res.status(200).json({ msg: "Application create" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.post('/create-short', async (req, res) => {
    const { data } = req.body;

    try {
        const newApplication = await query(
            'INSERT INTO applications (name, phone) VALUES ($1,$2) RETURNING *',
            [data.name, data.phone]
        );

        if (newApplication.rows.legth === 0) return res.status(400).json({ msg: "Произошла ошибка при создании" });

        res.status(200).json({ msg: "Application create" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;
