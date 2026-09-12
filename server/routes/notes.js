const express = require('express');
const bcrypt = require('bcryptjs');
const Note = require('../models/Note');
const { generateSlug } = require('../utils/slug');

const router = express.Router();

// GET /api/notes/:slug — fetch or create note
router.get('/:slug', async (req, res) => {
    try {
        let note = await Note.findOne({ slug: req.params.slug });

        if (!note) {
            note = await Note.create({ slug: req.params.slug });
        }

        // Increment views
        note.views += 1;
        await note.save();

        res.json({
            slug: note.slug,
            content: note.content,
            language: note.language,
            isPasswordProtected: !!note.passwordHash,
            views: note.views,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notes/:slug — auto-save content
router.put('/:slug', async (req, res) => {
    try {
        const { content, language } = req.body;
        let note = await Note.findOne({ slug: req.params.slug });

        if (!note) {
            note = await Note.create({ slug: req.params.slug, content, language });
        } else {
            // Push current state to version history before overwriting
            note.pushVersion();
            note.content = content;
            if (language) note.language = language;
            await note.save();
        }

        res.json({ success: true, updatedAt: note.updatedAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/notes/:slug/password — set or remove password
router.post('/:slug/password', async (req, res) => {
    try {
        const { password, currentPassword } = req.body;
        const note = await Note.findOne({ slug: req.params.slug });

        if (!note) return res.status(404).json({ error: 'Note not found' });

        // If already password-protected, verify current password first
        if (note.passwordHash) {
            if (!currentPassword) {
                return res.status(401).json({ error: 'Current password required' });
            }
            const valid = await bcrypt.compare(currentPassword, note.passwordHash);
            if (!valid) {
                return res.status(401).json({ error: 'Invalid current password' });
            }
        }

        if (password) {
            note.passwordHash = await bcrypt.hash(password, 10);
        } else {
            note.passwordHash = null; // Remove protection
        }

        await note.save();
        res.json({ success: true, isPasswordProtected: !!note.passwordHash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/notes/:slug/verify — verify password to unlock editing
router.post('/:slug/verify', async (req, res) => {
    try {
        const { password } = req.body;
        const note = await Note.findOne({ slug: req.params.slug });

        if (!note) return res.status(404).json({ error: 'Note not found' });
        if (!note.passwordHash) return res.json({ unlocked: true });

        const valid = await bcrypt.compare(password, note.passwordHash);
        res.json({ unlocked: valid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notes/:slug/migrate — change slug (migrate content)
router.put('/:slug/migrate', async (req, res) => {
    try {
        const { newSlug } = req.body;

        if (!newSlug || !/^[a-zA-Z0-9_-]+$/.test(newSlug)) {
            return res.status(400).json({ error: 'Invalid slug. Use only letters, numbers, hyphens, and underscores.' });
        }

        // Check if new slug is taken
        const existing = await Note.findOne({ slug: newSlug });
        if (existing) {
            return res.status(409).json({ error: 'That URL is already taken.' });
        }

        const note = await Note.findOne({ slug: req.params.slug });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        note.slug = newSlug;
        await note.save();

        res.json({ success: true, newSlug });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notes/:slug/versions — get version history
router.get('/:slug/versions', async (req, res) => {
    try {
        const note = await Note.findOne({ slug: req.params.slug });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        res.json({ versions: note.versions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
