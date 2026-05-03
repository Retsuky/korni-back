const express = require('express');
const router = express.Router();
const { query } = require('../../../db/db');

router.get('/', async (req, res) => {
    try {
        const applications = await query('SELECT * FROM applications', []);
        if (applications.rows.length === 0) return res.status(404).json({ msg: "Applications not found" });

        res.status(200).json(applications.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});

module.exports = router;