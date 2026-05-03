/**
 * Публичные данные для **главной страницы** и блоков карточек/подбора проектов.
 *
 * @module routes/main
 *
 * @description
 *
 * Префикс **`/api/v1/main`**.
 *
 * | Метод | Путь | Назначение |
 * |-------|------|------------|
 * | GET | `/` | Слайды из таблицы `slides` |
 * | GET | `/galleries` | Записи галереи `gallery` |
 * | GET | `/tags` | Совмещённо: все `categories` и все `stages` в одном JSON `{ tags, stages }` |
 * | GET | `/popular` | Проекты с `popular = TRUE`, сортировка `id DESC` |
 * | GET | `/same-projects/:style/:square/:id` | Похожие по стилю и площади (±100), иначе fallback на популярные без текущего `id` |
 * | GET | `/header` | Данные для шапки: отсортированные теги/этапы/типы → структуры `builderHouse` и `projectTypes` |
 *
 * Часть обработчиков при пустых выборках не отправляет ответ в `catch` (только лог); предпочтительнее унифицировать это при доработке.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../db/db');

router.get('/', async (req, res) => {
    try {
        const dataResult = await query('SELECT * FROM slides', []);
        if (dataResult.rows.length === 0) return res.status(404).json({ msg: "Data not found" });

        res.status(200).json(dataResult.rows);
    } catch (error) {
        console.log(error);
    }
});

router.get('/galleries', async (req, res) => {
    try {
        const dataResult = await query('SELECT * FROM gallery', []);
        if (dataResult.rows.length === 0) return res.status(404).json({ msg: "Galleries not found" });

        res.status(200).json(dataResult.rows);
    } catch (error) {
        console.log(error);
    }
});

router.get('/tags', async (req, res) => {
    try {
        const tags = await query('SELECT * FROM categories', []);
        if (tags.length === 0) return res.status(404).json({ msg: "Tags not found" });

        const stages = await query('SELECT * FROM stages', []);
        if (stages.length === 0) return res.status(404).json({ msg: "Stages not found" });

        res.status(200).json({ tags: tags.rows, stages: stages.rows });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/popular', async (req, res) => {
    try {
        const projects = await query('SELECT * FROM projects WHERE popular = TRUE ORDER BY id DESC', []);
        if (projects.length === 0) return res.status(404).json({ msg: "Projects not found" });

        res.status(200).json(projects.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/same-projects/:style/:square/:id', async (req, res) => {
    const { style, square, id } = req.params;

    // Валидация square
    const squareNum = parseFloat(square);
    if (isNaN(squareNum)) {
        return res.status(400).json({ msg: 'Invalid square value' });
    }

    // Валидация id
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
        return res.status(400).json({ msg: 'Invalid project ID' });
    }

    const minSquare = squareNum - 100;
    const maxSquare = squareNum + 100;

    try {
        let projects = await query(
            'SELECT * FROM projects WHERE style = $1 AND square BETWEEN $2 AND $3 AND id != $4 ORDER BY id DESC',
            [style, minSquare, maxSquare, idNum]
        );

        if (projects.rows.length === 0) {
            projects = await query(
                'SELECT * FROM projects WHERE popular = true AND id != $1 ORDER BY id DESC',
                [idNum]
            );
        }

        if (projects.rows.length === 0) {
            return res.status(404).json({ msg: 'No projects found' });
        }

        res.status(200).json(projects.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/header', async (req, res) => {
    try {
        const tags = await query('SELECT * FROM categories ORDER BY priority ASC', []);
        if (tags.length === 0) return res.status(404).json({ msg: "Tags not found" });

        const stages = await query('SELECT * FROM stages ORDER BY priority ASC', []);
        if (stages.length === 0) return res.status(404).json({ msg: "Stages not found" });

        const types = await query('SELECT * FROM types ORDER BY priority ASC', []);
        if (types.length === 0) return res.status(404).json({ msg: "Types not found" });

        const projectTypes = types.rows.map(item => ({ text: item.name_ru, link: item.name_en }));
        const builderHouse = [...tags.rows, ...stages.rows].map((item) => ({ text: item.name_ru, link: item.name_en }));

        res.status(200).json({ builderHouse, projectTypes });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;