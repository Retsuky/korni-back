/**
 * Админский **CRUD проектов**: загрузка обложки, галерей и планов (`multer` → `uploads/`), URL файлов с префиксом публичного API.
 *
 * @module routes/admin/projects
 *
 * @description
 *
 * Префикс **`/api/v1/admin/projects`**, JWT обязателен.
 *
 * Файлы сохраняются в каталог **`uploads/`**; в БД пишутся абсолютные URL вида **`https://api.korni.pro/uploads/&lt;filename&gt;`** (`API_URL_PREFIX`). Раздача с диска — через `{@link module:server}` (`/uploads`).
 *
 * | Метод | Путь | Назначение |
 * |-------|------|------------|
 * | GET | `/:id` | Одна запись `public.projects` |
 * | GET | `/` | Все проекты, сортировка `priority ASC` |
 * | POST | `/create` | Создание; **multipart**: поля `cover` (1), `images` (до 20), `plans` (до 20); тело текста — метаданные (`name`, `cost`, `square`, …). Обязательна обложка. Приоритет авто. |
 * | PATCH | `/:id/priority` | Смена `priority` с обменом при конфликте (как в справочниках) |
 * | PUT | `/update/:id` | Обновление; те же поля файлов + `existingCover`, `existingImages`, `existingPlans` (JSON-массивы URL). Удаляет с диска файлы, выпавшие из набора. |
 * | DELETE | `/delete/:id` | Удаление записи; с диска снимаются **images** и **plans** (не cover в текущей реализации — проверьте при доработке) |
 *
 * Схема БД: **`public.projects`**. Успешное создание: **201**; типичные ошибки **400**, **404**, **500**.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query } = require('../../../db/db');
const fs = require('fs').promises;

const UPLOAD_DIR = 'uploads/';
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });
const API_URL_PREFIX = 'https://api.korni.pro/uploads/';

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query('SELECT * FROM public.projects WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Add endpoint to get all projects sorted by priority
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM public.projects ORDER BY priority ASC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post(
    '/create',
    upload.fields([
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 20 },
        { name: 'plans', maxCount: 20 }
    ]),
    async (req, res) => {
        try {
            const { name, cost, square, floors, terraces, bedrooms, bathrooms, description, style, material, popular, sections } = req.body;

            if (!req.files.cover || req.files.cover.length === 0) {
                return res.status(400).json({ msg: 'Cover image is required.' });
            }

            // Get the next available priority number
            const priorityResult = await query('SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM public.projects');
            const nextPriority = priorityResult.rows[0].next_priority;

            const coverUrl = `${API_URL_PREFIX}${req.files.cover[0].filename}`;
            const imageUrls = (req.files.images || []).map(file => `${API_URL_PREFIX}${file.filename}`);
            const planUrls = (req.files.plans || []).map(file => `${API_URL_PREFIX}${file.filename}`);

            const sql = `
                INSERT INTO public.projects 
                (name, cost, square, floors, terraces, bedrooms, bathrooms, plans, images, description, style, material, cover, popular, sections, priority) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
                RETURNING *;
            `;
            const params = [name, cost, square, floors, terraces, bedrooms, bathrooms, planUrls, imageUrls, description, style, material, coverUrl, popular, sections, nextPriority];
            const newProject = await query(sql, params);
            res.status(201).json(newProject.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Server error', error: error.message });
        }
    }
);

// Add priority update endpoint with priority swapping
router.patch('/:id/priority', async (req, res) => {
    const { id } = req.params;
    const { priority } = req.body;
    
    try {
        if (!priority || isNaN(priority) || priority < 1) {
            return res.status(400).json({ msg: 'Priority must be a positive number' });
        }

        // Check if project exists and get its current priority
        const projectExists = await query('SELECT id, priority FROM public.projects WHERE id = $1', [id]);
        if (projectExists.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const currentPriority = projectExists.rows[0].priority;
        const newPriority = parseInt(priority);

        // If priority is the same, no need to update
        if (currentPriority === newPriority) {
            return res.status(200).json(projectExists.rows[0]);
        }

        // Check if the new priority is already taken by another project
        const conflictingProject = await query('SELECT id FROM public.projects WHERE priority = $1 AND id != $2', [newPriority, id]);
        
        if (conflictingProject.rows.length > 0) {
            // Swap priorities: give the conflicting project the current priority of the updated project
            await query('UPDATE public.projects SET priority = $1 WHERE id = $2', [currentPriority, conflictingProject.rows[0].id]);
        }

        // Update the target project with the new priority
        const sql = 'UPDATE public.projects SET priority = $1 WHERE id = $2 RETURNING *';
        const result = await query(sql, [newPriority, id]);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error updating priority for project ${id}:`, error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

router.put(
    '/update/:id',
    upload.fields([
        { name: 'cover', maxCount: 1 },
        { name: 'images', maxCount: 20 },
        { name: 'plans', maxCount: 20 }
    ]),
    async (req, res) => {
        const { id } = req.params;
        try {
            const { name, cost, square, floors, terraces, bedrooms, bathrooms, description, style, material,
                existingCover, existingImages, existingPlans, popular, sections } = req.body;

            const { rows: [oldProject] } = await query('SELECT * FROM public.projects WHERE id = $1', [id]);
            if (!oldProject) return res.status(404).json({ msg: 'Project not found' });

            let finalCoverUrl = existingCover || null;
            if (req.files.cover && req.files.cover[0]) {
                finalCoverUrl = `${API_URL_PREFIX}${req.files.cover[0].filename}`;
            }

            let finalImageUrls = JSON.parse(existingImages) || [];
            if (req.files.images && req.files.images.length > 0) {
                const newImageUrls = req.files.images.map(file => `${API_URL_PREFIX}${file.filename}`);
                finalImageUrls = newImageUrls;
            }

            let finalPlanUrls = JSON.parse(existingPlans) || [];
            if (req.files.plans && req.files.plans.length > 0) {
                const newPlanUrls = req.files.plans.map(file => `${API_URL_PREFIX}${file.filename}`);
                finalPlanUrls = newPlanUrls;
            }

            const oldFileUrls = [
                ...(oldProject.cover ? [oldProject.cover] : []),
                ...(oldProject.images || []),
                ...(oldProject.plans || [])
            ];

            const newFileUrls = new Set([
                ...(finalCoverUrl ? [finalCoverUrl] : []),
                ...finalImageUrls,
                ...finalPlanUrls
            ]);

            const filesToDelete = oldFileUrls.filter(url => !newFileUrls.has(url));

            const deletionPromises = filesToDelete.map(url => {
                const filename = url.replace(API_URL_PREFIX, '');
                const filePath = path.join(UPLOAD_DIR, filename);
                return fs.unlink(filePath).catch(err => {
                    if (err.code !== 'ENOENT') console.error(`Failed to delete file ${filePath}:`, err);
                });
            });
            await Promise.all(deletionPromises);

            const sql = `
                UPDATE public.projects SET
                name = $1, cost = $2, square = $3, floors = $4, terraces = $5, bedrooms = $6, bathrooms = $7,
                description = $8, style = $9, material = $10, cover = $11, images = $12, plans = $13, popular = $15, sections = $16
                WHERE id = $14 RETURNING *;
            `;
            const params = [
                name, cost, square, floors, terraces, bedrooms, bathrooms,
                description, style, material,
                finalCoverUrl, finalImageUrls, finalPlanUrls,
                id, popular, sections
            ];
            const updatedProject = await query(sql, params);

            res.status(200).json(updatedProject.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Server error', error: error.message });
        }
    }
);

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const findProjectQuery = 'SELECT images, plans FROM public.projects WHERE id = $1';
        const projectResult = await query(findProjectQuery, [id]);

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const project = projectResult.rows[0];
        const allFileUrls = [...(project.images || []), ...(project.plans || [])];

        const deletionPromises = allFileUrls.map(url => {
            if (!url.startsWith(API_URL_PREFIX)) return Promise.resolve();
            const filename = url.replace(API_URL_PREFIX, '');
            const filePath = path.join(UPLOAD_DIR, filename);
            return fs.unlink(filePath).catch(err => {
                if (err.code !== 'ENOENT') console.error(`Failed to delete file ${filePath}:`, err);
            });
        });

        await Promise.all(deletionPromises);
        await query('DELETE FROM public.projects WHERE id = $1', [id]);
        res.status(200).json({ msg: `Project with ID ${id} and associated files were deleted.` });
    } catch (error) {
        console.error(`Error deleting project ${id}:`, error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

module.exports = router;