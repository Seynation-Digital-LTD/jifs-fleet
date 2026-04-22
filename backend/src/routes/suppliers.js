const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');

const router = express.Router();

// GET all suppliers
router.get('/', isAuthenticated, (req, res) => {
    try {
        const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
        res.json({ suppliers });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET single supplier
router.get('/:id', isAuthenticated, (req, res) => {
    try {
        const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json({ supplier });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create supplier
router.post('/', isAuthenticated, (req, res) => {
    try {
        const { name, contact, type, type_label } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        const stmt = db.prepare('INSERT INTO suppliers (name, contact, type, type_label) VALUES (?, ?, ?, ?)');
        const result = stmt.run(name, contact || null, type || 'other', type_label || null);

        res.status(201).json({
            message: 'Supplier created',
            supplierId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update supplier
router.put('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact, type, type_label } = req.body;

        const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        const stmt = db.prepare('UPDATE suppliers SET name = ?, contact = ?, type = ?, type_label = ? WHERE id = ?');
        stmt.run(
            name || existing.name,
            contact !== undefined ? contact : existing.contact,
            type || existing.type,
            type_label !== undefined ? type_label : existing.type_label,
            id
        );

        res.json({ message: 'Supplier updated' });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE supplier
router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        
        const hasExpenses = db.prepare('SELECT id FROM expenses WHERE supplier_id = ?').get(id);
        if (hasExpenses) {
            return res.status(400).json({ error: 'Cannot delete supplier with existing expenses' });
        }
        
        const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(id);
        db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
        auditLog('DELETE_SUPPLIER', `Deleted supplier: ${supplier?.name} (id=${id})`, req.session.user?.id, req);
        res.json({ message: 'Supplier deleted' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;