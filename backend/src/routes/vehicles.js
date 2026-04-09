const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/vehicles
 * Get all vehicles
 * Access: All authenticated users
 */
router.get('/', isAuthenticated, (req, res) => {
    try {
        const vehicles = db.prepare(`
            SELECT * FROM vehicles ORDER BY created_at DESC
        `).all();
        
        res.json({ vehicles });
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/vehicles/:id
 * Get single vehicle by ID
 * Access: All authenticated users
 */
router.get('/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params;
        
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        res.json({ vehicle });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/vehicles
 * Create new vehicle
 * Access: Admin only
 */
router.post('/', isAdmin, (req, res) => {
    try {
        const { plate_no, vehicle_type, make_model, year, status } = req.body;
        
        // Validation
        if (!plate_no) {
            return res.status(400).json({ error: 'Plate number is required' });
        }
        
        // Check if plate already exists
        const existing = db.prepare('SELECT id FROM vehicles WHERE plate_no = ?').get(plate_no);
        if (existing) {
            return res.status(409).json({ error: 'Vehicle with this plate number already exists' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO vehicles (plate_no, vehicle_type, make_model, year, status)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            plate_no,
            vehicle_type || null,
            make_model || null,
            year || null,
            status || 'active'
        );
        
        res.status(201).json({
            message: 'Vehicle created',
            vehicleId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/vehicles/:id
 * Update vehicle
 * Access: Admin only
 */
router.put('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { plate_no, vehicle_type, make_model, year, status } = req.body;
        
        // Check if vehicle exists
        const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        // Check if new plate_no conflicts with another vehicle
        if (plate_no && plate_no !== existing.plate_no) {
            const conflict = db.prepare('SELECT id FROM vehicles WHERE plate_no = ? AND id != ?').get(plate_no, id);
            if (conflict) {
                return res.status(409).json({ error: 'Another vehicle with this plate number exists' });
            }
        }
        
        const stmt = db.prepare(`
            UPDATE vehicles 
            SET plate_no = ?, vehicle_type = ?, make_model = ?, year = ?, status = ?
            WHERE id = ?
        `);
        
        stmt.run(
            plate_no || existing.plate_no,
            vehicle_type !== undefined ? vehicle_type : existing.vehicle_type,
            make_model !== undefined ? make_model : existing.make_model,
            year !== undefined ? year : existing.year,
            status || existing.status,
            id
        );
        
        res.json({ message: 'Vehicle updated' });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * DELETE /api/vehicles/:id
 * Delete vehicle
 * Access: Admin only
 */
router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if vehicle exists
        const existing = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        // Check for related expenses
        const hasExpenses = db.prepare('SELECT id FROM expenses WHERE vehicle_id = ?').get(id);
        if (hasExpenses) {
            return res.status(400).json({ 
                error: 'Cannot delete vehicle with existing expenses. Deactivate it instead.' 
            });
        }
        
        db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
        
        res.json({ message: 'Vehicle deleted' });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;