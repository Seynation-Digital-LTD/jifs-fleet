require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { initDb } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
    console.log('Body:', req.body);
    console.log('Content-Type:', req.get('Content-Type'));
    next();
});
app.use(session({
    secret: process.env.SESSION_SECRET || 'jifs-fleet-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes

// AUTH ROUTE
const authRoutes = require('./routes/auth') 
const vehicleRoutes = require('./routes/vehicles')

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes);



// Test route
app.get('/', (req, res) => {
    res.json({ message: 'JIFS Fleet API running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});