const express = require('express');
const path = require('path');
const fs = require('fs');
const FileModel = require('../models/File');
const { upload } = require('../middleware/fileValidation');
const { generateSlug } = require('../utils/slug');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// POST /api/files/upload — upload a file (already zipped by frontend)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const slug = req.body.slug && /^[a-zA-Z0-9_-]+$/.test(req.body.slug)
            ? req.body.slug
            : generateSlug();

        // Check if slug is taken
        const existing = await FileModel.findOne({ slug });
        if (existing) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(409).json({ error: 'That URL is already taken.' });
        }

        // Calculate expiry
        const lifespanHours = parseInt(req.body.lifespan) || 168; // default 7 days
        const expiresAt = new Date(Date.now() + lifespanHours * 60 * 60 * 1000);

        // Upload to Cloudinary (if configured)
        let cloudinaryUrl = null;
        let cloudinaryPublicId = null;
        // try {
        //     const cloudResult = await uploadToCloudinary(req.file.path, `securestore/${slug}`);
        //     cloudinaryUrl = cloudResult.url;
        //     cloudinaryPublicId = cloudResult.publicId;
        // } catch (cloudErr) {
        //     console.error('Cloudinary upload failed (continuing with local only):', cloudErr.message);
        // }

        const fileDoc = await FileModel.create({
            slug,
            originalName: req.file.originalname,
            filePath: path.relative(path.join(__dirname, '..'), req.file.path),
            cloudinaryUrl,
            cloudinaryPublicId,
            fileSize: req.file.size,
            expiresAt,
        });

        res.json({
            success: true,
            slug: fileDoc.slug,
            originalName: fileDoc.originalName,
            fileSize: fileDoc.fileSize,
            expiresAt: fileDoc.expiresAt,
            cloudinaryUrl: fileDoc.cloudinaryUrl,
        });
    } catch (err) {
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: err.message });
    }
});

// GET /api/files/:slug — get file metadata
router.get('/:slug', async (req, res) => {
    try {
        const fileDoc = await FileModel.findOne({ slug: req.params.slug });
        if (!fileDoc) return res.status(404).json({ error: 'File not found or expired' });

        res.json({
            slug: fileDoc.slug,
            originalName: fileDoc.originalName,
            fileSize: fileDoc.fileSize,
            downloads: fileDoc.downloads,
            expiresAt: fileDoc.expiresAt,
            createdAt: fileDoc.createdAt,
            cloudinaryUrl: fileDoc.cloudinaryUrl,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/files/:slug/download — stream file download
router.get('/:slug/download', async (req, res) => {
    try {
        const fileDoc = await FileModel.findOne({ slug: req.params.slug });
        if (!fileDoc) return res.status(404).json({ error: 'File not found or expired' });

        // Increment download counter
        fileDoc.downloads += 1;
        await fileDoc.save();

        // If Cloudinary URL exists, redirect to it
        if (fileDoc.cloudinaryUrl) {
            return res.redirect(fileDoc.cloudinaryUrl);
        }

        // Otherwise stream from local disk
        const fullPath = path.resolve(__dirname, '..', fileDoc.filePath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.download(fullPath, fileDoc.originalName);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;