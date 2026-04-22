require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initDb } = require('./config/db');
const { sanitizeRequest } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// ── Security Headers (helmet) ─────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────
// Allow the Vite dev server and any LAN client accessing the built app
const LAN_ORIGINS = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || LAN_ORIGINS.test(origin)) return cb(null, true);
        cb(new Error('CORS not allowed'));
    },
    credentials: true,
}));

// ── Body Parsing + Input Sanitisation ────────────────────────────────────
app.use(express.json());
app.use(sanitizeRequest); // Strip < > from all string fields globally

// ── Session ───────────────────────────────────────────────────────────────
// 8-hour rolling session — activity resets the timer.
// SECURE flag: set SESSION_SECURE=true in .env when running behind HTTPS.
app.use(session({
    secret: process.env.SESSION_SECRET || 'jifs-fleet-secret-change-this',
    resave: false,
    saveUninitialized: false,
    rolling: true,                          // reset expiry on every request
    cookie: {
        secure: process.env.SESSION_SECURE === 'true', // true = HTTPS only
        httpOnly: true,                     // not accessible from JS
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,        // 8 hours
    },
}));

// ── Routes ────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const vehicleRoutes  = require('./routes/vehicles');
const supplierRoutes = require('./routes/suppliers');
const expenseRoutes  = require('./routes/expenses');
const serviceRoutes  = require('./routes/services');
const partRoutes     = require('./routes/parts');
const reportRoutes   = require('./routes/reports');
const documentRoutes = require('./routes/documents');

app.use('/api/auth',      authRoutes);
app.use('/api/vehicles',  vehicleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses',  expenseRoutes);
app.use('/api/services',  serviceRoutes);
app.use('/api/parts',     partRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/documents', documentRoutes);

// ── Serve built frontend (production / LAN mode) ─────────────────────────
const DIST = path.join(__dirname, '../../frontend/dist');
if (require('fs').existsSync(DIST)) {
    app.use(express.static(DIST));
    app.use((_req, res) => {
        res.sendFile(path.join(DIST, 'index.html'));
    });
} else {
    app.get('/', (_req, res) => {
        res.json({ message: 'Jifs Company & Gen Supp Ltd — Fleet API running' });
    });
}

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} (LAN: http://[your-ip]:${PORT})`);
});
