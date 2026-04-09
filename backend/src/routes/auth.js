const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../config/db');

const router = express.Router();

/**
 * POST /api/auth/register
 * Creates a new user account
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        // Hash password - NEVER store plain text
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user
        const stmt = db.prepare(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
        );
        const result = stmt.run(username, hashedPassword, role || 'operator');

        res.status(201).json({ 
            message: 'User created',
            userId: result.lastInsertRowid 
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * POST /api/auth/login
 * Authenticates user and creates session
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password with hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session - store user info server-side
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        res.json({ 
            message: 'Login successful',
            user: req.session.user 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/auth/logout
 * Destroys the session
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.json({ message: 'Logged out' });
    });
});

/**
 * GET /api/auth/me
 * Returns current logged-in user
 */
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
});

module.exports = router;