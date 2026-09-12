const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DEV_PASSWORD = process.env.DEV_PASSWORD || 'dev123';
const DEV_SECRET = process.env.DEV_SECRET || 'securestore-dev-secret-change-me';
const TOKEN_MAX_AGE = '7d';

const TOKEN_PATH = path.join(__dirname, '..', 'devtoken.txt');

/**
 * Read a previously issued dev token (if any) so sessions survive restarts.
 */
function readStoredToken() {
    try {
        if (fs.existsSync(TOKEN_PATH)) {
            return fs.readFileSync(TOKEN_PATH, 'utf8').trim();
        }
    } catch { /* ignore */ }
    return null;
}

/**
 * Verify a JWT dev token. Returns decoded payload or null.
 */
function verifyToken(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, DEV_SECRET);
    } catch {
        return null;
    }
}

/**
 * Create a dev token (JWT), persist it to disk, and return it.
 */
function createToken() {
    const token = jwt.sign({ sub: 'dev', role: 'dev' }, DEV_SECRET, { expiresIn: TOKEN_MAX_AGE });
    try {
        fs.writeFileSync(TOKEN_PATH, token, 'utf8');
    } catch { /* ignore */ }
    return token;
}

/**
 * Express middleware: require a valid dev token in the Authorization header
 * (Bearer <token>) or ?token=<token> query param.
 */
function requireDev(req, res, next) {
    const header = req.get('Authorization') || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = bearer || req.query.token;

    if (!token) {
        return res.status(401).json({ error: 'Dev token required' });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({ error: 'Invalid or expired dev token' });
    }

    req.dev = payload;
    next();
}

/**
 * Express middleware: rate-limit dev login attempts.
 */
const loginLimiter = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, try again later.' },
});

module.exports = {
    DEV_PASSWORD,
    DEV_SECRET,
    createToken,
    verifyToken,
    requireDev,
    loginLimiter,
    readStoredToken,
};