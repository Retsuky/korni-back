/**
 * Управление админскими справочниками: **теги (categories)**, **типы (types)** и **этапы (stages)** — порядок через поле `priority`, с поддержкой обмена приоритетами между записями.
 *
 * @module routes/admin/categories
 *
 * @description
 *
 * ## Базовый URL
 *
 * Все пути ниже задаются **относительно** монтирования роутера в `{@link module:routes/index}`:
 * фактический префикс **`/api/v1/admin/categories`**.
 *
 * ## Авторизация
 *
 * Требуется заголовок `Authorization: Bearer &lt;JWT&gt;`. Исключений нет — см. `tokenAdminController` в корневом роутере.
 *
 * ## Данные и таблицы
 *
 * - **categories** — теги/категории проектов (`name_ru`, `name_en`, `priority`).
 * - **types** — типы объектов, расширенное описание (`title`, `description`).
 * - **stages** — этапы строительства (`name_ru`, `name_en`).
 *
 * При создании записей `priority` назначается автоматически как `MAX(priority)+1`.
 *
 * Эндпоинты `PATCH .../priority` меняют порядок: если новый приоритет уже занят, выполняется **обмен** приоритетами с конфликтующей записью.
 *
 * ## Маршруты (каталог)
 *
 * | Метод | Путь (suffix) | Назначение |
 * |-------|----------------|------------|
 * | GET | `/tags` | Список тегов, сортировка по `priority` ASC |
 * | POST | `/tags/create` | Создание тега; body: `name_ru`, `name_en` |
 * | PUT | `/tags/edit` | Редактирование; body: `id`, `name_ru`, `name_en` |
 * | DELETE | `/tags/:id` | Удаление тега |
 * | PATCH | `/tags/:id/priority` | Смена приоритета; body: `priority` (положительное число) |
 * | GET | `/types` | Список типов по `priority` |
 * | POST | `/types/create` | Создание типа; body: `name_ru`, `name_en`, `title`, `description` |
 * | PUT | `/types/edit` | Редактирование типа |
 * | DELETE | `/types/:id` | Удаление типа |
 * | PATCH | `/types/:id/priority` | Смена приоритета типа |
 * | GET | `/stages` | Список этапов |
 * | POST | `/stages/create` | Создание этапа |
 * | PUT | `/stages/edit` | Редактирование этапа |
 * | DELETE | `/stages/:id` | Удаление этапа |
 * | PATCH | `/stages/:id/priority` | Смена приоритета этапа |
 *
 * Типичные коды ответов: **200** — успех; **400** — невалидный `priority`; **404** — сущность не найдена; **500** — ошибка БД или сервера.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../../db/db');

router.get('/tags', async (req, res) => {
    try {
        const tags = await query('SELECT * FROM categories ORDER BY priority ASC', []);
        if (tags.length === 0) return res.status(404).json({ msg: "Tags not found" });

        res.status(200).json(tags.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.post('/tags/create', async (req, res) => {
    const { name_ru, name_en } = req.body;

    try {
        // Get the next available priority number
        const priorityResult = await query('SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM categories');
        const nextPriority = priorityResult.rows[0].next_priority;

        await query('INSERT INTO categories (name_ru, name_en, priority) VALUES ($1, $2, $3)', [name_ru, name_en, nextPriority]);
        res.status(200).json({ msg: "Tag successfully create" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.put('/tags/edit', async (req, res) => {
    const { name_ru, name_en, id } = req.body;

    try {
        const tag = await query('SELECT * FROM categories WHERE id = $1', [id]);
        if (tag.rows.length === 0) return res.status(404).json({ msg: "Tag not found" });

        await query('UPDATE categories SET name_ru = $1, name_en = $2 WHERE id = $3', [name_ru, name_en, id]);
        res.status(200).json({ msg: "Tag successfully update" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.delete('/tags/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const tag = await query('SELECT * FROM categories WHERE id = $1', [id]);
        if (tag.rows.length === 0) return res.status(404).json({ msg: "Tag not found" });

        await query('DELETE FROM categories WHERE id = $1', [id]);
        res.status(200).json({ msg: "Tag successfully delete" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/types', async (req, res) => {
    try {
        const types = await query('SELECT * FROM types ORDER BY priority ASC', []);
        if (types.length === 0) return res.status(404).json({ msg: "Types not found" });

        res.status(200).json(types.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.post('/types/create', async (req, res) => {
    const { name_ru, name_en, title, description } = req.body;

    try {
        // Get the next available priority number
        const priorityResult = await query('SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM types');
        const nextPriority = priorityResult.rows[0].next_priority;

        await query('INSERT INTO types (name_ru, name_en, title, description, priority) VALUES ($1, $2, $3, $4, $5)', [name_ru, name_en, title, description, nextPriority]);
        res.status(200).json({ msg: "Type successfully create" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.put('/types/edit', async (req, res) => {
    const { name_ru, name_en, id, title, description } = req.body;

    try {
        const type = await query('SELECT * FROM types WHERE id = $1', [id]);
        if (type.rows.length === 0) return res.status(404).json({ msg: "Type not found" });

        console.log(name_ru, name_en, title, description, id);
        await query('UPDATE types SET name_ru = $1, name_en = $2, title = $3, description = $4 WHERE id = $5', [name_ru, name_en, title, description, id]);
        res.status(200).json({ msg: "Type successfully update" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.delete('/types/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const tag = await query('SELECT * FROM types WHERE id = $1', [id]);
        if (tag.rows.length === 0) return res.status(404).json({ msg: "Type not found" });

        await query('DELETE FROM types WHERE id = $1', [id]);
        res.status(200).json({ msg: "Type successfully delete" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.get('/stages', async (req, res) => {
    try {
        const stages = await query('SELECT * FROM stages ORDER BY priority ASC', []);
        if (stages.length === 0) return res.status(404).json({ msg: "Stages not found" });

        res.status(200).json(stages.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.post('/stages/create', async (req, res) => {
    const { name_ru, name_en } = req.body;

    try {
        // Get the next available priority number
        const priorityResult = await query('SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM stages');
        const nextPriority = priorityResult.rows[0].next_priority;

        await query('INSERT INTO stages (name_ru, name_en, priority) VALUES ($1, $2, $3)', [name_ru, name_en, nextPriority]);
        res.status(200).json({ msg: "Stage successfully create" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.put('/stages/edit', async (req, res) => {
    const { name_ru, name_en, id } = req.body;

    try {
        const stage = await query('SELECT * FROM stages WHERE id = $1', [id]);
        if (stage.rows.length === 0) return res.status(404).json({ msg: "Stage not found" });

        await query('UPDATE stages SET name_ru = $1, name_en = $2 WHERE id = $3', [name_ru, name_en, id]);
        res.status(200).json({ msg: "Stage successfully update" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

router.delete('/stages/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const stage = await query('SELECT * FROM stages WHERE id = $1', [id]);
        if (stage.rows.length === 0) return res.status(404).json({ msg: "Stage not found" });

        await query('DELETE FROM stages WHERE id = $1', [id]);
        res.status(200).json({ msg: "Stage successfully delete" });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

// Add priority update endpoint for tags with priority swapping
router.patch('/tags/:id/priority', async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    
    try {
        if (!priority || isNaN(priority) || priority < 1) {
            return res.status(400).json({ msg: 'Priority must be a positive number' });
        }

        // Check if tag exists and get its current priority
        const tagExists = await query('SELECT id, priority FROM categories WHERE id = $1', [id]);
        if (tagExists.rows.length === 0) {
            return res.status(404).json({ msg: 'Tag not found' });
        }

        const currentPriority = tagExists.rows[0].priority;
        const newPriority = parseInt(priority);

        // If priority is the same, no need to update
        if (currentPriority === newPriority) {
            return res.status(200).json(tagExists.rows[0]);
        }

        // Check if the new priority is already taken by another tag
        const conflictingTag = await query('SELECT id FROM categories WHERE priority = $1 AND id != $2', [newPriority, id]);
        
        if (conflictingTag.rows.length > 0) {
            // Swap priorities: give the conflicting tag the current priority of the updated tag
            await query('UPDATE categories SET priority = $1 WHERE id = $2', [currentPriority, conflictingTag.rows[0].id]);
        }

        // Update the target tag with the new priority
        const sql = 'UPDATE categories SET priority = $1 WHERE id = $2 RETURNING *';
        const result = await query(sql, [newPriority, id]);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error updating priority for tag ${id}:`, error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Add priority update endpoint for types with priority swapping
router.patch('/types/:id/priority', async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    
    try {
        if (!priority || isNaN(priority) || priority < 1) {
            return res.status(400).json({ msg: 'Priority must be a positive number' });
        }

        // Check if type exists and get its current priority
        const typeExists = await query('SELECT id, priority FROM types WHERE id = $1', [id]);
        if (typeExists.rows.length === 0) {
            return res.status(404).json({ msg: 'Type not found' });
        }

        const currentPriority = typeExists.rows[0].priority;
        const newPriority = parseInt(priority);

        // If priority is the same, no need to update
        if (currentPriority === newPriority) {
            return res.status(200).json(typeExists.rows[0]);
        }

        // Check if the new priority is already taken by another type
        const conflictingType = await query('SELECT id FROM types WHERE priority = $1 AND id != $2', [newPriority, id]);
        
        if (conflictingType.rows.length > 0) {
            // Swap priorities: give the conflicting type the current priority of the updated type
            await query('UPDATE types SET priority = $1 WHERE id = $2', [currentPriority, conflictingType.rows[0].id]);
        }

        // Update the target type with the new priority
        const sql = 'UPDATE types SET priority = $1 WHERE id = $2 RETURNING *';
        const result = await query(sql, [newPriority, id]);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error updating priority for type ${id}:`, error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Add priority update endpoint for stages with priority swapping
router.patch('/stages/:id/priority', async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    
    try {
        if (!priority || isNaN(priority) || priority < 1) {
            return res.status(400).json({ msg: 'Priority must be a positive number' });
        }

        // Check if stage exists and get its current priority
        const stageExists = await query('SELECT id, priority FROM stages WHERE id = $1', [id]);
        if (stageExists.rows.length === 0) {
            return res.status(404).json({ msg: 'Stage not found' });
        }

        const currentPriority = stageExists.rows[0].priority;
        const newPriority = parseInt(priority);

        // If priority is the same, no need to update
        if (currentPriority === newPriority) {
            return res.status(200).json(stageExists.rows[0]);
        }

        // Check if the new priority is already taken by another stage
        const conflictingStage = await query('SELECT id FROM stages WHERE priority = $1 AND id != $2', [newPriority, id]);
        
        if (conflictingStage.rows.length > 0) {
            // Swap priorities: give the conflicting stage the current priority of the updated stage
            await query('UPDATE stages SET priority = $1 WHERE id = $2', [currentPriority, conflictingStage.rows[0].id]);
        }

        // Update the target stage with the new priority
        const sql = 'UPDATE stages SET priority = $1 WHERE id = $2 RETURNING *';
        const result = await query(sql, [newPriority, id]);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error updating priority for stage ${id}:`, error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

module.exports = router;