const express = require('express');
const crypto = require('crypto');
const Analytics = require('../models/Analytics');

const router = express.Router();

function getTodayKey() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function hashIP(ip) {
    return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 16);
}

// POST /api/analytics/view — record a page view
router.post('/view', async (req, res) => {
    try {
        const { type } = req.body; // "note" or "file"
        const date = getTodayKey();
        const ipHash = hashIP(req.ip);

        let analytics = await Analytics.findOne({ date });
        if (!analytics) {
            analytics = new Analytics({ date });
        }

        analytics.totalViews += 1;

        if (type === 'note') analytics.noteViews += 1;
        if (type === 'file') analytics.fileViews += 1;

        // Track unique visitors
        if (!analytics.uniqueVisitors.includes(ipHash)) {
            analytics.uniqueVisitors.push(ipHash);
        }

        await analytics.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/analytics/download — record a file download
router.post('/download', async (req, res) => {
    try {
        const { fileSize } = req.body;
        const date = getTodayKey();

        let analytics = await Analytics.findOne({ date });
        if (!analytics) {
            analytics = new Analytics({ date });
        }

        analytics.totalDownloads += 1;
        analytics.totalFileSize += fileSize || 0;

        await analytics.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics/stats — get global stats
router.get('/stats', async (_req, res) => {
    try {
        const allDocs = await Analytics.find().sort({ date: -1 }).limit(30);

        const totals = allDocs.reduce(
            (acc, doc) => ({
                totalViews: acc.totalViews + doc.totalViews,
                uniqueVisitors: acc.uniqueVisitors + doc.uniqueVisitors.length,
                totalFileSize: acc.totalFileSize + doc.totalFileSize,
                totalDownloads: acc.totalDownloads + doc.totalDownloads,
                noteViews: acc.noteViews + doc.noteViews,
                fileViews: acc.fileViews + doc.fileViews,
            }),
            { totalViews: 0, uniqueVisitors: 0, totalFileSize: 0, totalDownloads: 0, noteViews: 0, fileViews: 0 }
        );

        res.json({ last30Days: allDocs, totals });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
