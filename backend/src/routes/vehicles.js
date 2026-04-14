const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', isAuthenticated, (req, res) => {
    try {
        const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
        res.json({ vehicles });
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', isAuthenticated, (req, res) => {
    try {
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ vehicle });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', isAdmin, (req, res) => {
    try {
        const { plate_no, vehicle_type, make_model, year, status, monthly_budget } = req.body;
        if (!plate_no) return res.status(400).json({ error: 'Plate number is required' });
        const existing = db.prepare('SELECT id FROM vehicles WHERE plate_no = ?').get(plate_no);
        if (existing) return res.status(409).json({ error: 'Vehicle with this plate number already exists' });

        const result = db.prepare(`
            INSERT INTO vehicles (plate_no, vehicle_type, make_model, year, status, monthly_budget)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(plate_no, vehicle_type || null, make_model || null, year || null, status || 'active', monthly_budget || 0);

        res.status(201).json({ message: 'Vehicle created', vehicleId: result.lastInsertRowid });
    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { plate_no, vehicle_type, make_model, year, status, monthly_budget } = req.body;
        const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'Vehicle not found' });
        if (plate_no && plate_no !== existing.plate_no) {
            const conflict = db.prepare('SELECT id FROM vehicles WHERE plate_no = ? AND id != ?').get(plate_no, id);
            if (conflict) return res.status(409).json({ error: 'Another vehicle with this plate number exists' });
        }
        db.prepare(`
            UPDATE vehicles SET plate_no = ?, vehicle_type = ?, make_model = ?, year = ?, status = ?, monthly_budget = ?
            WHERE id = ?
        `).run(
            plate_no || existing.plate_no,
            vehicle_type !== undefined ? vehicle_type : existing.vehicle_type,
            make_model !== undefined ? make_model : existing.make_model,
            year !== undefined ? year : existing.year,
            status || existing.status,
            monthly_budget !== undefined ? monthly_budget : existing.monthly_budget,
            id
        );
        res.json({ message: 'Vehicle updated' });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const existing = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'Vehicle not found' });
        const hasExpenses = db.prepare('SELECT id FROM expenses WHERE vehicle_id = ?').get(id);
        if (hasExpenses) {
            return res.status(400).json({ error: 'Cannot delete vehicle with existing expenses. Deactivate it instead.' });
        }
        db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
        res.json({ message: 'Vehicle deleted' });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
