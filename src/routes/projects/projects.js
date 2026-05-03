/**
 * Публичный API **проектов** и сведений по **типам** объектов без авторизации.
 *
 * @module routes/projects
 *
 * @description
 *
 * Базовый префикс: **`/api/v1/projects`**.
 *
 * | Метод | Путь | Назначение |
 * |-------|------|-------------|
 * | GET | `/` | Все строки таблицы `projects` |
 * | GET | `/type` | Типы: массив `{ key, value, label }` из таблицы `types` |
 * | GET | `/:id` | Один проект по `id` (числовой идентификатор из БД — не путать с slug) |
 * | GET | `/type/:type` | По `name_en` типа: поля `title`, `description` |
 *
 * **Порядок маршрутов:** объявление `/:id` **выше**, чем `/type/:type` может конфликтовать с литеральным `type` если Express трактует сегмент как id — в текущем файле `/type` и `/type/:type` объявлены отдельно; при запросах учитывайте, что `GET .../something` может попасть в `/:id`.
 *
 * Коды: **404** если нет строк; **500** при ошибке БД.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../db/db');

router.get('/', async (req, res) => {
    try {
        const projects = await query('SELECT * FROM projects', []);
        if (projects.rows.length === 0) return res.status(404).json({ msg: "Projects not found" });

        res.status(200).json(projects.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/type', async (req, res) => {
    try {
        const types = await query('SELECT * FROM types', []);
        if (types.rows.length === 0) return res.status(404).json({ msg: "Type not found" });

        const data = types.rows.map(item => ({ key: item.name_en, value: item.name_en, label: item.name_ru }));
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const projects = await query('SELECT * FROM projects WHERE id = $1', [id]);
        if (projects.rows.length === 0) return res.status(404).json({ msg: "Project not found" });

        res.status(200).json(projects.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/type/:type', async (req, res) => {
    const type = req.params.type;

    try {
        const typeResult = await query('SELECT * FROM types WHERE name_en = $1', [type]);
        if (typeResult.rows.length === 0) return res.status(404).json({ msg: "Type not found" });

        res.status(200).json({ title: typeResult.rows[0].title, description: typeResult.rows[0].description });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;