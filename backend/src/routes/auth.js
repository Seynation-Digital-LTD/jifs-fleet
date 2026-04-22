const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../config/db');
const {
    loginRateLimiter,
    trackFailedIp,
    validatePassword,
    auditLog,
} = require('../middleware/security');

const router = express.Router();

const LOCK_THRESHOLD = 10;              // failed attempts before account lock
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ── GET /needs-setup — public, returns true if no users exist yet ────────────
router.get('/needs-setup', (req, res) => {
    try {
        const count = db.prepare('SELECT COUNT(*) as n FROM users').get();
        res.json({ needsSetup: count.n === 0 });
    } catch (error) {
        res.json({ needsSetup: false });
    }
});

// ── POST /register — only works when NO users exist (first-time setup only) ──
router.post('/register', async (req, res) => {
    try {
        // Block registration once any user exists — use /api/auth/users instead
        const count = db.prepare('SELECT COUNT(*) as n FROM users').get();
        if (count.n > 0) {
            return res.status(403).json({ error: 'Registration is disabled. Ask your admin to create an account for you.' });
        }

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const pwErrors = validatePassword(password);
        if (pwErrors.length > 0) {
            return res.status(400).json({ error: `Password must be ${pwErrors.join(', ')}.` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
        ).run(username, hashedPassword, 'admin');

        auditLog('REGISTER', `First admin created: ${username}`, result.lastInsertRowid, req);
        res.status(201).json({ message: 'Admin account created', userId: result.lastInsertRowid });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /login ─────────────────────────────────────────────────────────────
// Protected by IP-based rate limiter (max 5/min) + per-account lockout (10 failures).
router.post('/login', loginRateLimiter, async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Fetch user
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        // Unknown user — still track IP attempt to prevent username enumeration
        if (!user) {
            trackFailedIp(ip);
            auditLog('LOGIN_FAIL', `Unknown username: ${username}`, null, req);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is locked
        if (user.locked_until) {
            const lockedUntil = new Date(user.locked_until);
            if (lockedUntil > new Date()) {
                const minsLeft = Math.ceil((lockedUntil - new Date()) / 60000);
                auditLog('LOGIN_BLOCKED', `Account locked: ${username}`, user.id, req);
                return res.status(423).json({
                    error: `Account is locked. Try again in ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}.`,
                });
            } else {
                // Lock has expired — clear it
                db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
            }
        }

        // Compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            trackFailedIp(ip);
            const newAttempts = (user.failed_attempts || 0) + 1;

            if (newAttempts >= LOCK_THRESHOLD) {
                const lockUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
                db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?')
                    .run(newAttempts, lockUntil, user.id);
                auditLog('ACCOUNT_LOCKED', `Account locked after ${newAttempts} failures: ${username}`, user.id, req);
                return res.status(423).json({
                    error: 'Account locked for 30 minutes due to too many failed login attempts.',
                });
            } else {
                db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(newAttempts, user.id);
                const remaining = LOCK_THRESHOLD - newAttempts;
                auditLog('LOGIN_FAIL', `Wrong password: ${username} (${newAttempts} failures)`, user.id, req);
                return res.status(401).json({
                    error: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lock.`,
                });
            }
        }

        // Success — reset failure counters
        db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

        // Regenerate session ID to prevent session fixation attacks
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regenerate error:', err);
                return res.status(500).json({ error: 'Session error' });
            }

            req.session.user = { id: user.id, username: user.username, role: user.role };
            auditLog('LOGIN_SUCCESS', `Login: ${username}`, user.id, req);

            res.json({ message: 'Login successful', user: req.session.user });
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /logout ────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    const userId = req.session.user?.id;
    const username = req.session.user?.username;

    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('connect.sid');
        if (userId) auditLog('LOGOUT', `Logout: ${username}`, userId, req);
        res.json({ message: 'Logged out' });
    });
});

// ── POST /verify-password ───────────────────────────────────────────────────
// Used by the delete-confirmation modal to verify the user's own password.
router.post('/verify-password', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }
        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.session.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        res.json({ verified: true });
    } catch (error) {
        console.error('Verify password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /me ─────────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
});

// ── GET /users — list all users (admin only) ─────────────────────────────────
const { isAdmin } = require('../middleware/auth');

router.get('/users', isAdmin, (req, res) => {
    try {
        const users = db.prepare(
            'SELECT id, username, role, created_at, failed_attempts, locked_until FROM users ORDER BY id ASC'
        ).all();
        res.json({ users });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /users — create user (admin only) ────────────────────────────────────
router.post('/users', isAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        if (!['admin', 'operator'].includes(role)) {
            return res.status(400).json({ error: 'Role must be admin or operator' });
        }

        const pwErrors = validatePassword(password);
        if (pwErrors.length > 0) {
            return res.status(400).json({ error: `Password must be ${pwErrors.join(', ')}.` });
        }

        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
        ).run(username, hashed, role);

        auditLog('CREATE_USER', `Admin created user: ${username} (${role})`, req.session.user.id, req);
        res.status(201).json({ message: 'User created', userId: result.lastInsertRowid });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /users/:id — update role or reset password (admin only) ───────────────
router.put('/users/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role, password } = req.body;

        const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (role !== undefined) {
            if (!['admin', 'operator'].includes(role)) {
                return res.status(400).json({ error: 'Role must be admin or operator' });
            }
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
            auditLog('UPDATE_USER_ROLE', `Changed role of ${user.username} to ${role}`, req.session.user.id, req);
        }

        if (password) {
            const pwErrors = validatePassword(password);
            if (pwErrors.length > 0) {
                return res.status(400).json({ error: `Password must be ${pwErrors.join(', ')}.` });
            }
            const hashed = await bcrypt.hash(password, 10);
            db.prepare('UPDATE users SET password = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?')
                .run(hashed, id);
            auditLog('RESET_PASSWORD', `Admin reset password for ${user.username}`, req.session.user.id, req);
        }

        res.json({ message: 'User updated' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /users/:id — delete user (admin only, cannot delete self) ──────────
router.delete('/users/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.session.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        auditLog('DELETE_USER', `Deleted user: ${user.username} (id=${id})`, req.session.user.id, req);
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
