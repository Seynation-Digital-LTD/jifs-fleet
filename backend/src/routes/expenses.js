const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all expenses (with vehicle and supplier names)
router.get('/', isAuthenticated, (req, res) => {
    try {
        const expenses = db.prepare(`
            SELECT 
                e.*,
                v.plate_no,
                s.name as supplier_name
            FROM expenses e
            LEFT JOIN vehicles v ON e.vehicle_id = v.id
            LEFT JOIN suppliers s ON e.supplier_id = s.id
            ORDER BY e.date DESC
        `).all();
        
        res.json({ expenses });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET expenses by vehicle
router.get('/vehicle/:vehicleId', isAuthenticated, (req, res) => {
    try {
        const expenses = db.prepare(`
            SELECT 
                e.*,
                v.plate_no,
                s.name as supplier_name
            FROM expenses e
            LEFT JOIN vehicles v ON e.vehicle_id = v.id
            LEFT JOIN suppliers s ON e.supplier_id = s.id
            WHERE e.vehicle_id = ?
            ORDER BY e.date DESC
        `).all(req.params.vehicleId);
        
        res.json({ expenses });
    } catch (error) {
        console.error('Get vehicle expenses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single expense
router.get('/:id', isAuthenticated, (req, res) => {
    try {
        const expense = db.prepare(`
            SELECT 
                e.*,
                v.plate_no,
                s.name as supplier_name
            FROM expenses e
            LEFT JOIN vehicles v ON e.vehicle_id = v.id
            LEFT JOIN suppliers s ON e.supplier_id = s.id
            WHERE e.id = ?
        `).get(req.params.id);
        
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json({ expense });
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create expense
router.post('/', isAuthenticated, (req, res) => {
    try {
        const { 
            vehicle_id, supplier_id, date, reference_no, 
            expense_type, quantity, unit, debit, credit, notes 
        } = req.body;
        
        if (!vehicle_id || !date || !expense_type) {
            return res.status(400).json({ error: 'Vehicle, date, and expense type are required' });
        }
        
        // Verify vehicle exists
        const vehicle = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(vehicle_id);
        if (!vehicle) {
            return res.status(400).json({ error: 'Vehicle not found' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO expenses 
            (vehicle_id, supplier_id, date, reference_no, expense_type, quantity, unit, debit, credit, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            vehicle_id,
            supplier_id || null,
            date,
            reference_no || null,
            expense_type,
            quantity || null,
            unit || null,
            debit || 0,
            credit || 0,
            notes || null,
            req.session.user.id
        );
        
        res.status(201).json({
            message: 'Expense created',
            expenseId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update expense
router.put('/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params;
        const { 
            vehicle_id, supplier_id, date, reference_no, 
            expense_type, quantity, unit, debit, credit, notes 
        } = req.body;
        
        const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        const stmt = db.prepare(`
            UPDATE expenses SET
                vehicle_id = ?, supplier_id = ?, date = ?, reference_no = ?,
                expense_type = ?, quantity = ?, unit = ?, debit = ?, credit = ?, notes = ?
            WHERE id = ?
        `);
        
        stmt.run(
            vehicle_id || existing.vehicle_id,
            supplier_id !== undefined ? supplier_id : existing.supplier_id,
            date || existing.date,
            reference_no !== undefined ? reference_no : existing.reference_no,
            expense_type || existing.expense_type,
            quantity !== undefined ? quantity : existing.quantity,
            unit !== undefined ? unit : existing.unit,
            debit !== undefined ? debit : existing.debit,
            credit !== undefined ? credit : existing.credit,
            notes !== undefined ? notes : existing.notes,
            id
        );
        
        res.json({ message: 'Expense updated' });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE expense
router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        
        db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;