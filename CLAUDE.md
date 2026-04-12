# JIFS Fleet Management System

> **Project handoff document for Claude Code**
> This file contains everything needed to understand and continue development on this project.

---

## Project Overview

**Client:** JIFS Company (Tanzania)
**Developer:** Sey @ Seynation Digital LTD
**Purpose:** Fleet expense management system for tracking vehicles, suppliers, expenses, services, and parts
**Deployment:** Offline LAN-based system on a Mac computer

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js + Express.js |
| **Database** | SQLite via better-sqlite3 |
| **Auth** | Session-based (express-session + bcrypt) |
| **Frontend** | React 18 + Vite + Tailwind CSS v4 |
| **API Client** | Axios with credentials |

---

## Project Structure

```
jifs-fleet/
├── backend/
│   ├── src/
│   │   ├── config/db.js              # SQLite connection + schema init
│   │   ├── middleware/auth.js         # isAuthenticated, isAdmin middleware
│   │   ├── routes/
│   │   │   ├── auth.js               # POST /register, /login, /logout, GET /me
│   │   │   ├── vehicles.js           # CRUD for vehicles
│   │   │   ├── suppliers.js          # CRUD for suppliers
│   │   │   ├── expenses.js           # CRUD for expenses (with JOINs)
│   │   │   ├── services.js           # CRUD + /upcoming/:days endpoint
│   │   │   ├── parts.js              # CRUD + /expiring/:days endpoint
│   │   │   └── reports.js            # Dashboard stats, expense reports
│   │   ├── models/schema.sql         # Database schema
│   │   └── app.js                    # Express app entry point
│   ├── data/fleet.db                  # SQLite database (gitignored)
│   ├── package.json
│   └── .env                           # PORT=3000, SESSION_SECRET
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js              # Axios instance (baseURL: /api, withCredentials: true)
│   │   ├── components/
│   │   │   ├── Layout.jsx             # Sidebar + main content wrapper
│   │   │   └── ProtectedRoute.jsx     # Auth guard component
│   │   ├── context/AuthContext.jsx    # User state, login/logout functions
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Login form
│   │   │   ├── Dashboard.jsx          # Stats cards + alerts
│   │   │   ├── Vehicles.jsx           # Vehicle CRUD
│   │   │   ├── Suppliers.jsx          # Supplier CRUD
│   │   │   ├── Expenses.jsx           # Expense entry (main daily use)
│   │   │   ├── Services.jsx           # Service tracking
│   │   │   ├── Parts.jsx              # Parts with expiry tracking
│   │   │   └── Reports.jsx            # Filterable reports
│   │   ├── App.jsx                    # React Router setup
│   │   ├── main.jsx                   # Entry point
│   │   └── index.css                  # Tailwind + custom styles
│   ├── vite.config.js                 # Proxy /api → localhost:3000
│   ├── package.json
│   └── index.html
│
├── start-jifs.sh                      # Mac startup script
├── stop-jifs.sh                       # Mac stop script
├── .gitignore
└── CLAUDE.md                          # This file
```

---

## Database Schema

### Tables

```sql
-- Users (authentication)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,              -- bcrypt hashed
    role TEXT CHECK(role IN ('admin', 'operator')) DEFAULT 'operator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles
CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_no TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    make_model TEXT,
    year INTEGER,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    type TEXT CHECK(type IN ('fuel', 'maintenance', 'insurance', 'other')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expenses (main transaction table)
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    date TEXT NOT NULL,
    reference_no TEXT,
    expense_type TEXT CHECK(expense_type IN ('fuel', 'maintenance', 'insurance', 'parts', 'other')) NOT NULL,
    quantity REAL,
    unit TEXT,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services (maintenance tracking)
CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    expense_id INTEGER REFERENCES expenses(id),
    service_date TEXT NOT NULL,
    description TEXT,
    next_service_date TEXT,
    next_service_km INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parts (with expiry tracking)
CREATE TABLE parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    service_id INTEGER REFERENCES services(id),
    part_number TEXT,
    part_name TEXT NOT NULL,
    expiry_date TEXT,
    installed_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Create new user | Public |
| POST | `/login` | Login, creates session | Public |
| POST | `/logout` | Destroy session | Auth |
| GET | `/me` | Get current user | Auth |

### Vehicles (`/api/vehicles`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all vehicles | Auth |
| GET | `/:id` | Get single vehicle | Auth |
| POST | `/` | Create vehicle | Admin |
| PUT | `/:id` | Update vehicle | Admin |
| DELETE | `/:id` | Delete vehicle | Admin |

### Suppliers (`/api/suppliers`)
Same pattern as vehicles.

### Expenses (`/api/expenses`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all (with JOINs for plate_no, supplier_name) | Auth |
| GET | `/:id` | Get single expense | Auth |
| POST | `/` | Create expense | Auth |
| PUT | `/:id` | Update expense | Auth |
| DELETE | `/:id` | Delete expense | Admin |

### Services (`/api/services`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all services | Auth |
| GET | `/upcoming/:days` | Services due within N days | Auth |
| POST | `/` | Create service | Auth |
| PUT | `/:id` | Update service | Auth |
| DELETE | `/:id` | Delete service | Admin |

### Parts (`/api/parts`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all parts | Auth |
| GET | `/expiring/:days` | Parts expiring within N days | Auth |
| POST | `/` | Create part | Auth |
| PUT | `/:id` | Update part | Auth |
| DELETE | `/:id` | Delete part | Admin |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Stats: vehicles, suppliers, totals, alerts |
| GET | `/expenses-by-vehicle` | Grouped by vehicle |
| GET | `/expenses-by-type` | Grouped by expense type |
| GET | `/expenses-by-date?start=&end=` | Filtered by date range |

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full CRUD on everything, user management |
| **Operator** | Create/edit expenses, services, parts. View only for vehicles/suppliers |

---

## Running the Project

### Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Access at http://localhost:5173
```

### First User Setup
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

---

## Key Implementation Details

### Backend
- **Session auth**: `express-session` with `connect.sid` cookie
- **Password hashing**: bcrypt with 10 salt rounds
- **SQL injection prevention**: Parameterized queries via better-sqlite3
- **CORS**: Configured for `localhost:5173` with credentials

### Frontend
- **Proxy**: Vite proxies `/api` to `localhost:3000`
- **Auth state**: React Context (`AuthContext`)
- **Protected routes**: Redirect to `/login` if no session
- **API client**: Axios with `withCredentials: true`

### Design System
- **Sidebar**: Dark slate (#0f172a)
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Warning**: Amber (#f59e0b)
- **Font**: DM Sans

---

## Current Status: COMPLETE MVP

✅ Backend API - All routes implemented and tested
✅ Database schema - All tables with relationships
✅ Authentication - Session-based with role checks
✅ Frontend - All 8 pages built with polished UI
✅ CRUD operations - Working for all entities
✅ Dashboard - Stats and alerts
✅ Reports - Filterable by vehicle/type/date

---

## Potential Future Enhancements (v2)

- [ ] Driver tracking
- [ ] Approval workflows
- [ ] Receipt image uploads
- [ ] Export to Excel/PDF
- [ ] SMS/email reminders for services
- [ ] Fuel analytics dashboard
- [ ] Multi-branch support

---

## GitHub Repository

https://github.com/Seynation-Digital-LTD/jifs-fleet.git

---

## Developer Notes

- Currency is TZS (Tanzanian Shillings)
- Date format: YYYY-MM-DD in database, displayed as "12 Apr 2026"
- The system runs offline on a Mac - no internet required
- SQLite database file at `backend/data/fleet.db` - backup by copying this file
