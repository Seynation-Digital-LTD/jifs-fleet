const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/fleet.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const initDb = () => {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Database initialized');

    // Migrate expenses table
    const expenseColumns = db.pragma('table_info(expenses)').map(col => col.name);
    const expenseMigrations = [
        { name: 'document_no',     sql: 'ALTER TABLE expenses ADD COLUMN document_no TEXT' },
        { name: 'due_date',        sql: 'ALTER TABLE expenses ADD COLUMN due_date DATE' },
        { name: 'item_description',sql: 'ALTER TABLE expenses ADD COLUMN item_description TEXT' },
        { name: 'odometer_km',     sql: 'ALTER TABLE expenses ADD COLUMN odometer_km REAL' },
        { name: 'payment_status',  sql: "ALTER TABLE expenses ADD COLUMN payment_status TEXT DEFAULT 'unpaid'" },
    ];
    for (const m of expenseMigrations) {
        if (!expenseColumns.includes(m.name)) {
            try { db.exec(m.sql); console.log(`Migration: added expenses.${m.name}`); }
            catch (err) { console.error(`Migration error expenses.${m.name}:`, err.message); }
        }
    }

    // Migrate vehicles table
    const vehicleColumns = db.pragma('table_info(vehicles)').map(col => col.name);
    const vehicleMigrations = [
        { name: 'monthly_budget', sql: 'ALTER TABLE vehicles ADD COLUMN monthly_budget REAL DEFAULT 0' },
    ];
    for (const m of vehicleMigrations) {
        if (!vehicleColumns.includes(m.name)) {
            try { db.exec(m.sql); console.log(`Migration: added vehicles.${m.name}`); }
            catch (err) { console.error(`Migration error vehicles.${m.name}:`, err.message); }
        }
    }

    // Migrate suppliers table
    const supplierColumns = db.pragma('table_info(suppliers)').map(col => col.name);
    const supplierMigrations = [
        { name: 'type_label', sql: 'ALTER TABLE suppliers ADD COLUMN type_label TEXT' },
    ];
    for (const m of supplierMigrations) {
        if (!supplierColumns.includes(m.name)) {
            try { db.exec(m.sql); console.log(`Migration: added suppliers.${m.name}`); }
            catch (err) { console.error(`Migration error suppliers.${m.name}:`, err.message); }
        }
    }

    // Migrate parts table
    const partColumns = db.pragma('table_info(parts)').map(col => col.name);
    const partMigrations = [
        { name: 'serial_number', sql: 'ALTER TABLE parts ADD COLUMN serial_number TEXT' },
    ];
    for (const m of partMigrations) {
        if (!partColumns.includes(m.name)) {
            try { db.exec(m.sql); console.log(`Migration: added parts.${m.name}`); }
            catch (err) { console.error(`Migration error parts.${m.name}:`, err.message); }
        }
    }

    // Migrate users table — account lockout columns
    const userColumns = db.pragma('table_info(users)').map(col => col.name);
    const userMigrations = [
        { name: 'failed_attempts', sql: 'ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0' },
        { name: 'locked_until',    sql: 'ALTER TABLE users ADD COLUMN locked_until TEXT NULL' },
    ];
    for (const m of userMigrations) {
        if (!userColumns.includes(m.name)) {
            try { db.exec(m.sql); console.log(`Migration: added users.${m.name}`); }
            catch (err) { console.error(`Migration error users.${m.name}:`, err.message); }
        }
    }

    // Create audit_logs table
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            action       TEXT NOT NULL,
            details      TEXT,
            user_id      INTEGER,
            ip_address   TEXT,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('Audit logs table ready');
};

module.exports = { db, initDb };
