const express = require('express');
const crypto = require('crypto');
const { readLogs, logFile, clearLogs } = require('../utils/logger');
const { requireDev, loginLimiter, createToken, DEV_PASSWORD } = require('../middleware/devAuth');
const Analytics = require('../models/Analytics');
const Contact = require('../models/Contact');

const router = express.Router();

// ── POST /api/dev/login ─────────────────────────────────────
// Verify the dev password and return a persistent JWT token.
router.post('/login', loginLimiter, (req, res) => {
    try {
        const { password } = req.body || {};
        if (!password || password !== DEV_PASSWORD) {
            return res.status(401).json({ error: 'Invalid dev password' });
        }
        const token = createToken();
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/dev/logs ───────────────────────────────────────
// Read the log file with optional filtering.
// Query params: limit, level, route, search, since (ISO date)
router.get('/logs', requireDev, (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 500, 5000);
        const level = req.query.level || null;
        const route = req.query.route || null;
        const search = req.query.search || null;
        const since = req.query.since ? new Date(req.query.since) : null;

        const allLogs = readLogs(limit);

        const filtered = allLogs.filter((entry) => {
            if (level && entry.level !== level) return false;
            if (route && !(entry.route || '').toLowerCase().includes(route.toLowerCase())) return false;
            if (since && new Date(entry.timestamp) < since) return false;
            if (search) {
                const hay = JSON.stringify(entry).toLowerCase();
                if (!hay.includes(search.toLowerCase())) return false;
            }
            return true;
        });

        res.json({
            logFile,
            total: filtered.length,
            logs: filtered,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/dev/logs ────────────────────────────────────
router.delete('/logs', requireDev, (_req, res) => {
    try {
        const ok = clearLogs();
        res.json({ success: ok });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/dev/contacts ───────────────────────────────────
// Paginated contacts (10 per page). Supports offset-based pagination.
router.get('/contacts', requireDev, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
        const offset = parseInt(req.query.offset, 10) || 0;

        const [contacts, total] = await Promise.all([
            Contact.find().sort({ createdAt: -1 }).skip(offset).limit(limit),
            Contact.countDocuments(),
        ]);

        res.json({
            contacts,
            total,
            limit,
            offset,
            hasMore: offset + contacts.length < total,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/dev/contacts/:id ────────────────────────────
router.delete('/contacts/:id', requireDev, async (req, res) => {
    try {
        const deleted = await Contact.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Contact not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/dev/analytics ──────────────────────────────────
// Aggregated analytics across all time + last 30 days series.
router.get('/analytics', requireDev, async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
        const since = new Date();
        since.setDate(since.getDate() - days);

        const docs = await Analytics.find({ date: { $gte: since.toISOString().slice(0, 10) } })
            .sort({ date: 1 })
            .lean();

        const totals = docs.reduce(
            (acc, d) => ({
                totalViews: acc.totalViews + d.totalViews,
                uniqueVisitors: acc.uniqueVisitors + (d.uniqueVisitors || []).length,
                totalFileSize: acc.totalFileSize + d.totalFileSize,
                totalDownloads: acc.totalDownloads + d.totalDownloads,
                noteViews: acc.noteViews + d.noteViews,
                fileViews: acc.fileViews + d.fileViews,
            }),
            { totalViews: 0, uniqueVisitors: 0, totalFileSize: 0, totalDownloads: 0, noteViews: 0, fileViews: 0 }
        );

        // All-time totals (independent of the `days` window)
        const allDocs = await Analytics.find().lean();
        const allTime = allDocs.reduce(
            (acc, d) => ({
                totalViews: acc.totalViews + d.totalViews,
                uniqueVisitors: acc.uniqueVisitors + (d.uniqueVisitors || []).length,
                totalFileSize: acc.totalFileSize + d.totalFileSize,
                totalDownloads: acc.totalDownloads + d.totalDownloads,
                noteViews: acc.noteViews + d.noteViews,
                fileViews: acc.fileViews + d.fileViews,
            }),
            { totalViews: 0, uniqueVisitors: 0, totalFileSize: 0, totalDownloads: 0, noteViews: 0, fileViews: 0 }
        );

        res.json({
            windowDays: days,
            series: docs.map((d) => ({
                date: d.date,
                totalViews: d.totalViews,
                uniqueVisitors: (d.uniqueVisitors || []).length,
                totalFileSize: d.totalFileSize,
                totalDownloads: d.totalDownloads,
                noteViews: d.noteViews,
                fileViews: d.fileViews,
            })),
            totals,
            allTime,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/dev/health ─────────────────────────────────────
router.get('/health', requireDev, (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

module.exports = router;