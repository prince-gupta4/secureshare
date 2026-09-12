require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const notesRoutes = require('./routes/notes');
const filesRoutes = require('./routes/files');
const analyticsRoutes = require('./routes/analytics');
const contactsRoutes = require('./routes/contacts');
const devRoutes = require('./routes/dev');
const { requestLogger } = require('./middleware/logger');
const { cleanupExpiredFiles } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/securestore';

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging (every API request is logged with route, device, IP, duration, errors)
app.use('/api', requestLogger);

// Global rate limiter — 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ── API Routes ─────────────────────────────────────────────
app.use('/api/notes', notesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/dev', devRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => res.json({ status: 'Looks Good' }));

// ── Scheduled Cleanup ──────────────────────────────────────
// Run every 15 minutes: delete expired files from local disk, Cloudinary, and DB.
cron.schedule('*/15 * * * *', async () => {
  try {
    const result = await cleanupExpiredFiles();
    console.log(`✓ Cleanup run: ${result.deleted} expired file(s) removed`);
  } catch (err) {
    console.error('Cleanup job error:', err.message);
  }
});

// ── MongoDB + Server Start ─────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });