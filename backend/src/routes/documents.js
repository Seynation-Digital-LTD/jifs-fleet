const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all documents (with vehicle plate_no)
router.get('/', isAuthenticated, (req, res) => {
    try {
        const documents = db.prepare(`
            SELECT d.*, v.plate_no
            FROM vehicle_documents d
            JOIN vehicles v ON d.vehicle_id = v.id
            ORDER BY d.expiry_date ASC
        `).all();
        res.json({ documents });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create document
router.post('/', isAuthenticated, (req, res) => {
    try {
        const { vehicle_id, doc_type, doc_name, doc_number, issue_date, expiry_date, notes } = req.body;
        if (!vehicle_id || !doc_type) {
            return res.status(400).json({ error: 'Vehicle and document type are required' });
        }
        const vehicle = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(vehicle_id);
        if (!vehicle) {
            return res.status(400).json({ error: 'Vehicle not found' });
        }
        const result = db.prepare(`
            INSERT INTO vehicle_documents (vehicle_id, doc_type, doc_name, doc_number, issue_date, expiry_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(vehicle_id, doc_type, doc_name || null, doc_number || null, issue_date || null, expiry_date || null, notes || null);
        res.status(201).json({ message: 'Document created', documentId: result.lastInsertRowid });
    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT update document
router.put('/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params;
        const { vehicle_id, doc_type, doc_name, doc_number, issue_date, expiry_date, notes } = req.body;
        const existing = db.prepare('SELECT * FROM vehicle_documents WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'Document not found' });
        db.prepare(`
            UPDATE vehicle_documents SET
                vehicle_id = ?, doc_type = ?, doc_name = ?, doc_number = ?,
                issue_date = ?, expiry_date = ?, notes = ?
            WHERE id = ?
        `).run(
            vehicle_id || existing.vehicle_id,
            doc_type || existing.doc_type,
            doc_name !== undefined ? doc_name : existing.doc_name,
            doc_number !== undefined ? doc_number : existing.doc_number,
            issue_date !== undefined ? issue_date : existing.issue_date,
            expiry_date !== undefined ? expiry_date : existing.expiry_date,
            notes !== undefined ? notes : existing.notes,
            id
        );
        res.json({ message: 'Document updated' });
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE document
router.delete('/:id', isAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const existing = db.prepare('SELECT id FROM vehicle_documents WHERE id = ?').get(id);
        if (!existing) return res.status(404).json({ error: 'Document not found' });
        db.prepare('DELETE FROM vehicle_documents WHERE id = ?').run(id);
        res.json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
