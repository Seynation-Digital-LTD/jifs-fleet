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

        const monthExpenses = db.prepare(`
            SELECT SUM(debit) as total FROM expenses
            WHERE date >= date('now', 'start of month')
        `).get();

        const upcomingServices = db.prepare(`
            SELECT s.description, s.next_service_date, v.plate_no
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.next_service_date IS NOT NULL
            AND s.next_service_date <= date('now', '+30 days')
            AND s.next_service_date >= date('now')
            ORDER BY s.next_service_date ASC
        `).all();

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

// Expenses by vehicle (supports optional date range)
router.get('/expenses-by-vehicle', isAuthenticated, (req, res) => {
    try {
        const { start, end } = req.query;
        const params = [];
        let dateFilter = '';
        if (start && end) {
            dateFilter = 'AND e.date BETWEEN ? AND ?';
            params.push(start, end);
        }

        const report = db.prepare(`
            SELECT
                v.plate_no,
                v.make_model,
                COUNT(e.id) as expense_count,
                COALESCE(SUM(e.debit), 0) as total_debit,
                COALESCE(SUM(e.credit), 0) as total_credit
            FROM vehicles v
            LEFT JOIN expenses e ON v.id = e.vehicle_id ${dateFilter}
            GROUP BY v.id
            ORDER BY total_debit DESC
        `).all(...params);

        res.json({ report });
    } catch (error) {
        console.error('Expenses by vehicle error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Expenses by type (supports optional date range)
router.get('/expenses-by-type', isAuthenticated, (req, res) => {
    try {
        const { start, end } = req.query;
        const params = [];
        let dateFilter = '';
        if (start && end) {
            dateFilter = 'WHERE date BETWEEN ? AND ?';
            params.push(start, end);
        }

        const report = db.prepare(`
            SELECT
                expense_type,
                COUNT(*) as expense_count,
                COALESCE(SUM(debit), 0) as total_debit,
                COALESCE(SUM(credit), 0) as total_credit
            FROM expenses
            ${dateFilter}
            GROUP BY expense_type
            ORDER BY total_debit DESC
        `).all(...params);

        res.json({ report });
    } catch (error) {
        console.error('Expenses by type error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Expenses by date range (detailed transactions)
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

// Fuel consumption report
router.get('/fuel', isAuthenticated, (req, res) => {
    try {
        const { start, end } = req.query;
        const params = [];
        let dateFilter = '';
        if (start && end) {
            dateFilter = 'AND e.date BETWEEN ? AND ?';
            params.push(start, end);
        }

        const report = db.prepare(`
            SELECT
                v.plate_no,
                v.make_model,
                COUNT(e.id) as fill_ups,
                COALESCE(SUM(e.quantity), 0) as total_liters,
                COALESCE(SUM(e.debit), 0) as total_cost
            FROM expenses e
            JOIN vehicles v ON e.vehicle_id = v.id
            WHERE e.expense_type = 'fuel'
            ${dateFilter}
            GROUP BY v.id
            ORDER BY total_cost DESC
        `).all(...params);

        const totals = db.prepare(`
            SELECT
                COUNT(*) as fill_ups,
                COALESCE(SUM(quantity), 0) as total_liters,
                COALESCE(SUM(debit), 0) as total_cost
            FROM expenses
            WHERE expense_type = 'fuel'
            ${start && end ? 'AND date BETWEEN ? AND ?' : ''}
        `).get(...params);

        res.json({ report, totals });
    } catch (error) {
        console.error('Fuel report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Supplier balances — outstanding amount owed per supplier
router.get('/supplier-balances', isAuthenticated, (req, res) => {
    try {
        const report = db.prepare(`
            SELECT
                s.id,
                s.name,
                s.type,
                s.contact,
                COUNT(e.id) as transaction_count,
                COALESCE(SUM(e.debit), 0) as total_debit,
                COALESCE(SUM(e.credit), 0) as total_credit,
                COALESCE(SUM(e.debit), 0) - COALESCE(SUM(e.credit), 0) as balance
            FROM suppliers s
            LEFT JOIN expenses e ON s.id = e.supplier_id
            GROUP BY s.id
            ORDER BY balance DESC
        `).all();

        res.json({ report });
    } catch (error) {
        console.error('Supplier balances error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Services schedule — overdue and upcoming within 60 days
router.get('/services-schedule', isAuthenticated, (req, res) => {
    try {
        const overdue = db.prepare(`
            SELECT s.id, s.description, s.next_service_date, s.next_service_km,
                   v.plate_no, v.make_model
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.next_service_date IS NOT NULL
              AND s.next_service_date < date('now')
            ORDER BY s.next_service_date ASC
        `).all();

        const upcoming = db.prepare(`
            SELECT s.id, s.description, s.next_service_date, s.next_service_km,
                   v.plate_no, v.make_model
            FROM services s
            JOIN vehicles v ON s.vehicle_id = v.id
            WHERE s.next_service_date IS NOT NULL
              AND s.next_service_date >= date('now')
              AND s.next_service_date <= date('now', '+60 days')
            ORDER BY s.next_service_date ASC
        `).all();

        res.json({ overdue, upcoming });
    } catch (error) {
        console.error('Services schedule error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Parts expiry — expired and expiring within 90 days
router.get('/parts-expiry', isAuthenticated, (req, res) => {
    try {
        const expired = db.prepare(`
            SELECT p.id, p.part_name, p.part_number, p.expiry_date, p.installed_date,
                   v.plate_no
            FROM parts p
            JOIN vehicles v ON p.vehicle_id = v.id
            WHERE p.expiry_date IS NOT NULL
              AND p.expiry_date < date('now')
            ORDER BY p.expiry_date ASC
        `).all();

        const expiring = db.prepare(`
            SELECT p.id, p.part_name, p.part_number, p.expiry_date, p.installed_date,
                   v.plate_no
            FROM parts p
            JOIN vehicles v ON p.vehicle_id = v.id
            WHERE p.expiry_date IS NOT NULL
              AND p.expiry_date >= date('now')
              AND p.expiry_date <= date('now', '+90 days')
            ORDER BY p.expiry_date ASC
        `).all();

        res.json({ expired, expiring });
    } catch (error) {
        console.error('Parts expiry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Monthly overview — full breakdown for a given month vs previous month
router.get('/monthly-overview', isAuthenticated, (req, res) => {
    try {
        const now = new Date();
        const targetYear = parseInt(req.query.year) || now.getFullYear();
        const targetMonth = parseInt(req.query.month) || (now.getMonth() + 1);
        const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

        const prevDate = new Date(targetYear, targetMonth - 2, 1);
        const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        const byType = db.prepare(`
            SELECT expense_type, COUNT(*) as count,
                   COALESCE(SUM(debit), 0) as total_debit,
                   COALESCE(SUM(credit), 0) as total_credit
            FROM expenses
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY expense_type
            ORDER BY total_debit DESC
        `).all(monthStr);

        const byVehicle = db.prepare(`
            SELECT v.plate_no, COUNT(e.id) as count,
                   COALESCE(SUM(e.debit), 0) as total_debit,
                   COALESCE(SUM(e.credit), 0) as total_credit
            FROM expenses e
            JOIN vehicles v ON e.vehicle_id = v.id
            WHERE strftime('%Y-%m', e.date) = ?
            GROUP BY v.id
            ORDER BY total_debit DESC
        `).all(monthStr);

        const totals = db.prepare(`
            SELECT COUNT(*) as transaction_count,
                   COALESCE(SUM(debit), 0) as total_debit,
                   COALESCE(SUM(credit), 0) as total_credit
            FROM expenses
            WHERE strftime('%Y-%m', date) = ?
        `).get(monthStr);

        const prevTotals = db.prepare(`
            SELECT COALESCE(SUM(debit), 0) as total_debit
            FROM expenses
            WHERE strftime('%Y-%m', date) = ?
        `).get(prevMonthStr);

        res.json({ byType, byVehicle, totals, prevTotals, monthStr, prevMonthStr });
    } catch (error) {
        console.error('Monthly overview error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
