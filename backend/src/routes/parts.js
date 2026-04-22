const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');

const router = express.Router();

// GET all parts
router.get('/', isAuthenticated, (req, res) => {
    try {
        const parts = db.prepare(`
            SELECT p.*, v.plate_no
            FROM parts p
            LEFT JOIN vehicles v ON p.vehicle_id = v.id
            ORDER BY p.expiry_date ASC
        `).all();
        
        res.json({ parts });
    } catch (error) {
        console.error('Get parts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET expiring parts (within X days)
router.get('/expiring/:days', isAuthenticated, (req, res) => {
    try {
        const days = parseInt(req.params.days) || 30;
        
        const parts = db.prepare(`
            SELECT p.*, v.plate_no
            FROM parts p
            LEFT JOIN vehicles v ON p.vehicle_id = v.id
            WHERE p.expiry_date IS NOT NULL
            AND p.expiry_date <= date('now', '+' || ? || ' days')
            AND p.expiry_date >= date('now')
            ORDER BY p.expiry_date ASC
        `).all(days);
        
        res.json({ parts });
    } catch (error) {
        console.error('Get expiring parts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET parts by vehicle
router.get('/vehicle/:vehicleId', isAuthenticated, (req, res) => {
    try {
        const parts = db.prepare(`
            SELECT p.*, v.plate_no
            FROM parts p
            LEFT JOIN vehicles v ON p.vehicle_id = v.id
            WHERE p.vehicle_id = ?
            ORDER BY p.expiry_date ASC
        `).all(req.params.vehicleId);
        
        res.json({ parts });
    } catch (error) {
        console.error('Get vehicle parts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create part
router.post('/', isAuthenticated, (req, res) => {
    try {
        const { vehicle_id, service_id, part_number, part_name, expiry_date, installed_date, serial_number } = req.body;

        if (!vehicle_id || !part_name) {
            return res.status(400).json({ error: 'Vehicle and part name are required' });
        }

        const stmt = db.prepare(`
            INSERT INTO parts (vehicle_id, service_id, part_number, part_name, expiry_date, installed_date, serial_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            vehicle_id,
            service_id || null,
            part_number || null,
            part_name,
            expiry_date || null,
            installed_date || null,
            serial_number || null
        );

        res.status(201).json({
            message: 'Part created',
            partId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create part error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update part
router.put('/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_id, service_id, part_number, part_name, expiry_date, installed_date, serial_number } = req.body;

        const existing = db.prepare('SELECT * FROM parts WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Part not found' });
        }

        const stmt = db.prepare(`
            UPDATE parts SET
                vehicle_id = ?, service_id = ?, part_number = ?,
                part_name = ?, expiry_date = ?, installed_date = ?, serial_number = ?
            WHERE id = ?
        `);

        stmt.run(
            vehicle_id || existing.vehicle_id,
            service_id !== undefined ? service_id : existing.service_id,
            part_number !== undefined ? part_number : existing.part_number,
            part_name || existing.part_name,
            expiry_date !== undefined ? expiry_date : existing.expiry_date,
            installed_date !== undefined ? installed_date : existing.installed_date,
            serial_number !== undefined ? serial_number : existing.serial_number,
            id
        );

        res.json({ message: 'Part updated' });
    } catch (error) {
        console.error('Update part error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE part
router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = db.prepare('SELECT id FROM parts WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Part not found' });
        }
        
        const part = db.prepare('SELECT part_name, vehicle_id FROM parts WHERE id = ?').get(id);
        db.prepare('DELETE FROM parts WHERE id = ?').run(id);
        auditLog('DELETE_PART', `Deleted part: ${part?.part_name} vehicle_id=${part?.vehicle_id} (id=${id})`, req.session.user?.id, req);
        res.json({ message: 'Part deleted' });
    } catch (error) {
        console.error('Delete part error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;