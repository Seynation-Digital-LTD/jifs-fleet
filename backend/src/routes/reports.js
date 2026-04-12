const express = require('express');
const { db } = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Dashboard summary
router.get('/dashboard', isAuthenticated, (req, res) => {
    try {
        const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = ?').get('active');
        const totalSuppliers = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
        const totalExpenses = db.prepare('SELECT SUM(debit) as total FROM expenses').get();
        const totalCredits = db.prepare('SELECT SUM(credit) as total FROM expenses').get();

        // Expenses this month
        const monthExpenses = db.prepare(`
            SELECT SUM(debit) as total FROM expenses
            WHERE date >= date('now', 'start of month')
        `).get();

        // Upcoming services (next 30 days) — return actual records
        const upcomingServices = db.prepare(`
            SELECT s.description, s.next_service_date, v.plate_no
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.next_service_date IS NOT NULL
            AND s.next_service_date <= date('now', '+30 days')
            AND s.next_service_date >= date('now')
            ORDER BY s.next_service_date ASC
        `).all();

        // Expiring parts (next 30 days) — return actual records
        const expiringParts = db.prepare(`
            SELECT p.part_name, p.expiry_date, v.plate_no
            FROM parts p
            JOIN vehicles v ON p.vehicle_id = v.id
            WHERE p.expiry_date IS NOT NULL
            AND p.expiry_date <= date('now', '+30 days')
            AND p.expiry_date >= date('now')
            ORDER BY p.expiry_date ASC
        `).all();

        res.json({
            activeVehicles: totalVehicles.count,
            totalSuppliers: totalSuppliers.count,
            totalDebit: totalExpenses.total || 0,
            totalCredit: totalCredits.total || 0,
            monthExpenses: monthExpenses.total || 0,
            upcomingServices,
            expiringParts
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Expenses by vehicle
router.get('/expenses-by-vehicle', isAuthenticated, (req, res) => {
    try {
        const report = db.prepare(`
            SELECT 
                v.plate_no,
                v.make_model,
                COUNT(e.id) as expense_count,
                SUM(e.debit) as total_debit,
                SUM(e.credit) as total_credit
            FROM vehicles v
            LEFT JOIN expenses e ON v.id = e.vehicle_id
            GROUP BY v.id
            ORDER BY total_debit DESC
        `).all();
        
        res.json({ report });
    } catch (error) {
        console.error('Expenses by vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Expenses by type
router.get('/expenses-by-type', isAuthenticated, (req, res) => {
    try {
        const report = db.prepare(`
            SELECT 
                expense_type,
                COUNT(*) as count,
                SUM(debit) as total_debit
            FROM expenses
            GROUP BY expense_type
            ORDER BY total_debit DESC
        `).all();
        
        res.json({ report });
    } catch (error) {
        console.error('Expenses by type error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Expenses by date range
router.get('/expenses-by-date', isAuthenticated, (req, res) => {
    try {
        const { start, end } = req.query;
        
        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates required' });
        }
        
        const expenses = db.prepare(`
            SELECT 
                e.*,
                v.plate_no,
                s.name as supplier_name
            FROM expenses e
            LEFT JOIN vehicles v ON e.vehicle_id = v.id
            LEFT JOIN suppliers s ON e.supplier_id = s.id
            WHERE e.date BETWEEN ? AND ?
            ORDER BY e.date DESC
        `).all(start, end);
        
        const totals = db.prepare(`
            SELECT SUM(debit) as total_debit, SUM(credit) as total_credit
            FROM expenses
            WHERE date BETWEEN ? AND ?
        `).get(start, end);
        
        res.json({ 
            expenses,
            totalDebit: totals.total_debit || 0,
            totalCredit: totals.total_credit || 0
        });
    } catch (error) {
        console.error('Expenses by date error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;