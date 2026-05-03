const express = require('express');
const router = express.Router();
const { query } = require('../../../db/db');
const multer = require('multer');
const path = require('path');
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

router.put('/update',
    upload.array('images', 20),
    async (req, res) => {
        try {
            const { existingSlides, newSlides } = req.body;

            let existingSlidesData = [];
            if (existingSlides) {
                try {
                    existingSlidesData = JSON.parse(existingSlides);
                    if (!Array.isArray(existingSlidesData)) {
                        existingSlidesData = [];
                    }
                } catch (parseError) {
                    console.error('Error parsing existingSlides:', parseError);
                    existingSlidesData = [];
                }
            }

            let newSlidesData = [];
            if (newSlides) {
                try {
                    newSlidesData = JSON.parse(newSlides);
                    if (!Array.isArray(newSlidesData)) {
                        newSlidesData = [];
                    }
                } catch (parseError) {
                    console.error('Error parsing newSlides:', parseError);
                    newSlidesData = [];
                }
            }

            const newImageUrls = [];
            if (req.files && req.files.length > 0) {
                newImageUrls.push(...req.files.map(file => `${API_URL_PREFIX}${file.filename}`));
            }

            await query('BEGIN');

            try {
                await query('DELETE FROM slides');

                for (let i = 0; i < existingSlidesData.length; i++) {
                    const slide = existingSlidesData[i];
                    await query(`
                        INSERT INTO slides (slide_order, image_url, title, subtitle)
                        VALUES ($1, $2, $3, $4)
                    `, [i, slide.image_url, slide.title || '', slide.subtitle || '']);
                }

                for (let i = 0; i < newSlidesData.length; i++) {
                    const slide = newSlidesData[i];
                    const imageUrl = newImageUrls[i] || slide.image_url;
                    await query(`
                        INSERT INTO slides (slide_order, image_url, title, subtitle)
                        VALUES ($1, $2, $3, $4)
                    `, [existingSlidesData.length + i, imageUrl, slide.title || '', slide.subtitle || '']);
                }

                await query('COMMIT');

                res.status(200).json({ msg: "Slides successfully update" });
            } catch (error) {
                await query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error('Error updating main page:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.get('/main', async (req, res) => {
    try {
        const result = await query(`SELECT * FROM slides`, []);
        if (result.rows.length === 0) return res.status(404).json({ msg: "Slides not found" });

        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching main page:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 