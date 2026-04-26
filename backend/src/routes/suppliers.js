const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin, hasPerm } = require('../middleware/auth');
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
router.post('/', hasPerm('suppliers.write'), (req, res) => {
    try {
        const { name, contact, type, type_label, tin_no, vrn_no, billing_address, email, salesman, salesman_contact, logo_data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        const result = db.prepare(`
            INSERT INTO suppliers (name, contact, type, type_label, tin_no, vrn_no, billing_address, email, salesman, salesman_contact, logo_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, contact || null, type || 'other', type_label || null,
               tin_no || null, vrn_no || null, billing_address || null, email || null,
               salesman || null, salesman_contact || null, logo_data || null);

        res.status(201).json({ message: 'Supplier created', supplierId: result.lastInsertRowid });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update supplier
router.put('/:id', hasPerm('suppliers.write'), (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact, type, type_label, tin_no, vrn_no, billing_address, email, salesman, salesman_contact, logo_data } = req.body;

        const e = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
        if (!e) return res.status(404).json({ error: 'Supplier not found' });

        db.prepare(`
            UPDATE suppliers SET name=?, contact=?, type=?, type_label=?,
            tin_no=?, vrn_no=?, billing_address=?, email=?, salesman=?, salesman_contact=?, logo_data=?
            WHERE id=?
        `).run(
            name || e.name,
            contact !== undefined ? contact : e.contact,
            type || e.type,
            type_label !== undefined ? type_label : e.type_label,
            tin_no !== undefined ? tin_no : e.tin_no,
            vrn_no !== undefined ? vrn_no : e.vrn_no,
            billing_address !== undefined ? billing_address : e.billing_address,
            email !== undefined ? email : e.email,
            salesman !== undefined ? salesman : e.salesman,
            salesman_contact !== undefined ? salesman_contact : e.salesman_contact,
            logo_data !== undefined ? logo_data : e.logo_data,
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