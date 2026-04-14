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
};

module.exports = { db, initDb };
