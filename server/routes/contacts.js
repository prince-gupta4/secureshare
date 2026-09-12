const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST /api/contacts — Save a contact message
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email and message are required.' });
        }

        const contact = new Contact({ name, email, message });
        await contact.save();

        res.status(201).json({ success: true, message: 'Message received!' });
    } catch (err) {
        console.error('Contact save error:', err);
        res.status(500).json({ error: 'Failed to save message.' });
    }
});

module.exports = router;
