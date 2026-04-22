const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');

const router = express.Router();

// GET all services
router.get('/', isAuthenticated, (req, res) => {
    try {
        const services = db.prepare(`
            SELECT 
                s.*,
                v.plate_no
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            ORDER BY s.service_date DESC
        `).all();
        
        res.json({ services });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET services by vehicle
router.get('/vehicle/:vehicleId', isAuthenticated, (req, res) => {
    try {
        const services = db.prepare(`
            SELECT s.*, v.plate_no
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.vehicle_id = ?
            ORDER BY s.service_date DESC
        `).all(req.params.vehicleId);
        
        res.json({ services });
    } catch (error) {
        console.error('Get vehicle services error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET upcoming services (due soon)
router.get('/upcoming/:days', isAuthenticated, (req, res) => {
    try {
        const days = parseInt(req.params.days) || 30;
        
        const services = db.prepare(`
            SELECT s.*, v.plate_no
            FROM services s
            LEFT JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.next_service_date IS NOT NULL
            AND s.next_service_date <= date('now', '+' || ? || ' days')
            AND s.next_service_date >= date('now')
            ORDER BY s.next_service_date ASC
        `).all(days);
        
        res.json({ services });
    } catch (error) {
        console.error('Get upcoming services error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create service
router.post('/', isAuthenticated, (req, res) => {
    try {
        const { vehicle_id, expense_id, service_date, description, next_service_date, next_service_km } = req.body;
        
        if (!vehicle_id || !service_date || !description) {
            return res.status(400).json({ error: 'Vehicle, service date, and description are required' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO services (vehicle_id, expense_id, service_date, description, next_service_date, next_service_km)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            vehicle_id,
            expense_id || null,
            service_date,
            description,
            next_service_date || null,
            next_service_km || null
        );
        
        res.status(201).json({
            message: 'Service record created',
            serviceId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update service
router.put('/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_id, expense_id, service_date, description, next_service_date, next_service_km } = req.body;
        
        const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        const stmt = db.prepare(`
            UPDATE services SET
                vehicle_id = ?, expense_id = ?, service_date = ?, 
                description = ?, next_service_date = ?, next_service_km = ?
            WHERE id = ?
        `);
        
        stmt.run(
            vehicle_id || existing.vehicle_id,
            expense_id !== undefined ? expense_id : existing.expense_id,
            service_date || existing.service_date,
            description || existing.description,
            next_service_date !== undefined ? next_service_date : existing.next_service_date,
            next_service_km !== undefined ? next_service_km : existing.next_service_km,
            id
        );
        
        res.json({ message: 'Service updated' });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE service
router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = db.prepare('SELECT id FROM services WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        const svc = db.prepare('SELECT vehicle_id, service_date FROM services WHERE id = ?').get(id);
        db.prepare('DELETE FROM services WHERE id = ?').run(id);
        auditLog('DELETE_SERVICE', `Deleted service id=${id} vehicle_id=${svc?.vehicle_id} date=${svc?.service_date}`, req.session.user?.id, req);
        res.json({ message: 'Service deleted' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;