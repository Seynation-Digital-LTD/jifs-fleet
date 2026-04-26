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

    // Migrate expenses table — add missing columns
    const expenseColumns = db.pragma('table_info(expenses)').map(col => col.name);
    const expenseMigrations = [
        { name: 'document_no',     sql: 'ALTER TABLE expenses ADD COLUMN document_no TEXT' },
        { name: 'due_date',        sql: 'ALTER TABLE expenses ADD COLUMN due_date DATE' },
        { name: 'item_description',sql: 'ALTER TABLE expenses ADD COLUMN item_description TEXT' },
        { name: 'odometer_km',     sql: 'ALTER TABLE expenses ADD COLUMN odometer_km REAL' },
        { name: 'payment_status',    sql: "ALTER TABLE expenses ADD COLUMN payment_status TEXT DEFAULT 'unpaid'" },
        { name: 'expense_type_other', sql: 'ALTER TABLE expenses ADD COLUMN expense_type_other TEXT' },
    ];
    for (const m of expenseMigrations) {
        if (!expenseColumns.includes(m.name)) {
            try { db.exec(m.sql); console.log(`Migration: added expenses.${m.name}`); }
            catch (err) { console.error(`Migration error expenses.${m.name}:`, err.message); }
        }
    }

    // Make vehicle_id nullable — rebuild table if currently NOT NULL
    const vehicleCol = db.pragma('table_info(expenses)').find(c => c.name === 'vehicle_id');
    if (vehicleCol && vehicleCol.notnull === 1) {
        try {
            db.pragma('foreign_keys = OFF');
            db.exec(`
                CREATE TABLE expenses_new (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    vehicle_id       INTEGER,
                    supplier_id      INTEGER,
                    date             DATE NOT NULL,
                    due_date         DATE,
                    document_no      TEXT,
                    reference_no     TEXT,
                    expense_type     TEXT NOT NULL,
                    item_description TEXT,
                    quantity         REAL,
                    unit             TEXT,
                    debit            REAL DEFAULT 0,
                    credit           REAL DEFAULT 0,
                    odometer_km      REAL,
                    payment_status   TEXT DEFAULT 'unpaid',
                    notes            TEXT,
                    created_by       INTEGER,
                    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (vehicle_id)  REFERENCES vehicles(id),
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
                    FOREIGN KEY (created_by)  REFERENCES users(id)
                );
                INSERT INTO expenses_new SELECT * FROM expenses;
                DROP TABLE expenses;
                ALTER TABLE expenses_new RENAME TO expenses;
            `);
            db.pragma('foreign_keys = ON');
            console.log('Migration: expenses.vehicle_id is now nullable');
        } catch (err) {
            db.pragma('foreign_keys = ON');
            console.error('Migration error (vehicle_id nullable):', err.message);
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
        { name: 'type_label',       sql: 'ALTER TABLE suppliers ADD COLUMN type_label TEXT' },
        { name: 'tin_no',           sql: 'ALTER TABLE suppliers ADD COLUMN tin_no TEXT' },
        { name: 'vrn_no',           sql: 'ALTER TABLE suppliers ADD COLUMN vrn_no TEXT' },
        { name: 'billing_address',  sql: 'ALTER TABLE suppliers ADD COLUMN billing_address TEXT' },
        { name: 'email',            sql: 'ALTER TABLE suppliers ADD COLUMN email TEXT' },
        { name: 'salesman',         sql: 'ALTER TABLE suppliers ADD COLUMN salesman TEXT' },
        { name: 'salesman_contact', sql: 'ALTER TABLE suppliers ADD COLUMN salesman_contact TEXT' },
        { name: 'logo_data',        sql: 'ALTER TABLE suppliers ADD COLUMN logo_data TEXT' },
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
        { name: 'permissions',     sql: 'ALTER TABLE users ADD COLUMN permissions TEXT NULL' },
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
