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

router.post('/create',
    upload.array('images', 50),
    async (req, res) => {
        try {
            const { title, description, category, stage } = req.body;
            console.log(req.body)

            if (!title || !category) {
                return res.status(400).json({ error: 'Title and category are required' });
            }

            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = req.files.map(file => `${API_URL_PREFIX}${file.filename}`);
            }

            const result = await query(`
                INSERT INTO gallery (title, description, category, images, stage)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [title, description || '', category, imageUrls, stage]);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating gallery:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const galleryResult = await query(`
            SELECT images FROM gallery WHERE id = $1
        `, [id]);

        if (galleryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        const gallery = galleryResult.rows[0];

        await query(`
            DELETE FROM gallery WHERE id = $1
        `, [id]);

        if (gallery.images && Array.isArray(gallery.images)) {
            const deletionPromises = gallery.images.map(imageUrl => {
                try {
                    const filename = imageUrl.split('/').pop();
                    if (filename) {
                        const filePath = path.join('uploads', filename);
                        return fs.unlink(filePath).catch(err => {
                            if (err.code !== 'ENOENT') {
                                console.error(`Failed to delete file ${filePath}:`, err);
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error processing image URL for deletion:', imageUrl, error);
                }
            });

            await Promise.all(deletionPromises);
        }

        res.status(200).json({ message: 'Gallery deleted successfully' });
    } catch (error) {
        console.error('Error deleting gallery:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('SELECT * FROM gallery WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/update/:id',
    upload.array('images', 50),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, category, existingImageUrls, stage } = req.body;

            if (!title || !category) {
                return res.status(400).json({ error: 'Title and category are required' });
            }

            let finalImages = [];
            if (existingImageUrls) {
                try {
                    finalImages = JSON.parse(existingImageUrls);
                    if (!Array.isArray(finalImages)) {
                        finalImages = [];
                    }
                } catch (parseError) {
                    console.error('Error parsing existingImageUrls:', parseError);
                    finalImages = [];
                }
            }

            if (req.files && req.files.length > 0) {
                const newImageUrls = req.files.map(file => `${API_URL_PREFIX}${file.filename}`);
                finalImages = [...finalImages, ...newImageUrls];
            }

            if (finalImages.length === 0) {
                return res.status(400).json({ error: 'At least one image is required' });
            }

            const oldGalleryResult = await query('SELECT images FROM gallery WHERE id = $1', [id]);
            if (oldGalleryResult.rows.length === 0) {
                return res.status(404).json({ error: 'Gallery not found' });
            }
            const oldImages = oldGalleryResult.rows[0].images || [];
            const imagesToDelete = oldImages.filter(url => !finalImages.includes(url));

            if (imagesToDelete) {
                const deletionPromises = imagesToDelete.map(imageUrl => {
                    try {
                        const filename = imageUrl.split('/').pop();
                        if (filename) {
                            const filePath = path.join('uploads', filename);
                            return fs.unlink(filePath).catch(err => {
                                if (err.code !== 'ENOENT') {
                                    console.error(`Failed to delete file ${filePath}:`, err);
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error processing image URL for deletion:', imageUrl, error);
                    }
                });

                await Promise.all(deletionPromises);
            }

            const result = await query(`
                UPDATE gallery
                SET title = $1, description = $2, category = $3, images = $4, stage = $6, updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING id, title, description, category, images
            `, [title, description || '', category, finalImages, id, stage]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Gallery not found for update' });
            }

            const updatedGallery = result.rows[0];
            const formattedResponse = {
                id: updatedGallery.id,
                name: updatedGallery.title,
                description: updatedGallery.description,
                category: updatedGallery.category,
                images: updatedGallery.images || []
            };

            res.status(200).json(formattedResponse);
        } catch (error) {
            console.error('Error updating gallery:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

module.exports = router;