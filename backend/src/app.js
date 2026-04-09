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
app.use(session({
    secret: process.env.SESSION_SECRET || 'jifs-fleet-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const supplierRoutes = require('./routes/suppliers');
const expenseRoutes = require('./routes/expenses');
const serviceRoutes = require('./routes/services');
const partRoutes = require('./routes/parts');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/reports', reportRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'JIFS Fleet API running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});