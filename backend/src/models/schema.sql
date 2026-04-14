-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'operator')) NOT NULL DEFAULT 'operator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_no TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    make_model TEXT,
    year INTEGER,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
    monthly_budget REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    type TEXT CHECK(type IN ('fuel', 'maintenance', 'insurance', 'other')) DEFAULT 'other',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    supplier_id INTEGER,
    date DATE NOT NULL,
    due_date DATE,
    document_no TEXT,
    reference_no TEXT,
    expense_type TEXT CHECK(expense_type IN ('fuel', 'maintenance', 'insurance', 'parts', 'other')) NOT NULL,
    item_description TEXT,
    quantity REAL,
    unit TEXT,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    odometer_km REAL,
    payment_status TEXT CHECK(payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Vehicle documents table (TRA sticker, road licence, insurance, etc.)
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    doc_type TEXT CHECK(doc_type IN ('tra_sticker', 'road_licence', 'psv_licence', 'insurance', 'goods_licence', 'other')) NOT NULL,
    doc_name TEXT,
    doc_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    expense_id INTEGER,
    service_date DATE NOT NULL,
    description TEXT NOT NULL,
    next_service_date DATE,
    next_service_km INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (expense_id) REFERENCES expenses(id)
);

-- Parts table
CREATE TABLE IF NOT EXISTS parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    service_id INTEGER,
    part_number TEXT,
    part_name TEXT NOT NULL,
    expiry_date DATE,
    installed_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);