const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: generate document_no
const generateDocumentNo = (id) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `DOC-${year}${month}-${String(id).padStart(4, '0')}`;
};

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

// GET /statement — supplier ledger reconciliation statement
// MUST be before GET /:id to prevent Express matching "statement" as an id
router.get('/statement', isAuthenticated, (req, res) => {
    try {
        const { supplier_id, start, end } = req.query;

        let whereClauses = [];
        let params = [];

        if (start) {
            whereClauses.push('e.date >= ?');
            params.push(start);
        }
        if (end) {
            whereClauses.push('e.date <= ?');
            params.push(end);
        }
        if (supplier_id) {
            const ids = supplier_id.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean);
            if (ids.length > 0) {
                whereClauses.push(`e.supplier_id IN (${ids.map(() => '?').join(',')})`);
                params.push(...ids);
            }
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const rows = db.prepare(`
            SELECT
                e.id,
                e.date,
                e.due_date,
                e.document_no,
                e.reference_no,
                e.item_description,
                e.expense_type,
                e.quantity,
                e.unit,
                e.debit,
                e.credit,
                e.notes,
                e.supplier_id,
                v.plate_no,
                s.name as supplier_name
            FROM expenses e
            LEFT JOIN vehicles v ON e.vehicle_id = v.id
            LEFT JOIN suppliers s ON e.supplier_id = s.id
            ${whereSQL}
            ORDER BY e.date ASC, e.id ASC
        `).all(...params);

        // Calculate running balance
        let running = 0;
        let total_debit = 0;
        let total_credit = 0;

        const statement = rows.map(row => {
            const debit = row.debit || 0;
            const credit = row.credit || 0;
            running = running + debit - credit;
            total_debit += debit;
            total_credit += credit;
            return { ...row, running_balance: running };
        });

        res.json({
            statement,
            summary: {
                total_debit,
                total_credit,
                final_balance: running
            }
        });
    } catch (error) {
        console.error('Get statement error:', error);
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
            vehicle_id, supplier_id, date, due_date, reference_no,
            expense_type, item_description, quantity, unit, debit, credit, notes
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
            (vehicle_id, supplier_id, date, due_date, reference_no, expense_type, item_description, quantity, unit, debit, credit, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            vehicle_id,
            supplier_id || null,
            date,
            due_date || null,
            reference_no || null,
            expense_type,
            item_description || null,
            quantity || null,
            unit || null,
            debit || 0,
            credit || 0,
            notes || null,
            req.session.user.id
        );

        // Generate and store document_no using the new row's id
        const newId = result.lastInsertRowid;
        const document_no = generateDocumentNo(newId);
        db.prepare('UPDATE expenses SET document_no = ? WHERE id = ?').run(document_no, newId);

        res.status(201).json({
            message: 'Expense created',
            expenseId: newId,
            document_no
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
            vehicle_id, supplier_id, date, due_date, reference_no,
            expense_type, item_description, quantity, unit, debit, credit, notes
        } = req.body;

        const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const stmt = db.prepare(`
            UPDATE expenses SET
                vehicle_id = ?, supplier_id = ?, date = ?, due_date = ?, reference_no = ?,
                expense_type = ?, item_description = ?, quantity = ?, unit = ?, debit = ?, credit = ?, notes = ?
            WHERE id = ?
        `);

        stmt.run(
            vehicle_id || existing.vehicle_id,
            supplier_id !== undefined ? supplier_id : existing.supplier_id,
            date || existing.date,
            due_date !== undefined ? due_date : existing.due_date,
            reference_no !== undefined ? reference_no : existing.reference_no,
            expense_type || existing.expense_type,
            item_description !== undefined ? item_description : existing.item_description,
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
