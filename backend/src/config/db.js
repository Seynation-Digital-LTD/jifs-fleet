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

    // Migrate expenses table — add new columns if they don't exist
    const existingColumns = db.pragma('table_info(expenses)').map(col => col.name);

    const migrations = [
        { name: 'document_no', sql: 'ALTER TABLE expenses ADD COLUMN document_no TEXT' },
        { name: 'due_date',    sql: 'ALTER TABLE expenses ADD COLUMN due_date DATE' },
        { name: 'item_description', sql: 'ALTER TABLE expenses ADD COLUMN item_description TEXT' }
    ];

    for (const migration of migrations) {
        if (!existingColumns.includes(migration.name)) {
            try {
                db.exec(migration.sql);
                console.log(`Migration: added column ${migration.name} to expenses`);
            } catch (err) {
                console.error(`Migration error for column ${migration.name}:`, err.message);
            }
        }
    }
};

module.exports = { db, initDb };