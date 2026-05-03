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