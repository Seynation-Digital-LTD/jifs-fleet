const { db } = require('../config/db');

// ── IP-based Login Rate Limiter ─────────────────────────────────────────────
// Max 5 login attempts per IP per 60-second window
const ipAttempts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;

// Prune stale entries every 5 minutes to prevent memory growth
setInterval(() => {
    const now = Date.now();
    for (const [key, rec] of ipAttempts.entries()) {
        if (now - rec.windowStart > WINDOW_MS) ipAttempts.delete(key);
    }
}, 5 * 60 * 1000).unref();

const loginRateLimiter = (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const rec = ipAttempts.get(ip);

    if (!rec || now - rec.windowStart > WINDOW_MS) {
        ipAttempts.set(ip, { count: 1, windowStart: now });
        return next();
    }

    if (rec.count >= MAX_PER_WINDOW) {
        const waitSec = Math.ceil((WINDOW_MS - (now - rec.windowStart)) / 1000);
        return res.status(429).json({
            error: `Too many login attempts. Please wait ${waitSec} second${waitSec !== 1 ? 's' : ''} and try again.`
        });
    }

    rec.count++;
    next();
};

// Increment the counter for an IP (called on each failed login)
const trackFailedIp = (ip) => {
    const now = Date.now();
    const rec = ipAttempts.get(ip);
    if (!rec || now - rec.windowStart > WINDOW_MS) {
        ipAttempts.set(ip, { count: 1, windowStart: now });
    } else {
        rec.count++;
    }
};

// ── Password Strength Validator ─────────────────────────────────────────────
const validatePassword = (password) => {
    const errors = [];
    if (!password || password.length < 8) errors.push('at least 8 characters long');
    if (!/[A-Z]/.test(password))           errors.push('at least 1 uppercase letter (A–Z)');
    if (!/[0-9]/.test(password))           errors.push('at least 1 number (0–9)');
    return errors; // empty = valid
};

// ── Input Sanitiser ─────────────────────────────────────────────────────────
// Strips < > from every string field in req.body to prevent HTML/script injection.
// Applied globally — parameterised SQL already prevents SQL injection.
const sanitizeRequest = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key]
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .trim();
            }
        }
    }
    next();
};

// ── Field Validators (used inside route handlers) ───────────────────────────
const isValidDate = (str) => {
    if (!str) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
};

const isValidNumber = (val) =>
    val === null || val === undefined || val === '' || !isNaN(parseFloat(val));

// ── Audit Logger ────────────────────────────────────────────────────────────
// Writes a structured entry to the audit_logs table.
// action: short verb  e.g. 'LOGIN_SUCCESS', 'DELETE_EXPENSE'
// details: human-readable description
const auditLog = (action, details, userId, req) => {
    try {
        const ip = req?.ip || req?.socket?.remoteAddress || null;
        db.prepare(`
            INSERT INTO audit_logs (action, details, user_id, ip_address)
            VALUES (?, ?, ?, ?)
        `).run(action, details || null, userId || null, ip);
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
};

module.exports = {
    loginRateLimiter,
    trackFailedIp,
    validatePassword,
    sanitizeRequest,
    isValidDate,
    isValidNumber,
    auditLog,
};
